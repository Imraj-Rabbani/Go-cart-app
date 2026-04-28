import mongoose from "mongoose";
import { IStore } from "../types/index.js";

const storeSchema = new mongoose.Schema<IStore>({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    logo: { type: String },
    status: {
        type: String,
        enum: ["pending", "active", "rejected"],
        default: "pending",
    },
    rejectionReason: { type: String },
    revenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
}, { timestamps: true });

const Store = mongoose.model<IStore>("Store", storeSchema);

export default Store;
