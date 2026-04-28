import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS, getStatusColor } from "@/constants";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function StoreOwnerOrdersScreen() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoaded, isAllowed } = useRoleGuard(["store_owner"]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);

    const fetchOrders = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get("/store-owner/orders", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOrders(data.data);
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to fetch orders" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isAllowed) {
            fetchOrders();
        }
    }, [isAllowed]);

    if (!isLoaded || (loading && !refreshing)) {
        return <View className="flex-1 items-center justify-center bg-surface"><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!isAllowed) return null;

    return (
        <ScrollView className="flex-1 bg-surface p-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchOrders();
        }} />}>
            {orders.length === 0 ? (
                <View className="mt-20 items-center">
                    <Text className="text-secondary">No orders found</Text>
                </View>
            ) : (
                orders.map((order) => (
                    <TouchableOpacity key={order._id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-4" onPress={() => router.push(`/store-owner/orders/${order._id}`)}>
                        <View className="flex-row justify-between items-center mb-3">
                            <View>
                                <Text className="text-primary font-bold">Order #{order.orderNumber}</Text>
                                <Text className="text-secondary text-xs mt-1">{new Date(order.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View className={`px-3 py-1.5 rounded-full ${getStatusColor(order.orderStatus)}`}>
                                <Text className="text-xs font-bold uppercase">{order.orderStatus}</Text>
                            </View>
                        </View>
                        <Text className="text-secondary text-sm mb-1">Customer: {order.user?.name || "Unknown customer"}</Text>
                        <Text className="text-secondary text-sm mb-2">Items: {order.items.map((item: any) => `${item.name} x${item.quantity}`).join(", ")}</Text>
                        <Text className="text-primary font-bold">${order.storeSubtotal.toFixed(2)}</Text>
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
    );
}
