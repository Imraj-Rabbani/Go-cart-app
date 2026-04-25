import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/Header'
import CartItem from '@/components/CartItem'


export default function Cart() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart()
  const router = useRouter()
  const shipping = 2.00
  const total = cartTotal + shipping

  return (
    <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
      <Header title='My Cart' showBack />
      {cartItems.length > 0 ? (
        <>
          <ScrollView>
            {cartItems.map((item, index) => {
              // console.log("Cart item:", JSON.stringify(item, null, 2))
              return (
                <CartItem key={index}
                  item={item}
                  onRemove={() => removeFromCart(item.productId, item.size)}
                  onUpdateQuantity={(q) => updateQuantity(item.productId, item.size, q as number)}
                />
              )
            })}
          </ScrollView>

          <View className='mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-100'>
            {/* Subtotal */}
            <View className='flex-row justify-between items-center mb-3'>
              <Text className='text-secondary text-sm'>Subtotal</Text>
              <Text className='text-primary font-medium'>${cartTotal.toFixed(2)}</Text>
            </View>

            {/* Shipping */}
            <View className='flex-row justify-between items-center mb-3'>
              <Text className='text-secondary text-sm'>Shipping</Text>
              <Text className='text-primary font-medium'>${shipping.toFixed(2)}</Text>
            </View>

            {/* Divider */}
            <View className='h-px bg-gray-200 my-1' />

            <View className='flex-row justify-between items-center mt-3'>
              <Text className='text-primary font-semibold text-base'>Total</Text>
              <Text className='text-primary font-bold text-base'>${total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Checkout button */}
          <TouchableOpacity
            onPress={() => router.push('/checkout')}
            className='mx-4 mt-4 mb-6 bg-gray-900 rounded-2xl py-4 items-center'
          >
            <Text className='text-white font-semibold text-base'>Checkout</Text>
          </TouchableOpacity>

        </>
      ) : (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-secondary text-lg'>Your Cart is empty</Text>
          <TouchableOpacity onPress={() => router.push('/')} className='mt-4'>
            <Text className='text-primary font-bold'>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}