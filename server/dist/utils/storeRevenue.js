import Order from "../models/Orders.js";
const ROYALTY_RATE = 0.05;
export const calculateStoreRevenue = async (storeId) => {
    const eligibleOrders = await Order.find({
        orderStatus: { $ne: "cancelled" },
        "items.store": storeId,
        $or: [
            { paymentStatus: "paid" },
            { orderStatus: "delivered" },
        ],
    }).sort({ createdAt: 1 });
    const buckets = [];
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
    eligibleOrders.forEach((order) => {
        const storeItems = order.items.filter((item) => item.store?.toString() === storeId.toString());
        const grossAmount = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
