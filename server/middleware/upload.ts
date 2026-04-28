import multer from "multer";

const storage = multer.memoryStorage();

// Shared upload middleware for product images, store logos, and design artwork.
const upload = multer({ storage: storage});

export default upload
