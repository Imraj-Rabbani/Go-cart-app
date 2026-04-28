import express from "express";
import upload from "../middleware/upload.js";
import { authorize, protect } from "../middleware/auth.js";
import {
    applyForStore,
    approveStore,
    getAdminStores,
    getMyStore,
    getStoreById,
    rejectStore,
} from "../controllers/storeController.js";

const StoreRouter = express.Router();

StoreRouter.post("/apply", protect, upload.single("logo"), applyForStore);
StoreRouter.get("/my", protect, getMyStore);
StoreRouter.get("/admin/all", protect, authorize("admin"), getAdminStores);
StoreRouter.put("/admin/:storeId/approve", protect, authorize("admin"), approveStore);
StoreRouter.put("/admin/:storeId/reject", protect, authorize("admin"), rejectStore);
StoreRouter.get("/:storeId", getStoreById);

export default StoreRouter;
