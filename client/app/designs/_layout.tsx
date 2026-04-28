import { Stack } from "expo-router";
import { COLORS } from "@/constants";

export default function DesignsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: COLORS.primary,
                headerTitleStyle: { fontWeight: "bold" },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="index" options={{ title: "My Designs", headerShown:false }} />
            <Stack.Screen name="create" options={{ title: "Create Design", headerShown:false }} />
        </Stack>
    );
}
