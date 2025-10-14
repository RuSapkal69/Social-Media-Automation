// app/api/post/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";
import { postToSocialMedia } from "@/lib/platformServices";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const prompt = (formData.get("prompt") as string) || "Write a social media caption";
    const platforms = JSON.parse(formData.get("platforms") as string) || [];
    const scheduledTime = formData.get("scheduledTime") || null;
    const shouldPost = formData.get("shouldPost") === "true"; // New parameter

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const sizeBytes = arrayBuffer.byteLength;
    const mediaType = file.type.startsWith("image/") ? "image" : "video";

    // Upload media to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
    const mediaUrl = urlData.publicUrl;

    // Generate caption using Gemini
    let caption = "";
    const INLINE_LIMIT = 20 * 1024 * 1024;

    if (sizeBytes <= INLINE_LIMIT) {
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: file.type,
            data: base64,
          },
        },
        prompt,
      ]);
      caption = result.response.text();
    } else {
      const { GoogleAIFileManager } = await import("@google/generative-ai/server");
      const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
      const buffer = Buffer.from(arrayBuffer);
      const uploadResult = await fileManager.uploadFile(buffer, {
        mimeType: file.type,
        displayName: file.name,
      });

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri,
          },
        },
        prompt,
      ]);
      caption = result.response.text();
    }

    // Save to database
    const { data: postData, error: dbError } = await supabase
      .from("posts")
      .insert([
        {
          caption,
          platforms,
          scheduled_time: scheduledTime ? new Date(scheduledTime as string).toISOString() : null,
          media_url: mediaUrl,
          media_type: mediaType,
          status: shouldPost && !scheduledTime ? "posting" : scheduledTime ? "scheduled" : "draft",
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
    }

    // Post immediately if requested and no scheduled time
    let postingResults = [];
    if (shouldPost && !scheduledTime && platforms.length > 0) {
      // Fetch platform tokens
      const { data: tokens } = await supabase
        .from("platform_tokens")
        .select("*")
        .in("platform", platforms.map((p: string) => p.toLowerCase()));

      if (tokens && tokens.length > 0) {
        const tokenMap: any = {};
        
        tokens.forEach((token) => {
          tokenMap[token.platform] = {
            accessToken: token.access_token,
            userId: token.user_id,
            ...token.additional_data,
          };
        });

        // Post to social media
        postingResults = await postToSocialMedia(
          platforms,
          caption,
          mediaUrl,
          mediaType,
          tokenMap
        );

        // Update post status
        await supabase
          .from("posts")
          .update({
            status: "posted",
            posting_results: postingResults,
          })
          .eq("id", postData.id);
      }
    }

    return NextResponse.json({
      caption,
      mediaUrl,
      postId: postData.id,
      postingResults: postingResults.length > 0 ? postingResults : undefined,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}