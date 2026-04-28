import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS } from "@/constants";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function StoreOwnerRevenueScreen() {
    const { getToken } = useAuth();
    const { isLoaded, isAllowed } = useRoleGuard(["store_owner"]);
    const [loading, setLoading] = useState(true);
    const [revenue, setRevenue] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        revenueByMonth: [] as { label: string; totalRevenue: number }[],
    });

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const token = await getToken();
                const { data } = await api.get("/store-owner/revenue", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRevenue(data.data);
            } catch (error: any) {
                Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to fetch revenue" });
            } finally {
                setLoading(false);
            }
        };

        if (isAllowed) {
            fetchRevenue();
        }
    }, [getToken, isAllowed]);

    if (!isLoaded || loading) {
        return <View className="flex-1 items-center justify-center bg-surface"><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!isAllowed) return null;

    const maxRevenue = Math.max(...revenue.revenueByMonth.map((item) => item.totalRevenue), 1);

    return (
        <ScrollView className="flex-1 bg-surface p-4">
            <View className="bg-white p-5 rounded-2xl border border-gray-100 mb-4">
                <Text className="text-secondary text-xs uppercase font-medium mb-2">Total Royalty Revenue</Text>
                <Text className="text-primary text-3xl font-bold">${revenue.totalRevenue.toFixed(2)}</Text>
            </View>
            <View className="bg-white p-5 rounded-2xl border border-gray-100 mb-4">
                <Text className="text-secondary text-xs uppercase font-medium mb-2">Total Orders</Text>
                <Text className="text-primary text-3xl font-bold">{revenue.totalOrders}</Text>
            </View>
            <View className="bg-white p-5 rounded-2xl border border-gray-100 mb-4">
                <Text className="text-secondary text-xs uppercase font-medium mb-2">Royalty Rate</Text>
                <Text className="text-primary text-3xl font-bold">{Math.round(((revenue as any).royaltyRate || 0.05) * 100)}%</Text>
            </View>
            <View className="bg-white p-5 rounded-2xl border border-gray-100">
                <Text className="text-primary text-xl font-bold mb-4">Last 6 Months</Text>
                {revenue.revenueByMonth.map((item) => (
                    <View key={item.label} className="mb-4">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-secondary">{item.label}</Text>
                            <Text className="text-primary font-semibold">${item.totalRevenue.toFixed(2)}</Text>
                        </View>
                        <View className="h-3 rounded-full bg-gray-100 overflow-hidden">
                            <View className="h-3 rounded-full bg-primary" style={{ width: `${(item.totalRevenue / maxRevenue) * 100}%` }} />
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
