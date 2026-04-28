import mongoose from "mongoose";
const AddressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, enum: ["Home", "Work", "Other"], default: "Home" },
    street: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "Bangladesh" },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
export default mongoose.model("Address", AddressSchema);
