// client/constants/productImages.ts
// Add or remove entries to match whatever images you actually copied over.

const productImages: Record<string, any> = {
  tshirt_white_front:      require('../assets/images/products/tshirt_white_front.png'),
  tshirt_black_front:      require('../assets/images/products/tshirt_black_front.png'),
  tshirt_red_front:        require('../assets/images/products/tshirt_red_front.png'),
  tshirt_blue_front:       require('../assets/images/products/tshirt_blue_front.png'),
  hoodie_white_front:      require('../assets/images/products/hoodie_white_front.png'),
}

export const getProductImage = (productType: string, color: string): any => {
  const typeKey = productType.toLowerCase().replace('-', '').replace(' ', '')
  const key = `${typeKey}_${color}_front`
  // Fallback to white if the specific color doesn't exist
  return productImages[key] ?? productImages[`${typeKey}_white_front`] ?? null
}