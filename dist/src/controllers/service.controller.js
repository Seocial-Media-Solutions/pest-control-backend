import Service from '../models/service.model.js';
import SubService from '../models/subService.model.js';
import cloudinary from '../config/cloudinary.js';
// Helper to handle formData 'undefined' string or empty values
const parseFormData = (val) => {
    if (val === 'undefined' || val === undefined || val === null)
        return undefined;
    return val;
};
// --- Main Service Controllers ---
/**
 * @desc    Get all services
 * @route   GET /api/services
 * @access  Public
 */
export const getAllServices = async (req, res) => {
    try {
        const services = await Service.find().populate('services');
        res.status(200).json({ success: true, count: services.length, data: services });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching services', error: error.message });
    }
};
/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
export const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).populate('services');
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }
        res.status(200).json({ success: true, data: service });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching service', error: error.message });
    }
};
/**
 * @desc    Get service by title
 * @route   GET /api/services/title/:title
 * @access  Public
 */
export const getServiceByTitle = async (req, res) => {
    try {
        const service = await Service.findOne({ title: req.params.title.toLowerCase() }).populate('services');
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }
        res.status(200).json({ success: true, data: service });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching service', error: error.message });
    }
};
/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Private/Admin
 */
export const createService = async (req, res) => {
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
        });
        // Parse services if stringified (for initial seeding or full creation)
        let subServicesData = data.services;
        if (typeof subServicesData === 'string') {
            try {
                subServicesData = JSON.parse(subServicesData);
            }
            catch (e) {
                subServicesData = [];
            }
        }
        if (Array.isArray(subServicesData) && subServicesData.length > 0) {
            const subServicePromises = subServicesData.map(async (subData) => {
                return await SubService.create({
                    serviceId: service._id,
                    ...subData
                });
            });
            const createdSubServices = await Promise.all(subServicePromises);
            service.services = createdSubServices.map(s => s._id);
            await service.save();
        }
        const populatedService = await Service.findById(service._id).populate('services');
        res.status(201).json({ success: true, message: 'Service created successfully', data: populatedService });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error creating service', error: error.message });
    }
};
/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Private/Admin
 */
export const updateService = async (req, res) => {
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
        }
        else if (typeof updates.image !== 'string' || updates.image === 'undefined') {
            delete updates.image;
        }
        // We don't update subservices here via 'services' field usually, as they are separate entities now.
        // But if someone tries to pass 'services' array ID's, we might overwrite. 
        // Safer to delete 'services' from updates to prevent accidental overwrites unless explicit.
        delete updates.services;
        // Clean up undefined fields
        Object.keys(updates).forEach(key => {
            if (updates[key] === 'undefined')
                delete updates[key];
        });
        const updatedService = await Service.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('services');
        res.status(200).json({ success: true, message: 'Service updated successfully', data: updatedService });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error updating service', error: error.message });
    }
};
/**
 * @desc    Delete service
 * @route   DELETE /api/services/:id
 * @access  Private/Admin
 */
export const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }
        // Delete parent service image from cloudinary
        if (service.image && service.image.includes('cloudinary.com')) {
            try {
                const parts = service.image.split('/');
                const publicId = `${parts[parts.length - 2]}/${parts[parts.length - 1].split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            }
            catch (err) { }
        }
        // Get all associated sub-services
        const subServices = await SubService.find({ serviceId: service._id });
        for (const sub of subServices) {
            if (sub.image && sub.image.includes('cloudinary.com')) {
                try {
                    const parts = sub.image.split('/');
                    const publicId = `${parts[parts.length - 2]}/${parts[parts.length - 1].split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                }
                catch (err) { }
            }
        }
        // Delete all associated sub-services
        await SubService.deleteMany({ serviceId: service._id });
        await service.deleteOne();
        res.status(200).json({ success: true, message: 'Service and sub-services deleted successfully', data: {} });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting service', error: error.message });
    }
};
// --- Sub-Service Controllers ---
/**
 * @desc    Add sub-service
 * @route   POST /api/services/:id/sub-service
 */
export const addSubService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }
        const data = req.body;
        let image = parseFormData(data.image);
        if (req.file)
            image = req.file.path;
        if (!image) {
            res.status(400).json({ success: false, message: 'Sub-service image is required' });
            return;
        }
        const subService = await SubService.create({
            serviceId: service._id,
            title: data.title,
            description: data.description,
            startingPrice: data.startingPrice,
            image
        });
        service.services.push(subService._id);
        await service.save();
        // Return updated service with populated subservices
        const updatedService = await Service.findById(service._id).populate('services');
        res.status(201).json({ success: true, message: 'Sub-service added successfully', data: updatedService });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error adding sub-service', error: error.message });
    }
};
/**
 * @desc    Update sub-service
 * @route   PUT /api/services/:id/sub-service/:subServiceId
 */
export const updateSubService = async (req, res) => {
    try {
        const subService = await SubService.findById(req.params.subServiceId);
        if (!subService) {
            res.status(404).json({ success: false, message: 'Sub-service not found' });
            return;
        }
        const updates = { ...req.body };
        if (req.file) {
            updates.image = req.file.path;
        }
        else {
            if (typeof updates.image !== 'string' || updates.image === 'undefined')
                delete updates.image;
        }
        const updatedSubService = await SubService.findByIdAndUpdate(req.params.subServiceId, updates, { new: true });
        // Return parent service
        const service = await Service.findById(req.params.id).populate('services');
        res.status(200).json({ success: true, message: 'Sub-service updated successfully', data: service });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error updating sub-service', error: error.message });
    }
};
/**
 * @desc    Delete sub-service
 * @route   DELETE /api/services/:id/sub-service/:subServiceId
 */
export const deleteSubService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, message: 'Service not found' });
            return;
        }
        const subService = await SubService.findById(req.params.subServiceId);
        if (!subService) {
            res.status(404).json({ success: false, message: 'Sub-service not found' });
            return;
        }
        // Delete image from cloudinary if it exists
        if (subService.image && subService.image.includes('cloudinary.com')) {
            try {
                const parts = subService.image.split('/');
                const fileWithExt = parts[parts.length - 1];
                const folder = parts[parts.length - 2];
                const filename = fileWithExt.split('.')[0];
                const publicId = `${folder}/${filename}`;
                await cloudinary.uploader.destroy(publicId);
            }
            catch (err) {
                console.error('Failed to delete sub-service image from cloudinary', err);
            }
        }
        await subService.deleteOne();
        // Remove from parent service array
        service.services = service.services.filter((id) => id.toString() !== req.params.subServiceId);
        await service.save();
        const updatedService = await Service.findById(service._id).populate('services');
        res.status(200).json({ success: true, message: 'Sub-service deleted successfully', data: updatedService });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting sub-service', error: error.message });
    }
};
