import mongoose, { Schema } from "mongoose";
const CartItemSchema = new Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    size: { type: String, required: true },
});
const cartSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [CartItemSchema],
    totalAmount: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
cartSchema.methods.calculateTotal = function () {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
    return this.totalAmount;
};
const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
