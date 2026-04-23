import mongoose from "mongoose";
import { IUser } from "../types/index.js";

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    image: { type: String },
    clerkId: { type: String, sparse: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true })

const User = mongoose.model<IUser>('User', userSchema)

export default User;

