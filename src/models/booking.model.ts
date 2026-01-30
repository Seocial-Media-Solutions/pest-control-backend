import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer ID is required'],
        index: true
    },
    subServiceIds: [{
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubService',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed'],
            default: 'pending'
        }
    }],
    additionalAddress: {
        type: String,
        required: [true, 'Service address is required'],
        trim: true,
        minlength: [10, 'Address must be at least 10 characters long']
    },
    additionalMobileNo: {
        type: String,
        required: [true, 'Contact mobile number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Invalid mobile number']
    },
    bookingDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    preferredTimeSlot: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'anytime'],
        default: 'anytime'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    deadlineDate: {
        type: Date,
        required: [true, 'Deadline is required']
    },
    totalAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes
bookingSchema.index({ customerId: 1, bookingDate: -1 });
bookingSchema.index({ status: 1, bookingDate: -1 });

bookingSchema.virtual('bookingReference').get(function () {
    return `BK${this._id.toString().slice(-8).toUpperCase()}`;
});

export default mongoose.model('Booking', bookingSchema);    