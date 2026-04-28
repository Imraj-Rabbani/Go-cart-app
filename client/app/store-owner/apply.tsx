import React, { useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import api from "@/constants/api";
import { COLORS } from "@/constants";

export default function StoreApplyScreen() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [logo, setLogo] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const pickLogo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled) {
            setLogo(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            Toast.show({ type: "error", text1: "Store name is required" });
            return;
        }

        try {
            setSubmitting(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);

            if (logo) {
                formData.append("logo", {
                    uri: logo,
                    type: "image/jpeg",
                    name: "store-logo.jpg",
                } as any);
            }

            const { data } = await api.post("/stores/apply", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            Toast.show({
                type: "success",
                text1: data.message || "Your application is under review",
            });

            router.replace("/store-owner");
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: error.response?.data?.message || "Failed to submit store application",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-surface p-4">
            <View className="bg-white p-5 rounded-2xl border border-gray-100">
                <Text className="text-secondary text-xs font-bold uppercase mb-1">Store Name *</Text>
                <TextInput className="bg-surface p-3 rounded-lg mb-4 text-primary" value={name} onChangeText={setName} placeholder="Enter your store name" />

                <Text className="text-secondary text-xs font-bold uppercase mb-1">Description</Text>
                <TextInput
                    className="bg-surface p-3 rounded-lg mb-4 text-primary h-28"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    textAlignVertical="top"
                    placeholder="Tell customers what your store is about"
                />

                <Text className="text-secondary text-xs font-bold uppercase mb-2">Logo</Text>
                <TouchableOpacity onPress={pickLogo} className="mb-6">
                    {logo ? (
                        <Image source={{ uri: logo }} className="w-full h-48 rounded-2xl bg-gray-100" resizeMode="cover" />
                    ) : (
                        <View className="w-full h-40 rounded-2xl bg-gray-100 border border-dashed border-gray-300 items-center justify-center">
                            <Ionicons name="image-outline" size={32} color={COLORS.secondary} />
                            <Text className="text-secondary mt-2">Upload store logo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity className={`bg-primary py-4 rounded-xl items-center ${submitting ? "opacity-70" : ""}`} disabled={submitting} onPress={handleSubmit}>
                    {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Submit Application</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
