import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mediaUrl } = body;

    const fakeCaption = `This is a mock caption for media: ${mediaUrl}`;

    return NextResponse.json({ caption: fakeCaption });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
