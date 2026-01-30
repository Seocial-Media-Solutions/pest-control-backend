import { Router } from 'express';
import {
    getAllServices,
    getServiceById,
    getServiceByTitle,
    createService,
    updateService,
    deleteService,
    addSubService,
    updateSubService,
    deleteSubService
} from '../controllers/service.controller.js';
import { upload } from '../config/cloudinary.js';

const router = Router();

// Public Routes
router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.get('/title/:title', getServiceByTitle);

// Private/Admin Routes
// Main Services
router.post('/', upload.single('image'), createService);
router.put('/:id', upload.single('image'), updateService);
router.delete('/:id', deleteService);

// Sub-Services
router.post('/:id/sub-service', upload.single('image'), addSubService);
router.put('/:id/sub-service/:subServiceId', upload.single('image'), updateSubService);
router.delete('/:id/sub-service/:subServiceId', deleteSubService);

export default router;
