import express from 'express';
import { getDashboardStats, getAssignmentTrends, getTechnicianActivity, getRevenueAnalytics, getAllDashboardDetails } from '../controllers/dashboard.controller.js';
const router = express.Router();
/**
 * @route   GET /api/dashboard/stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Public (Add authentication middleware as needed)
 */
router.get('/stats', getDashboardStats);
/**
 * @route   GET /api/dashboard/trends
 * @desc    Get assignment trends over time
 * @query   period - day, week, month, year (default: month)
 * @access  Public
 */
router.get('/trends', getAssignmentTrends);
/**
 * @route   GET /api/dashboard/technician-activity
 * @desc    Get technician activity and location data
 * @access  Public
 */
router.get('/technician-activity', getTechnicianActivity);
/**
 * @route   GET /api/dashboard/revenue-analytics
 * @desc    Get revenue analytics and breakdowns
 * @access  Public
 */
router.get('/revenue-analytics', getRevenueAnalytics);
/**
 * @route   GET /api/dashboard/all
 * @desc    Get all dashboard details in one call
 * @access  Public
 */
router.get('/all', getAllDashboardDetails);
export default router;
