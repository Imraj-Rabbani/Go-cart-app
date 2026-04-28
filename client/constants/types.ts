export interface User {
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin" | "store_owner";
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    createdAt: string;
}

export interface Product {
    _id: string;
    store?: Store | string | null;
    sourceDesign?: string | null;
    royaltyRate?: number;
    design?: {
        artworkUrl: string;
        previewUrl?: string;
        productType: "t-shirt" | "hoodie" | "mug" | "tote-bag" | "phone-case";
        color: string;
        placement: {
            x: number;
            y: number;
            scale: number;
        };
    };
    name: string;
    description: string;
    price: number;
    comparePrice?: number;
    images: string[];
    sizes?: string[];
    category: string;
    stock: number;
    ratings: {
        average: number;
        count: number;
    };
    isFeatured: boolean;
    isActive: boolean;
    createdAt: string;
}

export type ProductCardProps = {
    product: Product;
};

export interface CartItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    size: string;
    price: number;
}

export type CartItemProps = {
    item: CartItem;
    onRemove?: () => void;
    onUpdateQuantity?: (newQty: number) => void;
};

export type CategoryItemProps = {
    item: { id: string | number; name: string; icon: string };
    isSelected?: boolean;
    onPress?: () => void;
};

export type HeaderProps = {
    title?: string;
    showBack?: boolean;
    showSearch?: boolean;
    showCart?: boolean;
    showMenu?: boolean;
    showLogo?: boolean;
};

export interface Address {
    _id: string;
    type: "Home" | "Work" | "Other";
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
    createdAt: string;
}

export interface OrderItem {
    product: Product | string;
    store?: Store | string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    size?: string;
}

export interface Order {
    _id: string;
    user: User | string;
    orderNumber: string;
    items: OrderItem[];
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentMethod: string;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    orderStatus: "placed" | "processing" | "shipped" | "delivered" | "cancelled";
    subtotal: number;
    shippingCost: number;
    tax: number;
    totalAmount: number;
    notes?: string;
    deliveredAt?: string;
    createdAt: string;
}

export type WishlistContextType = {
    wishlist: Product[];
    toggleWishlist: (product: Product) => void;
    isInWishlist: (productId: string) => boolean;
    loading: boolean;
};

export interface Store {
    _id: string;
    owner: User | string;
    name: string;
    description?: string;
    logo?: string;
    status: "pending" | "active" | "rejected";
    rejectionReason?: string;
    revenue: number;
    totalOrders: number;
    createdAt: string;
}

export interface Design {
    _id: string;
    user: User | string;
    store?: Store | string;
    product?: Product | string | null;
    productType: "t-shirt" | "hoodie" | "mug" | "tote-bag" | "phone-case";
    color: string;
    category: "Men" | "Women" | "Kids" | "Accessories";
    description?: string;
    price: number;
    stock: number;
    sizes: string[];
    artworkUrl: string;
    artworkPublicId: string;
    previewUrl?: string;
    placement: {
        x: number;
        y: number;
        scale: number;
    };
    title: string;
    status: "draft" | "submitted" | "in_production" | "completed";
    createdAt: string;
}
