import { Router } from 'express';
import { getAllSubServices, getSubServiceById } from '../controllers/subService.controller.js';
const router = Router();
// Public Routes
router.get('/', getAllSubServices);
router.get('/:id', getSubServiceById);
export default router;
