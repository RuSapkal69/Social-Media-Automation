import {z} from 'zod';

export const usernameVadidation = z.string()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must be at most 30 characters long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

export const signUpSchema = z.object({
    username: usernameVadidation,
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")  
})