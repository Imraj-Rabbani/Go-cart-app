import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS, getStoreStatusColor } from "@/constants";
import type { Product, Store } from "@/constants/types";

export default function StoreOwnerDashboard() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [store, setStore] = useState<Store | null>(null);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        activeProducts: 0,
    });

    const fetchDashboard = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get("/stores/my", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setStore(data.data);

            if (data.data?.status === "active") {
                const [revenueResponse, productsResponse] = await Promise.all([
                    api.get("/store-owner/revenue", { headers: { Authorization: `Bearer ${token}` } }),
                    api.get("/store-owner/products", { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                const products: Product[] = productsResponse.data.data || [];
                setStats({
                    totalRevenue: revenueResponse.data.data.totalRevenue,
                    totalOrders: revenueResponse.data.data.totalOrders,
                    activeProducts: products.filter((product) => product.isActive).length,
                });
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setStore(null);
            } else {
                Toast.show({
                    type: "error",
                    text1: error.response?.data?.message || "Failed to load store dashboard",
                });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading && !refreshing) {
        return (
            <View className="flex-1 items-center justify-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!store) {
        return (
            <View className="flex-1 bg-surface p-4 justify-center">
                <View className="bg-white p-6 rounded-2xl border border-gray-100">
                    <Text className="text-2xl font-bold text-primary mb-2">Start your seller journey</Text>
                    <Text className="text-secondary mb-6">Apply for a store to manage products, orders, and revenue in Gocart.</Text>
                    <TouchableOpacity className="bg-primary py-4 rounded-xl items-center" onPress={() => router.push("/store-owner/apply")}>
                        <Text className="text-white font-bold">Apply for a Store</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-surface p-4"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                setRefreshing(true);
                fetchDashboard();
            }} />}
        >
            <View className="bg-white p-5 rounded-2xl border border-gray-100 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-2xl font-bold text-primary flex-1 mr-3">{store.name}</Text>
                    <View className={`px-3 py-2 rounded-full ${getStoreStatusColor(store.status)}`}>
                        <Text className="text-xs font-bold uppercase text-primary">{store.status}</Text>
                    </View>
                </View>
                {store.description ? <Text className="text-secondary">{store.description}</Text> : null}
            </View>

            {store.status === "pending" && (
                <View className="bg-white p-5 rounded-2xl border border-gray-100">
                    <Text className="text-xl font-bold text-primary mb-2">Application under review</Text>
                    <Text className="text-secondary">Your store application is pending approval. We’ll unlock seller tools once it has been reviewed.</Text>
                </View>
            )}

            {store.status === "rejected" && (
                <View className="bg-white p-5 rounded-2xl border border-gray-100">
                    <Text className="text-xl font-bold text-primary mb-2">Application update</Text>
                    <Text className="text-secondary mb-3">Reason: {store.rejectionReason || "No reason provided."}</Text>
                    <TouchableOpacity className="bg-primary py-4 rounded-xl items-center" onPress={() => router.push("/store-owner/apply")}>
                        <Text className="text-white font-bold">Re-apply</Text>
                    </TouchableOpacity>
                </View>
            )}

            {store.status === "active" && (
                <>
                    <View className="flex-row flex-wrap justify-between mb-4">
                        <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} />
                        <StatCard label="Total Orders" value={stats.totalOrders.toString()} />
                        <StatCard label="Active Products" value={stats.activeProducts.toString()} />
                    </View>

                    <View className="bg-white p-5 rounded-2xl border border-gray-100">
                        <Text className="text-xl font-bold text-primary mb-4">Manage Store</Text>
                        <TouchableOpacity className="bg-surface py-4 px-4 rounded-xl mb-3" onPress={() => router.push("/store-owner/products")}>
                            <Text className="text-primary font-semibold">Products</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-surface py-4 px-4 rounded-xl mb-3" onPress={() => router.push("/store-owner/orders")}>
                            <Text className="text-primary font-semibold">Orders</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-surface py-4 px-4 rounded-xl" onPress={() => router.push("/store-owner/revenue")}>
                            <Text className="text-primary font-semibold">Revenue</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
    <View className="bg-white p-5 rounded-2xl border border-gray-100 w-[48%] mb-4">
        <Text className="text-xl font-bold text-primary mb-1">{value}</Text>
        <Text className="text-secondary text-xs uppercase font-medium">{label}</Text>
    </View>
);
