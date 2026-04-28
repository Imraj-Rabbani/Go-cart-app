// client/app/designs/create.tsx
import React, { useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    LayoutChangeEvent,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'
import {
    GestureDetector,
    Gesture,
    GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    runOnJS,
} from 'react-native-reanimated'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import api from '@/constants/api'
import { COLORS } from '@/constants'
import Header from '@/components/Header'
import { getProductImage } from '@/constants/productImages'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_TYPES = ['t-shirt', 'hoodie', 'sweatshirt', 'mug', 'tote-bag', 'phone-case']

const COLOR_OPTIONS = [
    { id: 'white', hex: '#FFFFFF', border: '#CBD5E1' },
    { id: 'black', hex: '#000000', border: '#1E293B' },
    { id: 'red', hex: '#DC2626', border: '#B91C1C' },
    { id: 'blue', hex: '#2563EB', border: '#1D4ED8' },
]

// Base size of the artwork as a fraction of the canvas width
const BASE_ARTWORK_FRACTION = 0.35

// ─── Types ────────────────────────────────────────────────────────────────────

interface CanvasSize {
    width: number
    height: number
}

// ─── Draggable Artwork Layer ──────────────────────────────────────────────────

interface ArtworkLayerProps {
    uri: string
    canvasSize: CanvasSize
    onRemove: () => void
}

function ArtworkLayer({ uri, canvasSize, onRemove }: ArtworkLayerProps) {
    // Position is stored as offset from canvas center
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)
    const scale = useSharedValue(1)

    // Saved values between gestures
    const savedX = useSharedValue(0)
    const savedY = useSharedValue(0)
    const savedScale = useSharedValue(1)

    const [selected, setSelected] = useState(true)

    const artworkSize = canvasSize.width * BASE_ARTWORK_FRACTION

    const panGesture = Gesture.Pan()
        .onStart(() => {
            runOnJS(setSelected)(true)
        })
        .onUpdate((e) => {
            translateX.value = savedX.value + e.translationX
            translateY.value = savedY.value + e.translationY
        })
        .onEnd(() => {
            savedX.value = translateX.value
            savedY.value = translateY.value
        })

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.max(0.3, Math.min(3, savedScale.value * e.scale))
        })
        .onEnd(() => {
            savedScale.value = scale.value
        })

    const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture)

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }))

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        width: artworkSize,
                        height: artworkSize,
                        // Start centered in the printable area
                        top: canvasSize.height * 0.15 + (canvasSize.height * 0.70 - artworkSize) / 2,
                        left: canvasSize.width * 0.20 + (canvasSize.width * 0.60 - artworkSize) / 2,
                    },
                    animatedStyle,
                ]}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setSelected((s) => !s)}
                    style={{ width: '100%', height: '100%' }}
                >
                    <View style={{
                        width: '100%',
                        height: '100%',
                        borderWidth: selected ? 2 : 0,
                        borderColor: '#6366F1',
                        borderStyle: 'dashed',
                        borderRadius: 4,
                        overflow: 'hidden',
                    }}>
                        <Image
                            source={{ uri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Remove button — only when selected */}
                    {selected && (
                        <TouchableOpacity
                            onPress={onRemove}
                            style={{
                                position: 'absolute',
                                top: -12,
                                right: -12,
                                backgroundColor: '#EF4444',
                                borderRadius: 12,
                                width: 24,
                                height: 24,
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                            }}
                        >
                            <Ionicons name="close" size={14} color="white" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </GestureDetector>
    )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateDesignScreen() {
    const router = useRouter()
    const { getToken } = useAuth()

    // Form state
    const [title, setTitle] = useState('')
    const [productType, setProductType] = useState('t-shirt')
    const [color, setColor] = useState('white')
    const [artworkUri, setArtworkUri] = useState<string | null>(null)
    const [artworkFile, setArtworkFile] = useState<any>(null)

    // UI state
    const [productModalVisible, setProductModalVisible] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 })
    const [showArtworkOnCanvas, setShowArtworkOnCanvas] = useState(false)

    const productImage = getProductImage(productType, color)

    // ── Image Picker ─────────────────────────────────────────────────────────────

    const pickArtwork = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
        })

        if (!result.canceled) {
            const asset = result.assets[0]
            setArtworkUri(asset.uri)
            setArtworkFile({
                uri: asset.uri,
                type: 'image/jpeg',
                name: 'design-artwork.jpg',
            })
            setShowArtworkOnCanvas(true)
        }
    }

    const removeArtwork = () => {
        Alert.alert('Remove Artwork', 'Remove artwork from canvas?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    setArtworkUri(null)
                    setArtworkFile(null)
                    setShowArtworkOnCanvas(false)
                },
            },
        ])
    }

    // ── Canvas Layout ─────────────────────────────────────────────────────────────

    const onCanvasLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout
        setCanvasSize({ width, height })
    }

    // ── Submit ────────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!title.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter a design title' })
            return
        }
        if (!artworkFile) {
            Toast.show({ type: 'error', text1: 'Please upload your artwork' })
            return
        }

        try {
            setSubmitting(true)
            const token = await getToken()
            const formData = new FormData()
            formData.append('title', title)
            formData.append('productType', productType)
            formData.append('color', color)
            formData.append('artwork', artworkFile)

            await api.post('/designs', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            })

            Toast.show({ type: 'success', text1: 'Design created!' })
            router.replace('/designs')
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.response?.data?.message || 'Failed to create design',
            })
        } finally {
            setSubmitting(false)
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────────

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                <Header title="Design Studio" showBack />

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    // Disable scroll while user might be dragging artwork
                    scrollEnabled={!showArtworkOnCanvas}
                >

                    {/* ── Canvas ─────────────────────────────────────────────────────── */}
                    <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-5 shadow-sm">
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest p-4 pb-0">
                            Front View
                        </Text>

                        <View
                            className="mx-4 my-4 rounded-2xl bg-gray-50"
                            style={{ aspectRatio: 0.8 }}
                            onLayout={onCanvasLayout}
                        >
                            {/* Shirt base image */}
                            {productImage && (
                                <View style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                                    <Image
                                        source={productImage}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="contain"
                                    />
                                </View>
                            )}

                            {/* Draggable artwork layer */}
                            {showArtworkOnCanvas && artworkUri && canvasSize.width > 0 && (
                                <ArtworkLayer
                                    uri={artworkUri}
                                    canvasSize={canvasSize}
                                    onRemove={removeArtwork}
                                />
                            )}

                            {/* Empty state hint */}
                            {!showArtworkOnCanvas && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: '15%',
                                        left: '20%',
                                        right: '20%',
                                        bottom: '15%',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    pointerEvents="none"
                                >
                                    <View className="border-2 border-dashed border-gray-300 rounded-xl w-full h-full items-center justify-center">
                                        <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                                        <Text className="text-gray-400 text-xs mt-2 text-center">
                                            Upload artwork below{'\n'}to place it here
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ── Controls ───────────────────────────────────────────────────── */}
                    <View className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm space-y-5">

                        {/* Title */}
                        <View>
                            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Design Title *
                            </Text>
                            <TextInput
                                className="bg-gray-50 p-3 rounded-xl text-gray-900 border border-gray-100"
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Give your design a name"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Product Type */}
                        <View>
                            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Product Type *
                            </Text>
                            <TouchableOpacity
                                className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex-row justify-between items-center"
                                onPress={() => setProductModalVisible(true)}
                            >
                                <Text className="text-gray-900 capitalize">{productType}</Text>
                                <Ionicons name="chevron-down" size={18} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Color Picker */}
                        <View>
                            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Color
                            </Text>
                            <View className="flex-row gap-3">
                                {COLOR_OPTIONS.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        onPress={() => setColor(c.id)}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 16,
                                            backgroundColor: c.hex,
                                            borderWidth: 2,
                                            borderColor: color === c.id ? '#6366F1' : c.border,
                                            transform: [{ scale: color === c.id ? 1.15 : 1 }],
                                        }}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Artwork Upload */}
                        <View>
                            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Artwork *
                            </Text>
                            <TouchableOpacity onPress={pickArtwork}>
                                {artworkUri ? (
                                    <View className="relative">
                                        <Image
                                            source={{ uri: artworkUri }}
                                            className="w-full h-40 rounded-2xl bg-gray-100"
                                            resizeMode="cover"
                                        />
                                        <View className="absolute inset-0 rounded-2xl bg-black/20 items-center justify-center">
                                            <Text className="text-white text-xs font-semibold">
                                                Tap to change
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View className="h-36 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 items-center justify-center">
                                        <Ionicons name="cloud-upload-outline" size={30} color="#9CA3AF" />
                                        <Text className="text-gray-400 mt-2 text-sm">Tap to upload artwork</Text>
                                        <Text className="text-gray-300 text-xs mt-1">PNG, JPG supported</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Hint ───────────────────────────────────────────────────────── */}
                    {showArtworkOnCanvas && (
                        <View className="bg-indigo-50 rounded-xl p-3 mb-4 flex-row items-center gap-2">
                            <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
                            <Text className="text-indigo-600 text-xs flex-1">
                                Drag your artwork on the shirt to reposition. Pinch to resize.
                            </Text>
                        </View>
                    )}

                    {/* ── Submit ─────────────────────────────────────────────────────── */}
                    <TouchableOpacity
                        className={`bg-gray-900 py-4 rounded-2xl items-center shadow-lg ${submitting ? 'opacity-60' : ''}`}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-base">Publish Design</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>

                {/* ── Product Type Modal ─────────────────────────────────────────── */}
                <Modal visible={productModalVisible} animationType="slide" transparent>
                    <TouchableWithoutFeedback onPress={() => setProductModalVisible(false)}>
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white rounded-t-3xl p-4">
                                <Text className="text-base font-bold text-center mb-4 text-gray-900">
                                    Select Product Type
                                </Text>
                                <FlatList
                                    data={PRODUCT_TYPES}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            className={`p-4 border-b border-gray-50 flex-row justify-between items-center ${productType === item ? 'bg-indigo-50' : ''
                                                }`}
                                            onPress={() => {
                                                setProductType(item)
                                                setProductModalVisible(false)
                                            }}
                                        >
                                            <Text
                                                className={`capitalize ${productType === item
                                                    ? 'text-indigo-600 font-bold'
                                                    : 'text-gray-800'
                                                    }`}
                                            >
                                                {item}
                                            </Text>
                                            {productType === item && (
                                                <Ionicons name="checkmark" size={20} color="#6366F1" />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </SafeAreaView>
        </GestureHandlerRootView>
    )
}