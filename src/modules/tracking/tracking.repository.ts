// Tracking Repository - Data access layer for tracking operations

import Tracking from '../../models/tracking.model.js';
import Technician from '../../models/user.model.js';
import { LocationUpdatePayload } from './tracking.events.js';

export class TrackingRepository {
    /**
     * Create a new tracking record
     */
    async createTracking(data: LocationUpdatePayload & { technicianName: string }) {
        const tracking = new Tracking({
            technicianId: data.technicianId,
            technicianName: data.technicianName,
            latitude: data.latitude,
            longitude: data.longitude,
            location: {
                type: 'Point',
                coordinates: [data.longitude, data.latitude]
            },
            address: data.address || '',
            notes: data.notes || '',
            status: data.status || 'Active',
            recordedBy: 'WebSocket'
        });

        await tracking.save();
        return tracking;
    }

    /**
     * Update existing tracking record
     */
    async updateTracking(trackingId: string, data: Partial<LocationUpdatePayload>) {
        const updateData: any = {};

        if (data.latitude !== undefined) updateData.latitude = data.latitude;
        if (data.longitude !== undefined) updateData.longitude = data.longitude;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.status !== undefined) updateData.status = data.status;

        // Update location coordinates if lat/long changed
        if (data.latitude !== undefined || data.longitude !== undefined) {
            const tracking = await Tracking.findById(trackingId);
            if (tracking) {
                updateData.location = {
                    type: 'Point',
                    coordinates: [
                        data.longitude ?? tracking.longitude,
                        data.latitude ?? tracking.latitude
                    ]
                };
            }
        }

        const tracking = await Tracking.findByIdAndUpdate(
            trackingId,
            updateData,
            { new: true, runValidators: true }
        ).populate('technicianId', 'fullName email contactNumber');

        return tracking;
    }

    /**
     * Get latest tracking for a technician
     */
    async getLatestByTechnician(technicianId: string) {
        const tracking = await Tracking.findOne({ technicianId })
            .sort({ createdAt: -1 })
            .populate('technicianId', 'fullName email contactNumber');

        return tracking;
    }

    /**
     * Get active technicians (with recent tracking)
     */
    async getLatestLocationsForAll() {
        // More reliable approach than aggregation for strict typing/population:
        const technicianIds = await Tracking.distinct('technicianId');

        const latestTrackings = [];
        for (const techId of technicianIds) {
            // Find the most recently updated OR created record
            const tracking = await Tracking.findOne({ technicianId: techId })
                .sort({ updatedAt: -1, createdAt: -1 })
                .populate('technicianId', 'fullName email contactNumber');

            if (tracking) {
                latestTrackings.push(tracking);
            }
        }
        return latestTrackings;
    }

    /**
     * Get all tracking records with filters
     */
    async getAllTracking(filters: {
        technicianId?: string;
        status?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const query: any = {};

        if (filters.technicianId) {
            query.technicianId = filters.technicianId;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                query.createdAt.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.createdAt.$lte = filters.endDate;
            }
        }

        const trackingRecords = await Tracking.find(query)
            .populate('technicianId', 'fullName email contactNumber')
            .sort({ createdAt: -1 });

        return trackingRecords;
    }

    /**
     * Get tracking records within a radius (geospatial query)
     */
    async getNearbyTracking(longitude: number, latitude: number, radius: number = 5000) {
        const trackingRecords = await Tracking.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: radius
                }
            }
        }).populate('technicianId', 'fullName email contactNumber');

        return trackingRecords;
    }

    /**
     * Get technician by ID
     */
    async getTechnicianById(technicianId: string) {
        const technician = await Technician.findById(technicianId);
        return technician;
    }

    /**
     * Delete tracking record
     */
    async deleteTracking(trackingId: string) {
        const tracking = await Tracking.findByIdAndDelete(trackingId);
        return tracking;
    }

    /**
     * Get active technicians (with recent tracking)
     */
    async getActiveTechnicians(minutesAgo: number = 30) {
        const timeThreshold = new Date(Date.now() - minutesAgo * 60 * 1000);

        const activeTechnicians = await Tracking.aggregate([
            {
                $match: {
                    createdAt: { $gte: timeThreshold },
                    status: 'Active'
                }
            },
            {
                $group: {
                    _id: '$technicianId',
                    latestTracking: { $last: '$$ROOT' }
                }
            },
            {
                $lookup: {
                    from: 'technicians',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'technician'
                }
            },
            {
                $unwind: '$technician'
            }
        ]);

        return activeTechnicians;
    }
}
