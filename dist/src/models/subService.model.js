import mongoose from "mongoose";
const subServiceSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    startingPrice: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
        trim: true,
    },
    metaKeywords: String,
    metaDescription: String,
    metaTitle: String,
    metaImage: String,
}, { timestamps: true });
export default mongoose.model("SubService", subServiceSchema);
