import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { sendVerification } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
    await dbConnect();
    const { email, username, password } = await request.json();

    // Check if user already exists
    const existingUser = await User .findOne({ email });
    if (existingUser) {
        return new Response(JSON.stringify({ success: false, message: "User already exists" }), { status: 400 });
    }   
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({ email, username, password: hashedPassword });
    await user.save();
    // Send verification email
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();      
    await sendVerification(email, username, verifyCode);
