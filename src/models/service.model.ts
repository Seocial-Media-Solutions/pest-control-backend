import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String,
        required: true,
        trim: true,
    },
    services: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubService'
    }],
    metaKeywords: {
        type: String,
        required: true,
    },
    metaDescription: {
        type: String,
        required: true,
    },
    metaTitle: {
        type: String,
        required: true,
    },
    metaImage: {
        type: String,
        required: false,
    },
}, { timestamps: true });

export default mongoose.model("Service", serviceSchema);