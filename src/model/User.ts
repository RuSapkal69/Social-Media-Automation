import mongoose, { Document, Schema } from 'mongoose';

export interface Message extends Document {
    content: string;
    createdAt: Date;
}

const MessageSchema: Schema<Message> = new Schema({
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, required: true }
})

export interface User extends Document {
    username: string;
    email: string;
    password: string;
    verifyCode: string;
    verifyCodeExpiry: Date;
    isVerified: boolean;
    isAcceptingMessages: boolean;
    messages: Message[];
}

const UserSchema: Schema<User> = new Schema({
    username: { type: String, required: [true, "Username is required"], unique: true, trim: true},
    email: { type: String, required: [true, "Email is required"], unique: true, match: [ /\S+@\S+\.\S+/, 'Please fill a valid email address'] },
    password: { type: String, required: [true, "Password is required"] },
    verifyCode: { type: String, required: true },
    verifyCodeExpiry: { type: Date, required: true },
    isVerified: { type: Boolean, default: false },
    isAcceptingMessages: { type: Boolean, default: true },
    messages: [MessageSchema]
})
