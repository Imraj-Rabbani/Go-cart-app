import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useEffect } from "react";

export const useRoleGuard = (roles: string[]) => {
    const router = useRouter();
    const { isLoaded, user } = useUser();

    useEffect(() => {
        if (!isLoaded) return;

        const role = String(user?.publicMetadata?.role || "user");
        if (!user || !roles.includes(role)) {
            router.replace("/(tabs)/profile");
        }
    }, [isLoaded, roles, router, user]);

    return {
        isLoaded,
        isAllowed: !!user && roles.includes(String(user.publicMetadata?.role || "user")),
    };
};
