import { v2 as cloudinary } from 'cloudinary';
import multerStorageCloudinary from 'multer-storage-cloudinary';
// Force restart
const { CloudinaryStorage } = multerStorageCloudinary;
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pest-control-assignments', // The folder in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Allowed file formats
        transformation: [{ width: 1000, margin: 0, crop: "limit" }], // Optional: resize large images
    } // using 'as any' because types for params can be strict
});
// Create Multer upload instance
export const upload = multer({ storage: storage });
export default cloudinary;
