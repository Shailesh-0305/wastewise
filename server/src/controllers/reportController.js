import WasteReport from '../models/WasteReport.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const VALID_CATEGORIES = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];
const VALID_STATUSES = ['Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Cancelled'];

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
      lat,
      lng,
      imageUrl = '',
      preferredDate,
      preferredDay = 'Tomorrow',
      preferredSlot = '07:00 AM - 09:00 AM',
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

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const userDoc = await User.findById(userId);
      if (userDoc) {
        citizenName = userDoc.name;
        citizenEmail = userDoc.email;
        citizenPhone = userDoc.phone || '';
      }
    }

    const trackingId = 'WW-' + Math.floor(10000 + Math.random() * 90000);

    // Only assign coordinates when resident explicitly provides genuine GPS coordinates
    const hasValidCoords = (lat !== undefined && lat !== null && !isNaN(Number(lat))) &&
                           (lng !== undefined && lng !== null && !isNaN(Number(lng)));
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
      location: {
        address,
        landmark,
        coordinates
      },
      imageUrl,
      // Compatibility fields: no simulated AI confidence or CO2 values; ecoPoints credited upon collection
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

    // Eco-points are deferred until verified collection/recycling
    return res.status(201).json({ success: true, report: created });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * READ: Get waste reports
 * Data ownership enforced:
 * - Admin: can view all reports with filter & search
 * - Driver: can view assigned / active collection reports
 * - Citizen: strictly limited to their own reports
 */
export const getAllReports = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    let query = {};

    // Apply data-ownership constraints
    if (req.user) {
      if (req.user.role === 'citizen') {
        query['$or'] = [
          { 'citizen.userId': req.user.id },
          { 'citizen.email': req.user.email }
        ];
      } else if (req.user.role === 'driver') {
        // Driver sees assigned or active pending collections
        query['status'] = { $in: ['Assigned', 'In Progress', 'Collected'] };
      }
    } else {
      // Unauthenticated visitor cannot browse private pickup records
      return res.status(401).json({ success: false, message: 'Please sign in to view pickup reports.' });
    }

    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      const searchConditions = [
        { trackingId: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
      if (req.user.role === 'admin') {
        searchConditions.push({ 'citizen.name': { $regex: search, $options: 'i' } });
      }

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const reports = await WasteReport.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * READ SINGLE: Get report by ID with data-ownership verification
 */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const report = await WasteReport.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }]
    });

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

    return res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE (Full CRUD Edit): Update editable report attributes
 * Separate from status updating. Restricted to Admin or Report Owner.
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
      lat,
      lng,
      preferredDay,
      preferredSlot,
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
    }

    // Validate category if provided
    let updateFields = {};
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

    if (address !== undefined || landmark !== undefined || lat !== undefined || lng !== undefined) {
      const existingCoords = existingReport.location?.coordinates;
      let newCoords = undefined;
      if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
        newCoords = { lat: Number(lat), lng: Number(lng) };
      } else if (existingCoords) {
        newCoords = {
          lat: lat !== undefined && lat !== null ? Number(lat) : existingCoords.lat,
          lng: lng !== undefined && lng !== null ? Number(lng) : existingCoords.lng
        };
      }

      updateFields.location = {
        address: address || existingReport.location?.address,
        landmark: landmark !== undefined ? landmark : (existingReport.location?.landmark || ''),
        coordinates: newCoords
      };
    }

    if (preferredDay !== undefined || preferredSlot !== undefined) {
      updateFields.preferredSlot = {
        date: existingReport.preferredSlot?.date || new Date(),
        dayName: preferredDay || existingReport.preferredSlot?.dayName,
        timeSlot: preferredSlot || existingReport.preferredSlot?.timeSlot
      };
    }

    const updated = await WasteReport.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }] },
      { $set: updateFields },
      { new: true }
    );

    return res.json({ success: true, report: updated, message: 'Report updated successfully.' });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE STATUS: Transition report through collection lifecycle
 * Restricted to Admin, Driver, or Citizen cancelling their own report.
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

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

    // Citizen can only set status to 'Cancelled' on their own report
    if (req.user?.role === 'citizen') {
      const isOwner = (report.citizen?.userId && report.citizen.userId.toString() === req.user.id) ||
                      (report.citizen?.email && report.citizen.email.toLowerCase() === req.user.email.toLowerCase());
      if (!isOwner || status !== 'Cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Citizens can only cancel their own pickup requests.'
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
    const timelineEntry = {
      status,
      timestamp: new Date(),
      note: (note || `Status updated to ${status} by ${req.user?.name || req.user?.role || 'staff'}`) + noteSuffix
    };

    const updateDoc = {
      $set: {
        status,
        ...(pointsAwardedNow ? {
          pointsAwarded: true,
          pointsAwardedAt: new Date(),
          'aiClassification.ecoPointsEarned': awardedPoints
        } : {})
      },
      $push: { timeline: timelineEntry }
    };

    const updated = await WasteReport.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }] },
      updateDoc,
      { new: true }
    );

    return res.json({ success: true, report: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ASSIGN DRIVER: Assign courier and fleet vehicle
 * Restricted to Admin.
 */
export const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverName, phone, vehiclePlate, etaMinutes, distanceKm } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const driverData = {
      name: driverName || 'Karthik Raja',
      phone: phone || '+91 94431 82910',
      driverIdCode: 'CBE-DRV-104',
      vehiclePlate: vehiclePlate || 'TN-38-BZ-4921',
      distanceKm: Number(distanceKm) || 3.5,
      etaMinutes: Number(etaMinutes) || 15
    };

    const updated = await WasteReport.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }] },
      {
        $set: {
          assignedDriver: driverData,
          status: 'Assigned'
        },
        $push: {
          timeline: {
            status: 'Assigned',
            timestamp: new Date(),
            note: `Assigned to driver ${driverData.name} (${driverData.vehiclePlate})`
          }
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

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

    return res.json({ success: true, message: 'Report deleted successfully from database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
