import { Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";
import Design from "../models/Design.js";

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

export const createDesign = async (req: Request, res: Response) => {
    try {
        const { title, productType } = req.body;

        if (!title || !productType) {
            return res.status(400).json({ success: false, message: "Title and product type are required" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Artwork is required" });
        }

        const artwork = await uploadArtwork(req.file);
        const design = await Design.create({
            user: req.user._id,
            title,
            productType,
            artworkUrl: artwork.secure_url,
            artworkPublicId: artwork.public_id,
        });

        res.status(201).json({ success: true, data: design });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyDesigns = async (req: Request, res: Response) => {
    try {
        const designs = await Design.find({ user: req.user._id }).sort({ createdAt: -1 });
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
