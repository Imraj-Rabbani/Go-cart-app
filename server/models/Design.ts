import mongoose from "mongoose";
import { IDesign } from "../types/index.js";

const designSchema = new mongoose.Schema<IDesign>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productType: {
        type: String,
        enum: ["t-shirt", "hoodie", "mug", "tote-bag", "phone-case"],
        required: true,
    },
    artworkUrl: { type: String, required: true },
    artworkPublicId: { type: String, required: true },
    previewUrl: { type: String },
    title: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ["draft", "submitted", "in_production", "completed"],
        default: "draft",
    },
}, { timestamps: true });

const Design = mongoose.model<IDesign>("Design", designSchema);

export default Design;
