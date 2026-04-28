import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS, getStoreStatusColor } from "@/constants";
import type { Design, Store } from "@/constants/types";
import MockupPreview from "@/components/MockupPreview";

export default function StoreOwnerDashboard() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [store, setStore] = useState<Store | null>(null);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        royaltyRate: 0.05,
    });
    const [designs, setDesigns] = useState<Design[]>([]);

    const fetchDashboard = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get("/stores/my", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setStore(data.data);

            const requests = [
                api.get("/designs/my", { headers: { Authorization: `Bearer ${token}` } }),
            ];

            if (data.data?.status === "active") {
                requests.push(
                    api.get("/store-owner/revenue", { headers: { Authorization: `Bearer ${token}` } }),
                );
            }

            const [designsResponse, revenueResponse] = await Promise.all(requests);
            setDesigns(designsResponse.data.data || []);

            if (revenueResponse) {
                setStats({
                    totalRevenue: revenueResponse.data.data.totalRevenue,
                    totalOrders: revenueResponse.data.data.totalOrders,
                    royaltyRate: revenueResponse.data.data.royaltyRate,
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
                        <Text className="text-white font-bold">Create Store</Text>
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
                <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                        <Text className="text-2xl font-bold text-primary">{store.name}</Text>
                        {store.description ? <Text className="text-secondary mt-2">{store.description}</Text> : null}
                    </View>
                    <View className={`px-3 py-2 rounded-full ${getStoreStatusColor(store.status)}`}>
                        <Text className="text-xs font-bold uppercase text-primary">{store.status}</Text>
                    </View>
                </View>
                <TouchableOpacity className="bg-primary py-3 rounded-xl items-center" onPress={() => router.push("/designs/create")}>
                    <Text className="text-white font-bold">Create New Design</Text>
                </TouchableOpacity>
            </View>

            {store.status === "pending" && (
                <View className="bg-white p-5 rounded-2xl border border-gray-100">
                    <Text className="text-xl font-bold text-primary mb-2">Application under review</Text>
                    <Text className="text-secondary">Your store is waiting for approval. You can still prepare designs now, and they will publish automatically after approval.</Text>
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
                        <StatCard label="Royalty Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} />
                        <StatCard label="Total Orders" value={stats.totalOrders.toString()} />
                        <StatCard label="Royalty Rate" value={`${Math.round(stats.royaltyRate * 100)}%`} />
                    </View>

                    <View className="bg-white p-5 rounded-2xl border border-gray-100">
                        <Text className="text-xl font-bold text-primary mb-4">Manage Store</Text>
                        <TouchableOpacity className="bg-surface py-4 px-4 rounded-xl mb-3" onPress={() => router.push("/store-owner/orders")}>
                            <Text className="text-primary font-semibold">Orders</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-surface py-4 px-4 rounded-xl" onPress={() => router.push("/store-owner/revenue")}>
                            <Text className="text-primary font-semibold">Revenue</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <View className="bg-white p-5 rounded-2xl border border-gray-100 mt-4">
                <Text className="text-xl font-bold text-primary mb-4">Store Designs</Text>
                {designs.length === 0 ? (
                    <Text className="text-secondary">No designs yet. Create your first one to start building your store catalog.</Text>
                ) : (
                    designs.map((design) => (
                        <View key={design._id} className="border border-gray-100 rounded-2xl p-4 mb-4 last:mb-0">
                            <MockupPreview
                                productType={design.productType}
                                color={design.color}
                                artworkUrl={design.artworkUrl}
                                placement={design.placement}
                                className="w-full h-52 rounded-2xl mb-4"
                            />
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1 mr-3">
                                    <Text className="text-primary font-bold text-lg">{design.title}</Text>
                                    <Text className="text-secondary capitalize">{design.productType}</Text>
                                    <Text className="text-secondary text-sm mt-1">${design.price.toFixed(2)} • Stock {design.stock}</Text>
                                </View>
                                <View className={`px-3 py-1.5 rounded-full ${getStoreStatusColor(store.status === "active" ? "active" : design.status === "draft" ? "pending" : "active")}`}>
                                    <Text className="text-xs font-bold uppercase text-primary">{design.product ? "live" : design.status}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
    <View className="bg-white p-5 rounded-2xl border border-gray-100 w-[48%] mb-4">
        <Text className="text-xl font-bold text-primary mb-1">{value}</Text>
        <Text className="text-secondary text-xs uppercase font-medium">{label}</Text>
    </View>
);
