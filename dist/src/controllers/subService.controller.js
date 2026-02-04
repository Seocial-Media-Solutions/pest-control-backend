import SubService from '../models/subService.model.js';
// --- Sub-Service Independent Controllers ---
/**
 * @desc    Get all sub-services with pagination and filtering
 * @route   GET /api/sub-services
 * @access  Public
 */
export const getAllSubServices = async (req, res) => {
    try {
        const { page = 1, limit = 50, search, serviceId } = req.query;
        const query = {};
        if (serviceId) {
            query.serviceId = serviceId;
        }
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [subServices, total] = await Promise.all([
            SubService.find(query)
                .populate('serviceId', 'title')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            SubService.countDocuments(query)
        ]);
        res.status(200).json({
            success: true,
            count: subServices.length,
            data: subServices,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching sub-services', error: error.message });
    }
};
/**
 * @desc    Get single sub-service by ID
 * @route   GET /api/sub-services/:id
 * @access  Public
 */
export const getSubServiceById = async (req, res) => {
    try {
        const subService = await SubService.findById(req.params.id).populate('serviceId', 'title');
        if (!subService) {
            res.status(404).json({ success: false, message: 'Sub-service not found' });
            return;
        }
        res.status(200).json({ success: true, data: subService });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching sub-service', error: error.message });
    }
};
