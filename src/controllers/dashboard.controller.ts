import { Request, Response } from 'express';
import Assignment from '../models/assignment.model.js';
import Technician from '../models/user.model.js';
import Service from '../models/service.model.js';
import Tracking from '../models/tracking.model.js';

/**
 * Get comprehensive dashboard statistics
 * @route GET /api/dashboard/stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // 1. Basic Counts
        const [
            totalAssignments,
            pendingAssignments,
            completedAssignments,
            inProgressAssignments,
            cancelledAssignments,
            todayAssignments,
            monthAssignments,
            yearAssignments,
            totalTechnicians,
            activeTechnicians,
            inactiveTechnicians,
            totalServices
        ] = await Promise.all([
            Assignment.countDocuments(),
            Assignment.countDocuments({ status: 'pending' }),
            Assignment.countDocuments({ status: 'completed' }),
            Assignment.countDocuments({ status: 'in-progress' }),
            Assignment.countDocuments({ status: 'cancelled' }),
            Assignment.countDocuments({ createdAt: { $gte: startOfToday } }),
            Assignment.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Assignment.countDocuments({ createdAt: { $gte: startOfYear } }),
            Technician.countDocuments(),
            Technician.countDocuments({ isActive: true }),
            Technician.countDocuments({ isActive: false }),
            Service.countDocuments(),
        ]);

        // 2. Revenue Aggregation
        const revenueStats = await Assignment.aggregate([
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'bookingId',
                    foreignField: '_id',
                    as: 'booking'
                }
            },
            { $unwind: '$booking' },
            // Removed direct service lookup as booking.serviceId doesn't exist.
            // Using booking.totalAmount for revenue calculations instead.
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$booking.totalAmount' }, // Using Booking Total Amount
                    collectedRevenue: { $sum: '$paymentCollection.amount' },
                    pendingRevenue: {
                        $sum: {
                            $subtract: ['$booking.totalAmount', '$paymentCollection.amount']
                        }
                    },
                    todayRevenue: {
                        $sum: {
                            $cond: [{ $gte: ['$createdAt', startOfToday] }, '$paymentCollection.amount', 0]
                        }
                    },
                    monthRevenue: {
                        $sum: {
                            $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$paymentCollection.amount', 0]
                        }
                    },
                    yearRevenue: {
                        $sum: {
                            $cond: [{ $gte: ['$createdAt', startOfYear] }, '$paymentCollection.amount', 0]
                        }
                    }
                }
            }
        ]);

        const stats = revenueStats[0] || {
            totalRevenue: 0,
            collectedRevenue: 0,
            pendingRevenue: 0,
            todayRevenue: 0,
            monthRevenue: 0,
            yearRevenue: 0
        };

        // 3. Recent Assignments
        const recentAssignmentsRaw = await Assignment.find()
            .populate({
                path: 'bookingId',
                populate: [
                    { path: 'customerId', select: 'fullName' },
                    {
                        path: 'subServiceIds',
                        select: 'serviceId',
                        populate: {
                            path: 'serviceId',
                            select: 'title'
                        }
                    }
                ]
            })
            .populate('technicianId', 'fullName username')
            .sort({ createdAt: -1 })
            .limit(10);

        const recentAssignments = recentAssignmentsRaw.map((a: any) => {
            const subServices = a.bookingId?.subServiceIds || [];
            const mainService = subServices.length > 0 && subServices[0]?.serviceId ? subServices[0].serviceId : null;

            return {
                _id: a._id,
                status: a.status,
                createdAt: a.createdAt,
                paymentAmount: a.paymentCollection?.amount || 0,
                paymentstatus: a.paymentCollection?.paymentStatus || 'pending',
                category: mainService?.title || 'Unknown',
                serviceTitle: mainService?.title || 'Unknown',
                customer: { name: a.bookingId?.customerId?.fullName || 'Unknown' },
                technician: { name: a.technicianId?.fullName || 'Unassigned' }
            };
        });

        // 4. Technician Performance
        const technicianPerformance = await Assignment.aggregate([
            { $match: { technicianId: { $ne: null } } },
            {
                $group: {
                    _id: '$technicianId',
                    totalAssignments: { $sum: 1 },
                    completedAssignments: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    totalRevenue: { $sum: '$paymentCollection.amount' }
                }
            },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'technicians',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'tech'
                }
            },
            { $unwind: '$tech' },
            {
                $project: {
                    technicianName: '$tech.fullName',
                    username: '$tech.username',
                    totalAssignments: 1,
                    completedAssignments: 1,
                    totalRevenue: 1,
                    completionRate: {
                        $multiply: [{ $divide: ['$completedAssignments', '$totalAssignments'] }, 100]
                    }
                }
            },
            { $sort: { completedAssignments: -1 } }
        ]);

        // 5. Payment Breakdowns
        const paymentStats = await Assignment.aggregate([
            {
                $group: {
                    _id: '$paymentCollection.paymentMethod',
                    count: { $sum: 1 },
                    collectedAmount: { $sum: '$paymentCollection.amount' },
                    totalAmount: { $sum: '$paymentCollection.amount' } // Simplified
                }
            }
        ]);

        // 6. Service Stats
        const serviceUsageStats = await Assignment.aggregate([
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'bookingId',
                    foreignField: '_id',
                    as: 'booking'
                }
            },
            { $unwind: '$booking' },
            // Add field to get the first subServiceId
            {
                $addFields: {
                    'firstSubServiceId': { $arrayElemAt: ['$booking.subServiceIds', 0] }
                }
            },
            {
                $lookup: {
                    from: 'subservices',
                    localField: 'firstSubServiceId',
                    foreignField: '_id',
                    as: 'subService'
                }
            },
            { $unwind: { path: '$subService', preserveNullAndEmptyArrays: false } }, // If no subservice, skip
            {
                $lookup: {
                    from: 'services',
                    localField: 'subService.serviceId',
                    foreignField: '_id',
                    as: 'service'
                }
            },
            { $unwind: { path: '$service', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: '$service.title',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$paymentCollection.amount' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Response Data
        const dashboardData = {
            overview: {
                totalAssignments,
                totalTechnicians,
                totalServices,
                totalRevenue: stats.totalRevenue,
                collectedRevenue: stats.collectedRevenue,
                pendingRevenue: stats.pendingRevenue
            },
            assignments: {
                total: totalAssignments,
                pending: pendingAssignments,
                inProgress: inProgressAssignments,
                completed: completedAssignments,
                cancelled: cancelledAssignments,
                completionRate: totalAssignments > 0 ? ((completedAssignments / totalAssignments) * 100).toFixed(2) : '0',
                today: todayAssignments,
                thisMonth: monthAssignments,
                thisYear: yearAssignments
            },
            technicians: {
                total: totalTechnicians,
                active: activeTechnicians,
                inactive: inactiveTechnicians,
                activePercentage: totalTechnicians > 0 ? ((activeTechnicians / totalTechnicians) * 100).toFixed(2) + '%' : '0%'
            },
            revenue: {
                total: stats.totalRevenue,
                collected: stats.collectedRevenue,
                pending: stats.pendingRevenue,
                collectionRate: stats.totalRevenue > 0 ? ((stats.collectedRevenue / stats.totalRevenue) * 100).toFixed(2) : '0',
                today: stats.todayRevenue,
                thisMonth: stats.monthRevenue,
                thisYear: stats.yearRevenue
            },       
            recentActivity: {
                assignments: recentAssignments
            },
            performance: {
                topTechnicians: technicianPerformance,
                paymentBreakdown: paymentStats,
                popularServices: serviceUsageStats
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json({ status: 'success', data: dashboardData });

    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard statistics', error: error.message });
    }
};

export const getAssignmentTrends = async (req: Request, res: Response) => { res.status(200).json({ status: 'success', data: [] }) };
export const getTechnicianActivity = async (req: Request, res: Response) => { res.status(200).json({ status: 'success', data: { locations: [], attendanceToday: {} } }) };
export const getRevenueAnalytics = async (req: Request, res: Response) => { res.status(200).json({ status: 'success', data: {} }) };
export const getAllDashboardDetails = async (req: Request, res: Response) => { getDashboardStats(req, res) };
