import React from "react";
import { Image, View } from "react-native";
import { getProductImage } from "@/constants/productImages";

const BASE_ARTWORK_FRACTION = 0.35;

type Placement = {
    x: number;
    y: number;
    scale: number;
};

type MockupPreviewProps = {
    productType: "t-shirt" | "hoodie" | "mug" | "tote-bag" | "phone-case";
    color: string;
    artworkUrl: string;
    placement?: Placement;
    className?: string;
};

export default function MockupPreview({
    productType,
    color,
    artworkUrl,
    placement,
    className = "w-full h-full",
}: MockupPreviewProps) {
    const baseImage = getProductImage(productType, color);
    const scale = placement?.scale || 1;
    const artworkSize = `${BASE_ARTWORK_FRACTION * scale * 100}%`;
    const baseLeft = 20 + (60 - BASE_ARTWORK_FRACTION * scale * 100) / 2;
    const baseTop = 15 + (70 - BASE_ARTWORK_FRACTION * scale * 100) / 2;
    const left = `${baseLeft + ((placement?.x || 0) * 100)}%`;
    const top = `${baseTop + ((placement?.y || 0) * 100)}%`;

    if (!baseImage) {
        return <Image source={{ uri: artworkUrl }} className={className} resizeMode="cover" />;
    }

    return (
        <View className={`relative overflow-hidden bg-gray-100 ${className}`}>
            <Image source={baseImage} className="w-full h-full" resizeMode="contain" />
            <Image
                source={{ uri: artworkUrl }}
                className="absolute"
                style={{
                    width: artworkSize,
                    height: artworkSize,
                    left,
                    top,
                }}
                resizeMode="contain"
            />
        </View>
    );
}
