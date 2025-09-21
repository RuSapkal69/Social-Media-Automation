import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mediaUrl } = body;

    // Mock AI caption
    const fakeCaption = `This is a mock caption for media: ${mediaUrl}`;

    // Save to Supabase
    const { error } = await supabase.from("posts").insert([
      {
        media_url: mediaUrl,
        caption: fakeCaption,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
    }

    return NextResponse.json({ caption: fakeCaption });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
