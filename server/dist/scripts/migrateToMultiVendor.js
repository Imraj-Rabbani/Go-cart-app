import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Store from "../models/Store.js";
import Product from "../models/Products.js";
const migrateToMultiVendor = async () => {
    try {
        await connectDB();
        const adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
            throw new Error("Admin user not found");
        }
        let officialStore = await Store.findOne({ owner: adminUser._id, name: "Official Store" });
        if (!officialStore) {
            officialStore = await Store.create({
                owner: adminUser._id,
                name: "Official Store",
                status: "active",
            });
        }
        const filter = {
            $or: [
                { store: null },
                { store: { $exists: false } },
            ],
        };
        const migratedCount = await Product.countDocuments(filter);
        await Product.updateMany(filter, { $set: { store: officialStore._id } });
        console.log(`Multi-vendor migration complete. Migrated ${migratedCount} products to Official Store.`);
        await mongoose.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error("Multi-vendor migration failed:", error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
};
migrateToMultiVendor();
