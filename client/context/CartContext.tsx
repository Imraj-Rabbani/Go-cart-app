import api from "@/constants/api";
import { Product, CartItem } from "@/constants/types";
import { useAuth } from "@clerk/clerk-expo";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import Toast from "react-native-toast-message";

// export type CartItem = {
//     id: string;
//     productId: string;
//     product: Product;
//     quantity: number;
//     size: string;
//     price: number;
// }

export type CartContextType = {
    cartItems: CartItem[];
    addToCart: (product: Product, size: string) => Promise<void>;
    removeFromCart: (itemId: string, size: string) => Promise<void>;
    updateQuantity: (itemId: string, size: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    cartTotal: number;
    itemCount: number;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);


export const CartProvider = ({ children }: { children: ReactNode }) => {

    const { getToken, isSignedIn } = useAuth()
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);

    const fetchCart = async () => {
        try {
            setIsLoading(true);
            const token = await getToken()
            const { data } = await api.get('/cart', {headers: {
                Authorization: `Bearer ${token}`}})
            if (data.success && data.data) {
                const serverCart = data.data;
                const validItems = serverCart.items.filter((item: any) => item.product !== null)
                const mappedItem: CartItem[] = validItems.map((item: any) => ({
                    id: item.product._id,
                    productId: item.product._id,
                    product: item.product,
                    quantity: item.quantity,
                    size: item.size,
                    price: item.product.price,
                }));
                setCartItems(mappedItem);
                setCartTotal(serverCart.totalAmount);
            }
        } catch (error) {
            console.error("Failed to fetch cart:", error)
        } finally {
            setIsLoading(false);
        }
    }

    const addToCart = async (product: Product, size: string) => {
        if(!isSignedIn){
            return Toast.show({
                type: "error",
                text1: "Please login to add to cart",
            })
        }
        try {
            setIsLoading(true);
            const token = await getToken();
            const { data } = await api.post('/cart/add',
                { productId: product._id, quantity: 1, size },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success && data.data) {
                await fetchCart()
            }
        } catch (error) {
            console.error("Failed to add to cart:", error);
            Toast.show({
                text1: "Failed to add to cart",
                type: 'error',
            })
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromCart = async (productId: string, size: string) => {
        if(!isSignedIn) return
        try {
            setIsLoading(true);
            const token = await getToken();
            const { data } = await api.delete(`/cart/item/${productId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { size }
                }
            );
            if (data.success ) {
               await fetchCart()
            }
        } catch (error) {
            console.error("Failed to remove from cart:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (productId: string, size: string, quantity: number) => {
        if(!isSignedIn) return
        if(quantity<1) return
        try {
            setIsLoading(true);
            const token = await getToken();
            const { data } = await api.put(`/cart/item/${productId}`,
                { quantity, size },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                await fetchCart()
            }
        } catch (error) {
            console.error("Failed to update quantity:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearCart = async () => {
        if(!isSignedIn) return
        try {
            setIsLoading(true);
            const token = await getToken();
            const { data } = await api.delete('/cart',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                setCartItems([]);
                setCartTotal(0);
            }
        } catch (error) {
            console.error("Failed to clear cart:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);


    useEffect(() => {
        if (isSignedIn) {
            fetchCart();
        } else {
            setCartItems([])
            setCartTotal(0)
        }
    }, [isSignedIn]);


    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, isLoading }}>
            {children}
        </CartContext.Provider>
    );
};


export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
