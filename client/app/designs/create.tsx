import React, { useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS } from "@/constants";
import Header from '@/components/Header'
import { SafeAreaView } from 'react-native-safe-area-context'


const PRODUCT_TYPES = ["t-shirt", "hoodie", "mug", "tote-bag", "phone-case"];

export default function CreateDesignScreen() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [title, setTitle] = useState("");
    const [productType, setProductType] = useState("t-shirt");
    const [artwork, setArtwork] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const pickArtwork = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
        });

        if (!result.canceled) {
            setArtwork(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !artwork) {
            Toast.show({ type: "error", text1: "Title and artwork are required" });
            return;
        }

        try {
            setSubmitting(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append("title", title);
            formData.append("productType", productType);
            formData.append("artwork", {
                uri: artwork,
                type: "image/jpeg",
                name: "design-artwork.jpg",
            } as any);

            await api.post("/designs", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            Toast.show({ type: "success", text1: "Design created!" });
            router.replace("/designs");
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to create design" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title='Create Design' showBack />
            <View className="bg-white p-5 rounded-2xl border border-gray-100">
                <Text className="text-secondary text-xs font-bold uppercase mb-1">Title *</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" value={title} onChangeText={setTitle} placeholder="Give your design a title" />

                <Text className="text-secondary text-xs font-bold uppercase mb-1">Product Type *</Text>
                <TouchableOpacity className="bg-surface p-3 rounded-lg mb-4 flex-row justify-between items-center" onPress={() => setModalVisible(true)}>
                    <Text className="text-primary capitalize">{productType}</Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.secondary} />
                </TouchableOpacity>

                <Text className="text-secondary text-xs font-bold uppercase mb-2">Artwork Upload *</Text>
                <TouchableOpacity onPress={pickArtwork} className="mb-6">
                    {artwork ? (
                        <Image source={{ uri: artwork }} className="w-full h-60 rounded-2xl bg-gray-100" resizeMode="cover" />
                    ) : (
                        <View className="h-48 rounded-2xl bg-gray-100 border border-dashed border-gray-300 items-center justify-center">
                            <Ionicons name="image-outline" size={32} color={COLORS.secondary} />
                            <Text className="text-secondary mt-2">Upload Artwork</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity className={`bg-primary py-4 rounded-xl items-center ${submitting ? "opacity-70" : ""}`} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Create Design</Text>}
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-2xl p-4 max-h-[50%]">
                            <Text className="text-lg font-bold text-center mb-4">Select Product Type</Text>
                            <FlatList
                                data={PRODUCT_TYPES}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity className={`p-4 border-b ${productType === item ? "bg-primary/5" : ""}`} onPress={() => {
                                        setProductType(item);
                                        setModalVisible(false);
                                    }}>
                                        <View className="flex-row justify-between">
                                            <Text className={productType === item ? "text-primary font-bold capitalize" : "text-primary capitalize"}>{item}</Text>
                                            {productType === item ? <Ionicons name="checkmark" size={20} color={COLORS.primary} /> : null}
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}
