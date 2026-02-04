// Tracking Service - Business logic layer for tracking operations
import { TrackingRepository } from './tracking.repository.js';
export class TrackingService {
    repository;
    constructor() {
        this.repository = new TrackingRepository();
    }
    /**
     * Process location update from technician
     */
    async processLocationUpdate(data) {
        // Validate coordinates
        if (data.latitude < -90 || data.latitude > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }
        if (data.longitude < -180 || data.longitude > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }
        // Get technician details
        const technician = await this.repository.getTechnicianById(data.technicianId);
        if (!technician) {
            throw new Error('Technician not found');
        }
        // Get latest tracking record for this technician
        const existingTracking = await this.repository.getLatestByTechnician(data.technicianId);
        let tracking;
        let statusChanged = false;
        let oldStatus = '';
        if (existingTracking) {
            // Check if status changed
            if (data.status && existingTracking.status !== data.status) {
                statusChanged = true;
                oldStatus = existingTracking.status;
            }
            // Update existing tracking
            tracking = await this.repository.updateTracking(existingTracking._id.toString(), data);
        }
        else {
            // Create new tracking record
            tracking = await this.repository.createTracking({
                ...data,
                technicianName: technician.fullName
            });
        }
        // Check if tracking was successfully created/updated
        if (!tracking) {
            throw new Error('Failed to create or update tracking record');
        }
        // Prepare response payload
        const payload = {
            trackingId: tracking._id.toString(),
            technicianId: tracking.technicianId.toString(),
            technicianName: tracking.technicianName,
            latitude: tracking.latitude,
            longitude: tracking.longitude,
            address: tracking.address,
            status: tracking.status,
            timestamp: tracking.updatedAt || tracking.createdAt
        };
        return payload;
    }
    /**
     * Get latest location for a technician
     */
    async getLatestLocation(technicianId) {
        const tracking = await this.repository.getLatestByTechnician(technicianId);
        if (!tracking) {
            return null;
        }
        return {
            trackingId: tracking._id.toString(),
            technicianId: tracking.technicianId.toString(),
            technicianName: tracking.technicianName,
            latitude: tracking.latitude,
            longitude: tracking.longitude,
            address: tracking.address,
            status: tracking.status,
            timestamp: tracking.updatedAt || tracking.createdAt
        };
    }
    /**
     * Get latest locations for ALL technicians
     */
    async getLatestLocationsForAll() {
        const locations = await this.repository.getLatestLocationsForAll();
        return locations.map((tracking) => ({
            trackingId: tracking._id.toString(),
            technicianId: tracking.technicianId?._id?.toString() || tracking.technicianId.toString(),
            technicianName: tracking.technicianName,
            latitude: tracking.latitude,
            longitude: tracking.longitude,
            address: tracking.address,
            status: tracking.status,
            timestamp: tracking.updatedAt || tracking.createdAt
        }));
    }
    /**
     * Get all tracking records with filters
     */
    async getAllTracking(filters) {
        const trackingRecords = await this.repository.getAllTracking(filters);
        return trackingRecords;
    }
    /**
     * Get nearby tracking records
     */
    async getNearbyTracking(longitude, latitude, radius) {
        const trackingRecords = await this.repository.getNearbyTracking(longitude, latitude, radius);
        return trackingRecords;
    }
    /**
     * Get active technicians
     */
    async getActiveTechnicians(minutesAgo) {
        const activeTechnicians = await this.repository.getActiveTechnicians(minutesAgo);
        return activeTechnicians;
    }
    /**
     * Update technician status
     */
    async updateStatus(technicianId, newStatus) {
        const tracking = await this.repository.getLatestByTechnician(technicianId);
        if (!tracking) {
            return null;
        }
        const oldStatus = tracking.status;
        if (oldStatus === newStatus) {
            return null; // No change
        }
        await this.repository.updateTracking(tracking._id.toString(), { status: newStatus });
        return {
            technicianId,
            oldStatus,
            newStatus,
            timestamp: new Date()
        };
    }
    /**
     * Validate location update payload
     */
    validateLocationUpdate(data) {
        if (!data.technicianId) {
            return { valid: false, error: 'Technician ID is required' };
        }
        if (data.latitude === undefined || data.latitude === null) {
            return { valid: false, error: 'Latitude is required' };
        }
        if (data.longitude === undefined || data.longitude === null) {
            return { valid: false, error: 'Longitude is required' };
        }
        if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
            return { valid: false, error: 'Latitude and longitude must be numbers' };
        }
        if (data.latitude < -90 || data.latitude > 90) {
            return { valid: false, error: 'Latitude must be between -90 and 90' };
        }
        if (data.longitude < -180 || data.longitude > 180) {
            return { valid: false, error: 'Longitude must be between -180 and 180' };
        }
        if (data.status && !['Active', 'Inactive', 'On Break', 'Completed'].includes(data.status)) {
            return { valid: false, error: 'Invalid status value' };
        }
        return { valid: true };
    }
}
