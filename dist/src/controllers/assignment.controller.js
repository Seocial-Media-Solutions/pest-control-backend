import Assignment from '../models/assignment.model.js';
import Booking from '../models/booking.model.js';
import cloudinary from '../config/cloudinary.js';
// --- Helpers ---
const populateAssignment = (query) => {
    return query
        .populate({
        path: 'bookingId',
        populate: [
            { path: 'customerId', select: 'fullName email mobileNumber address' },
            { path: 'subServiceIds.serviceId', select: 'title description startingPrice metaImage image' }
        ]
    })
        .populate('technicianId', 'fullName email contactNumber');
};
const handleBookingStatusUpdate = async (assignment) => {
    if (!assignment.bookingId)
        return;
    // Logic: If assignment is completed or paid, update booking? 
    // For now, let's keep it simple based on payment or manual status.
    const servicePrice = assignment.bookingId.totalAmount || 0;
    const paidAmount = assignment.paymentCollection?.amount || 0;
    const paymentStatus = assignment.paymentCollection?.paymentStatus;
    let newStatus = 'pending';
    if (paymentStatus === 'completed' || (servicePrice > 0 && paidAmount >= servicePrice)) {
        newStatus = 'completed';
    }
    else if (paidAmount > 0) {
        newStatus = 'in-progress';
    }
    else if (assignment.status === 'in-progress') {
        newStatus = 'in-progress';
    }
    // Only update if not cancelled
    if (assignment.bookingId.status !== 'cancelled') {
        await Booking.findByIdAndUpdate(assignment.bookingId._id, { status: newStatus });
    }
};
export const updateServiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const subServiceId = req.params.subServiceId.trim();
        const { status } = req.body;
        const assignment = await Assignment.findById(id);
        if (!assignment)
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        if (!assignment.bookingId)
            return res.status(400).json({ success: false, message: 'No linked booking' });
        const booking = await Booking.findById(assignment.bookingId);
        if (!booking)
            return res.status(404).json({ success: false, message: 'Booking not found' });
        // Debug logs
        console.log('Update Service Status Request:');
        console.log('Target subServiceId:', subServiceId);
        console.log('Booking subServiceIds:', JSON.stringify(booking.subServiceIds, null, 2));
        // Manually find the sub-service object
        // Check both the subdocument _id AND the referenced serviceId as a fallback
        // Manually find the sub-service object
        const subService = booking.subServiceIds.find((item) => {
            let itemId = item._id ? item._id.toString() : null;
            let itemServiceId = item.serviceId ? item.serviceId.toString() : null;
            // Handle Buffer IDs (weird Mongoose/Driver behavior)
            if (item._id && Buffer.isBuffer(item._id)) {
                itemId = item._id.toString('hex');
            }
            // If serviceId is a Buffer (shown in logs)
            if (item.serviceId && (Buffer.isBuffer(item.serviceId) || item.serviceId.buffer)) {
                const buf = item.serviceId.buffer || item.serviceId;
                itemServiceId = Buffer.isBuffer(buf) ? buf.toString('hex') : buf.toString();
            }
            // Normal ObjectId check just in case toString() didn't give hex
            if (itemId && itemId.length > 24 && itemId.includes('"'))
                itemId = itemId.replace(/['"]+/g, '');
            // Check match (soft equality for safety)
            return itemId == subServiceId || itemServiceId == subServiceId;
        });
        if (!subService) {
            console.log('Match failed for subServiceId:', subServiceId);
            return res.status(404).json({ success: false, message: 'Service not found in booking' });
        }
        subService.status = status;
        await booking.save();
        const data = await populateAssignment(Assignment.findById(id));
        res.status(200).json({ success: true, message: 'Service status updated', data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Update failed', error: err.message });
    }
};
// --- Basic CRUD ---
export const getAllAssignments = async (req, res) => {
    try {
        const assignments = await populateAssignment(Assignment.find().sort({ createdAt: -1 }));
        res.status(200).json({ success: true, count: assignments.length, data: assignments });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching assignments', error: err.message });
    }
};
export const getAssignmentById = async (req, res) => {
    try {
        const assignment = await populateAssignment(Assignment.findById(req.params.id));
        if (!assignment)
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        res.status(200).json({ success: true, data: assignment });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching assignment', error: err.message });
    }
};
export const getAssignmentsByTechnician = async (req, res) => {
    try {
        const assignments = await populateAssignment(Assignment.find({ technicianId: req.params.technicianId }).sort({ createdAt: -1 }));
        res.status(200).json({ success: true, count: assignments.length, data: assignments });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching assignments', error: err.message });
    }
};
export const createAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.create(req.body);
        // Auto-update booking status
        if (assignment.bookingId) {
            await Booking.findByIdAndUpdate(assignment.bookingId, { status: 'in-progress' });
        }
        const data = await populateAssignment(Assignment.findById(assignment._id));
        res.status(201).json({ success: true, message: 'Assignment created', data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Creation failed', error: err.message });
    }
};
export const updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!assignment)
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        const data = await populateAssignment(Assignment.findById(assignment._id));
        res.status(200).json({ success: true, message: 'Assignment updated', data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Update failed', error: err.message });
    }
};
export const deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndDelete(req.params.id);
        if (!assignment)
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        res.status(200).json({ success: true, message: 'Assignment deleted' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Deletion failed', error: err.message });
    }
};
// --- Sub-Resources (Treatment, Pictures, Payment) ---
export const assignTechnician = async (req, res) => {
    try {
        const { technicianId } = req.body;
        const assignment = await Assignment.findByIdAndUpdate(req.params.id, { technicianId }, { new: true });
        if (!assignment)
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        const data = await populateAssignment(Assignment.findById(assignment._id));
        res.status(200).json({ success: true, message: 'Technician assigned', data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Assignment failed', error: err.message });
    }
};
// Treatment Preparation (Array Manipulation)
export const manageTreatmentPreparation = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const method = req.method;
        const assignment = await Assignment.findById(id);
        if (!assignment)
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        if (method === 'POST') {
            // Add
            assignment.treatmentPreparation.push(req.body);
        }
        else if (method === 'PUT' && itemId) {
            // Update (Manual find & update)
            const item = assignment.treatmentPreparation.id(itemId);
            if (item)
                item.set(req.body);
        }
        else if (method === 'DELETE' && itemId) {
            // Delete
            // @ts-ignore
            assignment.treatmentPreparation.pull(itemId);
        }
        await assignment.save();
        const data = await populateAssignment(Assignment.findById(id));
        res.status(200).json({ success: true, message: 'Treatment preparation updated', data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Operation failed', error: err.message });
    }
};
// Site Pictures
export const addSitePicture = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment)
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        let pictureData = req.body;
        if (req.file) {
            pictureData = {
                publicId: req.file.filename,
                url: req.file.path,
                filename: req.file.originalname,
                width: 0, height: 0
            };
        }
        if (!assignment.applyTreatment)
            assignment.applyTreatment = { sitePictures: [] };
        assignment.applyTreatment.sitePictures.push(pictureData);
        await assignment.save();
        const data = await populateAssignment(Assignment.findById(assignment._id));
        res.status(200).json({ success: true, message: 'Picture added', data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
    }
};
export const deleteSitePicture = async (req, res) => {
    try {
        const { id, pictureId } = req.params;
        const assignment = await Assignment.findById(id);
        if (!assignment)
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        // Cloudinary Delete
        const picture = assignment.applyTreatment?.sitePictures.id(pictureId);
        if (picture?.publicId) {
            await cloudinary.uploader.destroy(picture.publicId).catch(console.error);
        }
        // @ts-ignore
        assignment.applyTreatment.sitePictures.pull(pictureId);
        await assignment.save();
        const data = await populateAssignment(Assignment.findById(id));
        res.status(200).json({ success: true, message: 'Picture deleted', data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Deletion failed', error: err.message });
    }
};
// Payment Collection
export const managePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await populateAssignment(Assignment.findById(id)); // populate needed for booking update check
        if (!assignment)
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        if (req.method === 'DELETE') {
            assignment.paymentCollection = { amount: 0, paymentMethod: 'cash', paymentDate: null, paymentStatus: 'pending' };
        }
        else {
            // POST or PUT (Upsert logic mostly)
            const collection = assignment.paymentCollection || {};
            // Merge existing with new
            assignment.paymentCollection = { ...collection.toObject(), ...req.body };
            // Auto-complete status if money paid
            if (assignment.paymentCollection.amount > 0 && assignment.paymentCollection.paymentStatus === 'pending') {
                assignment.paymentCollection.paymentStatus = 'completed';
                assignment.paymentCollection.paymentDate = new Date();
            }
        }
        await assignment.save();
        await handleBookingStatusUpdate(assignment);
        const data = await populateAssignment(Assignment.findById(id));
        res.status(200).json({ success: true, message: 'Payment updated', data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Payment operation failed', error: err.message });
    }
};
