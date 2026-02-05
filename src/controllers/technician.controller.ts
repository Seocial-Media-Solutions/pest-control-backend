import { Request, Response } from 'express';
import Technician from '../models/user.model.js';

// --- Auth & Core ---

export const loginTechnician = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const technician: any = await Technician.findOne({ username }).select('+password');

    if (!technician || technician.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!technician.isActive) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    const techData: any = technician.toObject();
    delete techData.password;

    res.status(200).json({ success: true, message: 'Login successful', data: techData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
};

export const createTechnician = async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;

    const existing = await Technician.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username or Email already exists' });
    }

    const technician = await Technician.create(req.body);

    const techData: any = technician.toObject();
    delete techData.password;

    res.status(201).json({ success: true, message: 'Technician created successfully', data: techData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Creation failed', error: err.message });
  }
};

// --- CRUD Operations ---

export const getAllTechnicians = async (req: Request, res: Response) => {
  try {
    const technicians = await Technician.find().sort({ createdAt: -1 });

    // Filter for today's attendance only
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const data = technicians.map((tech: any) => {
      const techObj: any = tech.toObject();
      const todayAttendance = techObj.attendance?.find((att: any) => {
        const d = new Date(att.date).getTime();
        return d >= startOfDay && d <= endOfDay;
      });
      delete techObj.attendance;
      return { ...techObj, attendance: todayAttendance || null };
    });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Error fetching technicians', error: err.message });
  }
};

export const getTechnicianById = async (req: Request, res: Response) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });

    const techObj: any = technician.toObject();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const todayAttendance = techObj.attendance?.find((att: any) => {
      const d = new Date(att.date).getTime();
      return d >= startOfDay && d <= endOfDay;
    });

    delete techObj.attendance;
    res.status(200).json({ success: true, data: { ...techObj, attendance: todayAttendance || null } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Error fetching technician', error: err.message });
  }
};

export const updateTechnician = async (req: Request, res: Response) => {
  try {
    const technician = await Technician.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });

    res.status(200).json({ success: true, message: 'Technician updated successfully', data: technician });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Update failed', error: err.message });
  }
};

export const deleteTechnician = async (req: Request, res: Response) => {
  try {
    const technician = await Technician.findByIdAndDelete(req.params.id);
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });

    res.status(200).json({ success: true, message: 'Technician deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Deletion failed', error: err.message });
  }
};

// --- Attendance ---

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { status, date } = req.body;
    if (status && !['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const technician: any = await Technician.findById(req.params.id);
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate).setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate).setHours(23, 59, 59, 999);

    if (!technician.attendance) technician.attendance = [];

    const index = technician.attendance.findIndex((att: any) => {
      const d = new Date(att.date).getTime();
      return d >= startOfDay && d <= endOfDay;
    });

    const newRecord = { date: targetDate, status: status || 'Present' };

    if (index !== -1) {
      technician.attendance[index].status = newRecord.status;
    } else {
      technician.attendance.push(newRecord);
    }

    await technician.save();
    res.status(200).json({ success: true, message: 'Attendance marked', data: newRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Attendance failed', error: err.message });
  }
};

export const getAttendanceByMonth = async (req: Request, res: Response) => {
  try {
    const { id, month } = req.params;
    const technician: any = await Technician.findById(id);
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });

    const now = new Date();
    let targetMonth = now.getMonth() + 1;
    let targetYear = now.getFullYear();

    if (month) {
      if (month.includes('-')) {
        const [y, m] = month.split('-');
        targetYear = parseInt(y);
        targetMonth = parseInt(m);
      } else {
        targetMonth = parseInt(month);
      }
    }

    const filtered = technician.attendance?.filter((att: any) => {
      const d = new Date(att.date);
      return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
    }) || [];

    const totalDays = filtered.length;
    const presentDays = filtered.filter((a: any) => a.status === 'Present').length;

    res.status(200).json({
      success: true,
      data: {
        technicianId: technician._id,
        technicianName: technician.fullName,
        month: targetMonth,
        year: targetYear,
        statistics: {
          totalDays,
          presentDays,
          absentDays: totalDays - presentDays,
          attendancePercentage: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : '0.00'
        },
        attendance: filtered
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: err.message });
  }
};
