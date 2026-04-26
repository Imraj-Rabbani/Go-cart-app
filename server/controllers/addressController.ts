import { Request, Response } from "express";
import Address from "../models/Address.js";

// Get all addresses for user
// GET /api/addresses
export const getAddresses = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const addresses = await Address.find({ user: userId }).sort(
      "-isDefault -createdAt",
    );
    // console.log("Addresses:", JSON.stringify(addresses, null, 2));

    res.json({ success: true, data: addresses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new address
// POST /api/addresses
export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { type, street, city, state, zipCode, country, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { isDefault: false },
      );
    }

    const newAddress = await Address.create({
      user: userId,
      type,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: !!isDefault,
    });

    res.status(201).json({ success: true, data: newAddress });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update address
// PUT /api/addresses/:id
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { type, street, city, state, zipCode, country, isDefault } = req.body;

    let addressItem = await Address.findById(req.params.id);

    if (!addressItem) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    if (addressItem.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorised to update this address",
        });
    }

    // If setting this address as default, unset any existing default
    if (isDefault) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { isDefault: false },
      );
    }

    addressItem = await Address.findByIdAndUpdate(
      req.params.id,
      { type, street, city, state, zipCode, country, isDefault },
      { new: true },
    );

    res.json({ success: true, data: addressItem });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete address (soft delete)
// DELETE /api/addresses/:id
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const address = await Address.findById(req.params.id);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    if (address.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorised to delete this address",
        });
    }

    await address.deleteOne();
    res.json({ success: true, message: "Address removed successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
