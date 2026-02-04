import express from 'express';
import { loginAdmin, verifyOtp } from '../controllers/auth.controller.js';
const router = express.Router();
router.post('/login', loginAdmin);
router.post('/verify-otp', verifyOtp);
export default router;
