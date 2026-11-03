import CollectionSchedule from '../models/CollectionSchedule.js';
import mongoose from 'mongoose';

export const getAllSchedules = async (req, res) => {
  try {
    const { zone, status, month, year } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    let query = {};
    if (zone && zone !== 'All') query.zone = zone;
    if (status && status !== 'All') query.status = status;

    if (month && year) {
      const startOfMonth = new Date(Number(year), Number(month) - 1, 1);
      const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59);
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const schedules = await CollectionSchedule.find(query).sort({ date: 1 });
    return res.json({ success: true, count: schedules.length, schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const {
      title,
      zone = 'District 4 - Metro North',
      date,
      dayOfWeek = 'Thursday',
      timeWindow = '07:00 AM - 09:00 AM',
      categories = ['Organic', 'Plastic'],
      driverName = 'Muhammad Gilang Pratama',
      vehicleId = 'TRK-GREEN-08',
      notes = ''
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Schedule title is required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const newScheduleData = {
      title,
      zone,
      date: date ? new Date(date) : new Date(Date.now() + 86400000),
      dayOfWeek,
      timeWindow,
      categories,
      driverName,
      vehicleId,
      status: 'Upcoming',
      notes
    };

    const schedule = await CollectionSchedule.create(newScheduleData);
    return res.status(201).json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const updated = await CollectionSchedule.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    return res.json({ success: true, schedule: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const deleted = await CollectionSchedule.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    return res.json({ success: true, message: 'Schedule deleted successfully from database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
