import { Stack } from "expo-router";
import { COLORS } from "@/constants";

export default function StoreOwnerProductsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: COLORS.primary,
                headerTitleStyle: { fontWeight: "bold" },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="index" options={{ title: "Products" }} />
            <Stack.Screen name="add" options={{ title: "Add Product" }} />
            <Stack.Screen name="edit/[id]" options={{ title: "Edit Product" }} />
        </Stack>
    );
}
