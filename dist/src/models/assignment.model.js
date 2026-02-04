import mongoose from "mongoose";
const { Schema, Types } = mongoose;
const assignmentSchema = new Schema({
    bookingId: {
        type: Types.ObjectId,
        ref: "Booking",
        index: true,
        default: null
    },
    technicianId: {
        type: Types.ObjectId,
        ref: "Technician",
        index: true,
        default: null
    },
    // Phase 1: Preparation
    treatmentPreparation: [{
            chemicals: { type: String, default: "" },
            quantity: { type: String, default: "" }
        }],
    // Phase 2: Execution (Photos)
    applyTreatment: {
        sitePictures: [{
                publicId: { type: String, default: "" },
                url: { type: String, default: "" },
                filename: { type: String, default: "" },
                width: Number,
                height: Number
            }]
    },
    // Phase 3: Payment
    paymentCollection: {
        amount: { type: Number, default: 0 },
        paymentMethod: {
            type: String,
            enum: ["cash", "card", "upi", "bank_transfer", "online", "other"],
            default: "cash"
        },
        paymentDate: { type: Date, default: null },
        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending"
        }
    },
    status: {
        type: String,
        enum: ["pending", "in-progress", "completed", "cancelled"],
        default: "pending"
    }
}, {
    timestamps: true,
    versionKey: false
});
export default mongoose.model("Assignment", assignmentSchema);
