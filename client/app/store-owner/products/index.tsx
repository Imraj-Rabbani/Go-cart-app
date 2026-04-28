import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS } from "@/constants";
import type { Product } from "@/constants/types";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function StoreOwnerProductsScreen() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoaded, isAllowed } = useRoleGuard(["store_owner"]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    const fetchProducts = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get("/store-owner/products", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProducts(data.data);
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to fetch products" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isAllowed) {
            fetchProducts();
        }
    }, [isAllowed]);

    const removeProduct = (productId: string) => {
        Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await getToken();
                        const { data } = await api.delete(`/store-owner/products/${productId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        Toast.show({ type: "success", text1: data.message || "Product deleted successfully" });
                        fetchProducts();
                    } catch (error: any) {
                        Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to delete product" });
                    }
                },
            },
        ]);
    };

    if (!isLoaded || (loading && !refreshing)) {
        return (
            <View className="flex-1 items-center justify-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!isAllowed) return null;

    return (
        <View className="flex-1 bg-surface">
            <View className="p-4 bg-white border border-gray-100 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-primary">Total Products ({products.length})</Text>
                <TouchableOpacity className="bg-primary px-4 py-2 rounded-full flex-row items-center" onPress={() => router.push("/store-owner/products/add")}>
                    <Ionicons name="add" size={18} color="white" />
                    <Text className="text-white font-medium ml-1">Add Product</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-3" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                setRefreshing(true);
                fetchProducts();
            }} />}>
                {products.length === 0 ? (
                    <View className="mt-20 items-center">
                        <Text className="text-secondary">No products found</Text>
                    </View>
                ) : (
                    products.map((product) => (
                        <View key={product._id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-3 flex-row items-center">
                            <Image source={{ uri: product.images?.[0] }} className="w-16 h-16 rounded-xl bg-gray-100 mr-3" />
                            <View className="flex-1">
                                <Text className="text-primary font-bold text-base" numberOfLines={1}>{product.name}</Text>
                                <Text className="text-secondary text-xs mb-1">Category: {product.category}</Text>
                                <Text className="text-secondary text-xs mb-1">Stock: {product.stock}</Text>
                                <Text className="text-secondary text-xs mb-1">Status: {product.isActive ? "Active" : "Inactive"}</Text>
                                <Text className="text-primary font-bold">${product.price.toFixed(2)}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <TouchableOpacity className="p-2 bg-slate-50 rounded-full mr-2" onPress={() => router.push(`/store-owner/products/edit/${product._id}`)}>
                                    <Ionicons name="create-outline" size={18} color="#333333" />
                                </TouchableOpacity>
                                <TouchableOpacity className="p-2 bg-gray-50 rounded-full" onPress={() => removeProduct(product._id)}>
                                    <Ionicons name="trash-outline" size={18} color="#333333" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
