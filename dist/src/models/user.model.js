import mongoose from 'mongoose';
const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['Present', 'Absent']
    }
}, { _id: false });
const technicianSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true,
        match: [/^\d{10}$/, 'Invalid contact number']
    },
    aadharNumber: {
        type: String,
        required: [true, 'Aadhar number is required'],
        trim: true,
        match: [/^\d{12}$/, 'Invalid Aadhar number']
    },
    drivingLicenseNumber: {
        type: String,
        required: [true, 'Driving license number is required'],
        trim: true
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    attendance: [attendanceSchema]
}, {
    timestamps: true
});
export default mongoose.model('Technician', technicianSchema);
