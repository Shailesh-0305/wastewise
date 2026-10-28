import WasteReport from '../models/WasteReport.js';
import User from '../models/User.js';
import { inMemoryDB } from '../store/inMemoryStore.js';
import mongoose from 'mongoose';

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
        message: 'Please provide waste category and pickup address'
      });
    }

    const trackingId = 'WW-' + Math.floor(10000 + Math.random() * 90000);
    const citizenName = req.user?.name || req.body.citizenName || 'Alex Navillera';
    const citizenPhone = req.body.citizenPhone || '+1 (555) 234-5678';
    const citizenEmail = req.user?.email || 'alex@example.com';
    const citizenId = req.user?.id || 'u1';

    const coordinates = {
      lat: Number(lat) || 40.8448 + (Math.random() - 0.5) * 0.02,
      lng: Number(lng) || -73.8648 + (Math.random() - 0.5) * 0.02
    };

    const ecoPointsEarned = aiClassification.ecoPointsEarned || (category === 'Plastic' ? 25 : category === 'Electronic' ? 50 : 20);
    const estimatedCO2Grams = aiClassification.estimatedCO2Grams || (category === 'Plastic' ? 120 : 250);

    const newReportData = {
      trackingId,
      citizen: {
        userId: citizenId,
        name: citizenName,
        email: citizenEmail,
        phone: citizenPhone
      },
      category,
      subCategory: subCategory || `${category} segregated recyclable item`,
      quantity: Number(quantity) || 1,
      unit,
      location: {
        address,
        landmark,
        coordinates
      },
      imageUrl,
      aiClassification: {
        detectedCategory: aiClassification.detectedCategory || category,
        confidence: aiClassification.confidence || 0.95,
        estimatedCO2Grams,
        ecoPointsEarned
      },
      preferredSlot: {
        date: new Date(Date.now() + 86400000),
        dayName: preferredDay,
        timeSlot: preferredSlot
      },
      status: 'Reported',
      assignedDriver: {
        name: 'Travis Jordan',
        phone: '+1 (587) 254-2365',
        driverIdCode: 'DRV-587-254-2365',
        vehiclePlate: 'NY-EV-7821',
        currentLocation: {
          lat: coordinates.lat + 0.008,
          lng: coordinates.lng - 0.005
        },
        distanceKm: 3.4,
        etaMinutes: 8
      },
      notes,
      timeline: [
        {
          status: 'Reported',
          timestamp: new Date(),
          note: 'Citizen created waste pickup request via WasteWise Platform'
        }
      ],
      createdAt: new Date()
    };

    if (mongoose.connection.readyState === 1) {
      const created = await WasteReport.create(newReportData);
      // Award eco-points to citizen if logged in
      if (citizenId && mongoose.Types.ObjectId.isValid(citizenId)) {
        await User.findByIdAndUpdate(citizenId, {
          $inc: { ecoPoints: ecoPointsEarned, co2SavedKg: estimatedCO2Grams / 1000 }
        });
      }
      return res.status(201).json({ success: true, report: created });
    } else {
      // In-Memory Mode
      const reportWithId = {
        _id: 'r_' + Date.now(),
        ...newReportData,
        preferredSlot: {
          ...newReportData.preferredSlot,
          date: newReportData.preferredSlot.date.toISOString()
        },
        timeline: [
          {
            status: 'Reported',
            timestamp: new Date().toISOString(),
            note: 'Citizen created waste pickup request via WasteWise Platform'
          }
        ],
        createdAt: new Date().toISOString()
      };
      inMemoryDB.reports.unshift(reportWithId);

      // Increment in-memory user points
      const user = inMemoryDB.users.find(u => u._id === citizenId || u.email === citizenEmail);
      if (user) {
        user.ecoPoints = (user.ecoPoints || 1000) + ecoPointsEarned;
        user.co2SavedKg = Number(((user.co2SavedKg || 0) + (estimatedCO2Grams / 1000)).toFixed(1));
      }

      return res.status(201).json({ success: true, report: reportWithId });
    }
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};

      if (category && category !== 'All') {
        query.category = category;
      }
      if (status && status !== 'All') {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { trackingId: { $regex: search, $options: 'i' } },
          { 'citizen.name': { $regex: search, $options: 'i' } },
          { 'location.address': { $regex: search, $options: 'i' } }
        ];
      }

      const reports = await WasteReport.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, count: reports.length, reports });
    } else {
      // In-Memory Mode
      let list = [...inMemoryDB.reports];

      if (category && category !== 'All') {
        list = list.filter(r => r.category.toLowerCase() === category.toLowerCase());
      }
      if (status && status !== 'All') {
        list = list.filter(r => r.status.toLowerCase() === status.toLowerCase());
      }
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(r =>
          r.trackingId.toLowerCase().includes(s) ||
          r.citizen.name.toLowerCase().includes(s) ||
          r.location.address.toLowerCase().includes(s)
        );
      }

      return res.json({ success: true, count: list.length, reports: list });
    }
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const report = await WasteReport.findOne({
        $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }]
      });

      if (!report) {
        return res.status(404).json({ success: false, message: 'Pickup report not found' });
      }
      return res.json({ success: true, report });
    } else {
      const report = inMemoryDB.reports.find(r => r._id === id || r.trackingId === id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Pickup report not found' });
      }
      return res.json({ success: true, report });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const timelineEntry = {
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    };

    if (mongoose.connection.readyState === 1) {
      const updated = await WasteReport.findOneAndUpdate(
        { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }] },
        {
          $set: { status },
          $push: { timeline: timelineEntry }
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }
      return res.json({ success: true, report: updated });
    } else {
      const report = inMemoryDB.reports.find(r => r._id === id || r.trackingId === id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      report.status = status;
      report.timeline.push({
        ...timelineEntry,
        timestamp: timelineEntry.timestamp.toISOString()
      });

      return res.json({ success: true, report });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverName, phone, vehiclePlate, etaMinutes, distanceKm } = req.body;

    const driverData = {
      name: driverName || 'Travis Jordan',
      phone: phone || '+1 (587) 254-2365',
      driverIdCode: 'DRV-587-254-2365',
      vehiclePlate: vehiclePlate || 'NY-EV-7821',
      distanceKm: Number(distanceKm) || 4.2,
      etaMinutes: Number(etaMinutes) || 10
    };

    if (mongoose.connection.readyState === 1) {
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
      return res.json({ success: true, report: updated });
    } else {
      const report = inMemoryDB.reports.find(r => r._id === id || r.trackingId === id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      report.assignedDriver = {
        ...report.assignedDriver,
        ...driverData
      };
      report.status = 'Assigned';
      report.timeline.push({
        status: 'Assigned',
        timestamp: new Date().toISOString(),
        note: `Assigned to driver ${driverData.name} (${driverData.vehiclePlate})`
      });

      return res.json({ success: true, report });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      await WasteReport.findOneAndDelete({
        $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { trackingId: id }]
      });
      return res.json({ success: true, message: 'Report deleted successfully' });
    } else {
      const index = inMemoryDB.reports.findIndex(r => r._id === id || r.trackingId === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }
      inMemoryDB.reports.splice(index, 1);
      return res.json({ success: true, message: 'Report deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
