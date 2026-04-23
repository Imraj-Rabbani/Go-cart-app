import { dummyCart } from "@/assets/assets";
import { Product, WishlistContextType } from "@/constants/types";
import { createContext, ReactNode, useContext,useEffect, useState } from "react";

export type CartItem = {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    size: string;
    price:number;
}

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
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [cartTotal,setCartTotal] = useState(0);

    const fetchCart = async()=>{
        setIsLoading(true);
        const serverCart = dummyCart;
        const mappedItem: CartItem[] = serverCart.items.map((item: any)=>({
            id: item.product._id,
            productId: item.product._id,
            product: item.product,
            quantity: item.quantity,
            size: item.size,
            price: item.product.price,
        }));
        setCartItems(mappedItem);
        setCartTotal(serverCart.totalAmount);
        setIsLoading(false);
    }

    const addToCart = async (product: Product, size: string) => {
        
    }

    const removeFromCart = async (itemId: string, size: string) => {
        
    }

    const updateQuantity = async (itemId: string, size: string, quantity: number) => {
        
    }

    const clearCart = async () => {
        
    }

    const itemCount = cartItems.reduce((total,item)=>total+item.quantity,0);
    

    useEffect(()=>{
        fetchCart();
    },[]);
    

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, isLoading }}>
            {children}
        </CartContext.Provider>
    );
};


export function useCart(){
    const context = useContext(CartContext);
    if(!context){
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
