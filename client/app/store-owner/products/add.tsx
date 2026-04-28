import React, { useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { CATEGORIES, COLORS } from "@/constants";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function AddStoreOwnerProduct() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoaded, isAllowed } = useRoleGuard(["store_owner"]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [category, setCategory] = useState("Men");
    const [sizes, setSizes] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImages(result.assets.map((asset) => asset.uri).slice(0, 5));
        }
    };

    const handleSubmit = async () => {
        if (!name || !price || !stock || !sizes || images.length === 0) {
            Toast.show({ type: "error", text1: "Please fill in all required fields" });
            return;
        }

        try {
            setSubmitting(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("price", price);
            formData.append("stock", stock);
            formData.append("category", category);
            formData.append("sizes", sizes);

            images.forEach((uri, index) => {
                formData.append("images", {
                    uri,
                    type: "image/jpeg",
                    name: `store-product-${index}.jpg`,
                } as any);
            });

            const { data } = await api.post("/store-owner/products", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            Toast.show({ type: "success", text1: data.message || "Product added successfully" });
            router.replace("/store-owner/products");
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to add product" });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isLoaded) {
        return <View className="flex-1 items-center justify-center bg-surface"><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!isAllowed) return null;

    return (
        <ScrollView className="flex-1 bg-surface p-4">
            <View className="bg-white p-4 rounded-xl border border-gray-100">
                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Product Name *</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" value={name} onChangeText={setName} />

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Description</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary h-24" multiline value={description} onChangeText={setDescription} textAlignVertical="top" />

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Price *</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Stock *</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" keyboardType="number-pad" value={stock} onChangeText={setStock} />

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Category *</Text>
                <TouchableOpacity className="bg-surface p-3 rounded-lg mb-4 flex-row justify-between items-center" onPress={() => setModalVisible(true)}>
                    <Text className="text-primary">{category}</Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.secondary} />
                </TouchableOpacity>

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Sizes *</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" value={sizes} onChangeText={setSizes} placeholder="S, M, L" />

                <Text className="text-secondary text-xs font-bold mb-2 uppercase">Images *</Text>
                <TouchableOpacity onPress={pickImages} className="mb-6">
                    {images.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {images.map((uri) => (
                                <Image key={uri} source={{ uri }} className="w-28 h-28 rounded-xl mr-2" />
                            ))}
                        </ScrollView>
                    ) : (
                        <View className="h-32 bg-gray-100 rounded-xl border border-dashed border-gray-300 items-center justify-center">
                            <Ionicons name="cloud-upload-outline" size={32} color={COLORS.secondary} />
                            <Text className="text-secondary text-xs mt-2">Tap to upload images</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity className={`bg-primary py-4 rounded-xl items-center ${submitting ? "opacity-70" : ""}`} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Create Product</Text>}
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-2xl p-4 max-h-[50%]">
                            <Text className="text-lg font-bold text-center mb-4">Select Category</Text>
                            <FlatList
                                data={CATEGORIES}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity className={`p-4 border-b ${category === item.name ? "bg-primary/5" : ""}`} onPress={() => {
                                        setCategory(item.name);
                                        setModalVisible(false);
                                    }}>
                                        <View className="flex-row justify-between">
                                            <Text className={category === item.name ? "font-bold text-primary" : "text-primary"}>{item.name}</Text>
                                            {category === item.name ? <Ionicons name="checkmark" size={20} color={COLORS.primary} /> : null}
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ScrollView>
    );
}
