import Booking from '../models/booking.model.js';
import Customer from '../models/customer.model.js';
import SubService from '../models/subService.model.js';
// --- Helpers ---
// --- Helpers ---
const populateBooking = (query) => {
    return query
        .populate('customerId', 'fullName email mobileNo address')
        .populate('subServiceIds.serviceId', 'title description startingPrice metaImage');
};
// --- CRUD Controllers ---
export const createBooking = async (req, res) => {
    try {
        const { customerId, subServiceIds, additionalAddress, additionalMobileNo, deadlineDate } = req.body;
        const customer = await Customer.findById(customerId);
        if (!customer)
            return res.status(404).json({ status: 'error', message: 'Customer not found' });
        // Calculate total amount
        let totalAmount = 0;
        let formattedSubServices = [];
        if (subServiceIds && subServiceIds.length > 0) {
            // Assume subServiceIds is an array of strings (IDs) from frontend
            const subServices = await SubService.find({ _id: { $in: subServiceIds } });
            totalAmount = subServices.reduce((sum, service) => sum + (service.startingPrice || 0), 0);
            // Format for new schema structure
            formattedSubServices = subServiceIds.map((id) => ({
                serviceId: id,
                status: 'pending'
            }));
        }
        const booking = await Booking.create({
            customerId,
            subServiceIds: formattedSubServices,
            additionalAddress,
            additionalMobileNo,
            deadlineDate: new Date(deadlineDate),
            totalAmount
        });
        const data = await populateBooking(Booking.findById(booking._id));
        res.status(201).json({ status: 'success', message: 'Booking created successfully', data: { booking: data } });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to create booking', error: error.message });
    }
};
export const getAllBookings = async (req, res) => {
    try {
        const { customerId, status, fromDate, toDate, page = 1, limit = 50 } = req.query;
        const query = {};
        if (customerId)
            query.customerId = customerId;
        if (status)
            query.status = status;
        if (fromDate || toDate) {
            query.bookingDate = {};
            if (fromDate)
                query.bookingDate.$gte = new Date(fromDate);
            if (toDate)
                query.bookingDate.$lte = new Date(toDate);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [bookings, total] = await Promise.all([
            populateBooking(Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))),
            Booking.countDocuments(query)
        ]);
        res.status(200).json({
            status: 'success',
            data: {
                bookings,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch bookings', error: error.message });
    }
};
export const getBookingById = async (req, res) => {
    try {
        const booking = await populateBooking(Booking.findById(req.params.id));
        if (!booking)
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        res.status(200).json({ status: 'success', data: { booking } });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch booking', error: error.message });
    }
};
export const updateBooking = async (req, res) => {
    try {
        const updates = { ...req.body };
        // If subServiceIds are being updated, recalculate totalAmount and reformat
        if (updates.subServiceIds) {
            const subServices = await SubService.find({ _id: { $in: updates.subServiceIds } });
            updates.totalAmount = subServices.reduce((sum, service) => sum + (service.startingPrice || 0), 0);
            // Format for new schema structure
            updates.subServiceIds = updates.subServiceIds.map((id) => ({
                serviceId: id,
                status: 'pending'
            }));
        }
        const booking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!booking)
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        const data = await populateBooking(Booking.findById(booking._id));
        res.status(200).json({ status: 'success', message: 'Booking updated successfully', data: { booking: data } });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update booking', error: error.message });
    }
};
export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking)
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        res.status(200).json({ status: 'success', message: 'Booking deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete booking', error: error.message });
    }
};
export const getCustomerBookings = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;
        const query = { customerId };
        if (status)
            query.status = status;
        const skip = (Number(page) - 1) * Number(limit);
        const [bookings, total] = await Promise.all([
            populateBooking(Booking.find(query).sort({ bookingDate: -1 }).skip(skip).limit(Number(limit))),
            Booking.countDocuments(query)
        ]);
        res.status(200).json({
            status: 'success',
            data: {
                bookings,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch customer bookings', error: error.message });
    }
};
export const getBookingStats = async (req, res) => {
    try {
        const [total, pending, confirmed, inProgress, completed, cancelled] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'pending' }),
            Booking.countDocuments({ status: 'confirmed' }),
            Booking.countDocuments({ status: 'in-progress' }),
            Booking.countDocuments({ status: 'completed' }),
            Booking.countDocuments({ status: 'cancelled' })
        ]);
        res.status(200).json({
            status: 'success',
            data: {
                total,
                byStatus: { pending, confirmed, inProgress, completed, cancelled }
            }
        });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch stats', error: error.message });
    }
};
