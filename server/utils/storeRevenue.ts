import Order from "../models/Orders.js";
import { Types } from "mongoose";

const ROYALTY_RATE = 0.05;

export const calculateStoreRevenue = async (storeId: Types.ObjectId) => {
    const paidOrders = await Order.find({
        paymentStatus: "paid",
        "items.store": storeId,
    }).sort({ createdAt: 1 });

    const buckets: { key: string; label: string; totalRevenue: number }[] = [];
    const now = new Date();

    for (let index = 5; index >= 0; index--) {
        const current = new Date(now.getFullYear(), now.getMonth() - index, 1);
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        const label = current.toLocaleDateString(undefined, { month: "short", year: "numeric" });
        buckets.push({ key, label, totalRevenue: 0 });
    }

    const monthlyMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    let totalRevenue = 0;
    let totalOrders = 0;

    paidOrders.forEach((order) => {
        const storeItems = order.items.filter((item: any) => item.store?.toString() === storeId.toString());
        const grossAmount = storeItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const royalty = grossAmount * ROYALTY_RATE;

        if (royalty > 0) {
            totalRevenue += royalty;
            totalOrders += 1;
        }

        const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
        const bucket = monthlyMap.get(key);
        if (bucket) {
            bucket.totalRevenue += royalty;
        }
    });

    return {
        totalRevenue,
        totalOrders,
        revenueByMonth: buckets.map(({ label, totalRevenue: amount }) => ({
            label,
            totalRevenue: amount,
        })),
        royaltyRate: ROYALTY_RATE,
    };
};
