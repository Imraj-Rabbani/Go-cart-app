import React, { useEffect } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { COLORS } from "@/constants";
import { useCart } from "@/context/CartContext";

export default function PaymentStatusScreen() {
    const router = useRouter();
    const { clearCart } = useCart();
    const { status } = useLocalSearchParams<{ status: string }>();

    useEffect(() => {
        WebBrowser.dismissBrowser();
        if (status === "success") {
            clearCart();
        }
    }, [clearCart, status]);

    const isSuccess = status === "success";
    const isCancelled = status === "cancelled";

    return (
        <SafeAreaView className="flex-1 bg-surface justify-center items-center px-6">
            <View className="bg-white rounded-3xl border border-gray-100 p-6 w-full items-center">
                <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isSuccess ? "bg-green-100" : isCancelled ? "bg-yellow-100" : "bg-red-100"}`}>
                    {status ? (
                        <Text className="text-2xl">{isSuccess ? "✓" : isCancelled ? "!" : "×"}</Text>
                    ) : (
                        <ActivityIndicator color={COLORS.primary} />
                    )}
                </View>
                <Text className="text-2xl font-bold text-primary mb-2">
                    {isSuccess ? "Payment Successful" : isCancelled ? "Payment Cancelled" : "Payment Failed"}
                </Text>
                <Text className="text-secondary text-center mb-6">
                    {isSuccess
                        ? "Your bKash payment was confirmed and your order is now in the system."
                        : isCancelled
                            ? "You cancelled the payment. Your cart is still available if you want to try again."
                            : "The payment could not be completed. Please try again."}
                </Text>

                <TouchableOpacity
                    className="bg-primary py-4 rounded-2xl items-center w-full mb-3"
                    onPress={() => router.replace(isSuccess ? "/orders" : "/checkout")}
                >
                    <Text className="text-white font-bold">{isSuccess ? "View Orders" : "Back to Checkout"}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
                    <Text className="text-secondary font-medium">Go Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
