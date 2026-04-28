import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    image: { type: String },
    clerkId: { type: String, sparse: true, unique: true },
    role: { type: String, enum: ['user', 'admin', 'store_owner'], default: 'user' },
}, { timestamps: true });
const User = mongoose.model('User', userSchema);
export default User;
