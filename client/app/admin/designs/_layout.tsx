import { Stack } from "expo-router";
import { COLORS } from "@/constants";

export default function AdminDesignsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: COLORS.primary,
                headerTitleStyle: { fontWeight: "bold" },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="index" options={{ title: "Manage Designs" }} />
        </Stack>
    );
}
