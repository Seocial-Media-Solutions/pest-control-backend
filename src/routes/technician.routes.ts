import express from 'express';
import {
    loginTechnician,
    createTechnician,
    getAllTechnicians,
    getTechnicianById,
    updateTechnician,
    deleteTechnician,
    markAttendance,
    getAttendanceByMonth
} from '../controllers/technician.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Auth (Public)
router.post('/technicians/login', loginTechnician);

// Core CRUD (Protected)
router.post('/technicians', protect, createTechnician);
router.get('/technicians', protect, getAllTechnicians);
router.get('/technicians/:id', protect, getTechnicianById);
router.put('/technicians/:id', protect, updateTechnician);
router.delete('/technicians/:id', protect, deleteTechnician);

// Attendance (Protected)
router.post('/technicians/:id/attendance', protect, markAttendance);
router.get('/technicians/:id/attendance', protect, getAttendanceByMonth); // Current month default
router.get('/technicians/:id/attendance/:month', protect, getAttendanceByMonth); // Specific month

export default router;