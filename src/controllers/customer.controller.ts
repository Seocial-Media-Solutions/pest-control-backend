import { Request, Response } from 'express';
import Customer from '../models/customer.model.js';

// --- Auth Controllers ---

export const signupCustomer = async (req: Request, res: Response) => {
    try {
        const { fullName, email, mobileNo, password, address, status } = req.body;

        const existingCustomer = await Customer.findOne({ $or: [{ email }, { mobileNo }] });
        if (existingCustomer) {
            return res.status(400).json({
                status: 'error',
                message: existingCustomer.email === email
                    ? 'Customer with this email already exists'
                    : 'Customer with this mobile number already exists'
            });
        }

        const customer = await Customer.create({
            fullName,
            email,
            mobileNo,
            password,
            address,
            status: status || 'temporary'
        });

        const customerResponse: any = customer.toObject();
        delete customerResponse.password;

        res.status(201).json({ status: 'success', message: 'Customer registered successfully', data: customerResponse });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to register customer', error: error.message });
    }
};

export const loginCustomer = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const customer = await Customer.findOne({ email }).select('+password');
        if (!customer || customer.password !== password) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        if (!customer.isActive) {
            return res.status(403).json({ status: 'error', message: 'Account deactivated' });
        }

        const customerResponse: any = customer.toObject();
        delete customerResponse.password;

        res.status(200).json({ status: 'success', message: 'Login successful', data: customerResponse });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Login failed', error: error.message });
    }
};

// --- CRUD Controllers ---

export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        const { status, isActive, search, page = 1, limit = 50 } = req.query;
        const query: any = {};

        if (status) query.status = status;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobileNo: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [customers, total] = await Promise.all([
            Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Customer.countDocuments(query)
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                customers,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch customers', error: error.message });
    }
};

export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ status: 'error', message: 'Customer not found' });
        res.status(200).json({ status: 'success', data: customer });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch customer', error: error.message });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const { fullName, email, mobileNo, address, status, notes, password } = req.body;

        const existingCustomer = await Customer.findOne({ $or: [{ email }, { mobileNo }] });
        if (existingCustomer) {
            return res.status(400).json({
                status: 'error',
                message: existingCustomer.email === email
                    ? 'Customer with this email already exists'
                    : 'Customer with this mobile number already exists'
            });
        }

        const customer = await Customer.create({
            fullName,
            email,
            mobileNo,
            password: password || 'Customer@123',
            address,
            status: status || 'temporary',
            notes: notes || ''
        });

        res.status(201).json({ status: 'success', message: 'Customer created successfully', data: customer });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to create customer', error: error.message });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent duplicate checks if email/mobile not changing, but simplistic check here:
        if (updates.email || updates.mobileNo) {
            const existing = await Customer.findOne({
                $and: [
                    { _id: { $ne: id } },
                    { $or: [{ email: updates.email }, { mobileNo: updates.mobileNo }] }
                ]
            });
            if (existing) {
                return res.status(400).json({ status: 'error', message: 'Email or Mobile already in use' });
            }
        }

        const customer = await Customer.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!customer) return res.status(404).json({ status: 'error', message: 'Customer not found' });

        res.status(200).json({ status: 'success', message: 'Customer updated successfully', data: customer });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to update customer', error: error.message });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ status: 'error', message: 'Customer not found' });
        res.status(200).json({ status: 'success', message: 'Customer deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to delete customer', error: error.message });
    }
};

// --- Stats & Utils ---

export const getCustomerStats = async (req: Request, res: Response) => {
    try {
        const [total, regular, temporary, other, active, inactive, recent] = await Promise.all([
            Customer.countDocuments(),
            Customer.countDocuments({ status: 'regular' }),
            Customer.countDocuments({ status: 'temporary' }),
            Customer.countDocuments({ status: 'other' }),
            Customer.countDocuments({ isActive: true }),
            Customer.countDocuments({ isActive: false }),
            Customer.find().sort({ createdAt: -1 }).limit(5).select('fullName email mobileNo status createdAt')
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                total,
                byStatus: { regular, temporary, other },
                byActivity: { active, inactive },
                recentCustomers: recent
            }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch stats', error: error.message });
    }
};

export const toggleCustomerStatus = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ status: 'error', message: 'Customer not found' });

        customer.isActive = !customer.isActive;
        await customer.save();

        res.status(200).json({ status: 'success', message: `Customer ${customer.isActive ? 'activated' : 'deactivated'}`, data: customer });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to toggle status', error: error.message });
    }
};
