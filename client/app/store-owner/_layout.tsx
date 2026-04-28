import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { COLORS } from "@/constants";
import { Ionicons } from "@expo/vector-icons";

export default function StoreOwnerLayout() {
    const router = useRouter();
    const { isLoaded, user } = useUser();

    useEffect(() => {
        if (isLoaded && !user) {
            router.replace("/(tabs)/profile");
        }
    }, [isLoaded, router, user]);

    if (!isLoaded) {
        return (
            <View className="flex-1 items-center justify-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!user) return null;

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: COLORS.primary,
                headerTitleStyle: { fontWeight: "bold" },
                headerShadowVisible: false,
                headerRight: () => (
                    <TouchableOpacity onPress={() => router.replace("/(tabs)/profile")} className="mr-4 flex-row items-center">
                        <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                        <Text className="ml-1 text-primary font-medium">Profile</Text>
                    </TouchableOpacity>
                ),
            }}
        />
    );
}
