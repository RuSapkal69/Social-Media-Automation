// import { NextResponse } from "next/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { supabase } from "@/lib/supabaseClient";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File;
//     const prompt = (formData.get("prompt") as string) || "Write a social media caption";
//     const platforms = JSON.parse(formData.get("platforms") as string) || [];
//     const scheduledTime = formData.get("scheduledTime") || null;

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     const arrayBuffer = await file.arrayBuffer();
//     const sizeBytes = arrayBuffer.byteLength;

//     let caption = "";

//     // Inline limit 20 MB
//     const INLINE_LIMIT = 20 * 1024 * 1024;
//     if (sizeBytes <= INLINE_LIMIT) {
//       const base64 = Buffer.from(arrayBuffer).toString("base64");
//       const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
//       const result = await model.generateContent([
//         {
//           inlineData: {
//             mimeType: file.type,
//             data: base64
//           }
//         },
//         prompt
//       ]);
//       caption = result.response.text();
//     } else {
//       // Large file: upload to Gemini Files API
//       const { GoogleAIFileManager } = await import("@google/generative-ai/server");
//       const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
      
//       // Convert File to Buffer for upload
//       const buffer = Buffer.from(arrayBuffer);
//       const uploadResult = await fileManager.uploadFile(buffer, {
//         mimeType: file.type,
//         displayName: file.name,
//       });

//       const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
//       const result = await model.generateContent([
//         {
//           fileData: {
//             mimeType: uploadResult.file.mimeType,
//             fileUri: uploadResult.file.uri
//           }
//         },
//         prompt
//       ]);
//       caption = result.response.text();
//     }

//     // Save caption + scheduling info in Supabase
//     const { error } = await supabase.from("posts").insert([
//       {
//         caption,
//         platforms,
//         scheduled_time: scheduledTime ? new Date(scheduledTime as string).toISOString() : null,
//       },
//     ]);

//     if (error) {
//       console.error("Supabase insert error:", error);
//     }

//     return NextResponse.json({ caption });
//   } catch (err: any) {
//     console.error(err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }