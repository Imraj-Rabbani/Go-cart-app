import mongoose from "mongoose";
import { IDesign } from "../types/index.js";

const designSchema = new mongoose.Schema<IDesign>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    productType: {
        type: String,
        enum: ["t-shirt", "hoodie", "mug", "tote-bag", "phone-case"],
        required: true,
    },
    color: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: ["Men", "Women", "Kids", "Accessories"],
        required: true,
    },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    sizes: [{ type: String }],
    artworkUrl: { type: String, required: true },
    artworkPublicId: { type: String, required: true },
    previewUrl: { type: String },
    placement: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        scale: { type: Number, default: 1 },
    },
    title: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ["draft", "submitted", "in_production", "completed"],
        default: "draft",
    },
}, { timestamps: true });

const Design = mongoose.model<IDesign>("Design", designSchema);

export default Design;
