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

const router = express.Router();

// Auth
router.post('/technicians/login', loginTechnician);

// Core CRUD
router.post('/technicians', createTechnician);
router.get('/technicians', getAllTechnicians);
router.get('/technicians/:id', getTechnicianById);
router.put('/technicians/:id', updateTechnician);
router.delete('/technicians/:id', deleteTechnician);

// Attendance
router.post('/technicians/:id/attendance', markAttendance);
router.get('/technicians/:id/attendance', getAttendanceByMonth); // Current month default
router.get('/technicians/:id/attendance/:month', getAttendanceByMonth); // Specific month

export default router;