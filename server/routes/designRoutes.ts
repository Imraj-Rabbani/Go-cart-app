import express from "express";
import upload from "../middleware/upload.js";
import { authorize, protect } from "../middleware/auth.js";
import {
    createDesign,
    deleteDesign,
    getAdminDesigns,
    getMyDesignById,
    getMyDesigns,
    submitDesign,
    updateDesignStatus,
} from "../controllers/designController.js";

const DesignRouter = express.Router();

DesignRouter.post("/", protect, upload.single("artwork"), createDesign);
DesignRouter.get("/my", protect, getMyDesigns);
DesignRouter.get("/admin/all", protect, authorize("admin"), getAdminDesigns);
DesignRouter.patch("/admin/:designId/status", protect, authorize("admin"), updateDesignStatus);
DesignRouter.get("/:designId", protect, getMyDesignById);
DesignRouter.delete("/:designId", protect, deleteDesign);
DesignRouter.patch("/:designId/submit", protect, submitDesign);

export default DesignRouter;
