import { Product, WishlistContextType } from "@/constants/types";
import { createContext, ReactNode, useContext,useEffect, useState } from "react";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState<Error | null>(null);

    const fetchWishlist = async () => {
        setLoading(true);
        setWishlist([]);
        setLoading(false);
    }   

    const toggleWishlist = async (product: Product) => {
        const exists = wishlist.find((p) => p._id === product._id);
        setWishlist((prev)=>{
            if(exists){
                return prev.filter((p) => p._id !== product._id);
            }else{
                return [...prev, product];
            }
        })
    }


    const isInWishlist = (productId: string) => {
        return wishlist.some((p) => p._id === productId);
    }

    useEffect(()=>{
        fetchWishlist();
    },[]);

    
    return (
        <WishlistContext.Provider value={{ wishlist, loading, isInWishlist, toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};


export function useWishlist(){
    const context = useContext(WishlistContext);
    if(!context){
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}
