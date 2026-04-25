import { Request, Response } from "express"
import Cart from "../models/Cart.js"
import Product from "../models/Products.js";


//Get Cart
//GET /api/cart
export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        let cart = await Cart.findOne({ user: userId }).populate("items.product", "name price images stock sizes");

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        const originalLength = cart.items.length;
        cart.items = cart.items.filter((item: any) => item.product !== null);

        if (cart.items.length !== originalLength) {
            cart.calculateTotal();
            await cart.save();
        }


        res.json({ success: true, data: cart })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
}

//Add item to Cart
//POST /api/cart/add
export const addToCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const { productId, quantity = 1, size } = req.body;

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (product.stock < quantity) {
            return res.status(404).json({ success: false, message: "Insufficient stock " });
        }

        const existingItem = cart.items.find((item: any) => item.product.toString() === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.price = product.price

        } else {
            cart.items.push({ product: productId, quantity, size, price: product.price });
        }

        cart.calculateTotal();

        await cart.save();
        await cart.populate("items.product", "name images price stock")

        res.json({ success: true, data: cart });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

//Update item in Cart
//PUT /api/cart/item/:productId
export const updateCartItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const { quantity, size } = req.body;
        const { productId } = req.params

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const item = cart.items.find((item) => item.product.toString() === productId && item.size === size);

        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            cart.items = cart.items.filter((item) => 
                item.product.toString() !== productId || item.size !== size
            )
        } else {
            const product = await Product.findById(productId)
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" })
            }
            if (product.stock < quantity) {
                return res.status(400).json({ success: false, message: "Insufficient stock" })
            }
            item.quantity = quantity  // ✅ actually update the quantity
        }

        cart.calculateTotal();
        await cart.save();
        await cart.populate("items.product", "name images price stock")

        res.json({ success: true, data: cart });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

//Remove item from Cart
//DELETE /api/cart/item/:productId
export const removeCartItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;
        const { size } = req.query;

        const cart = await Cart.findOne({ user: userId });

        if (!cart || !size) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        cart.items = cart.items.filter((item) => item.product.toString() !== productId || item.size !== size);
        cart.calculateTotal();

        await cart.save();
        await cart.populate('items.product', 'name images price stock')
        res.json({ success: true, data: cart });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

//Clear Cart
//DELETE /api/cart/clear
export const clearCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        cart.items = [];
        cart.totalAmount = 0;

        await cart.save();

        res.json({ success: true, data: cart });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}