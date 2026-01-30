import express from 'express';
import {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    getBookingStats,
    getCustomerBookings
} from '../controllers/booking.controller.js';

const router = express.Router();

// Stats
router.get('/stats/overview', getBookingStats);

// Customer Specific
router.get('/customer/:customerId', getCustomerBookings);

// Core CRUD
router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;
