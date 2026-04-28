import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS, getStatusColor } from "@/constants";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function StoreOwnerOrderDetails() {
    const { id } = useLocalSearchParams();
    const { getToken } = useAuth();
    const { isLoaded, isAllowed } = useRoleGuard(["store_owner"]);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const token = await getToken();
                const { data } = await api.get("/store-owner/orders", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setOrder(data.data.find((item: any) => item._id === id) || null);
            } catch (error: any) {
                Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to fetch order" });
            } finally {
                setLoading(false);
            }
        };

        if (isAllowed) {
            fetchOrder();
        }
    }, [getToken, id, isAllowed]);

    if (!isLoaded || loading) {
        return <View className="flex-1 items-center justify-center bg-surface"><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!isAllowed) return null;

    if (!order) {
        return <View className="flex-1 items-center justify-center bg-surface"><Text className="text-secondary">Order not found</Text></View>;
    }

    return (
        <ScrollView className="flex-1 bg-surface p-4">
            <View className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                <View className="flex-row justify-between items-center">
                    <Text className="text-primary font-bold text-lg">Order #{order.orderNumber}</Text>
                    <View className={`px-3 py-1.5 rounded-full ${getStatusColor(order.orderStatus)}`}>
                        <Text className="text-xs font-bold uppercase">{order.orderStatus}</Text>
                    </View>
                </View>
                <Text className="text-secondary text-sm mt-2">{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>

            <View className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                <Text className="text-primary font-bold text-lg mb-3">Items</Text>
                {order.items.map((item: any) => (
                    <View key={item._id} className="py-3 border-b border-gray-100 last:border-b-0">
                        <Text className="text-primary font-medium">{item.name}</Text>
                        <Text className="text-secondary text-sm">Size: {item.size || "-"}</Text>
                        <Text className="text-secondary text-sm">Quantity: {item.quantity}</Text>
                        <Text className="text-primary font-bold">${item.price.toFixed(2)}</Text>
                    </View>
                ))}
            </View>

            <View className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                <Text className="text-primary font-bold text-lg mb-3">Shipping Address</Text>
                <Text className="text-secondary">{order.shippingAddress.street}</Text>
                <Text className="text-secondary">{order.shippingAddress.city}, {order.shippingAddress.state}</Text>
                <Text className="text-secondary">{order.shippingAddress.zipCode}, {order.shippingAddress.country}</Text>
            </View>

            <View className="bg-white p-4 rounded-2xl border border-gray-100">
                <Text className="text-primary font-bold text-lg mb-2">Store Subtotal</Text>
                <Text className="text-primary font-bold text-2xl">${order.storeSubtotal.toFixed(2)}</Text>
            </View>
        </ScrollView>
    );
}
