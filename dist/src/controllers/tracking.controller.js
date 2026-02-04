import Tracking from '../models/tracking.model';
import Technician from '../models/user.model';
// Create a new tracking record
export const createTracking = async (req, res) => {
    try {
        const { technicianId, latitude, longitude, address, notes, status } = req.body;
        // Validate required fields
        if (!technicianId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Technician ID, latitude, and longitude are required'
            });
        }
        // Verify technician exists
        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: 'Technician not found'
            });
        }
        // Create tracking record
        const tracking = new Tracking({
            technicianId,
            technicianName: technician.fullName,
            latitude,
            longitude,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            address: address || '',
            notes: notes || '',
            status: status || 'Active',
            recordedBy: 'Admin'
        });
        await tracking.save();
        res.status(201).json({
            success: true,
            message: 'Tracking record created successfully',
            data: tracking
        });
    }
    catch (error) {
        console.error('Error creating tracking record:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating tracking record',
            error: error.message
        });
    }
};
// Get all tracking records
export const getAllTracking = async (req, res) => {
    try {
        const { technicianId, status, startDate, endDate } = req.query;
        // Build filter query
        const filter = {};
        if (technicianId) {
            filter.technicianId = technicianId;
        }
        if (status) {
            filter.status = status;
        }
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        const trackingRecords = await Tracking.find(filter)
            .populate('technicianId', 'fullName email contactNumber')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: trackingRecords.length,
            data: trackingRecords
        });
    }
    catch (error) {
        console.error('Error fetching tracking records:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tracking records',
            error: error.message
        });
    }
};
// Get tracking record by ID
export const getTrackingById = async (req, res) => {
    try {
        const { id } = req.params;
        const tracking = await Tracking.findById(id)
            .populate('technicianId', 'fullName email contactNumber');
        if (!tracking) {
            return res.status(404).json({
                success: false,
                message: 'Tracking record not found'
            });
        }
        res.status(200).json({
            success: true,
            data: tracking
        });
    }
    catch (error) {
        console.error('Error fetching tracking record:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tracking record',
            error: error.message
        });
    }
};
// Get latest tracking for a technician
export const getLatestTrackingByTechnician = async (req, res) => {
    try {
        const { technicianId } = req.params;
        const tracking = await Tracking.findOne({ technicianId })
            .sort({ createdAt: -1 })
            .populate('technicianId', 'fullName email contactNumber');
        if (!tracking) {
            return res.status(404).json({
                success: false,
                message: 'No tracking records found for this technician'
            });
        }
        res.status(200).json({
            success: true,
            data: tracking
        });
    }
    catch (error) {
        console.error('Error fetching latest tracking:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching latest tracking',
            error: error.message
        });
    }
};
// Update tracking record
export const updateTracking = async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude, address, notes, status } = req.body;
        const tracking = await Tracking.findById(id);
        if (!tracking) {
            return res.status(404).json({
                success: false,
                message: 'Tracking record not found'
            });
        }
        // Update fields
        if (latitude !== undefined)
            tracking.latitude = latitude;
        if (longitude !== undefined)
            tracking.longitude = longitude;
        if (address !== undefined)
            tracking.address = address;
        if (notes !== undefined)
            tracking.notes = notes;
        if (status !== undefined)
            tracking.status = status;
        // Update location coordinates if lat/long changed
        if (latitude !== undefined || longitude !== undefined) {
            tracking.set('location', {
                type: 'Point',
                coordinates: [tracking.longitude, tracking.latitude]
            });
        }
        await tracking.save();
        res.status(200).json({
            success: true,
            message: 'Tracking record updated successfully',
            data: tracking
        });
    }
    catch (error) {
        console.error('Error updating tracking record:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating tracking record',
            error: error.message
        });
    }
};
// Delete tracking record
export const deleteTracking = async (req, res) => {
    try {
        const { id } = req.params;
        const tracking = await Tracking.findByIdAndDelete(id);
        if (!tracking) {
            return res.status(404).json({
                success: false,
                message: 'Tracking record not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Tracking record deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting tracking record:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting tracking record',
            error: error.message
        });
    }
};
// Get tracking records within a radius (geospatial query)
export const getTrackingNearby = async (req, res) => {
    try {
        const { longitude, latitude, radius = 5000 } = req.query;
        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Longitude and latitude are required'
            });
        }
        const trackingRecords = await Tracking.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        }).populate('technicianId', 'fullName email contactNumber');
        res.status(200).json({
            success: true,
            count: trackingRecords.length,
            data: trackingRecords
        });
    }
    catch (error) {
        console.error('Error fetching nearby tracking records:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching nearby tracking records',
            error: error.message
        });
    }
};
