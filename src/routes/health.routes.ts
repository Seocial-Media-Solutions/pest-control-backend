import { Router } from 'express';
import { healthCheck, detailedHealthCheck } from '../controllers/health.controller.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', healthCheck);

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with system info
 * @access  Public
 */
router.get('/detailed', detailedHealthCheck);

export default router;
