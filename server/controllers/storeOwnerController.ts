import { Request, Response } from "express";
import Product from "../models/Products.js";
import Order from "../models/Orders.js";
import cloudinary from "../config/cloudinary.js";
import { getStoreByUser } from "../utils/getStoreByUser.js";

const parseSizes = (sizes: any) => {
    if (!sizes) return [];
    if (Array.isArray(sizes)) return sizes;

    if (typeof sizes === "string") {
        try {
            return JSON.parse(sizes);
        } catch (error) {
            return sizes.split(",").map((size) => size.trim()).filter(Boolean);
        }
    }

    return [sizes];
};

const uploadImages = async (files: Express.Multer.File[] = []) => {
    if (files.length === 0) return [];

    return Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: "gocart/products",
            resource_type: "auto",
        }, (error, result) => {
            if (error) reject(error);
            else resolve(result?.secure_url as string);
        });

        uploadStream.end(file.buffer);
    })));
};

const getMonthlyBuckets = () => {
    const buckets: { key: string; label: string; totalRevenue: number }[] = [];
    const now = new Date();

    for (let index = 5; index >= 0; index--) {
        const current = new Date(now.getFullYear(), now.getMonth() - index, 1);
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        const label = current.toLocaleDateString(undefined, { month: "short", year: "numeric" });
        buckets.push({ key, label, totalRevenue: 0 });
    }

    return buckets;
};

export const getStoreOwnerProducts = async (req: Request, res: Response) => {
    try {
        const store = await getStoreByUser(req.user._id);
        const products = await Product.find({ store: store._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createStoreOwnerProduct = async (req: Request, res: Response) => {
    try {
        const store = await getStoreByUser(req.user._id);
        const images = await uploadImages((req.files as Express.Multer.File[]) || []);

        if (images.length === 0) {
            return res.status(400).json({ success: false, message: "At least one image is required" });
        }

        const product = await Product.create({
            ...req.body,
            sizes: parseSizes(req.body.sizes),
            images,
            store: store._id,
        });

        res.status(201).json({ success: true, data: product });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStoreOwnerProduct = async (req: Request, res: Response) => {
    try {
        const store = await getStoreByUser(req.user._id);
        const product = await Product.findById(req.params.productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (!product.store || product.store.toString() !== store._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update this product" });
        }

        let images = product.images || [];
        if (req.body.existingImages) {
            images = Array.isArray(req.body.existingImages) ? [...req.body.existingImages] : [req.body.existingImages];
        }

        const uploadedImages = await uploadImages((req.files as Express.Multer.File[]) || []);
        if (uploadedImages.length > 0) {
            images = [...images, ...uploadedImages];
        }

        const updates: any = { ...req.body };
        updates.sizes = parseSizes(req.body.sizes ?? product.sizes);
        updates.store = store._id;

        if (req.body.existingImages || uploadedImages.length > 0) {
            updates.images = images;
        }

        delete updates.existingImages;

        const updatedProduct = await Product.findByIdAndUpdate(req.params.productId, updates, {
            new: true,
            runValidators: true,
        });

        res.json({ success: true, data: updatedProduct });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteStoreOwnerProduct = async (req: Request, res: Response) => {
    try {
        const store = await getStoreByUser(req.user._id);
        const product = await Product.findById(req.params.productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (!product.store || product.store.toString() !== store._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this product" });
        }

        await Product.findByIdAndDelete(product._id);
        res.json({ success: true, data: null, message: "Product deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStoreOwnerOrders = async (req: Request, res: Response) => {
    try {
        const store = await getStoreByUser(req.user._id);
        const orders = await Order.find({ "items.store": store._id })
            .populate("user", "name")
            .populate("items.product", "name images price")
            .sort({ createdAt: -1 });

        const filteredOrders = orders.map((order) => {
            const items = order.items.filter((item: any) => item.store?.toString() === store._id.toString());
            const storeSubtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

            return {
                ...order.toObject(),
                items,
                storeSubtotal,
            };
        });

        res.json({ success: true, data: filteredOrders });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStoreOwnerRevenue = async (req: Request, res: Response) => {
    try {
        const store = await getStoreByUser(req.user._id);
        const paidOrders = await Order.find({
            paymentStatus: "paid",
            "items.store": store._id,
        }).sort({ createdAt: 1 });

        const buckets = getMonthlyBuckets();
        const monthlyMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

        let totalRevenue = 0;
        let totalOrders = 0;

        paidOrders.forEach((order) => {
            const storeItems = order.items.filter((item: any) => item.store?.toString() === store._id.toString());
            const orderRevenue = storeItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

            if (orderRevenue > 0) {
                totalRevenue += orderRevenue;
                totalOrders += 1;
            }

            const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
            const bucket = monthlyMap.get(key);
            if (bucket) {
                bucket.totalRevenue += orderRevenue;
            }
        });

        await store.updateOne({ revenue: totalRevenue, totalOrders });

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                revenueByMonth: buckets.map(({ label, totalRevenue: amount }) => ({ label, totalRevenue: amount })),
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
