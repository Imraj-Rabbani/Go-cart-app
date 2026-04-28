import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { COLORS } from "@/constants";
import type { Product } from "@/constants/types";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function EditStoreOwnerProduct() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoaded, isAllowed } = useRoleGuard(["store_owner"]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [category, setCategory] = useState("");
    const [sizes, setSizes] = useState("");
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<string[]>([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const token = await getToken();
                const { data } = await api.get("/store-owner/products", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const product: Product | undefined = data.data.find((item: Product) => item._id === id);

                if (!product) {
                    Toast.show({ type: "error", text1: "Product not found" });
                    router.back();
                    return;
                }

                setName(product.name);
                setDescription(product.description);
                setPrice(String(product.price));
                setStock(String(product.stock));
                setCategory(product.category);
                setSizes(product.sizes?.join(", ") || "");
                setExistingImages(product.images || []);
            } catch (error: any) {
                Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to fetch product" });
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (isAllowed) {
            fetchProduct();
        }
    }, [getToken, id, isAllowed, router]);

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5 - (existingImages.length + newImages.length),
            quality: 0.8,
        });

        if (!result.canceled) {
            setNewImages([...newImages, ...result.assets.map((asset) => asset.uri)]);
        }
    };

    const handleSubmit = async () => {
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
            existingImages.forEach((image) => formData.append("existingImages", image));
            newImages.forEach((uri, index) => {
                formData.append("images", {
                    uri,
                    type: "image/jpeg",
                    name: `store-owner-edit-${index}.jpg`,
                } as any);
            });

            const { data } = await api.put(`/store-owner/products/${id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            Toast.show({ type: "success", text1: data.message || "Product updated successfully" });
            router.replace("/store-owner/products");
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.response?.data?.message || "Failed to update product" });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isLoaded || loading) {
        return <View className="flex-1 items-center justify-center bg-surface"><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!isAllowed) return null;

    return (
        <ScrollView className="flex-1 bg-surface p-4">
            <View className="bg-white p-4 rounded-xl border border-gray-100">
                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Product Name</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" value={name} onChangeText={setName} />

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Description</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary h-24" multiline textAlignVertical="top" value={description} onChangeText={setDescription} />

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Price</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Stock</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" keyboardType="number-pad" value={stock} onChangeText={setStock} />

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Category</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" value={category} onChangeText={setCategory} />

                <Text className="text-secondary text-xs font-bold mb-1 uppercase">Sizes</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" value={sizes} onChangeText={setSizes} />

                <Text className="text-secondary text-xs font-bold mb-2 uppercase">Images</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {existingImages.map((image) => (
                        <TouchableOpacity key={image} className="mr-2" onPress={() => setExistingImages(existingImages.filter((item) => item !== image))}>
                            <Image source={{ uri: image }} className="w-24 h-24 rounded-xl" />
                        </TouchableOpacity>
                    ))}
                    {newImages.map((image) => (
                        <TouchableOpacity key={image} className="mr-2" onPress={() => setNewImages(newImages.filter((item) => item !== image))}>
                            <Image source={{ uri: image }} className="w-24 h-24 rounded-xl border border-primary" />
                        </TouchableOpacity>
                    ))}
                    {(existingImages.length + newImages.length) < 5 ? (
                        <TouchableOpacity className="w-24 h-24 rounded-xl bg-gray-100 border border-dashed border-gray-300 items-center justify-center" onPress={pickImages}>
                            <Text className="text-secondary">Add</Text>
                        </TouchableOpacity>
                    ) : null}
                </ScrollView>

                <TouchableOpacity className={`bg-primary py-4 rounded-xl items-center ${submitting ? "opacity-70" : ""}`} disabled={submitting} onPress={handleSubmit}>
                    {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Update Product</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
