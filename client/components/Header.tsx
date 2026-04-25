import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { HeaderProps } from '@/constants/types'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants'
import { useRouter } from 'expo-router'
import { useCart } from '@/context/CartContext'

export default function Header({ title, showBack, showSearch, showCart, showMenu, showLogo }: HeaderProps) {

    const router = useRouter();
    const { itemCount } = useCart()


    return (
        <View className='flex-row items-center justify-between px-4 py-3 bg-white' >
            {/* left side */}
            <View className='flex-row items-center flex-1'>
                {showBack && (
                    <TouchableOpacity onPress={() => router.back()} className='mr-3'>
                        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                )}

                {showMenu && (
                    <TouchableOpacity onPress={() => router.back()} className='mr-3'>
                        <Ionicons name="menu" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                )}

                {showLogo ? (
                    <View className="flex-1 flex-row items-center">
                        <Text className="text-green-600 text-xl font-bold">Go</Text>
                        <Text className="text-xl font-bold text-gray-800">cart</Text>
                        <Text className="text-green-600 text-3xl leading-none">.</Text>
                    </View>
                ) : title && (
                    <Text className="text-xl font-bold text-gray-800">Gocart</Text>
                )}

                {(!title && !showSearch) && <View className='flex-1'></View>}
            </View>
            {/* right side */}
            <View className='flex-row items-center'>
                {showSearch && (
                    <TouchableOpacity>
                        <Ionicons name="search" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
                {showCart && (
                    <TouchableOpacity onPress={() => router.push('/(tabs)/cart')}>
                        <View className='relative'>
                            <Ionicons name="cart" size={24} color={COLORS.primary} />
                            <View className='absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center'>
                                <Text className='text-white text-xs font-bold'>{itemCount}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}