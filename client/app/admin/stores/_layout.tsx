import { Stack } from "expo-router";
import { COLORS } from "@/constants";

export default function AdminStoresLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: COLORS.primary,
                headerTitleStyle: { fontWeight: "bold" },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="index" options={{ title: "Manage Stores" }} />
        </Stack>
    );
}
