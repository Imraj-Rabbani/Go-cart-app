import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS, getStoreStatusColor } from "@/constants";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const FILTERS = ["all", "pending", "active", "rejected"];

export default function AdminStoresScreen() {
    const { getToken } = useAuth();
    const { isLoaded, isAllowed } = useRoleGuard(["admin"]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [stores, setStores] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");

    const fetchStores = async (status = selectedFilter) => {
        try {
            const token = await getToken();
            const { data } = await api.get("/stores/admin/all", {
                params: status === "all" ? {} : { status },
                headers: { Authorization: `Bearer ${token}` },
            });
            setStores(data.data);
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to fetch stores" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isAllowed) {
            fetchStores(selectedFilter);
        }
    }, [isAllowed, selectedFilter]);

    const approveStore = async (storeId: string) => {
        try {
            const token = await getToken();
            await api.put(`/stores/admin/${storeId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Toast.show({ type: "success", text1: "Store approved successfully" });
            fetchStores();
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to approve store" });
        }
    };

    const rejectStore = async () => {
        try {
            const token = await getToken();
            await api.put(`/stores/admin/${selectedStoreId}/reject`, { rejectionReason }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Toast.show({ type: "success", text1: "Store rejected successfully" });
            setModalVisible(false);
            setRejectionReason("");
            fetchStores();
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to reject store" });
        }
    };

    if (!isLoaded || (loading && !refreshing)) {
        return <View className="flex-1 items-center justify-center bg-surface"><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!isAllowed) return null;

    return (
        <View className="flex-1 bg-surface">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-4 py-3 bg-white border-b border-gray-100"
                contentContainerStyle={{ gap: 8 }}
            >
                {FILTERS.map((filter) => (
                    <TouchableOpacity key={filter} className={`px-4 py-2 rounded-full ${selectedFilter === filter ? "bg-primary" : "bg-surface"}`} onPress={() => setSelectedFilter(filter)}>
                        <Text className={selectedFilter === filter ? "text-white font-semibold capitalize" : "text-primary font-medium capitalize"}>{filter}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <ScrollView className="flex-1 p-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                setRefreshing(true);
                fetchStores();
            }} />}>
                {stores.map((store) => (
                    <View key={store._id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                        <View className="flex-row justify-between items-start mb-2">
                            <View className="flex-1 mr-3">
                                <Text className="text-primary font-bold text-lg">{store.name}</Text>
                                <Text className="text-secondary text-sm">{store.owner?.name}</Text>
                                <Text className="text-secondary text-sm">{store.owner?.email}</Text>
                            </View>
                            <View className={`px-3 py-1.5 rounded-full ${getStoreStatusColor(store.status)}`}>
                                <Text className="text-xs font-bold uppercase text-primary">{store.status}</Text>
                            </View>
                        </View>
                        <Text className="text-secondary text-sm mb-3">{new Date(store.createdAt).toLocaleDateString()}</Text>
                        <View className="bg-surface rounded-xl p-3 mb-3">
                            <Text className="text-secondary text-xs uppercase font-medium mb-1">Royalty Revenue</Text>
                            <Text className="text-primary font-bold text-lg">${Number(store.revenue || 0).toFixed(2)}</Text>
                            <Text className="text-secondary text-sm mt-1">Orders: {store.totalOrders || 0} • Rate: {Math.round((store.royaltyRate || 0.05) * 100)}%</Text>
                        </View>
                        {store.status === "pending" ? (
                            <View className="flex-row">
                                <TouchableOpacity className="bg-primary px-4 py-3 rounded-xl mr-2 flex-1 items-center" onPress={() => approveStore(store._id)}>
                                    <Text className="text-white font-bold">Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="bg-red-50 px-4 py-3 rounded-xl flex-1 items-center" onPress={() => {
                                    setSelectedStoreId(store._id);
                                    setModalVisible(true);
                                }}>
                                    <Text className="text-red-600 font-bold">Reject</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                ))}
            </ScrollView>

            <Modal visible={modalVisible} animationType="fade" transparent>
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View className="flex-1 items-center justify-center bg-black/50 px-4">
                        <TouchableWithoutFeedback>
                            <View className="bg-white w-full rounded-2xl p-5">
                                <Text className="text-primary font-bold text-lg mb-3">Reject Store</Text>
                                <TextInput
                                    className="bg-surface p-3 rounded-xl text-primary h-28 mb-4"
                                    multiline
                                    textAlignVertical="top"
                                    placeholder="Add a rejection reason"
                                    value={rejectionReason}
                                    onChangeText={setRejectionReason}
                                />
                                <TouchableOpacity className="bg-primary py-4 rounded-xl items-center" onPress={rejectStore}>
                                    <Text className="text-white font-bold">Submit Rejection</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}
