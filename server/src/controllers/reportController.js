import WasteReport from '../models/WasteReport.js';
import User from '../models/User.js';
import CollectionVehicle from '../models/CollectionVehicle.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';
import {
  VALID_STATUS_TRANSITIONS,
  isValidStatusTransition,
  isReportOverdue,
  estimateReportWeightKg,
  getVehicleCapacityInKg
} from '../utils/wasteMetrics.js';

const VALID_CATEGORIES = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];
const VALID_STATUSES = ['Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Rejected', 'Cancelled'];

const CATEGORY_ECO_POINTS = {
  Plastic: 20,
  Recyclable: 15,
  Glass: 15,
  Metal: 25,
  Electronic: 40,
  Organic: 10,
  Medical: 10
};

/**
 * CREATE: Submit a new waste pickup request
 * Requires authentication. Uses the authenticated user's actual profile details.
 */
export const createReport = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      quantity,
      unit = 'bags',
      address,
      landmark = '',
      locality = '',
      ward = '',
      lat,
      lng,
      imageUrl = '',
      preferredDate,
      preferredDay = 'Tomorrow',
      preferredSlot = '07:00 AM - 09:00 AM',
      priority,
      specialHandling = false,
      specialHandlingNotes = '',
      notes = ''
    } = req.body;

    if (!category || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide waste category and pickup address.'
      });
    }

    const matchedCategory = VALID_CATEGORIES.find(c => c.toLowerCase() === category.toLowerCase());
    if (!matchedCategory) {
      return res.status(400).json({
        success: false,
        message: `Invalid waste category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection offline. Please check MongoDB Atlas connection.'
      });
    }

    // Retrieve citizen identity from authenticated token
    const userId = req.user?.id;
    let citizenName = req.user?.name || 'Citizen User';
    let citizenEmail = req.user?.email || '';
    let citizenPhone = '';
    let resolvedLocality = locality;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const userDoc = await User.findById(userId);
      if (userDoc) {
        citizenName = userDoc.name;
        citizenEmail = userDoc.email;
        citizenPhone = userDoc.phone || '';
        if (!resolvedLocality && userDoc.address?.locality) {
          resolvedLocality = userDoc.address.locality;
        }
      }
    }

    const trackingId = 'WW-' + Math.floor(10000 + Math.random() * 90000);

    // Only assign coordinates when resident explicitly provides genuine GPS coordinates
    const hasValidCoords = (lat !== undefined && lat !== null && lat !== '' && !isNaN(Number(lat))) &&
                           (lng !== undefined && lng !== null && lng !== '' && !isNaN(Number(lng)));
    const coordinates = hasValidCoords
      ? { lat: Number(lat), lng: Number(lng) }
      : undefined;

    // Parse preferred slot date using Asia/Kolkata semantics
    let slotDate;
    if (preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      slotDate = new Date(`${preferredDate}T00:00:00+05:30`);
    } else if (preferredDate) {
      slotDate = new Date(preferredDate);
    } else {
      slotDate = new Date(Date.now() + 86400000);
    }

    // Validate quantity strictly: must be a positive finite number between 1 and 100
    const numQuantity = Number(quantity);
    if (quantity === undefined || quantity === null || isNaN(numQuantity) || numQuantity <= 0 || !Number.isFinite(numQuantity)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive quantity greater than 0.'
      });
    }
    if (numQuantity > 100) {
      return res.status(400).json({
        success: false,
        message: 'Quantity exceeds maximum allowable collection limit (100 units).'
      });
    }

    const isHazardousCategory = ['Electronic', 'Medical'].includes(matchedCategory);
    const computedPriority = priority || (isHazardousCategory ? 'Hazardous' : (specialHandling ? 'High' : 'Normal'));

    const newReportData = {
      trackingId,
      citizen: {
        userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : undefined,
        name: citizenName,
        email: citizenEmail,
        phone: citizenPhone
      },
      category: matchedCategory,
      subCategory: subCategory || `${matchedCategory} segregated recyclable item`,
      quantity: numQuantity,
      unit,
      ward: ward ? String(ward).trim() : '',
      locality: resolvedLocality ? String(resolvedLocality).trim() : '',
      priority: computedPriority,
      specialHandling: Boolean(specialHandling || isHazardousCategory),
      specialHandlingNotes: specialHandlingNotes || '',
      location: {
        address,
        landmark,
        locality: resolvedLocality ? String(resolvedLocality).trim() : '',
        ward: ward ? String(ward).trim() : '',
        coordinates
      },
      imageUrl,
      aiClassification: {
        detectedCategory: '',
        confidence: 0,
        estimatedCO2Grams: 0,
        ecoPointsEarned: 0
      },
      preferredSlot: {
        date: slotDate,
        dayName: preferredDay,
        timeSlot: preferredSlot
      },
      status: 'Reported',
      assignedDriver: {
        name: 'Awaiting Driver Assignment',
        phone: '',
        driverIdCode: '',
        vehiclePlate: '',
        currentLocation: undefined,
        distanceKm: 0,
        etaMinutes: 0
      },
      notes,
      pointsAwarded: false,
      timeline: [
        {
          status: 'Reported',
          timestamp: new Date(),
          note: `Pickup report filed by ${citizenName}`
        }
      ],
      createdAt: new Date()
    };

    const created = await WasteReport.create(newReportData);
    return res.status(201).json({ success: true, report: created });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * READ: Get waste reports with server-side filtering and optional pagination
 * Data ownership enforced:
 * - Admin: can view all reports with full filters
 * - Driver: limited to reports assigned to their user ID or vehicle/name
 * - Citizen: strictly limited to their own reports
 */
export const getAllReports = async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      ward,
      locality,
      workerId,
      priority,
      dateFrom,
      dateTo,
      overdueOnly,
      unassignedOnly,
      hazardousOnly,
      citizenId,
      page,
      limit
    } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please sign in to view pickup reports.' });
    }

    const andConditions = [];

    // Apply data-ownership constraints
    if (req.user.role === 'citizen') {
      andConditions.push({
        $or: [
          { 'citizen.userId': req.user.id },
          { 'citizen.email': req.user.email }
        ]
      });
    } else if (req.user.role === 'driver') {
      // Driver sees only assignments belonging to their account ID (or matching name for legacy seeded records)
      const driverOr = [{ 'assignedDriver.driverId': req.user.id }];
      if (req.user.name) {
        driverOr.push({ 'assignedDriver.name': req.user.name });
      }
      andConditions.push({ $or: driverOr });
    }

    if (category && category !== 'All') {
      andConditions.push({ category });
    }
    if (status && status !== 'All') {
      andConditions.push({ status });
    }
    if (ward && ward !== 'All') {
      andConditions.push({
        $or: [
          { ward: { $regex: ward, $options: 'i' } },
          { 'location.ward': { $regex: ward, $options: 'i' } },
          { 'location.address': { $regex: ward, $options: 'i' } }
        ]
      });
    }
    if (locality && locality !== 'All') {
      andConditions.push({
        $or: [
          { locality: { $regex: locality, $options: 'i' } },
          { 'location.locality': { $regex: locality, $options: 'i' } },
          { 'location.address': { $regex: locality, $options: 'i' } }
        ]
      });
    }
    if (workerId && workerId !== 'All') {
      if (mongoose.Types.ObjectId.isValid(workerId)) {
        andConditions.push({ 'assignedDriver.driverId': workerId });
      } else {
        andConditions.push({ 'assignedDriver.name': { $regex: workerId, $options: 'i' } });
      }
    }
    if (priority && priority !== 'All') {
      andConditions.push({ priority });
    }
    if (citizenId && req.user.role === 'admin') {
      if (mongoose.Types.ObjectId.isValid(citizenId)) {
        andConditions.push({ 'citizen.userId': citizenId });
      } else {
        andConditions.push({ 'citizen.email': citizenId });
      }
    }
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      andConditions.push({ createdAt: dateFilter });
    }
    if (unassignedOnly === 'true') {
      andConditions.push({
        status: { $in: ['Reported', 'Confirmed'] },
        $or: [
          { 'assignedDriver.driverId': { $exists: false } },
          { 'assignedDriver.driverId': null },
          { 'assignedDriver.name': 'Awaiting Driver Assignment' }
        ]
      });
    }
    if (hazardousOnly === 'true') {
      andConditions.push({
        $or: [
          { category: { $in: ['Electronic', 'Medical'] } },
          { priority: 'Hazardous' },
          { specialHandling: true }
        ]
      });
    }
    if (search) {
      const searchConditions = [
        { trackingId: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { ward: { $regex: search, $options: 'i' } },
        { locality: { $regex: search, $options: 'i' } }
      ];
      if (req.user.role === 'admin') {
        searchConditions.push({ 'citizen.name': { $regex: search, $options: 'i' } });
        searchConditions.push({ 'citizen.phone': { $regex: search, $options: 'i' } });
      }
      andConditions.push({ $or: searchConditions });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    let reports = await WasteReport.find(query).sort({ createdAt: -1 }).lean();

    // Enrich with computed overdue flag & estimated weight
    const now = new Date();
    reports = reports.map(r => {
      const overdue = isReportOverdue(r, now);
      const weightEst = estimateReportWeightKg(r.quantity, r.unit);
      return {
        ...r,
        isOverdue: overdue,
        estimatedWeightKg: weightEst.weightKg,
        isWeightEstimated: weightEst.isEstimated
      };
    });

    if (overdueOnly === 'true') {
      reports = reports.filter(r => r.isOverdue);
    }

    const totalCount = reports.length;

    if (page && limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Math.min(200, Number(limit) || 25));
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedReports = reports.slice(startIndex, startIndex + limitNum);
      return res.json({
        success: true,
        count: paginatedReports.length,
        totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        reports: paginatedReports
      });
    }

    return res.json({ success: true, count: totalCount, totalCount, reports });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * READ SINGLE: Get report by ID with data-ownership verification and resident history
 */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const report = await WasteReport.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }]
    }).lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Pickup report not found.' });
    }

    // Citizen authorization check
    if (req.user?.role === 'citizen') {
      const isOwner = (report.citizen?.userId && report.citizen.userId.toString() === req.user.id) ||
                      (report.citizen?.email && report.citizen.email.toLowerCase() === req.user.email.toLowerCase());
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied: You do not own this report.' });
      }
    }

    // Driver authorization check
    if (req.user?.role === 'driver') {
      const isAssigned = (report.assignedDriver?.driverId && report.assignedDriver.driverId.toString() === req.user.id) ||
                         (report.assignedDriver?.name && report.assignedDriver.name === req.user.name);
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'Access denied: This pickup is not assigned to you.' });
      }
    }

    // If admin, include previous requests from the same resident
    let residentPreviousRequests = [];
    if (req.user?.role === 'admin' && (report.citizen?.userId || report.citizen?.email)) {
      const residentOr = [];
      if (report.citizen.userId) residentOr.push({ 'citizen.userId': report.citizen.userId });
      if (report.citizen.email) residentOr.push({ 'citizen.email': report.citizen.email });
      residentPreviousRequests = await WasteReport.find({
        _id: { $ne: report._id },
        $or: residentOr
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('trackingId category quantity unit status createdAt ward location.address')
        .lean();
    }

    return res.json({
      success: true,
      report: {
        ...report,
        isOverdue: isReportOverdue(report),
        estimatedWeightKg: estimateReportWeightKg(report.quantity, report.unit).weightKg
      },
      residentPreviousRequests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE (Full CRUD Edit): Update editable report attributes
 * Restricted to Admin or Report Owner.
 */
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category,
      subCategory,
      quantity,
      unit,
      address,
      landmark,
      locality,
      ward,
      lat,
      lng,
      preferredDate,
      preferredDay,
      preferredSlot,
      priority,
      specialHandling,
      specialHandlingNotes,
      notes
    } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const existingReport = await WasteReport.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }]
    });

    if (!existingReport) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Role check: Only admin or the citizen owner can edit details
    if (req.user?.role === 'citizen') {
      const isOwner = (existingReport.citizen?.userId && existingReport.citizen.userId.toString() === req.user.id) ||
                      (existingReport.citizen?.email && existingReport.citizen.email.toLowerCase() === req.user.email.toLowerCase());
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied: You cannot edit another user\'s report.' });
      }
    } else if (req.user?.role === 'driver') {
      return res.status(403).json({ success: false, message: 'Drivers cannot edit pickup request metadata.' });
    }

    const updateFields = {};
    if (category) {
      const matched = VALID_CATEGORIES.find(c => c.toLowerCase() === category.toLowerCase());
      if (!matched) {
        return res.status(400).json({ success: false, message: `Invalid category. Allowed: ${VALID_CATEGORIES.join(', ')}` });
      }
      updateFields.category = matched;
    }
    if (subCategory !== undefined) updateFields.subCategory = subCategory;
    if (quantity !== undefined) {
      const numQty = Number(quantity);
      if (isNaN(numQty) || numQty <= 0 || !Number.isFinite(numQty)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid positive quantity greater than 0.' });
      }
      if (numQty > 100) {
        return res.status(400).json({ success: false, message: 'Quantity exceeds maximum allowable collection limit (100 units).' });
      }
      updateFields.quantity = numQty;
    }
    if (unit !== undefined) updateFields.unit = unit;
    if (notes !== undefined) updateFields.notes = notes;
    if (ward !== undefined) updateFields.ward = String(ward).trim();
    if (locality !== undefined) updateFields.locality = String(locality).trim();
    if (priority !== undefined && req.user?.role === 'admin') updateFields.priority = priority;
    if (specialHandling !== undefined) updateFields.specialHandling = Boolean(specialHandling);
    if (specialHandlingNotes !== undefined) updateFields.specialHandlingNotes = specialHandlingNotes;

    if (address !== undefined || landmark !== undefined || locality !== undefined || ward !== undefined || lat !== undefined || lng !== undefined) {
      const existingCoords = existingReport.location?.coordinates;
      let newCoords = undefined;
      if (lat !== undefined && lng !== undefined && lat !== null && lng !== null && lat !== '' && lng !== '') {
        newCoords = { lat: Number(lat), lng: Number(lng) };
      } else if (existingCoords && existingCoords.lat !== undefined && existingCoords.lng !== undefined) {
        newCoords = {
          lat: lat !== undefined && lat !== null && lat !== '' ? Number(lat) : existingCoords.lat,
          lng: lng !== undefined && lng !== null && lng !== '' ? Number(lng) : existingCoords.lng
        };
      }

      updateFields.location = {
        address: address || existingReport.location?.address,
        landmark: landmark !== undefined ? landmark : (existingReport.location?.landmark || ''),
        locality: locality !== undefined ? locality : (existingReport.location?.locality || existingReport.locality || ''),
        ward: ward !== undefined ? ward : (existingReport.location?.ward || existingReport.ward || ''),
        coordinates: newCoords
      };
    }

    if (preferredDate !== undefined || preferredDay !== undefined || preferredSlot !== undefined) {
      let parsedDate = existingReport.preferredSlot?.date || new Date();
      if (preferredDate) {
        parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
          ? new Date(`${preferredDate}T00:00:00+05:30`)
          : new Date(preferredDate);
      }
      updateFields.preferredSlot = {
        date: parsedDate,
        dayName: preferredDay || existingReport.preferredSlot?.dayName || 'Scheduled',
        timeSlot: preferredSlot || existingReport.preferredSlot?.timeSlot || '07:00 AM - 09:00 AM'
      };
    }

    const updated = await WasteReport.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }] },
      { $set: updateFields },
      { new: true }
    );

    if (req.user?.role === 'admin') {
      await logAdminAction({
        req,
        action: 'REPORT_UPDATED',
        entityType: 'PickupRequest',
        entityId: updated.trackingId || updated._id,
        summary: `Updated pickup request ${updated.trackingId} details`,
        previousValue: { category: existingReport.category, quantity: existingReport.quantity, ward: existingReport.ward },
        updatedValue: updateFields
      });
    }

    return res.json({ success: true, report: updated, message: 'Report updated successfully.' });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE STATUS: Transition report through explicit collection lifecycle
 * Enforces valid backend status transitions:
 * Reported -> Confirmed -> Assigned -> In Progress -> Collected -> Recycled (plus Rejected / Cancelled)
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, rejectionReason } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const report = await WasteReport.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }]
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Citizen can only set status to 'Cancelled' on their own report when not yet collected
    if (req.user?.role === 'citizen') {
      const isOwner = (report.citizen?.userId && report.citizen.userId.toString() === req.user.id) ||
                      (report.citizen?.email && report.citizen.email.toLowerCase() === req.user.email.toLowerCase());
      if (!isOwner || status !== 'Cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Citizens can only cancel their own pickup requests.'
        });
      }
      if (['Collected', 'Recycled'].includes(report.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel a pickup request that has already been collected.'
        });
      }
    }

    // Driver can only update their own assigned requests to In Progress or Collected
    if (req.user?.role === 'driver') {
      const isAssigned = (report.assignedDriver?.driverId && report.assignedDriver.driverId.toString() === req.user.id) ||
                         (report.assignedDriver?.name && report.assignedDriver.name === req.user.name);
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Drivers can only update status for their own assigned pickup requests.'
        });
      }
      if (!['In Progress', 'Collected'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Drivers may only transition requests to In Progress or Collected.'
        });
      }
    }

    // Validate lifecycle transition strictly
    const currentStatus = report.status || 'Reported';
    if (!isValidStatusTransition(currentStatus, status)) {
      const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${status}'. Allowed transitions from '${currentStatus}': ${allowedNext.length > 0 ? allowedNext.join(', ') : 'None (terminal state)'}.`
      });
    }

    if (status === 'Rejected') {
      const reason = (rejectionReason || note || '').trim();
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'A rejection reason is required when rejecting a pickup request.'
        });
      }
    }

    // Eco-points award on verified collection/recycling: only award points once per report
    let pointsAwardedNow = false;
    let awardedPoints = 0;

    if (['Collected', 'Recycled'].includes(status) && !report.pointsAwarded) {
      const verifiedQty = Math.max(1, Math.min(Number(report.quantity) || 1, 100));
      awardedPoints = (CATEGORY_ECO_POINTS[report.category] || 15) * verifiedQty;

      if (report.citizen?.userId && mongoose.Types.ObjectId.isValid(report.citizen.userId)) {
        await User.findByIdAndUpdate(report.citizen.userId, {
          $inc: { ecoPoints: awardedPoints }
        });
      }
      pointsAwardedNow = true;
    }

    const noteSuffix = pointsAwardedNow ? ` (${awardedPoints} eco-points awarded to resident)` : '';
    const effectiveNote = status === 'Rejected'
      ? `Rejected: ${(rejectionReason || note).trim()}`
      : (note || `Status updated from ${currentStatus} to ${status} by ${req.user?.name || req.user?.role || 'staff'}`) + noteSuffix;

    const timelineEntry = {
      status,
      timestamp: new Date(),
      note: effectiveNote
    };

    const setFields = {
      status,
      ...(status === 'Rejected' ? { rejectionReason: (rejectionReason || note || '').trim() } : {}),
      ...(['Collected', 'Recycled'].includes(status) && !report.completedAt ? { completedAt: new Date() } : {}),
      ...(pointsAwardedNow ? {
        pointsAwarded: true,
        pointsAwardedAt: new Date(),
        'aiClassification.ecoPointsEarned': awardedPoints
      } : {})
    };

    const updated = await WasteReport.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }] },
      {
        $set: setFields,
        $push: { timeline: timelineEntry }
      },
      { new: true }
    );

    if (req.user?.role === 'admin') {
      await logAdminAction({
        req,
        action: 'STATUS_CHANGE',
        entityType: 'PickupRequest',
        entityId: updated.trackingId || updated._id,
        summary: `Changed pickup ${updated.trackingId} status from ${currentStatus} to ${status}`,
        previousValue: { status: currentStatus },
        updatedValue: { status, note: effectiveNote }
      });
    }

    return res.json({ success: true, report: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ASSIGN DRIVER & VEHICLE: Assign collection worker and fleet vehicle to a pickup request
 * Restricted to Admin. Validates worker account and vehicle availability/capacity.
 */
export const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId, driverId, driverName, phone, vehicleId, vehiclePlate, etaMinutes, distanceKm, note } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const report = await WasteReport.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }]
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (['Collected', 'Recycled', 'Cancelled', 'Rejected'].includes(report.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign worker to a request with terminal status '${report.status}'.`
      });
    }

    const targetWorkerId = workerId || driverId;
    let workerDoc = null;
    if (targetWorkerId && mongoose.Types.ObjectId.isValid(targetWorkerId)) {
      workerDoc = await User.findById(targetWorkerId);
      if (!workerDoc || workerDoc.role !== 'driver') {
        return res.status(400).json({
          success: false,
          message: 'Selected user is not a valid registered collection worker (driver role required).'
        });
      }
      if (workerDoc.isActive === false || ['On Leave', 'Inactive'].includes(workerDoc.operationalStatus)) {
        return res.status(400).json({
          success: false,
          message: `Worker '${workerDoc.name}' is currently ${workerDoc.isActive === false ? 'deactivated' : workerDoc.operationalStatus} and cannot be assigned.`
        });
      }
    }

    let vehicleDoc = null;
    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
      vehicleDoc = await CollectionVehicle.findById(vehicleId);
      if (!vehicleDoc) {
        return res.status(404).json({ success: false, message: 'Selected vehicle not found.' });
      }
      if (!vehicleDoc.isActive || ['Under Maintenance', 'Out of Service', 'Deactivated'].includes(vehicleDoc.operationalStatus)) {
        return res.status(400).json({
          success: false,
          message: `Vehicle '${vehicleDoc.registrationNumber}' is currently '${vehicleDoc.operationalStatus}' and unavailable for assignment.`
        });
      }

      // Check capacity against report weight
      const reportWeight = estimateReportWeightKg(report.quantity, report.unit).weightKg;
      const capKg = getVehicleCapacityInKg(vehicleDoc);
      if ((vehicleDoc.currentAssignedLoadKg || 0) + reportWeight > capKg) {
        return res.status(400).json({
          success: false,
          message: `Vehicle capacity exceeded: '${vehicleDoc.registrationNumber}' has ${capKg - (vehicleDoc.currentAssignedLoadKg || 0)} kg remaining capacity, but pickup requires est. ${reportWeight} kg.`
        });
      }
    }

    const resolvedName = workerDoc?.name || driverName;
    if (!resolvedName) {
      return res.status(400).json({ success: false, message: 'Please specify a valid collection worker to assign.' });
    }

    const resolvedPlate = vehicleDoc?.registrationNumber || vehiclePlate || workerDoc?.assignedVehiclePlate || '';
    const resolvedPhone = workerDoc?.phone || phone || '';
    const resolvedCode = workerDoc?.employeeId || 'CBE-DRV';

    const driverData = {
      driverId: workerDoc?._id || (targetWorkerId && mongoose.Types.ObjectId.isValid(targetWorkerId) ? targetWorkerId : undefined),
      name: resolvedName,
      phone: resolvedPhone,
      driverIdCode: resolvedCode,
      vehicleId: vehicleDoc?._id || null,
      vehiclePlate: resolvedPlate,
      distanceKm: distanceKm !== undefined ? Number(distanceKm) : undefined,
      etaMinutes: etaMinutes !== undefined ? Number(etaMinutes) : undefined
    };

    const previousDriver = report.assignedDriver?.name || 'Unassigned';
    const nextStatus = ['In Progress'].includes(report.status) ? report.status : 'Assigned';

    const updated = await WasteReport.findOneAndUpdate(
      { _id: report._id },
      {
        $set: {
          assignedDriver: driverData,
          status: nextStatus
        },
        $push: {
          timeline: {
            status: nextStatus,
            timestamp: new Date(),
            note: note || `Assigned to worker ${resolvedName}${resolvedPlate ? ` (Vehicle: ${resolvedPlate})` : ''} by ${req.user?.name || 'Admin'}`
          }
        }
      },
      { new: true }
    );

    if (workerDoc) {
      await User.findByIdAndUpdate(workerDoc._id, {
        $set: { operationalStatus: 'Assigned' },
        $push: {
          assignmentHistory: {
            action: 'Pickup Assigned',
            details: `Assigned pickup ${report.trackingId} (${report.category}, ${report.quantity} ${report.unit})`,
            timestamp: new Date()
          }
        }
      });
    }

    if (vehicleDoc) {
      const reportWeight = estimateReportWeightKg(report.quantity, report.unit).weightKg;
      await CollectionVehicle.findByIdAndUpdate(vehicleDoc._id, {
        $inc: { currentAssignedLoadKg: reportWeight, assignedStopCount: 1 },
        $set: { operationalStatus: 'Assigned' }
      });
    }

    await logAdminAction({
      req,
      action: 'WORKER_ASSIGNED',
      entityType: 'PickupRequest',
      entityId: updated.trackingId || updated._id,
      summary: `Assigned pickup ${updated.trackingId} to worker ${resolvedName}${resolvedPlate ? ` with vehicle ${resolvedPlate}` : ''}`,
      previousValue: { driver: previousDriver, status: report.status },
      updatedValue: { driver: resolvedName, vehiclePlate: resolvedPlate, status: nextStatus }
    });

    return res.json({ success: true, report: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE: Remove report record from MongoDB
 * Restricted to Admin.
 */
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const deleted = await WasteReport.findOneAndDelete({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }]
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    await logAdminAction({
      req,
      action: 'REPORT_DELETED',
      entityType: 'PickupRequest',
      entityId: deleted.trackingId || deleted._id,
      summary: `Deleted pickup request ${deleted.trackingId} (${deleted.category})`,
      previousValue: { trackingId: deleted.trackingId, category: deleted.category, status: deleted.status },
      updatedValue: null
    });

    return res.json({ success: true, message: 'Report deleted successfully from database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
