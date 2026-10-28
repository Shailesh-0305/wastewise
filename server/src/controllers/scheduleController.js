import CollectionSchedule from '../models/CollectionSchedule.js';
import { inMemoryDB } from '../store/inMemoryStore.js';
import mongoose from 'mongoose';

export const getAllSchedules = async (req, res) => {
  try {
    const { zone, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (zone && zone !== 'All') query.zone = zone;
      if (status && status !== 'All') query.status = status;

      const schedules = await CollectionSchedule.find(query).sort({ date: 1 });
      return res.json({ success: true, count: schedules.length, schedules });
    } else {
      let list = [...inMemoryDB.schedules];
      if (zone && zone !== 'All') {
        list = list.filter(s => s.zone.toLowerCase().includes(zone.toLowerCase()));
      }
      if (status && status !== 'All') {
        list = list.filter(s => s.status.toLowerCase() === status.toLowerCase());
      }
      return res.json({ success: true, count: list.length, schedules: list });
    }
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
      categories = ['Organic', 'General'],
      driverName = 'Muhammad Gilang Pratama',
      vehicleId = 'TRK-GREEN-08',
      notes = ''
    } = req.body;

    const newScheduleData = {
      title: title || `${categories.join(' & ')} Collection Round`,
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

    if (mongoose.connection.readyState === 1) {
      const schedule = await CollectionSchedule.create(newScheduleData);
      return res.status(201).json({ success: true, schedule });
    } else {
      const schedule = {
        _id: 's_' + Date.now(),
        ...newScheduleData,
        date: newScheduleData.date.toISOString(),
        createdAt: new Date().toISOString()
      };
      inMemoryDB.schedules.push(schedule);
      return res.status(201).json({ success: true, schedule });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const updated = await CollectionSchedule.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Schedule not found' });
      return res.json({ success: true, schedule: updated });
    } else {
      const index = inMemoryDB.schedules.findIndex(s => s._id === id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Schedule not found' });
      inMemoryDB.schedules[index] = { ...inMemoryDB.schedules[index], ...req.body };
      return res.json({ success: true, schedule: inMemoryDB.schedules[index] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      await CollectionSchedule.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Schedule deleted successfully' });
    } else {
      const index = inMemoryDB.schedules.findIndex(s => s._id === id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Schedule not found' });
      inMemoryDB.schedules.splice(index, 1);
      return res.json({ success: true, message: 'Schedule deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
