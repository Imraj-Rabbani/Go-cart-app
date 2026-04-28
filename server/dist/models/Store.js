import mongoose from "mongoose";
const storeSchema = new mongoose.Schema({
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
const Store = mongoose.model("Store", storeSchema);
export default Store;
