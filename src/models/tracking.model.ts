import mongoose from 'mongoose';

const trackingSchema = new mongoose.Schema({
    technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technician',
        required: [true, 'Technician ID is required']
    },
    technicianName: {
        type: String,
        required: [true, 'Technician name is required'],
        trim: true
    },
    latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'On Break', 'Completed'],
        default: 'Active'
    },
    recordedBy: {
        type: String,
        default: 'Admin',
        trim: true
    }
}, {
    timestamps: true
});

// Create geospatial index for location-based queries
trackingSchema.index({ location: '2dsphere' });

export default mongoose.model('Tracking', trackingSchema);
