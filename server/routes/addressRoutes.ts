import express from "express";
import { protect } from "../middleware/auth.js";
import {getAddresses,addAddress, updateAddress, deleteAddress} from "../controllers/addressController.js";

const AddressRouter = express.Router();

AddressRouter.get("/", protect, getAddresses);
AddressRouter.post("/", protect, addAddress);
AddressRouter.put("/:id", protect, updateAddress);
AddressRouter.delete("/:id", protect, deleteAddress);

export default AddressRouter;