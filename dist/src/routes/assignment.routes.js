import { Router } from 'express';
import { upload } from '../config/cloudinary.js';
import { getAllAssignments, getAssignmentById, getAssignmentsByTechnician, createAssignment, updateAssignment, deleteAssignment, assignTechnician, manageTreatmentPreparation, addSitePicture, deleteSitePicture, managePayment, updateServiceStatus } from '../controllers/assignment.controller.js';
const router = Router();
// --- Core CRUD ---
router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);
router.get('/technician/:technicianId', getAssignmentsByTechnician);
router.post('/', createAssignment);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);
// --- Operations ---
router.patch('/:id/assign', assignTechnician);
// --- Sub-Resources ---
// Treatment Preparation (Unified handlers or separate routes pointing to specific logic)
router.post('/:id/treatment-preparation', manageTreatmentPreparation);
router.put('/:id/treatment-preparation/:itemId', manageTreatmentPreparation);
router.delete('/:id/treatment-preparation/:itemId', manageTreatmentPreparation);
// Site Pictures
router.post('/:id/site-pictures', upload.single('image'), addSitePicture);
router.delete('/:id/site-pictures/:pictureId', deleteSitePicture);
// Payment Collection
router.post('/:id/payment-collection', managePayment);
router.put('/:id/payment-collection', managePayment); // Simplified route
router.delete('/:id/payment-collection', managePayment);
// Service Status
router.patch('/:id/service-done/:subServiceId', updateServiceStatus);
export default router;
