import Product from "../models/Products.js";
export const publishDesignProduct = async (design, store) => {
    const existingProduct = design.product ? await Product.findById(design.product) : null;
    const productPayload = {
        store: store._id,
        sourceDesign: design._id,
        name: design.title,
        description: design.description || `${design.title} ${design.productType}`,
        price: design.price,
        images: [design.previewUrl || design.artworkUrl],
        sizes: design.sizes,
        category: design.category,
        stock: design.stock,
        royaltyRate: 0.05,
        isActive: true,
        design: {
            artworkUrl: design.artworkUrl,
            previewUrl: design.previewUrl,
            productType: design.productType,
            color: design.color,
            placement: design.placement,
        },
    };
    const product = existingProduct
        ? await Product.findByIdAndUpdate(existingProduct._id, productPayload, { new: true, runValidators: true })
        : await Product.create(productPayload);
    design.product = product?._id || null;
    design.status = "completed";
    await design.save();
    return product;
};
