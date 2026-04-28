import { Document, Types } from "mongoose";

export interface IAddress extends Document {
    user: Types.ObjectId;
    type: "Home" | "Work" | "Other";
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
    createdAt: Date;
}

export interface ICartItem {
    product: Types.ObjectId;
    quantity: number;
    price: number;
    size?: string;
}

export interface ICart extends Document {
    user: Types.ObjectId;
    items: ICartItem[];
    totalAmount: number;
    calculateTotal(): number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IOrderItem {
    product: Types.ObjectId;
    store?: Types.ObjectId | null;
    name: string;
    quantity: number;
    price: number;
    size?: string;
}

export interface IOrder extends Document {
    user: Types.ObjectId;
    orderNumber: string;
    items: IOrderItem[];
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentMethod: "cash" | "stripe";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentIntentId?: string;
    orderStatus: "placed" | "processing" | "shipped" | "delivered" | "cancelled";
    subtotal: number;
    shippingCost: number;
    tax: number;
    totalAmount: number;
    notes?: string;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IProduct extends Document {
    store?: Types.ObjectId | null;
    sourceDesign?: Types.ObjectId | null;
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
    sizes: string[];
    category: "Men" | "Women" | "Kids" | "Accessories";
    stock: number;
    ratings: {
        average: number;
        count: number;
    };
    isFeatured: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUser extends Document {
    name: string;
    email: string;
    clerkId: string;
    image?: string;
    role: "user" | "admin" | "store_owner";
    createdAt: Date;
    updatedAt: Date;
}

export interface IWishlist extends Document {
    user: Types.ObjectId;
    products: Types.ObjectId[];
    createdAt: Date;
}

export interface IStore extends Document {
    owner: Types.ObjectId;
    name: string;
    description?: string;
    logo?: string;
    status: "pending" | "active" | "rejected";
    rejectionReason?: string;
    revenue: number;
    totalOrders: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDesign extends Document {
    user: Types.ObjectId;
    store: Types.ObjectId;
    product?: Types.ObjectId | null;
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
    createdAt: Date;
    updatedAt: Date;
}
