import User from '../models/User.js';
import WasteReport from '../models/WasteReport.js';
import AuditLog from '../models/AuditLog.js';
import SystemSettings from '../models/SystemSettings.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';

// ==========================================================
// MODULE 18: USER MANAGEMENT (Admin Only)
// ==========================================================

export const getAllUsersAdmin = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { search, role, status, page, limit } = req.query;
    const andConditions = [];

    if (role && role !== 'All') {
      andConditions.push({ role });
    }
    if (status === 'Active') {
      andConditions.push({ isActive: { $ne: false } });
    } else if (status === 'Deactivated') {
      andConditions.push({ isActive: false });
    }
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { 'address.locality': { $regex: search, $options: 'i' } }
        ]
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};
    // Strictly exclude password hashes from ever being returned
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();

    const totalCount = users.length;
    if (page && limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Math.min(200, Number(limit) || 25));
      const startIndex = (pageNum - 1) * limitNum;
      return res.json({
        success: true,
        count: users.slice(startIndex, startIndex + limitNum).length,
        totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        users: users.slice(startIndex, startIndex + limitNum)
      });
    }

    return res.json({ success: true, count: totalCount, totalCount, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserDetailsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const pickupHistory = await WasteReport.find({
      $or: [
        { userId: user._id },
        { 'citizen.userId': user._id },
        { 'citizen.email': user.email }
      ]
    }).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      user,
      pickupHistory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatusOrRoleAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, role, phone, assignedWard } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Prevent an administrator from deactivating or demoting their own currently logged-in account
    if (req.user?.id && String(user._id) === String(req.user.id)) {
      if (isActive === false || (role && role !== 'admin')) {
        return res.status(400).json({
          success: false,
          message: 'Safety restriction: You cannot deactivate or demote your own active administrator account.'
        });
      }
    }

    const prevState = { isActive: user.isActive, role: user.role };
    const updateFields = {};

    if (isActive !== undefined) {
      updateFields.isActive = Boolean(isActive);
      if (!isActive && user.role === 'driver') {
        updateFields.operationalStatus = 'Inactive';
      }
    }

    if (role !== undefined) {
      if (!['citizen', 'driver', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role. Allowed: citizen, driver, admin.' });
      }
      updateFields.role = role;
    }

    if (phone !== undefined) updateFields.phone = String(phone).trim();
    if (assignedWard !== undefined) updateFields.assignedWard = String(assignedWard).trim();

    const updated = await User.findByIdAndUpdate(user._id, { $set: updateFields }, { new: true }).select('-password');

    await logAdminAction({
      req,
      action: isActive === false ? 'USER_DEACTIVATED' : (isActive === true && prevState.isActive === false ? 'USER_REACTIVATED' : 'USER_UPDATED'),
      entityType: 'User',
      entityId: updated.email,
      summary: `${isActive === false ? 'Deactivated' : 'Updated'} user account ${updated.name} (${updated.email}, role: ${updated.role})`,
      previousValue: prevState,
      updatedValue: { isActive: updated.isActive, role: updated.role }
    });

    return res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================================
// MODULE 19: ADMINISTRATIVE AUDIT LOGS (Append-Only)
// ==========================================================

export const getAuditLogs = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { admin, action, entityType, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const andConditions = [];

    if (admin && admin !== 'All') {
      andConditions.push({
        $or: [
          { adminName: { $regex: admin, $options: 'i' } },
          { adminEmail: { $regex: admin, $options: 'i' } }
        ]
      });
    }
    if (action && action !== 'All') {
      andConditions.push({ action: { $regex: action, $options: 'i' } });
    }
    if (entityType && entityType !== 'All') {
      andConditions.push({ entityType });
    }
    if (dateFrom || dateTo) {
      const timeFilter = {};
      if (dateFrom) timeFilter.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        timeFilter.$lte = end;
      }
      andConditions.push({ timestamp: timeFilter });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(200, Number(limit) || 50));

    const [totalCount, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ]);

    return res.json({
      success: true,
      count: logs.length,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectAuditLogMutation = (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Forbidden: Administrative audit logs are append-only and cannot be modified or deleted.'
  });
};

// ==========================================================
// MODULE 20: SYSTEM SETTINGS (Admin Only, No Secrets Exposed)
// ==========================================================

const DEFAULT_WASTE_CATEGORIES = [
  { name: 'Plastic', unitDefault: 'bags', ecoPointsPerUnit: 20, estimatedKgPerBag: 4.0, estimatedKgPerItem: 1.5, isHazardous: false, active: true },
  { name: 'Organic', unitDefault: 'kg', ecoPointsPerUnit: 10, estimatedKgPerBag: 5.0, estimatedKgPerItem: 1.0, isHazardous: false, active: true },
  { name: 'Electronic', unitDefault: 'items', ecoPointsPerUnit: 40, estimatedKgPerBag: 6.0, estimatedKgPerItem: 2.0, isHazardous: true, active: true },
  { name: 'Medical', unitDefault: 'bags', ecoPointsPerUnit: 10, estimatedKgPerBag: 3.0, estimatedKgPerItem: 1.0, isHazardous: true, active: true },
  { name: 'Recyclable', unitDefault: 'bags', ecoPointsPerUnit: 15, estimatedKgPerBag: 4.0, estimatedKgPerItem: 1.5, isHazardous: false, active: true },
  { name: 'Metal', unitDefault: 'kg', ecoPointsPerUnit: 25, estimatedKgPerBag: 6.0, estimatedKgPerItem: 2.5, isHazardous: false, active: true },
  { name: 'Glass', unitDefault: 'bags', ecoPointsPerUnit: 15, estimatedKgPerBag: 5.0, estimatedKgPerItem: 1.5, isHazardous: false, active: true }
];

const DEFAULT_TIME_WINDOWS = [
  { label: 'Morning Curbside (06:30 AM - 09:30 AM IST)', startTime: '06:30', endTime: '09:30', active: true },
  { label: 'Mid-Morning Round (09:30 AM - 12:30 PM IST)', startTime: '09:30', endTime: '12:30', active: true },
  { label: 'Afternoon Collection (02:00 PM - 05:00 PM IST)', startTime: '14:00', endTime: '17:00', active: true }
];

export const getSystemSettings = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    let settings = await SystemSettings.findOne({ settingKey: 'global_municipal_settings' });
    if (!settings) {
      settings = await SystemSettings.create({
        settingKey: 'global_municipal_settings',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        country: 'India',
        countryCallingCode: '+91',
        postalTerminology: 'PIN code',
        timezone: 'Asia/Kolkata',
        wasteCategories: DEFAULT_WASTE_CATEGORIES,
        collectionTimeWindows: DEFAULT_TIME_WINDOWS
      });
    }

    return res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const existing = await SystemSettings.findOne({ settingKey: 'global_municipal_settings' });

    const allowedFields = [
      'city',
      'state',
      'country',
      'countryCallingCode',
      'postalTerminology',
      'timezone',
      'wasteCategories',
      'collectionTimeWindows',
      'vehicleCapacityDefaults',
      'routeOptimizationSettings',
      'cleanlinessHeatmapThresholds',
      'wardPerformanceWeights',
      'complaintPriorityThresholds',
      'notificationPreferences'
    ];

    const updatePayload = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updatePayload[key] = req.body[key];
      }
    }
    updatePayload.updatedAt = new Date();
    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      updatePayload.updatedBy = req.user.id;
    }

    const settings = await SystemSettings.findOneAndUpdate(
      { settingKey: 'global_municipal_settings' },
      { $set: updatePayload },
      { new: true, upsert: true }
    );

    await logAdminAction({
      req,
      action: 'SETTINGS_UPDATED',
      entityType: 'SystemSettings',
      entityId: 'global_municipal_settings',
      summary: `Updated municipal system configuration (${Object.keys(updatePayload).filter(k => k !== 'updatedAt' && k !== 'updatedBy').join(', ')})`,
      previousValue: existing ? { city: existing.city, timezone: existing.timezone } : null,
      updatedValue: { updatedKeys: Object.keys(updatePayload) }
    });

    return res.json({ success: true, settings, message: 'System settings saved successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
