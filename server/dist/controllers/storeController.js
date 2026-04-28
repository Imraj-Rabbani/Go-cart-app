import { clerkClient } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";
import Store from "../models/Store.js";
import User from "../models/User.js";
import Design from "../models/Design.js";
import { calculateStoreRevenue } from "../utils/storeRevenue.js";
import { publishDesignProduct } from "../utils/publishDesignProduct.js";
const uploadSingleFile = (file, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder,
            resource_type: "auto",
        }, (error, result) => {
            if (error)
                reject(error);
            else
                resolve(result?.secure_url);
        });
        uploadStream.end(file.buffer);
    });
};
export const applyForStore = async (req, res) => {
    try {
        const existingStore = await Store.findOne({ owner: req.user._id });
        if (existingStore) {
            if (existingStore.status !== "rejected") {
                return res.status(400).json({ success: false, message: "You already have a store application" });
            }
            const { name, description } = req.body;
            let logo = existingStore.logo || "";
            if (req.file) {
                logo = await uploadSingleFile(req.file, "gocart/stores");
            }
            existingStore.name = name || existingStore.name;
            existingStore.description = description;
            existingStore.logo = logo;
            existingStore.status = "pending";
            existingStore.rejectionReason = undefined;
            await existingStore.save();
            return res.status(200).json({ success: true, data: existingStore });
        }
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Store name is required" });
        }
        let logo = "";
        if (req.file) {
            logo = await uploadSingleFile(req.file, "gocart/stores");
        }
        const store = await Store.create({
            owner: req.user._id,
            name,
            description,
            logo,
            status: "pending",
        });
        res.status(201).json({ success: true, data: store });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getMyStore = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user._id }).populate("owner", "name email");
        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }
        res.json({ success: true, data: store });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getAdminStores = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};
        if (status)
            query.status = status;
        const total = await Store.countDocuments(query);
        const stores = await Store.find(query)
            .populate("owner", "name email")
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const enrichedStores = await Promise.all(stores.map(async (store) => {
            const { totalRevenue, totalOrders } = await calculateStoreRevenue(store._id);
            await store.updateOne({ revenue: totalRevenue, totalOrders });
            return {
                ...store.toObject(),
                revenue: totalRevenue,
                totalOrders,
                royaltyRate: 0.05,
            };
        }));
        res.json({
            success: true,
            data: enrichedStores,
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
export const approveStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId);
        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }
        store.status = "active";
        store.rejectionReason = undefined;
        await store.save();
        const owner = await User.findByIdAndUpdate(store.owner, { role: "store_owner" }, { new: true });
        if (owner?.clerkId) {
            await clerkClient.users.updateUser(owner.clerkId, {
                publicMetadata: { role: "store_owner" },
            });
        }
        const pendingDesigns = await Design.find({ store: store._id });
        for (const design of pendingDesigns) {
            if (!design.product) {
                await publishDesignProduct(design, store);
            }
        }
        const updatedStore = await Store.findById(store._id).populate("owner", "name email");
        res.json({ success: true, data: updatedStore });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const rejectStore = async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        if (!rejectionReason) {
            return res.status(400).json({ success: false, message: "Rejection reason is required" });
        }
        const store = await Store.findByIdAndUpdate(req.params.storeId, {
            status: "rejected",
            rejectionReason,
        }, { new: true }).populate("owner", "name email");
        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }
        res.json({ success: true, data: store });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getStoreById = async (req, res) => {
    try {
        const store = await Store.findOne({
            _id: req.params.storeId,
            status: "active",
        }).populate("owner", "name");
        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }
        res.json({ success: true, data: store });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
