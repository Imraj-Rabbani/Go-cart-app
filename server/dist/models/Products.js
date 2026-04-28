import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    sourceDesign: { type: mongoose.Schema.Types.ObjectId, ref: "Design", default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String] },
    sizes: [{ type: String }],
    category: { type: String, required: true, enum: ["Men", "Women", "Kids", "Accessories"], default: "Accessories" },
    stock: { type: Number, required: true, min: 0, default: 0 },
    ratings: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 },
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    royaltyRate: { type: Number, default: 0.05, min: 0 },
    design: {
        artworkUrl: { type: String },
        previewUrl: { type: String },
        productType: {
            type: String,
            enum: ["t-shirt", "hoodie", "mug", "tote-bag", "phone-case"],
        },
        color: { type: String },
        placement: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            scale: { type: Number, default: 1 },
        },
    },
}, { timestamps: true });
productSchema.index({ name: 'text', description: 'text' });
const Product = mongoose.model("Product", productSchema);
export default Product;
