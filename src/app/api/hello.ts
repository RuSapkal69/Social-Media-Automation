import UserModel from "@/model/User";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    if (!username) {
        return new Response(JSON.stringify({ success: false, message: "Username is required" }), { status: 400 });
    }

    const user = await UserModel.findOne({ username }).select("isAcceptingMessages -_id");
    if (!user) {
        return new Response(JSON.stringify({ success: false, message: "User not found" }), { status: 404 });
    }   
    return new Response(JSON.stringify({ success: true, isAcceptingMessages: user.isAcceptingMessages }), { status: 200 });
}