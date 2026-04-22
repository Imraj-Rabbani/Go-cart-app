import React from 'react'
import { ActivityIndicator, ScrollView, Text, ToastAndroid, TouchableOpacity, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { Product } from '@/constants/types'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { dummyProducts } from '@/assets/assets'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants'
import { Dimensions, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'

const { width } = Dimensions.get('window');

const ProductDetail = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    const { addToCart, cartItems, itemCount } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const fetchProduct = async () => {
        setProduct(dummyProducts.find((product) => product._id === id) as any);
        setLoading(false);
    }

    useEffect(() => {
        fetchProduct();
    }, []);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        )
    }

    if (!product) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <Text>Product not found</Text>
            </SafeAreaView>
        )
    }

    const isLiked = isInWishlist(product._id);

    const handleAddToCart = () => {
        if(!selectedSize){
            Toast.show({
                type: "error",
                text1: "Please select a size",
            })
            return;
        }


        addToCart(product, selectedSize || "M");
    };

    return (
        <View className='flex-1 items-center justify-center'>
            <ScrollView contentContainerStyle={{ paddingBottom: 100, marginTop: 80 }}>
                <View className='relative h-[450px] bg-gray-100 mb-6'>
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                        scrollEventThrottle={16} onScroll={(e) => {
                            const slide = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                            setActiveImageIndex(slide);
                        }}>
                        {product.images?.map((img, index) => (
                            <Image
                                key={index}
                                source={{ uri: img }}
                                style={{ width: width, height: 500, }}
                                resizeMode='cover'
                            />
                        ))}
                    </ScrollView>
                    <View className='absolute top-12 left-4 right-4 flex-row justify-between items-center z-10'>
                        <TouchableOpacity onPress={() => router.back()} className='w-10 h-10 bg-white/80 rounded-full items-center justify-center'>
                            <Ionicons name='arrow-back' size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleWishlist(product)} className='w-10 h-10 bg-white/80 rounded-full items-center justify-center'>
                            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={24} color={isLiked ? COLORS.accent : COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View>
                    {/* pagination dots */}
                    <View className='absolute bottom-12 left-0 right-0 flex-row justify-center gap-2'>
                        {product.images?.map((_, index) => (
                            <View key={index} className={`h-2 rounded-full ${index === activeImageIndex ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`} />
                        ))}
                    </View>
                </View>

                {/* product info */}
                <View className='px-4'>
                    <View className='flex-row justify-between items-start mb-2'>
                        <Text className='text-2xl font-bold text-primary flex-1 mr-4'>{product.name}</Text>
                        <View className='flex-row justify-between items-start mb-2'>
                            <Ionicons name='star' size={20} color="#FFD700" />
                            <Text className='text-lg font-bold ml-2'>{product.ratings.average}</Text>
                            <Text className='text-xs text-secondary ml-1'>({product.ratings.count})</Text>
                        </View>
                    </View>
                    {/* Price */}
                    <Text className='text-lg font-bold text-primary mb-2'>${product.price.toFixed(2)}</Text>

                    {/* Sizes */}
                    {product.sizes && product.sizes.length > 0 && (
                        <View className='mb-2'>
                            <Text className='text-lg font-bold text-primary mb-2'>Available Sizes:</Text>
                            <View className='flex-row flex-wrap gap-2'>
                                {product.sizes.map((size) => (
                                    <TouchableOpacity key={size} className={`w-12 h-12 rounded-full border-2 ${selectedSize === size ? 'border-primary bg-primary' : 'border-gray-300 bg-white'} 
                                                                                        items-center justify-center`} onPress={() => setSelectedSize(size)}>
                                        <Text className={`text-lg font-bold ${selectedSize === size ? 'text-white' : 'text-primary'}`}>{size}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                    {/* Description */}
                    <Text className='text-xl font-bold text-primary mb-2'>Description</Text>
                    <Text className='text-gray-600 mb-6'>{product.description}</Text>

                    {/* Add to Cart */}
                    <View className='flex-row'>
                        <TouchableOpacity onPress={handleAddToCart} className='w-4/5 bg-primary p-4 rounded-full items-center mb-6'>
                            <Text className='text-white font-bold text-lg'>Add to Cart</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push("/(tabs)/cart")} className='w-1/5 py-3 flex-row justify-center relative'>
                            <Ionicons name='cart-outline' size={24} />
                            <Text className='text-white text-[9px]'>{itemCount}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

export default ProductDetail