import { View, Text, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React from 'react'
import { useRouter } from 'expo-router'
import Header from '@/components/Header'
import { ScrollView } from 'react-native-gesture-handler'
import { COLORS, PROFILE_MENU } from '@/constants'
import { Ionicons } from '@expo/vector-icons'
import { useUser, useAuth } from '@clerk/clerk-expo'

export default function Profile() {
  const { user } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.replace('/sign-in')
  }

  return (
    <SafeAreaView className='flex-1 bg-surface' edges={["top"]}>
      <Header title='Profile'/>
      <ScrollView className='flex-1 px-4'
        contentContainerStyle={!user ? { flex: 1, justifyContent: 'center', alignItems: 'center' } :
        { paddingTop: 16 }}>

        {!user ? (
          <View className='items-center w-full'>
            <View className='w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-6'>
              <Ionicons name='person-circle' size={150} color={COLORS.secondary}/>
            </View>
            <Text className='text-2xl font-bold text-gray-900 mb-2'>Guest User</Text>
            <Text className='text-center text-sm text-gray-500'>Login to access your profile features</Text>
            <TouchableOpacity className='bg-primary py-3 px-6 rounded-full mt-4' onPress={() => router.push('/sign-in')}>
              <Text className='text-white font-bold'>Login/Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Profile Info */}
            <View className='items-center mb-8'>
              <View className='mb-3'>
                {user.imageUrl ? (
                  <Image
                    className='size-20 border-2 border-white shadow-sm rounded-full'
                    source={{ uri: user.imageUrl }}
                  />
                ) : (
                  <View className='size-20 rounded-full bg-gray-200 items-center justify-center'>
                    <Ionicons name='person-circle' size={80} color={COLORS.secondary}/>
                  </View>
                )}
              </View>
              <Text className='text-2xl font-bold text-gray-900 mb-2'>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'User'}
              </Text>
              <Text className='text-sm text-gray-500'>
                {user.primaryEmailAddress?.emailAddress}
              </Text>

              {/* Admin Panel */}
              {user.publicMetadata?.role === 'admin' && (
                <TouchableOpacity className='bg-primary py-3 px-6 rounded-full mt-4' onPress={() => router.push('/admin')}>
                  <Text className='text-white font-bold'>Admin Panel</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className='border border-gray-100 rounded-2xl p-2 bg-white shadow-sm'>
              {PROFILE_MENU.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className='flex-row items-center py-4 px-2'
                  onPress={() => router.push(item.route as any)}
                >
                  <Ionicons name={item.icon as any} size={20} color={COLORS.secondary}/>
                  <Text className='text-lg font-medium ml-2'>{item.title}</Text>
                  <Ionicons name='chevron-forward' size={20} color={COLORS.secondary} className='ml-auto'/>
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout */}
            <TouchableOpacity
              className='bg-red-500 py-3 px-6 rounded-full mt-4 flex-row justify-center items-center'
              onPress={handleLogout}
            >
              <Text className='text-white font-bold'>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}