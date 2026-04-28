import Order from "../models/Orders.js";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
// Get user orders
// GET /api/orders
export const getOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({ user: userId })
            .populate("items.product", "name images price")
            .sort("-createdAt");
        res.json({ success: true, data: orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get single order
// GET /api/orders/:id
export const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("items.product", "name price images");
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Not authorised to view this order" });
        }
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Create order from cart
// POST /api/orders
export const createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;
        const cart = await Cart.findOne({ user: req.user._id }).populate("items.product", "name price stock");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }
        // Check stock for all items before proceeding
        const orderItems = [];
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for "${item.product.name}"`,
                });
            }
            orderItems.push({
                product: item.product._id,
                store: product.store || null,
                name: item.product.name,
                quantity: item.quantity,
                size: item.size,
                price: item.price,
            });
            product.stock -= item.quantity;
            await product.save();
        }
        const subtotal = cart.totalAmount;
        const shippingCost = 20;
        const totalAmount = subtotal + shippingCost;
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod: req.body.paymentMethod || "cod",
            subtotal,
            shippingCost,
            totalAmount,
            paymentIntentId: req.body.paymentIntentId,
            orderNumber: "ORD-" + Date.now(),
        });
        if (req.body.paymentMethod !== "stripe") {
            cart.items = [];
            cart.totalAmount = 0;
            await cart.save();
        }
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Update order status (admin only)
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus, paymentStatus } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (orderStatus)
            order.orderStatus = orderStatus;
        if (paymentStatus)
            order.paymentStatus = paymentStatus;
        if (orderStatus === 'delivered') {
            order.deliveredAt = new Date();
            if (order.paymentStatus === "pending") {
                order.paymentStatus = "paid";
            }
        }
        await order.save();
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get all orders (admin only)
// GET /api/orders/admin/all
export const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status)
            query.orderStatus = status;
        const total = await Order.countDocuments(query);
        const orders = await Order.find(query).populate("user", "name email").populate("items.product", "name").sort("-createdAt").skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
