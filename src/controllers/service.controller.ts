import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Service from '../models/service.model.js';
import SubService from '../models/subService.model.js';

// Helper to handle formData 'undefined' string or empty values
const parseFormData = (val: any) => {
    if (val === 'undefined' || val === undefined || val === null) return undefined;
    return val;
};

// --- Main Service Controllers ---

/**
 * @desc    Get all services
 * @route   GET /api/services
 * @access  Public
 */
export const getAllServices = async (req: Request, res: Response): Promise<void> => {
    try {
        const services = await Service.find().populate('services');
        res.status(200).json({ success: true, count: services.length, data: services });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error fetching services', error: error.message });
    }
};

/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const service = await Service.findById(req.params.id).populate('services');
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }
        res.status(200).json({ success: true, data: service });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error fetching service', error: error.message });
    }
};

/**
 * @desc    Get service by title
 * @route   GET /api/services/title/:title
 * @access  Public
 */
export const getServiceByTitle = async (req: Request, res: Response): Promise<void> => {
    try {
        const service = await Service.findOne({ title: req.params.title.toLowerCase() }).populate('services');
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }
        res.status(200).json({ success: true, data: service });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error fetching service', error: error.message });
    }
};

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Private/Admin
 */
export const createService = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;
        let image = parseFormData(data.image);

        if (req.file) {
            image = req.file.path;
        }

        if (!image) {
            res.status(400).json({ success: false, message: 'Service image is required' });
            return;
        }

        const existingService = await Service.findOne({ title: data.title.toLowerCase() });
        if (existingService) {
            res.status(400).json({ success: false, message: 'Service with this title already exists' });
            return;
        }

        const service = await Service.create({
            title: data.title,
            description: data.description,
            image,
            services: [], // Start empty, will populate if subservices are passed
            metaKeywords: data.metaKeywords || '',
            metaDescription: data.metaDescription || data.description,
            metaTitle: data.metaTitle || data.title,
            metaImage: data.metaImage || image
        });

        // Parse services if stringified (for initial seeding or full creation)
        let subServicesData = data.services;
        if (typeof subServicesData === 'string') {
            try { subServicesData = JSON.parse(subServicesData); } catch (e) { subServicesData = []; }
        }

        if (Array.isArray(subServicesData) && subServicesData.length > 0) {
            const subServicePromises = subServicesData.map(async (subData: any) => {
                return await SubService.create({
                    serviceId: service._id,
                    ...subData
                });
            });

            const createdSubServices = await Promise.all(subServicePromises);
            service.services = createdSubServices.map(s => s._id) as any;
            await service.save();
        }

        const populatedService = await Service.findById(service._id).populate('services');
        res.status(201).json({ success: true, message: 'Service created successfully', data: populatedService });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error creating service', error: error.message });
    }
};

/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Private/Admin
 */
export const updateService = async (req: Request, res: Response): Promise<void> => {
    try {
        const updates = { ...req.body };
        const service = await Service.findById(req.params.id);

        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }

        // Handle Image
        if (req.file) {
            updates.image = req.file.path;
        } else if (typeof updates.image !== 'string' || updates.image === 'undefined') {
            delete updates.image;
        }

        // We don't update subservices here via 'services' field usually, as they are separate entities now.
        // But if someone tries to pass 'services' array ID's, we might overwrite. 
        // Safer to delete 'services' from updates to prevent accidental overwrites unless explicit.
        delete updates.services;

        // Clean up undefined fields
        Object.keys(updates).forEach(key => {
            if (updates[key] === 'undefined') delete updates[key];
        });

        const updatedService = await Service.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('services');
        res.status(200).json({ success: true, message: 'Service updated successfully', data: updatedService });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error updating service', error: error.message });
    }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/services/:id
 * @access  Private/Admin
 */
export const deleteService = async (req: Request, res: Response): Promise<void> => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }

        // Delete all associated sub-services first
        await SubService.deleteMany({ serviceId: service._id });

        await service.deleteOne();
        res.status(200).json({ success: true, message: 'Service and sub-services deleted successfully', data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error deleting service', error: error.message });
    }
};

// --- Sub-Service Controllers ---

/**
 * @desc    Add sub-service
 * @route   POST /api/services/:id/sub-service
 */
export const addSubService = async (req: Request, res: Response): Promise<void> => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }

        const data = req.body;
        let image = parseFormData(data.image);
        if (req.file) image = req.file.path;

        const subService = await SubService.create({
            serviceId: service._id,
            title: data.title,
            description: data.description,
            startingPrice: data.startingPrice,
            image,
            metaKeywords: data.metaKeywords,
            metaDescription: data.metaDescription,
            metaTitle: data.metaTitle,
            metaImage: data.metaImage
        });

        service.services.push(subService._id as any);
        await service.save();

        // Return updated service with populated subservices
        const updatedService = await Service.findById(service._id).populate('services');

        res.status(201).json({ success: true, message: 'Sub-service added successfully', data: updatedService });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error adding sub-service', error: error.message });
    }
};

/**
 * @desc    Update sub-service
 * @route   PUT /api/services/:id/sub-service/:subServiceId
 */
export const updateSubService = async (req: Request, res: Response): Promise<void> => {
    try {
        const subService = await SubService.findById(req.params.subServiceId);
        if (!subService) {
            res.status(404).json({ success: false, message: 'Sub-service not found' });
            return;
        }

        const updates = { ...req.body };
        if (req.file) {
            updates.image = req.file.path;
        } else {
            if (typeof updates.image !== 'string' || updates.image === 'undefined') delete updates.image;
        }

        const updatedSubService = await SubService.findByIdAndUpdate(req.params.subServiceId, updates, { new: true });

        // Return parent service
        const service = await Service.findById(req.params.id).populate('services');

        res.status(200).json({ success: true, message: 'Sub-service updated successfully', data: service });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error updating sub-service', error: error.message });
    }
};

/**
 * @desc    Delete sub-service
 * @route   DELETE /api/services/:id/sub-service/:subServiceId
 */
export const deleteSubService = async (req: Request, res: Response): Promise<void> => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }

        const subService = await SubService.findByIdAndDelete(req.params.subServiceId);
        if (!subService) {
            res.status(404).json({ success: false, message: 'Sub-service not found' });
            return;
        }

        // Remove from parent service array
        service.services = service.services.filter((id: any) => id.toString() !== req.params.subServiceId) as any;
        await service.save();

        const updatedService = await Service.findById(service._id).populate('services');

        res.status(200).json({ success: true, message: 'Sub-service deleted successfully', data: updatedService });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error deleting sub-service', error: error.message });
    }
};


