import { Types } from "mongoose";
import Store from "../models/Store.js";

export const getStoreByUser = async (userId: Types.ObjectId) => {
    const store = await Store.findOne({ owner: userId });
    if (!store) throw new Error("Store not found for this user");
    return store;
};
