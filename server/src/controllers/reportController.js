import WasteReport from '../models/WasteReport.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const VALID_CATEGORIES = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];
const VALID_STATUSES = ['Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Cancelled'];

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
      aiClassification = {},
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
    let citizenPhone = '+91 98765 43210';

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const userDoc = await User.findById(userId);
      if (userDoc) {
        citizenName = userDoc.name;
        citizenEmail = userDoc.email;
        citizenPhone = userDoc.phone || citizenPhone;
      }
    }

    const trackingId = 'WW-' + Math.floor(10000 + Math.random() * 90000);

    const coordinates = {
      lat: Number(lat) || 11.0055,
      lng: Number(lng) || 76.9661
    };

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
      quantity: Number(quantity) || 1,
      unit,
      location: {
        address,
        landmark,
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
        date: new Date(Date.now() + 86400000),
        dayName: preferredDay,
        timeSlot: preferredSlot
      },
      status: 'Reported',
      assignedDriver: {
        name: 'Awaiting Driver Assignment',
        phone: '',
        driverIdCode: '',
        vehiclePlate: '',
        currentLocation: coordinates,
        distanceKm: 0,
        etaMinutes: 0
      },
      notes,
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

    // Award eco-points to citizen profile in database
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      await User.findByIdAndUpdate(userId, {
        $inc: { ecoPoints: ecoPointsEarned, co2SavedKg: estimatedCO2Grams / 1000 }
      });
    }

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
    if (quantity !== undefined) updateFields.quantity = Number(quantity);
    if (unit !== undefined) updateFields.unit = unit;
    if (notes !== undefined) updateFields.notes = notes;

    if (address !== undefined || landmark !== undefined || lat !== undefined || lng !== undefined) {
      updateFields.location = {
        address: address || existingReport.location.address,
        landmark: landmark !== undefined ? landmark : existingReport.location.landmark,
        coordinates: {
          lat: lat !== undefined ? Number(lat) : existingReport.location.coordinates.lat,
          lng: lng !== undefined ? Number(lng) : existingReport.location.coordinates.lng
        }
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

    const timelineEntry = {
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status} by ${req.user?.name || req.user?.role || 'staff'}`
    };

    const updated = await WasteReport.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }] },
      {
        $set: { status },
        $push: { timeline: timelineEntry }
      },
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
