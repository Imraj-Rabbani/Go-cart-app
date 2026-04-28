import { Stack } from "expo-router";
import { COLORS } from "@/constants";

export default function StoreOwnerOrdersLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: COLORS.primary,
                headerTitleStyle: { fontWeight: "bold" },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="index" options={{ title: "Orders" }} />
            <Stack.Screen name="[id]" options={{ title: "Order Details" }} />
        </Stack>
    );
}
