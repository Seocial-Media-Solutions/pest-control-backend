import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Full name must be at least 2 characters long'],
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    mobileNo: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        minlength: [10, 'Address must be at least 10 characters long']
    },
    status: {
        type: String,
        enum: ['regular', 'temporary', 'other'],
        default: 'temporary'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    totalAssignments: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    lastServiceDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes
customerSchema.index({ mobileNo: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ createdAt: -1 });

customerSchema.virtual('displayName').get(function () {
    return `${this.fullName} (${this.mobileNo})`;
});

customerSchema.methods.updateStats = async function (assignmentAmount: number) {
    this.totalAssignments += 1;
    this.totalSpent += assignmentAmount;
    this.lastServiceDate = new Date();
    await this.save();
};

export default mongoose.model('Customer', customerSchema);
