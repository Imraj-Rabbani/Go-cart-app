import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS, getDesignStatusColor } from "@/constants";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const FILTERS = ["all", "submitted", "in_production", "completed"];

export default function AdminDesignsScreen() {
    const { getToken } = useAuth();
    const { isLoaded, isAllowed } = useRoleGuard(["admin"]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [designs, setDesigns] = useState<any[]>([]);

    const fetchDesigns = async (status = selectedFilter) => {
        try {
            const token = await getToken();
            const { data } = await api.get("/designs/admin/all", {
                params: status === "all" ? {} : { status },
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
        if (isAllowed) {
            fetchDesigns(selectedFilter);
        }
    }, [isAllowed, selectedFilter]);

    const updateStatus = async (designId: string, status: string) => {
        try {
            const token = await getToken();
            await api.patch(`/designs/admin/${designId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Toast.show({ type: "success", text1: "Design status updated successfully" });
            fetchDesigns();
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to update design status" });
        }
    };

    if (!isLoaded || (loading && !refreshing)) {
        return <View className="flex-1 items-center justify-center bg-surface"><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!isAllowed) return null;

    return (
        <View className="flex-1 bg-surface">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3 bg-white border-b border-gray-100" contentContainerStyle={{ gap: 8 }}>
                {FILTERS.map((filter) => (
                    <TouchableOpacity key={filter} className={`px-4 py-2 rounded-full ${selectedFilter === filter ? "bg-primary" : "bg-surface"}`} onPress={() => setSelectedFilter(filter)}>
                        <Text className={selectedFilter === filter ? "text-white font-semibold capitalize" : "text-primary font-medium capitalize"}>{filter.replace("_", " ")}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <ScrollView className="flex-1 p-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                setRefreshing(true);
                fetchDesigns();
            }} />}>
                {designs.map((design) => (
                    <View key={design._id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                        <Image source={{ uri: design.artworkUrl }} className="w-full h-48 rounded-2xl bg-gray-100 mb-4" resizeMode="cover" />
                        <View className="flex-row justify-between items-start mb-2">
                            <View className="flex-1 mr-3">
                                <Text className="text-primary font-bold text-lg">{design.title}</Text>
                                <Text className="text-secondary text-sm capitalize">{design.productType}</Text>
                                <Text className="text-secondary text-sm">{design.user?.name}</Text>
                                <Text className="text-secondary text-sm">{design.user?.email}</Text>
                            </View>
                            <View className={`px-3 py-1.5 rounded-full ${getDesignStatusColor(design.status)}`}>
                                <Text className="text-xs font-bold uppercase text-primary">{design.status.replace("_", " ")}</Text>
                            </View>
                        </View>
                        {design.status === "submitted" ? (
                            <TouchableOpacity className="bg-primary py-4 rounded-xl items-center mt-2" onPress={() => updateStatus(design._id, "in_production")}>
                                <Text className="text-white font-bold">Mark In Production</Text>
                            </TouchableOpacity>
                        ) : null}
                        {design.status === "in_production" ? (
                            <TouchableOpacity className="bg-primary py-4 rounded-xl items-center mt-2" onPress={() => updateStatus(design._id, "completed")}>
                                <Text className="text-white font-bold">Mark Completed</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
