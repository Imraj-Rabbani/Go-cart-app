import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'expo-router'
import { Address } from '@/constants/types'
import { dummyAddress } from '@/assets/assets'
import Toast from 'react-native-toast-message'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants'
import Header from '@/components/Header'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@clerk/clerk-expo'
import api from '@/constants/api'

export default function Checkout() {

    const {getToken} = useAuth()
    const { cartTotal, clearCart } = useCart()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'stripe'>('cash')

    const shipping = 2.00
    const total = cartTotal + shipping

    const fetchAddress = async () => {
        try {
            const token = await getToken()
            const {data} = await api.get('/addresses',{
                headers:{Authorization:'Bearer '+ token}
            })
            const addrList = data.data
            if(addrList.length>0){
                const defaultAddr = addrList.find((addr:Address)=>addr.isDefault)
                setSelectedAddress(defaultAddr)
            }
        } catch (error) {
            Toast.show({
                type: 'error', 
                text1: 'Error',
                text2: 'Failed to load addresses',
            })
        }finally{
            setPageLoading(false)
        }
    }

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please add a shipping address',
            })
            return
        }

        if (paymentMethod === 'stripe') {
            Toast.show({
                type: 'info',
                text1: 'Info',
                text2: 'Stripe not implemented yet',
            })
            return
        }

        // Cash on delivery
        setLoading(true)
        try {
            const payload = {
                shippingAddress : selectedAddress,
                notes: "Place via App",
                paymentMethod: "cash"
            }
            const token = await getToken()
            const { data } = await api.post('/orders', payload, {
                headers: { Authorization: 'Bearer ' + token }
            })

            if(data.success){
                await clearCart()
                Toast.show({
                    type: 'success',
                    text1: 'Order placed successfully',
                    text2: 'Your order has been placed successfully',
                })
                router.replace('/orders')
            }

        }catch(error: any){
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response.data.message || 'Failed to place order',
            })   
        }
         finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAddress()
    }, [])

    if (pageLoading) {
        return (
            <SafeAreaView className='flex-1 bg-surface justify-center items-center'>
                <ActivityIndicator size='large' color={COLORS.primary} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
            <Header title='Checkout' showBack />
            <ScrollView className='flex-1 px-4 mt-4' contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Shipping Address */}
                <Text className='text-lg font-bold text-primary mb-3'>Shipping Address</Text>
                {selectedAddress ? (
                    <View className='bg-white p-4 rounded-xl mb-6 border border-gray-100'>
                        <View className='flex-row items-center justify-between mb-2'>
                            <View className='flex-row items-center gap-2'>
                                <Ionicons name='location-outline' size={16} color={COLORS.primary} />
                                <Text className='text-primary font-semibold capitalize'>{selectedAddress.type}</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/addresses')}>
                                <Text className='text-accent text-sm'>Change</Text>
                            </TouchableOpacity>
                        </View>
                        <Text className='text-secondary text-sm leading-5'>
                            {selectedAddress.street}, {selectedAddress.city}{'\n'}
                            {selectedAddress.state}, {selectedAddress.zipCode}{'\n'}
                            {selectedAddress.country}
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => router.push('/addresses')}
                        className='bg-white p-6 rounded-xl mb-6 items-center justify-center border-dashed border-2 border-gray-200'
                    >
                        <Ionicons name='add-circle-outline' size={24} color={COLORS.primary} />
                        <Text className='text-primary font-bold mt-2'>Add Address</Text>
                    </TouchableOpacity>
                )}

                {/* Payment Method */}
                <Text className='text-lg font-bold text-primary mb-3'>Payment Method</Text>
                <View className='mb-6 gap-3'>
                    {/* Cash on Delivery */}
                    <TouchableOpacity
                        onPress={() => setPaymentMethod('cash')}
                        className={`flex-row items-center p-4 rounded-xl border bg-white ${paymentMethod === 'cash' ? 'border-primary' : 'border-gray-100'}`}
                    >
                        <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${paymentMethod === 'cash' ? 'border-primary' : 'border-gray-300'}`}>
                            {paymentMethod === 'cash' && (
                                <View className='w-2.5 h-2.5 rounded-full bg-primary' />
                            )}
                        </View>
                        <Ionicons name='cash-outline' size={20} color={COLORS.primary} />
                        <Text className='text-primary font-medium ml-3'>Cash on Delivery</Text>
                    </TouchableOpacity>

                    {/* Stripe */}
                    <TouchableOpacity
                        onPress={() => setPaymentMethod('stripe')}
                        className={`flex-row items-center p-4 rounded-xl border bg-white ${paymentMethod === 'stripe' ? 'border-primary' : 'border-gray-100'}`}
                    >
                        <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${paymentMethod === 'stripe' ? 'border-primary' : 'border-gray-300'}`}>
                            {paymentMethod === 'stripe' && (
                                <View className='w-2.5 h-2.5 rounded-full bg-primary' />
                            )}
                        </View>
                        <Ionicons name='card-outline' size={20} color={COLORS.primary} />
                        <Text className='text-primary font-medium ml-3'>Pay with Stripe</Text>
                    </TouchableOpacity>
                </View>

                {/* Order Summary */}
                <Text className='text-lg font-bold text-primary mb-3'>Order Summary</Text>
                <View className='bg-white rounded-xl p-4 border border-gray-100 mb-6'>
                    <View className='flex-row justify-between items-center mb-3'>
                        <Text className='text-secondary text-sm'>Subtotal</Text>
                        <Text className='text-primary font-medium'>${cartTotal.toFixed(2)}</Text>
                    </View>
                    <View className='flex-row justify-between items-center mb-3'>
                        <Text className='text-secondary text-sm'>Shipping</Text>
                        <Text className='text-primary font-medium'>${shipping.toFixed(2)}</Text>
                    </View>
                    <View className='h-px bg-gray-100 my-1' />
                    <View className='flex-row justify-between items-center mt-3'>
                        <Text className='text-primary font-bold text-base'>Total</Text>
                        <Text className='text-primary font-bold text-base'>${total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Place Order Button */}
                <TouchableOpacity
                    onPress={handlePlaceOrder}
                    disabled={loading}
                    className='bg-gray-900 rounded-2xl py-4 items-center'
                >
                    {loading ? (
                        <ActivityIndicator size='small' color='white' />
                    ) : (
                        <Text className='text-white font-semibold text-base'>Place Order</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    )
}