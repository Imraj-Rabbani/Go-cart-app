import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS, getDesignStatusColor } from "@/constants";
import type { Design } from "@/constants/types";
import Header from '@/components/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import MockupPreview from "@/components/MockupPreview";

export default function MyDesignsScreen() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [designs, setDesigns] = useState<Design[]>([]);

    const fetchDesigns = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get("/designs/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDesigns(data.data);
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to fetch designs" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDesigns();
    }, []);

    const removeDesign = (designId: string) => {
        Alert.alert("Delete Design", "Are you sure you want to delete this draft design?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await getToken();
                        await api.delete(`/designs/${designId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        Toast.show({ type: "success", text1: "Design deleted successfully" });
                        fetchDesigns();
                    } catch (error: any) {
                        Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to delete design" });
                    }
                },
            },
        ]);
    };

    if (loading && !refreshing) {
        return <View className="flex-1 items-center justify-center bg-surface"><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title='My Designs' showBack />
            <View className="p-4 bg-white border border-gray-100 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-primary">My Designs ({designs.length})</Text>
                <TouchableOpacity className="bg-primary px-4 py-2 rounded-full" onPress={() => router.push("/designs/create")}>
                    <Text className="text-white font-medium">Create Design</Text>
                </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                setRefreshing(true);
                fetchDesigns();
            }} />}>
                {designs.length === 0 ? (
                    <View className="mt-20 items-center">
                        <Text className="text-secondary">No designs found</Text>
                    </View>
                ) : (
                    designs.map((design) => (
                        <View key={design._id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                            <MockupPreview
                                productType={design.productType}
                                color={design.color}
                                artworkUrl={design.artworkUrl}
                                placement={design.placement}
                                className="w-full h-52 rounded-2xl mb-4"
                            />
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1 mr-3">
                                    <Text className="text-primary font-bold text-lg">{design.title}</Text>
                                    <Text className="text-secondary capitalize">{design.productType}</Text>
                                    <Text className="text-secondary text-sm mt-1">${design.price.toFixed(2)} • Stock {design.stock}</Text>
                                </View>
                                <View className={`px-3 py-1.5 rounded-full ${getDesignStatusColor(design.status)}`}>
                                    <Text className="text-xs font-bold uppercase text-primary">{design.status.replace("_", " ")}</Text>
                                </View>
                            </View>
                            {design.status === "draft" ? (
                                <View className="flex-row mt-2">
                                    <TouchableOpacity className="bg-red-50 py-3 rounded-xl items-center flex-1" onPress={() => removeDesign(design._id)}>
                                        <Text className="text-red-600 font-bold">Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
