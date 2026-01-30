import express from 'express';
import {
    createTracking,
    getAllTracking,
    getTrackingById,
    getLatestTrackingByTechnician,
    updateTracking,
    deleteTracking,
    getTrackingNearby
} from '../controllers/tracking.controller';

const router = express.Router();

// Create a new tracking record
router.post('/', createTracking);

// Get all tracking records (with optional filters)
router.get('/', getAllTracking);

// Get tracking records within a radius
router.get('/nearby', getTrackingNearby);

// Get latest tracking for a specific technician
router.get('/technician/:technicianId/latest', getLatestTrackingByTechnician);

// Get tracking record by ID
router.get('/:id', getTrackingById);

// Update tracking record
router.put('/:id', updateTracking);

// Delete tracking record
router.delete('/:id', deleteTracking);

export default router;
