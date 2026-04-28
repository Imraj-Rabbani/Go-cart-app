import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    LayoutChangeEvent,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import api from "@/constants/api";
import { CATEGORIES } from "@/constants";
import Header from "@/components/Header";
import { getProductImage } from "@/constants/productImages";

const PRODUCT_TYPES: ("t-shirt" | "hoodie" | "mug" | "tote-bag" | "phone-case")[] = [
    "t-shirt",
    "hoodie",
    "mug",
    "tote-bag",
    "phone-case",
];

const COLOR_OPTIONS = [
    { id: "white", hex: "#FFFFFF", border: "#CBD5E1" },
    { id: "black", hex: "#111111", border: "#1E293B" },
    { id: "red", hex: "#DC2626", border: "#B91C1C" },
    { id: "blue", hex: "#2563EB", border: "#1D4ED8" },
];

const BASE_ARTWORK_FRACTION = 0.35;

type Placement = {
    x: number;
    y: number;
    scale: number;
};

type CanvasSize = {
    width: number;
    height: number;
};

function ArtworkLayer({
    uri,
    canvasSize,
    editable,
    initialPlacement,
    onChange,
    onRemove,
}: {
    uri: string;
    canvasSize: CanvasSize;
    editable: boolean;
    initialPlacement: Placement;
    onChange: (placement: Placement) => void;
    onRemove: () => void;
}) {
    const translateX = useSharedValue(initialPlacement.x * canvasSize.width);
    const translateY = useSharedValue(initialPlacement.y * canvasSize.height);
    const scale = useSharedValue(initialPlacement.scale);
    const savedX = useSharedValue(initialPlacement.x * canvasSize.width);
    const savedY = useSharedValue(initialPlacement.y * canvasSize.height);
    const savedScale = useSharedValue(initialPlacement.scale);

    const updatePlacement = () => {
        onChange({
            x: savedX.value / canvasSize.width,
            y: savedY.value / canvasSize.height,
            scale: savedScale.value,
        });
    };

    const panGesture = Gesture.Pan()
        .enabled(editable)
        .onUpdate((event) => {
            translateX.value = savedX.value + event.translationX;
            translateY.value = savedY.value + event.translationY;
        })
        .onEnd(() => {
            savedX.value = translateX.value;
            savedY.value = translateY.value;
            runOnJS(updatePlacement)();
        });

    const pinchGesture = Gesture.Pinch()
        .enabled(editable)
        .onUpdate((event) => {
            scale.value = Math.max(0.4, Math.min(2.5, savedScale.value * event.scale));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            runOnJS(updatePlacement)();
        });

    const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    const artworkSize = canvasSize.width * BASE_ARTWORK_FRACTION;
    const baseTop = canvasSize.height * 0.15 + (canvasSize.height * 0.7 - artworkSize) / 2;
    const baseLeft = canvasSize.width * 0.2 + (canvasSize.width * 0.6 - artworkSize) / 2;

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                style={[
                    {
                        position: "absolute",
                        width: artworkSize,
                        height: artworkSize,
                        top: baseTop,
                        left: baseLeft,
                    },
                    animatedStyle,
                ]}
            >
                <View
                    style={{
                        width: "100%",
                        height: "100%",
                        borderWidth: editable ? 2 : 0,
                        borderColor: "#2563EB",
                        borderStyle: "dashed",
                        borderRadius: 6,
                        overflow: "hidden",
                    }}
                >
                    <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                </View>

                {editable ? (
                    <TouchableOpacity
                        onPress={onRemove}
                        style={{
                            position: "absolute",
                            top: -10,
                            right: -10,
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#EF4444",
                        }}
                    >
                        <Ionicons name="close" size={14} color="white" />
                    </TouchableOpacity>
                ) : null}
            </Animated.View>
        </GestureDetector>
    );
}

export default function CreateDesignScreen() {
    const router = useRouter();
    const { getToken } = useAuth();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [sizes, setSizes] = useState("");
    const [category, setCategory] = useState<"Men" | "Women" | "Kids" | "Accessories">("Men");
    const [productType, setProductType] = useState<"t-shirt" | "hoodie" | "mug" | "tote-bag" | "phone-case">("t-shirt");
    const [color, setColor] = useState("white");
    const [artworkUri, setArtworkUri] = useState<string | null>(null);
    const [artworkFile, setArtworkFile] = useState<any>(null);
    const [placement, setPlacement] = useState<Placement>({ x: 0, y: 0, scale: 1 });
    const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingArtwork, setEditingArtwork] = useState(false);

    const productImage = useMemo(() => getProductImage(productType, color), [productType, color]);

    const pickArtwork = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setArtworkUri(asset.uri);
            setArtworkFile({
                uri: asset.uri,
                type: "image/jpeg",
                name: "design-artwork.jpg",
            });
            setPlacement({ x: 0, y: 0, scale: 1 });
            setEditingArtwork(false);
        }
    };

    const removeArtwork = () => {
        Alert.alert("Remove Artwork", "Remove artwork from this design?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: () => {
                    setArtworkUri(null);
                    setArtworkFile(null);
                    setEditingArtwork(false);
                },
            },
        ]);
    };

    const onCanvasLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setCanvasSize({ width, height });
    };

    const handleSubmit = async () => {
        if (!title.trim() || !artworkFile || !price || !stock) {
            Toast.show({ type: "error", text1: "Please complete the required design details" });
            return;
        }

        try {
            setSubmitting(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("price", price);
            formData.append("stock", stock);
            formData.append("sizes", sizes);
            formData.append("category", category);
            formData.append("productType", productType);
            formData.append("color", color);
            formData.append("placement", JSON.stringify(placement));
            formData.append("artwork", artworkFile);

            const { data } = await api.post("/designs", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            Toast.show({ type: "success", text1: data.message || "Design created!" });
            router.replace("/store-owner");
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: error.response?.data?.message || "Failed to create design",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
                <Header title="Design Studio" showBack />

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    scrollEnabled={!editingArtwork}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-5 shadow-sm">
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest p-4 pb-0">
                            Mockup Preview
                        </Text>

                        <View className="mx-4 my-4 rounded-2xl bg-gray-50 overflow-hidden" style={{ aspectRatio: 0.8 }} onLayout={onCanvasLayout}>
                            {productImage ? (
                                <Image source={productImage} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                            ) : null}

                            {artworkUri && canvasSize.width > 0 ? (
                                <ArtworkLayer
                                    uri={artworkUri}
                                    canvasSize={canvasSize}
                                    editable={editingArtwork}
                                    initialPlacement={placement}
                                    onChange={setPlacement}
                                    onRemove={removeArtwork}
                                />
                            ) : (
                                <View
                                    style={{
                                        position: "absolute",
                                        top: "15%",
                                        left: "20%",
                                        right: "20%",
                                        bottom: "15%",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    pointerEvents="none"
                                >
                                    <View className="border-2 border-dashed border-gray-300 rounded-xl w-full h-full items-center justify-center">
                                        <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                                        <Text className="text-gray-400 text-xs mt-2 text-center">
                                            Upload artwork below{"\n"}to place it on the product
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {artworkUri ? (
                        <View className="flex-row mb-4">
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-xl items-center mr-2 ${editingArtwork ? "bg-primary" : "bg-white border border-gray-200"}`}
                                onPress={() => setEditingArtwork((current) => !current)}
                            >
                                <Text className={editingArtwork ? "text-white font-bold" : "text-primary font-bold"}>
                                    {editingArtwork ? "Done Adjusting" : "Adjust Artwork"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-red-50 px-4 py-3 rounded-xl items-center" onPress={removeArtwork}>
                                <Text className="text-red-600 font-bold">Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    <View className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Design Title *</Text>
                        <TextInput
                            className="bg-gray-50 p-3 rounded-xl text-gray-900 border border-gray-100 mb-4"
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Give your design a name"
                            placeholderTextColor="#9CA3AF"
                        />

                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</Text>
                        <TextInput
                            className="bg-gray-50 p-3 rounded-xl text-gray-900 border border-gray-100 mb-4 h-24"
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe this design for shoppers"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                        />

                        <View className="flex-row justify-between mb-4">
                            <View className="w-[48%]">
                                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price *</Text>
                                <TextInput className="bg-gray-50 p-3 rounded-xl text-gray-900 border border-gray-100" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" />
                            </View>
                            <View className="w-[48%]">
                                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stock *</Text>
                                <TextInput className="bg-gray-50 p-3 rounded-xl text-gray-900 border border-gray-100" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="0" />
                            </View>
                        </View>

                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category *</Text>
                        <TouchableOpacity
                            className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex-row justify-between items-center mb-4"
                            onPress={() => setCategoryModalVisible(true)}
                        >
                            <Text className="text-gray-900">{category}</Text>
                            <Ionicons name="chevron-down" size={18} color="#6B7280" />
                        </TouchableOpacity>

                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sizes</Text>
                        <TextInput
                            className="bg-gray-50 p-3 rounded-xl text-gray-900 border border-gray-100 mb-4"
                            value={sizes}
                            onChangeText={setSizes}
                            placeholder="S, M, L"
                            placeholderTextColor="#9CA3AF"
                        />

                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Product Type *</Text>
                        <TouchableOpacity
                            className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex-row justify-between items-center mb-4"
                            onPress={() => setProductModalVisible(true)}
                        >
                            <Text className="text-gray-900 capitalize">{productType}</Text>
                            <Ionicons name="chevron-down" size={18} color="#6B7280" />
                        </TouchableOpacity>

                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Color</Text>
                        <View className="flex-row mb-4" style={{ gap: 12 }}>
                            {COLOR_OPTIONS.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => setColor(item.id)}
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 17,
                                        backgroundColor: item.hex,
                                        borderWidth: 2,
                                        borderColor: color === item.id ? "#2563EB" : item.border,
                                        transform: [{ scale: color === item.id ? 1.12 : 1 }],
                                    }}
                                />
                            ))}
                        </View>

                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Artwork *</Text>
                        <TouchableOpacity onPress={pickArtwork}>
                            {artworkUri ? (
                                <View className="relative">
                                    <Image source={{ uri: artworkUri }} className="w-full h-40 rounded-2xl bg-gray-100" resizeMode="cover" />
                                    <View className="absolute inset-0 rounded-2xl bg-black/20 items-center justify-center">
                                        <Text className="text-white text-xs font-semibold">Tap to change artwork</Text>
                                    </View>
                                </View>
                            ) : (
                                <View className="h-36 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 items-center justify-center">
                                    <Ionicons name="cloud-upload-outline" size={30} color="#9CA3AF" />
                                    <Text className="text-gray-400 mt-2 text-sm">Tap to upload artwork</Text>
                                    <Text className="text-gray-300 text-xs mt-1">PNG and JPG supported</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {editingArtwork ? (
                        <View className="bg-indigo-50 rounded-xl p-3 mb-4 flex-row items-center">
                            <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
                            <Text className="text-indigo-600 text-xs flex-1 ml-2">
                                Drag the artwork to reposition it and pinch to resize. Tap “Done Adjusting” when you want to scroll again.
                            </Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        className={`bg-gray-900 py-4 rounded-2xl items-center ${submitting ? "opacity-60" : ""}`}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Save Design</Text>}
                    </TouchableOpacity>
                </ScrollView>

                <Modal visible={productModalVisible} animationType="slide" transparent>
                    <TouchableWithoutFeedback onPress={() => setProductModalVisible(false)}>
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white rounded-t-3xl p-4">
                                <Text className="text-base font-bold text-center mb-4 text-gray-900">Select Product Type</Text>
                                <FlatList
                                    data={PRODUCT_TYPES}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            className={`p-4 border-b border-gray-50 flex-row justify-between items-center ${productType === item ? "bg-indigo-50" : ""}`}
                                            onPress={() => {
                                                setProductType(item);
                                                setProductModalVisible(false);
                                            }}
                                        >
                                            <Text className={productType === item ? "text-indigo-600 font-bold capitalize" : "text-gray-800 capitalize"}>
                                                {item}
                                            </Text>
                                            {productType === item ? <Ionicons name="checkmark" size={20} color="#6366F1" /> : null}
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <Modal visible={categoryModalVisible} animationType="slide" transparent>
                    <TouchableWithoutFeedback onPress={() => setCategoryModalVisible(false)}>
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white rounded-t-3xl p-4">
                                <Text className="text-base font-bold text-center mb-4 text-gray-900">Select Category</Text>
                                <FlatList
                                    data={CATEGORIES}
                                    keyExtractor={(item) => String(item.id)}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            className={`p-4 border-b border-gray-50 flex-row justify-between items-center ${category === item.name ? "bg-indigo-50" : ""}`}
                                            onPress={() => {
                                                setCategory(item.name as "Men" | "Women" | "Kids" | "Accessories");
                                                setCategoryModalVisible(false);
                                            }}
                                        >
                                            <Text className={category === item.name ? "text-indigo-600 font-bold" : "text-gray-800"}>
                                                {item.name}
                                            </Text>
                                            {category === item.name ? <Ionicons name="checkmark" size={20} color="#6366F1" /> : null}
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}
