import CollectionSchedule from '../models/CollectionSchedule.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * Helper to parse a time string like "07:00", "06:30 AM", "02:00 PM" into minutes from 00:00
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const clean = String(timeStr).trim().toUpperCase();
  const match12 = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const period = match12[3];
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }
  const match24 = clean.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);
    return hours * 60 + mins;
  }
  return null;
};

/**
 * Extract [startMin, endMin] from startTime/endTime or a timeWindow like "06:30 AM - 09:30 AM (IST)"
 */
export const getScheduleTimeRange = ({ startTime, endTime, timeWindow }) => {
  if (startTime && endTime) {
    const s = parseTimeToMinutes(startTime);
    const e = parseTimeToMinutes(endTime);
    if (s !== null && e !== null && e > s) return [s, e];
  }
  if (timeWindow && String(timeWindow).includes('-')) {
    const parts = String(timeWindow).split('-');
    const s = parseTimeToMinutes(parts[0]);
    const e = parseTimeToMinutes(parts[1]);
    if (s !== null && e !== null && e > s) return [s, e];
  }
  return [420, 540]; // Default 07:00 - 09:00
};

export const windowsOverlap = (rangeA, rangeB) => {
  return rangeA[0] < rangeB[1] && rangeB[0] < rangeA[1];
};

/**
 * Format Date to YYYY-MM-DD in Asia/Kolkata timezone
 */
const toISTDateKey = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

/**
 * Detect scheduling conflicts against existing active schedules on the same IST date
 */
export const detectScheduleConflicts = async (candidate, excludeId = null) => {
  const dateKey = toISTDateKey(candidate.date);
  if (!dateKey) {
    return [{ type: 'INVALID_DATE', message: 'Invalid collection date provided.' }];
  }

  // Fetch non-cancelled/non-completed schedules within +/- 36 hours of candidate date
  const targetTime = new Date(candidate.date).getTime();
  const existingSchedules = await CollectionSchedule.find({
    ...(excludeId && mongoose.Types.ObjectId.isValid(excludeId) ? { _id: { $ne: excludeId } } : {}),
    status: { $nin: ['Cancelled', 'Completed'] },
    date: {
      $gte: new Date(targetTime - 36 * 3600 * 1000),
      $lte: new Date(targetTime + 36 * 3600 * 1000)
    }
  }).lean();

  const sameDaySchedules = existingSchedules.filter(s => toISTDateKey(s.date) === dateKey);
  const candidateRange = getScheduleTimeRange(candidate);
  const conflicts = [];

  for (const existing of sameDaySchedules) {
    const existingRange = getScheduleTimeRange(existing);
    if (!windowsOverlap(candidateRange, existingRange)) continue;

    // 1. Worker double-booking check
    const sameDriverId = candidate.driverId && existing.driverId && String(candidate.driverId) === String(existing.driverId);
    const sameDriverName = candidate.driverName && existing.driverName &&
      candidate.driverName.trim().toLowerCase() === existing.driverName.trim().toLowerCase();

    if (sameDriverId || sameDriverName) {
      conflicts.push({
        type: 'WORKER_DOUBLE_BOOKING',
        scheduleId: existing._id,
        title: existing.title,
        message: `Worker '${candidate.driverName || candidate.driverId}' is already scheduled for '${existing.title}' during ${existing.timeWindow} on ${dateKey}.`
      });
    }

    // 2. Vehicle double-booking check
    const candVehicle = (candidate.vehiclePlate || candidate.vehicleId || '').trim().toUpperCase();
    const existVehicle = (existing.vehiclePlate || existing.vehicleId || '').trim().toUpperCase();
    const sameVehicleObj = candidate.vehicleObjectId && existing.vehicleObjectId &&
      String(candidate.vehicleObjectId) === String(existing.vehicleObjectId);

    if (sameVehicleObj || (candVehicle && existVehicle && candVehicle === existVehicle)) {
      conflicts.push({
        type: 'VEHICLE_DOUBLE_BOOKING',
        scheduleId: existing._id,
        title: existing.title,
        message: `Vehicle '${candVehicle || candidate.vehicleObjectId}' is already assigned to '${existing.title}' during ${existing.timeWindow} on ${dateKey}.`
      });
    }

    // 3. Conflicting ward assignment for overlapping categories
    const candWard = (candidate.ward || candidate.zone || '').trim().toLowerCase();
    const existWard = (existing.ward || existing.zone || '').trim().toLowerCase();
    if (candWard && existWard && candWard === existWard) {
      const candCats = Array.isArray(candidate.categories) ? candidate.categories : [];
      const existCats = Array.isArray(existing.categories) ? existing.categories : [];
      const sharedCats = candCats.filter(c => existCats.includes(c));
      if (sharedCats.length > 0) {
        conflicts.push({
          type: 'WARD_CATEGORY_CONFLICT',
          scheduleId: existing._id,
          title: existing.title,
          message: `Ward/Zone '${candidate.ward || candidate.zone}' already has an overlapping schedule ('${existing.title}') for [${sharedCats.join(', ')}] during ${existing.timeWindow} on ${dateKey}.`
        });
      }
    }
  }

  return conflicts;
};

export const getAllSchedules = async (req, res) => {
  try {
    const { zone, ward, status, driverId, driverName, vehicleId, category, month, year, date } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const andConditions = [];
    if (zone && zone !== 'All') {
      andConditions.push({ zone: { $regex: zone, $options: 'i' } });
    }
    if (ward && ward !== 'All') {
      andConditions.push({
        $or: [
          { ward: { $regex: ward, $options: 'i' } },
          { zone: { $regex: ward, $options: 'i' } },
          { title: { $regex: ward, $options: 'i' } }
        ]
      });
    }
    if (status && status !== 'All') {
      andConditions.push({ status });
    }
    if (driverId && driverId !== 'All') {
      if (mongoose.Types.ObjectId.isValid(driverId)) {
        andConditions.push({ driverId });
      } else {
        andConditions.push({ driverName: { $regex: driverId, $options: 'i' } });
      }
    }
    if (driverName && driverName !== 'All') {
      andConditions.push({ driverName: { $regex: driverName, $options: 'i' } });
    }
    if (vehicleId && vehicleId !== 'All') {
      andConditions.push({
        $or: [
          { vehicleId: { $regex: vehicleId, $options: 'i' } },
          { vehiclePlate: { $regex: vehicleId, $options: 'i' } }
        ]
      });
    }
    if (category && category !== 'All') {
      andConditions.push({ categories: category });
    }

    if (date) {
      const targetStart = new Date(`${date}T00:00:00+05:30`);
      const targetEnd = new Date(`${date}T23:59:59+05:30`);
      if (!isNaN(targetStart.getTime())) {
        andConditions.push({ date: { $gte: targetStart, $lte: targetEnd } });
      }
    } else if (month && year) {
      const startOfMonth = new Date(Number(year), Number(month) - 1, 1);
      const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59);
      andConditions.push({ date: { $gte: startOfMonth, $lte: endOfMonth } });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};
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
      zone = 'Coimbatore Central Zone',
      ward = '',
      wardId = null,
      date,
      dayOfWeek,
      timeWindow = '07:00 AM - 09:00 AM (IST)',
      startTime = '07:00',
      endTime = '09:00',
      categories = ['Organic'],
      driverId = null,
      driverName = '',
      vehicleObjectId = null,
      vehicleId = '',
      vehiclePlate = '',
      isPublished = true,
      notes = ''
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Schedule title is required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    let parsedDate;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      parsedDate = new Date(`${date}T07:00:00+05:30`);
    } else if (date) {
      parsedDate = new Date(date);
    } else {
      parsedDate = new Date(Date.now() + 86400000);
    }

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid collection date provided.' });
    }

    const computedDayOfWeek = dayOfWeek || parsedDate.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });
    const resolvedVehiclePlate = vehiclePlate || vehicleId || '';

    const candidateData = {
      title: String(title).trim(),
      zone: ward ? `${zone} - ${ward}` : zone,
      ward: ward ? String(ward).trim() : '',
      wardId: wardId && mongoose.Types.ObjectId.isValid(wardId) ? wardId : null,
      date: parsedDate,
      dayOfWeek: computedDayOfWeek,
      timeWindow,
      startTime,
      endTime,
      categories: Array.isArray(categories) && categories.length > 0 ? categories : ['Organic'],
      driverId: driverId && mongoose.Types.ObjectId.isValid(driverId) ? driverId : null,
      driverName: driverName ? String(driverName).trim() : '',
      vehicleObjectId: vehicleObjectId && mongoose.Types.ObjectId.isValid(vehicleObjectId) ? vehicleObjectId : null,
      vehicleId: resolvedVehiclePlate,
      vehiclePlate: resolvedVehiclePlate,
      status: 'Upcoming',
      isPublished: Boolean(isPublished),
      notes
    };

    // Detect scheduling conflicts (worker double-booking, vehicle double-booking, ward overlap)
    const conflicts = await detectScheduleConflicts(candidateData);
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: conflicts[0].message,
        conflicts
      });
    }

    const schedule = await CollectionSchedule.create(candidateData);

    await logAdminAction({
      req,
      action: 'SCHEDULE_CREATED',
      entityType: 'Schedule',
      entityId: schedule._id,
      summary: `Created collection schedule '${schedule.title}' for ${schedule.ward || schedule.zone} (${schedule.timeWindow})`,
      previousValue: null,
      updatedValue: { title: schedule.title, ward: schedule.ward, driverName: schedule.driverName, vehiclePlate: schedule.vehiclePlate }
    });

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

    const existing = await CollectionSchedule.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Schedule not found.' });

    const merged = {
      ...existing.toObject(),
      ...req.body
    };

    if (req.body.date) {
      merged.date = /^\d{4}-\d{2}-\d{2}$/.test(req.body.date)
        ? new Date(`${req.body.date}T07:00:00+05:30`)
        : new Date(req.body.date);
      if (isNaN(merged.date.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid collection date provided.' });
      }
    }

    // Only check conflicts if schedule is active (not being cancelled or marked completed)
    if (!['Cancelled', 'Completed'].includes(merged.status)) {
      const conflicts = await detectScheduleConflicts(merged, id);
      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: conflicts[0].message,
          conflicts
        });
      }
    }

    const updated = await CollectionSchedule.findByIdAndUpdate(id, merged, { new: true });

    await logAdminAction({
      req,
      action: merged.status === 'Cancelled' ? 'SCHEDULE_CANCELLED' : 'SCHEDULE_UPDATED',
      entityType: 'Schedule',
      entityId: updated._id,
      summary: `${merged.status === 'Cancelled' ? 'Cancelled' : 'Updated'} schedule '${updated.title}'`,
      previousValue: { status: existing.status, timeWindow: existing.timeWindow, driverName: existing.driverName },
      updatedValue: { status: updated.status, timeWindow: updated.timeWindow, driverName: updated.driverName }
    });

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

    await logAdminAction({
      req,
      action: 'SCHEDULE_DELETED',
      entityType: 'Schedule',
      entityId: deleted._id,
      summary: `Deleted collection schedule '${deleted.title}'`,
      previousValue: { title: deleted.title, zone: deleted.zone },
      updatedValue: null
    });

    return res.json({ success: true, message: 'Schedule deleted successfully from database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
