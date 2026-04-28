import Store from "../models/Store.js";
export const getStoreByUser = async (userId) => {
    const store = await Store.findOne({ owner: userId });
    if (!store)
        throw new Error("Store not found for this user");
    return store;
};
