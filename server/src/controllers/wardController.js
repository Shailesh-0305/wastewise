import Ward from '../models/Ward.js';
import WasteReport from '../models/WasteReport.js';
import Complaint from '../models/Complaint.js';
import CollectionSchedule from '../models/CollectionSchedule.js';
import User from '../models/User.js';
import CollectionVehicle from '../models/CollectionVehicle.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';
import { estimateReportWeightKg, isReportOverdue } from '../utils/wasteMetrics.js';

const matchesWard = (record, wardDoc) => {
  const num = (wardDoc.wardNumber || '').toLowerCase();
  const name = (wardDoc.wardName || '').toLowerCase();
  const recWard = (record.ward || record.location?.ward || record.zone || '').toLowerCase();
  const recAddr = (record.location?.address || record.address || '').toLowerCase();

  if (num && (recWard.includes(num) || recAddr.includes(num))) return true;
  if (name && (recWard.includes(name) || recAddr.includes(name))) return true;
  if (Array.isArray(wardDoc.localities)) {
    for (const loc of wardDoc.localities) {
      if (loc && (recWard.includes(loc.toLowerCase()) || recAddr.includes(loc.toLowerCase()))) {
        return true;
      }
    }
  }
  return false;
};

/**
 * GET /api/wards
 * List all registered Coimbatore wards with live aggregated statistics
 */
export const getAllWards = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { search, zone, status, includeInactive } = req.query;
    const andConditions = [];

    if (includeInactive !== 'true') {
      andConditions.push({ isActive: { $ne: false } });
    }
    if (zone && zone !== 'All') {
      andConditions.push({ zone });
    }
    if (status && status !== 'All') {
      andConditions.push({ operationalStatus: status });
    }
    if (search) {
      andConditions.push({
        $or: [
          { wardNumber: { $regex: search, $options: 'i' } },
          { wardName: { $regex: search, $options: 'i' } },
          { zone: { $regex: search, $options: 'i' } },
          { localities: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const [wards, reports, complaints, workers, vehicles] = await Promise.all([
      Ward.find(andConditions.length > 0 ? { $and: andConditions } : {}).sort({ wardNumber: 1 }).lean(),
      WasteReport.find().lean(),
      Complaint.find().lean(),
      User.find({ role: 'driver', isActive: { $ne: false } }).select('-password').lean(),
      CollectionVehicle.find({ isActive: { $ne: false } }).lean()
    ]);

    const now = new Date();

    const enrichedWards = wards.map(w => {
      const wardReports = reports.filter(r => matchesWard(r, w));
      const wardComplaints = complaints.filter(c => matchesWard(c, w));
      const wardWorkers = workers.filter(u => matchesWard({ ward: u.assignedWard }, w));
      const wardVehicles = vehicles.filter(v => matchesWard({ ward: v.assignedWard }, w));

      let totalWasteKg = 0;
      let collectedWasteKg = 0;
      wardReports.forEach(r => {
        const est = estimateReportWeightKg(r.quantity, r.unit).weightKg;
        totalWasteKg += est;
        if (['Collected', 'Recycled'].includes(r.status)) collectedWasteKg += est;
      });

      const completedCount = wardReports.filter(r => ['Collected', 'Recycled'].includes(r.status)).length;
      const pendingCount = wardReports.filter(r => ['Reported', 'Confirmed', 'Assigned', 'In Progress'].includes(r.status)).length;
      const overdueCount = wardReports.filter(r => isReportOverdue(r, now)).length;
      const unresolvedComplaints = wardComplaints.filter(c => !['Resolved', 'Rejected'].includes(c.status)).length;

      return {
        ...w,
        boundaryNotice: w.boundaryAvailable ? 'Verified Boundary Polygon Available' : 'Official Municipal Polygon Boundary Unavailable (Manual Record)',
        stats: {
          totalRequests: wardReports.length,
          completedRequests: completedCount,
          pendingRequests: pendingCount,
          overdueRequests: overdueCount,
          completionRate: wardReports.length > 0 ? Math.round((completedCount / wardReports.length) * 100) : null,
          totalWasteKg: Math.round(totalWasteKg * 10) / 10,
          collectedWasteKg: Math.round(collectedWasteKg * 10) / 10,
          totalComplaints: wardComplaints.length,
          unresolvedComplaints,
          assignedWorkersCount: Math.max((w.assignedWorkers || []).length, wardWorkers.length),
          assignedVehiclesCount: Math.max((w.assignedVehicles || []).length, wardVehicles.length)
        }
      };
    });

    return res.json({ success: true, count: enrichedWards.length, wards: enrichedWards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/wards/:id
 * Detailed ward overview: pickup summary, schedules, workers, vehicles, complaints, category distribution, performance
 */
export const getWardById = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const ward = await Ward.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
        { wardNumber: id }
      ]
    }).lean();

    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found.' });
    }

    const [reports, complaints, schedules, workers, vehicles] = await Promise.all([
      WasteReport.find().sort({ createdAt: -1 }).lean(),
      Complaint.find().sort({ createdAt: -1 }).lean(),
      CollectionSchedule.find().sort({ date: 1 }).lean(),
      User.find({ role: 'driver', isActive: { $ne: false } }).select('-password').lean(),
      CollectionVehicle.find({ isActive: { $ne: false } }).lean()
    ]);

    const wardReports = reports.filter(r => matchesWard(r, ward));
    const wardComplaints = complaints.filter(c => matchesWard(c, ward));
    const wardSchedules = schedules.filter(s => matchesWard(s, ward));
    const wardWorkers = workers.filter(u => matchesWard({ ward: u.assignedWard }, ward));
    const wardVehicles = vehicles.filter(v => matchesWard({ ward: v.assignedWard }, ward));

    const categoryBreakdown = {};
    ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'].forEach(cat => {
      categoryBreakdown[cat] = { count: 0, weightKg: 0 };
    });

    let totalWasteKg = 0;
    let collectedWasteKg = 0;

    wardReports.forEach(r => {
      const w = estimateReportWeightKg(r.quantity, r.unit).weightKg;
      totalWasteKg += w;
      if (['Collected', 'Recycled'].includes(r.status)) collectedWasteKg += w;
      if (categoryBreakdown[r.category]) {
        categoryBreakdown[r.category].count++;
        categoryBreakdown[r.category].weightKg = Math.round((categoryBreakdown[r.category].weightKg + w) * 10) / 10;
      }
    });

    const completedCount = wardReports.filter(r => ['Collected', 'Recycled'].includes(r.status)).length;
    const pendingCount = wardReports.filter(r => ['Reported', 'Confirmed', 'Assigned', 'In Progress'].includes(r.status)).length;
    const overdueCount = wardReports.filter(r => isReportOverdue(r)).length;

    return res.json({
      success: true,
      ward: {
        ...ward,
        boundaryNotice: ward.boundaryAvailable ? 'Verified Boundary Polygon Available' : 'Official Municipal Polygon Boundary Unavailable (Manual Record)',
        pickupSummary: {
          total: wardReports.length,
          completed: completedCount,
          pending: pendingCount,
          overdue: overdueCount,
          totalWasteKg: Math.round(totalWasteKg * 10) / 10,
          collectedWasteKg: Math.round(collectedWasteKg * 10) / 10,
          completionRate: wardReports.length > 0 ? Math.round((completedCount / wardReports.length) * 100) : null
        },
        categoryDistribution: Object.entries(categoryBreakdown).map(([category, data]) => ({
          category,
          ...data
        })),
        pickupRequests: wardReports,
        complaints: wardComplaints,
        schedules: wardSchedules,
        workers: wardWorkers,
        vehicles: wardVehicles
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/wards
 * Create a new Coimbatore municipal ward record
 */
export const createWard = async (req, res) => {
  try {
    const {
      wardNumber,
      wardName,
      zone = 'Central Zone',
      localities = [],
      collectionArea = '',
      referenceLat,
      referenceLng,
      operationalStatus = 'Active',
      notes = ''
    } = req.body;

    if (!wardNumber || !String(wardNumber).trim() || !wardName || !String(wardName).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Both Ward Number/Identifier and Ward Name are required.'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const cleanNum = String(wardNumber).trim();
    const existing = await Ward.findOne({ wardNumber: cleanNum });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Ward '${cleanNum}' already exists.`
      });
    }

    const parsedLocalities = Array.isArray(localities)
      ? localities.map(l => String(l).trim()).filter(Boolean)
      : String(localities || '').split(',').map(l => l.trim()).filter(Boolean);

    const hasRefCoords = referenceLat !== undefined && referenceLat !== '' && !isNaN(Number(referenceLat)) &&
                         referenceLng !== undefined && referenceLng !== '' && !isNaN(Number(referenceLng));

    const ward = await Ward.create({
      wardNumber: cleanNum,
      wardName: String(wardName).trim(),
      zone,
      localities: parsedLocalities,
      collectionArea: collectionArea ? String(collectionArea).trim() : '',
      boundaryAvailable: false, // Official geographic boundary polygons are never fabricated
      geographicBoundary: null,
      referenceCoordinates: hasRefCoords ? { lat: Number(referenceLat), lng: Number(referenceLng) } : undefined,
      operationalStatus,
      isActive: operationalStatus !== 'Deactivated',
      notes
    });

    await logAdminAction({
      req,
      action: 'WARD_CREATED',
      entityType: 'Ward',
      entityId: ward.wardNumber,
      summary: `Created municipal ward ${ward.wardNumber} (${ward.wardName}) in ${ward.zone}`,
      previousValue: null,
      updatedValue: { wardNumber: ward.wardNumber, wardName: ward.wardName, zone: ward.zone }
    });

    return res.status(201).json({ success: true, ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/wards/:id
 * Update ward details, localities, worker/vehicle assignments, or operational status
 */
export const updateWard = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      wardNumber,
      wardName,
      zone,
      localities,
      collectionArea,
      referenceLat,
      referenceLng,
      assignedWorkerIds,
      assignedVehicleIds,
      operationalStatus,
      isActive,
      notes
    } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const existing = await Ward.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ward not found.' });
    }

    const updateFields = {};
    if (wardNumber !== undefined && String(wardNumber).trim()) updateFields.wardNumber = String(wardNumber).trim();
    if (wardName !== undefined && String(wardName).trim()) updateFields.wardName = String(wardName).trim();
    if (zone !== undefined) updateFields.zone = zone;
    if (collectionArea !== undefined) updateFields.collectionArea = String(collectionArea).trim();
    if (notes !== undefined) updateFields.notes = notes;

    if (localities !== undefined) {
      updateFields.localities = Array.isArray(localities)
        ? localities.map(l => String(l).trim()).filter(Boolean)
        : String(localities).split(',').map(l => l.trim()).filter(Boolean);
    }

    if (referenceLat !== undefined && referenceLng !== undefined && referenceLat !== '' && referenceLng !== '') {
      updateFields.referenceCoordinates = { lat: Number(referenceLat), lng: Number(referenceLng) };
    }

    if (Array.isArray(assignedWorkerIds)) {
      const validIds = assignedWorkerIds.filter(wId => mongoose.Types.ObjectId.isValid(wId));
      const workerDocs = await User.find({ _id: { $in: validIds }, role: 'driver' });
      updateFields.assignedWorkers = workerDocs.map(w => ({
        workerId: w._id,
        name: w.name,
        phone: w.phone,
        shift: w.assignedShift
      }));
      const wardLabel = `${updateFields.wardNumber || existing.wardNumber} (${updateFields.wardName || existing.wardName})`;
      await User.updateMany({ _id: { $in: validIds } }, { $set: { assignedWard: wardLabel, assignedWardId: existing._id } });
    }

    if (Array.isArray(assignedVehicleIds)) {
      const validIds = assignedVehicleIds.filter(vId => mongoose.Types.ObjectId.isValid(vId));
      const vehicleDocs = await CollectionVehicle.find({ _id: { $in: validIds } });
      updateFields.assignedVehicles = vehicleDocs.map(v => ({
        vehicleId: v._id,
        registrationNumber: v.registrationNumber,
        vehicleType: v.vehicleType
      }));
      const wardLabel = `${updateFields.wardNumber || existing.wardNumber} (${updateFields.wardName || existing.wardName})`;
      await CollectionVehicle.updateMany({ _id: { $in: validIds } }, { $set: { assignedWard: wardLabel, assignedWardId: existing._id } });
    }

    if (operationalStatus !== undefined) {
      updateFields.operationalStatus = operationalStatus;
      updateFields.isActive = operationalStatus !== 'Deactivated';
    }
    if (isActive === false) {
      updateFields.isActive = false;
      updateFields.operationalStatus = 'Deactivated';
    }

    const updated = await Ward.findByIdAndUpdate(existing._id, { $set: updateFields }, { new: true });

    await logAdminAction({
      req,
      action: updateFields.isActive === false ? 'WARD_DEACTIVATED' : 'WARD_UPDATED',
      entityType: 'Ward',
      entityId: updated.wardNumber,
      summary: `Updated ward ${updated.wardNumber} (${updated.wardName})`,
      previousValue: { wardName: existing.wardName, operationalStatus: existing.operationalStatus },
      updatedValue: { wardName: updated.wardName, operationalStatus: updated.operationalStatus }
    });

    return res.json({ success: true, ward: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
