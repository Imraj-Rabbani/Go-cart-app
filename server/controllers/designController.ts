import { Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";
import Design from "../models/Design.js";
import Store from "../models/Store.js";
import { publishDesignProduct } from "../utils/publishDesignProduct.js";
import Product from "../models/Products.js";

const uploadArtwork = (file: Express.Multer.File) => {
    return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: "gocart/designs",
            resource_type: "auto",
        }, (error, result) => {
            if (error) reject(error);
            else resolve({
                secure_url: result?.secure_url as string,
                public_id: result?.public_id as string,
            });
        });

        uploadStream.end(file.buffer);
    });
};

const parseSizes = (sizes: any) => {
    if (!sizes) return [];
    if (Array.isArray(sizes)) return sizes;
    if (typeof sizes === "string") {
        try {
            const parsed = JSON.parse(sizes);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            return sizes.split(",").map((size: string) => size.trim()).filter(Boolean);
        }
    }

    return [sizes];
};

export const createDesign = async (req: Request, res: Response) => {
    try {
        const { title, productType, color, description, price, stock, category, previewUrl } = req.body;
        let { placement } = req.body;

        if (!title || !productType || !color || !price || !stock || !category) {
            return res.status(400).json({ success: false, message: "Please provide all required design details" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Artwork is required" });
        }

        const store = await Store.findOne({ owner: req.user._id });
        if (!store) {
            return res.status(400).json({ success: false, message: "Create a store before publishing designs" });
        }

        if (typeof placement === "string") {
            placement = JSON.parse(placement);
        }

        const artwork = await uploadArtwork(req.file);
        const design = new Design({
            user: req.user._id,
            store: store._id,
            title,
            productType,
            color,
            description,
            price: Number(price),
            stock: Number(stock),
            category,
            sizes: parseSizes(req.body.sizes),
            artworkUrl: artwork.secure_url,
            artworkPublicId: artwork.public_id,
            previewUrl,
            placement: {
                x: Number(placement?.x || 0),
                y: Number(placement?.y || 0),
                scale: Number(placement?.scale || 1),
            },
            status: store.status === "active" ? "completed" : "draft",
        });

        await design.save();

        if (store.status === "active") {
            await publishDesignProduct(design, store);
        }

        res.status(201).json({
            success: true,
            data: design,
            message: store.status === "active"
                ? "Design created and published to products"
                : "Design saved. It will be published after your store is approved",
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyDesigns = async (req: Request, res: Response) => {
    try {
        const designs = await Design.find({ user: req.user._id }).populate("product").sort({ createdAt: -1 });
        res.json({ success: true, data: designs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyDesignById = async (req: Request, res: Response) => {
    try {
        const design = await Design.findOne({ _id: req.params.designId, user: req.user._id });
        if (!design) {
            return res.status(404).json({ success: false, message: "Design not found" });
        }

        res.json({ success: true, data: design });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteDesign = async (req: Request, res: Response) => {
    try {
        const design = await Design.findOne({ _id: req.params.designId, user: req.user._id });
        if (!design) {
            return res.status(404).json({ success: false, message: "Design not found" });
        }

        if (design.product) {
            await Product.findByIdAndDelete(design.product);
        }

        await cloudinary.uploader.destroy(design.artworkPublicId);
        await Design.findByIdAndDelete(design._id);

        res.json({ success: true, data: null, message: "Design deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitDesign = async (req: Request, res: Response) => {
    try {
        const design = await Design.findOne({ _id: req.params.designId, user: req.user._id });
        if (!design) {
            return res.status(404).json({ success: false, message: "Design not found" });
        }

        if (design.status !== "draft") {
            return res.status(400).json({ success: false, message: "Only draft designs can be submitted" });
        }

        design.status = "submitted";
        await design.save();

        res.json({ success: true, data: design });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAdminDesigns = async (req: Request, res: Response) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query: any = {};

        if (status) query.status = status;

        const total = await Design.countDocuments(query);
        const designs = await Design.find(query)
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            success: true,
            data: designs,
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

export const updateDesignStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        if (!["in_production", "completed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid design status" });
        }

        const design = await Design.findByIdAndUpdate(req.params.designId, { status }, { new: true });
        if (!design) {
            return res.status(404).json({ success: false, message: "Design not found" });
        }

        res.json({ success: true, data: design });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
