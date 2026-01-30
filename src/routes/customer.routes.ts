import express from 'express';
import {
    signupCustomer,
    loginCustomer,
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats,
    toggleCustomerStatus
} from '../controllers/customer.controller.js';

const router = express.Router();

// Auth Routes
router.post('/signup', signupCustomer);
router.post('/login', loginCustomer);

// Stats
router.get('/stats/overview', getCustomerStats);

// Main CRUD
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

// Utils
router.patch('/:id/toggle-status', toggleCustomerStatus);

export default router;
