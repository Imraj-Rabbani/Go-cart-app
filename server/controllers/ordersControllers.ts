import { Request, Response } from "express";
import SSLCommerzPayment from "sslcommerz-lts";
import Order from "../models/Orders.js";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";

const storeId = process.env.SSLCOMMERZ_STORE_ID || "";
const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD || "";
const isLive = false;
const serverPublicUrl = process.env.SERVER_PUBLIC_URL || "http://192.168.0.102:3000/";
const appScheme = "client";

const getSSLCommerzClient = () => new SSLCommerzPayment(storeId, storePassword, isLive);

const restoreOrderStock = async (order: any) => {
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
            product.stock += item.quantity;
            await product.save();
        }
    }
};

const buildOrderFromCart = async (req: Request, paymentMethod: "cash" | "bkash", clearCartAfterOrder: boolean) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product", "name price stock");

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
    }

    const orderItems = [];
    for (const item of cart.items) {
        const product = await Product.findById(item.product._id);
        if (!product || product.stock < item.quantity) {
            throw new Error(`Insufficient stock for "${(item.product as any).name}"`);
        }

        orderItems.push({
            product: item.product._id,
            store: product.store || null,
            name: (item.product as any).name,
            quantity: item.quantity,
            size: item.size,
            price: item.price,
        });

        product.stock -= item.quantity;
        await product.save();
    }

    const subtotal = cart.totalAmount;
    const shippingCost = 200;
    const totalAmount = subtotal + shippingCost;

    const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        shippingAddress: req.body.shippingAddress,
        paymentMethod,
        paymentStatus: "pending",
        subtotal,
        shippingCost,
        totalAmount,
        paymentIntentId: req.body.paymentIntentId,
        notes: req.body.notes,
        orderNumber: "ORD-" + Date.now(),
    });

    if (clearCartAfterOrder) {
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();
    }

    return order;
};

// Get user orders
// GET /api/orders
export const getOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({ user: userId })
            .populate("items.product", "name images price")
            .sort("-createdAt");

        res.json({ success: true, data: orders });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single order
// GET /api/orders/:id
export const getOrder = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id).populate("items.product", "name price images");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorised to view this order" });
        }

        res.json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create cash order from cart
// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
    try {
        const order = await buildOrderFromCart(req, "cash", true);

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order,
        });
    } catch (error: any) {
        const status = error.message === "Cart is empty" || error.message.startsWith("Insufficient stock") ? 400 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// Init SSLCommerz sandbox payment
// POST /api/orders/sslcommerz/init
export const initBkashPayment = async (req: Request, res: Response) => {
    try {
        if (!storeId || !storePassword) {
            return res.status(500).json({ success: false, message: "SSLCommerz credentials are not configured" });
        }

        const order = await buildOrderFromCart(req, "bkash", false);
        const shippingAddress = req.body.shippingAddress;

        const data = {
            total_amount: order.totalAmount,
            currency: "BDT",
            tran_id: order._id.toString(),
            success_url: `${serverPublicUrl}/api/orders/sslcommerz/success/${order._id}`,
            fail_url: `${serverPublicUrl}/api/orders/sslcommerz/fail/${order._id}`,
            cancel_url: `${serverPublicUrl}/api/orders/sslcommerz/cancel/${order._id}`,
            ipn_url: `${serverPublicUrl}/api/orders/sslcommerz/ipn/${order._id}`,
            shipping_method: "Courier",
            product_name: order.items.map((item: any) => item.name).join(", ").slice(0, 200),
            product_category: "Fashion",
            product_profile: "general",
            cus_name: req.user.name || "Gocart Customer",
            cus_email: req.user.email,
            cus_add1: shippingAddress.street,
            cus_add2: shippingAddress.state,
            cus_city: shippingAddress.city,
            cus_state: shippingAddress.state,
            cus_postcode: shippingAddress.zipCode,
            cus_country: shippingAddress.country,
            cus_phone: "01700000000",
            cus_fax: "01700000000",
            ship_name: req.user.name || "Gocart Customer",
            ship_add1: shippingAddress.street,
            ship_add2: shippingAddress.state,
            ship_city: shippingAddress.city,
            ship_state: shippingAddress.state,
            ship_postcode: shippingAddress.zipCode,
            ship_country: shippingAddress.country,
        };

        const apiResponse = await getSSLCommerzClient().init(data);

        res.status(201).json({
            success: true,
            data: {
                gatewayUrl: apiResponse.GatewayPageURL,
                orderId: order._id,
            },
        });
    } catch (error: any) {
        const status = error.message === "Cart is empty" || error.message.startsWith("Insufficient stock") ? 400 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// SSLCommerz success callback
export const sslcommerzSuccess = async (req: Request, res: Response) => {

    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.redirect(`${appScheme}://payment/fail?message=order-not-found`);
        }

        if (order.paymentStatus !== "paid") {
            const validationStatus = String(req.body?.status || "").toUpperCase();

            if (!["VALID", "VALIDATED"].includes(validationStatus)) {
                order.paymentStatus = "failed";
                await order.save();
                return res.redirect(`${appScheme}://payment/fail?orderId=${order._id}`);
            }

            order.paymentStatus = "paid";
            order.paymentIntentId = String(req.body?.val_id || order.paymentIntentId || "");
            await order.save();

            const cart = await Cart.findOne({ user: order.user });
            if (cart) {
                cart.items = [];
                cart.totalAmount = 0;
                await cart.save();
            }
        }

        return res.redirect(`${appScheme}://payment/success?orderId=${order._id}`);
    } catch (error) {
        return res.redirect(`${appScheme}://payment/fail?message=validation-failed`);
    }
};

const handleUnsuccessfulBkashPayment = async (req: Request, res: Response, status: "failed" | "cancelled") => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (order && order.paymentStatus !== "paid") {
            await restoreOrderStock(order);
            order.paymentStatus = "failed";
            if (status === "cancelled") {
                order.orderStatus = "cancelled";
            }
            await order.save();
        }

        return res.redirect(`${appScheme}://payment/${status}?orderId=${req.params.orderId}`);
    } catch (error) {
        return res.redirect(`${appScheme}://payment/${status}?orderId=${req.params.orderId}`);
    }
};

export const sslcommerzFail = async (req: Request, res: Response) => {
    return handleUnsuccessfulBkashPayment(req, res, "failed");
};

export const sslcommerzCancel = async (req: Request, res: Response) => {
    return handleUnsuccessfulBkashPayment(req, res, "cancelled");
};

export const sslcommerzIpn = async (req: Request, res: Response) => {
    return res.json({ success: true, data: req.body });
};

// Update order status (admin only)
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderStatus, paymentStatus } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (orderStatus) order.orderStatus = orderStatus;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (orderStatus === "delivered") {
            order.deliveredAt = new Date();
            if (order.paymentStatus === "pending") {
                order.paymentStatus = "paid";
            }
        }

        await order.save();
        res.json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all orders (admin only)
// GET /api/orders/admin/all
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query: any = {};

        if (status) query.orderStatus = status;
        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate("user", "name email")
            .populate("items.product", "name")
            .sort("-createdAt")
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
