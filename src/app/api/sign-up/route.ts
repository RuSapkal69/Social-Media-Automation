import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
    await dbConnect();
    const { email, username, password } = await request.json();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        return new Response(JSON.stringify({ success: false, message: "User already exists" }), { status: 400 });
    }   
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    
}

     
