import User from '../models/User.js';
import WasteReport from '../models/WasteReport.js';
import CollectionVehicle from '../models/CollectionVehicle.js';
import CollectionRoute from '../models/CollectionRoute.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * GET /api/workers
 * List all collection workers (driver accounts) with current workload & assignment summary
 */
export const getAllWorkers = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { search, ward, shift, status, includeInactive } = req.query;
    const andConditions = [{ role: 'driver' }];

    if (includeInactive !== 'true') {
      andConditions.push({ isActive: { $ne: false } });
    }
    if (ward && ward !== 'All') {
      andConditions.push({ assignedWard: { $regex: ward, $options: 'i' } });
    }
    if (shift && shift !== 'All') {
      andConditions.push({ assignedShift: shift });
    }
    if (status && status !== 'All') {
      andConditions.push({ operationalStatus: status });
    }
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
          { assignedWard: { $regex: search, $options: 'i' } },
          { assignedVehiclePlate: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const [workers, reports] = await Promise.all([
      User.find({ $and: andConditions }).select('-password').sort({ createdAt: -1 }).lean(),
      WasteReport.find().lean()
    ]);

    const enrichedWorkers = workers.map(w => {
      const workerReports = reports.filter(r =>
        (r.assignedDriver?.driverId && String(r.assignedDriver.driverId) === String(w._id)) ||
        (r.assignedDriver?.name && r.assignedDriver.name.toLowerCase() === w.name.toLowerCase())
      );

      const assignedActive = workerReports.filter(r => ['Assigned', 'In Progress'].includes(r.status));
      const completedCollections = workerReports.filter(r => ['Collected', 'Recycled'].includes(r.status));

      return {
        ...w,
        currentWorkloadCount: assignedActive.length,
        completedCollectionsCount: completedCollections.length,
        totalAssignedCount: workerReports.length,
        activeRequests: assignedActive.slice(0, 5).map(r => ({
          _id: r._id,
          trackingId: r.trackingId,
          category: r.category,
          quantity: `${r.quantity} ${r.unit}`,
          status: r.status,
          address: r.location?.address
        }))
      };
    });

    return res.json({ success: true, count: enrichedWorkers.length, workers: enrichedWorkers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/workers/:id
 * Detailed worker profile, assigned requests, completed collections, and assignment history
 */
export const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const worker = await User.findOne({ _id: id, role: 'driver' }).select('-password').lean();
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Collection worker not found.' });
    }

    const [reports, routes] = await Promise.all([
      WasteReport.find({
        $or: [
          { 'assignedDriver.driverId': worker._id },
          { 'assignedDriver.name': worker.name }
        ]
      }).sort({ createdAt: -1 }).lean(),
      CollectionRoute.find({ 'assignedWorker.workerId': worker._id }).sort({ createdAt: -1 }).lean()
    ]);

    const assignedRequests = reports.filter(r => ['Assigned', 'In Progress'].includes(r.status));
    const completedCollections = reports.filter(r => ['Collected', 'Recycled'].includes(r.status));

    return res.json({
      success: true,
      worker: {
        ...worker,
        currentWorkloadCount: assignedRequests.length,
        completedCollectionsCount: completedCollections.length,
        assignedRequests,
        completedCollections,
        routes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/workers
 * Register a new collection worker (creates a driver-role account; restricted to Admin)
 */
export const createWorker = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      employeeId,
      assignedWard = '',
      assignedShift = 'Morning (06:00 - 14:00)',
      assignedVehicleId = null,
      assignedVehiclePlate = '',
      operationalStatus = 'Available',
      street = '',
      locality = ''
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Worker full name is required.' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ success: false, message: 'Worker contact phone number is required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const normalizedEmail = email
      ? String(email).toLowerCase().trim()
      : `${String(name).toLowerCase().replace(/[^a-z0-9]/g, '.')}@drivers.wastewise.org`;

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: `An account with email '${normalizedEmail}' already exists.` });
    }

    const generatedEmpId = employeeId
      ? String(employeeId).trim().toUpperCase()
      : `CBE-DRV-${Math.floor(100 + Math.random() * 900)}`;

    let resolvedPlate = assignedVehiclePlate;
    let resolvedVehicleObjId = null;

    if (assignedVehicleId && mongoose.Types.ObjectId.isValid(assignedVehicleId)) {
      const vehicle = await CollectionVehicle.findById(assignedVehicleId);
      if (vehicle) {
        if (!vehicle.isActive || ['Under Maintenance', 'Out of Service', 'Deactivated'].includes(vehicle.operationalStatus)) {
          return res.status(400).json({
            success: false,
            message: `Vehicle '${vehicle.registrationNumber}' is currently '${vehicle.operationalStatus}' and cannot be assigned.`
          });
        }
        resolvedVehicleObjId = vehicle._id;
        resolvedPlate = vehicle.registrationNumber;
      }
    }

    const newWorker = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: password && password.length >= 6 ? password : 'driverPass123!',
      role: 'driver',
      phone: String(phone).trim(),
      employeeId: generatedEmpId,
      assignedWard: assignedWard ? String(assignedWard).trim() : '',
      assignedShift,
      assignedVehicleId: resolvedVehicleObjId,
      assignedVehiclePlate: resolvedPlate,
      operationalStatus,
      isActive: true,
      address: {
        street: street || 'CCMC Sanitation Depot',
        locality: locality || assignedWard || 'Coimbatore',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641001'
      },
      ecoLevel: 'Municipal Collection Staff',
      assignmentHistory: [
        {
          action: 'Worker Registered',
          details: `Registered as municipal collection driver (${generatedEmpId})${assignedWard ? ` in ${assignedWard}` : ''}`,
          timestamp: new Date()
        }
      ]
    });

    if (resolvedVehicleObjId) {
      await CollectionVehicle.findByIdAndUpdate(resolvedVehicleObjId, {
        $set: {
          assignedWorkerId: newWorker._id,
          assignedWorkerName: newWorker.name,
          operationalStatus: 'Assigned'
        }
      });
    }

    const safeWorker = await User.findById(newWorker._id).select('-password');

    await logAdminAction({
      req,
      action: 'WORKER_CREATED',
      entityType: 'Worker',
      entityId: newWorker.employeeId || newWorker._id,
      summary: `Registered collection worker ${newWorker.name} (${generatedEmpId})`,
      previousValue: null,
      updatedValue: { name: newWorker.name, employeeId: generatedEmpId, assignedWard: newWorker.assignedWard }
    });

    return res.status(201).json({ success: true, worker: safeWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/workers/:id
 * Update worker information, ward, shift, vehicle, or active status
 */
export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      employeeId,
      assignedWard,
      assignedShift,
      assignedVehicleId,
      assignedVehiclePlate,
      operationalStatus,
      isActive
    } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const worker = await User.findOne({ _id: id, role: 'driver' });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Collection worker not found.' });
    }

    const prevState = {
      name: worker.name,
      assignedWard: worker.assignedWard,
      assignedShift: worker.assignedShift,
      assignedVehiclePlate: worker.assignedVehiclePlate,
      operationalStatus: worker.operationalStatus,
      isActive: worker.isActive
    };

    const updateFields = {};
    const historyNotes = [];

    if (name !== undefined && String(name).trim()) updateFields.name = String(name).trim();
    if (phone !== undefined) updateFields.phone = String(phone).trim();
    if (email !== undefined && String(email).trim()) updateFields.email = String(email).toLowerCase().trim();
    if (employeeId !== undefined) updateFields.employeeId = String(employeeId).trim().toUpperCase();

    if (assignedWard !== undefined && assignedWard !== worker.assignedWard) {
      updateFields.assignedWard = String(assignedWard).trim();
      historyNotes.push(`Assigned ward updated to '${updateFields.assignedWard || 'Unassigned'}'`);
    }
    if (assignedShift !== undefined && assignedShift !== worker.assignedShift) {
      updateFields.assignedShift = assignedShift;
      historyNotes.push(`Shift changed to '${assignedShift}'`);
    }

    if (assignedVehicleId !== undefined) {
      if (assignedVehicleId && mongoose.Types.ObjectId.isValid(assignedVehicleId)) {
        const vehicle = await CollectionVehicle.findById(assignedVehicleId);
        if (!vehicle) {
          return res.status(404).json({ success: false, message: 'Selected vehicle not found.' });
        }
        if (!vehicle.isActive || ['Under Maintenance', 'Out of Service', 'Deactivated'].includes(vehicle.operationalStatus)) {
          return res.status(400).json({
            success: false,
            message: `Cannot assign unavailable vehicle '${vehicle.registrationNumber}' (${vehicle.operationalStatus}).`
          });
        }
        if (vehicle.assignedWorkerId && String(vehicle.assignedWorkerId) !== String(worker._id)) {
          return res.status(409).json({
            success: false,
            message: `Vehicle '${vehicle.registrationNumber}' is already assigned to worker '${vehicle.assignedWorkerName}'.`
          });
        }

        // Release old vehicle if different
        if (worker.assignedVehicleId && String(worker.assignedVehicleId) !== String(vehicle._id)) {
          await CollectionVehicle.findByIdAndUpdate(worker.assignedVehicleId, {
            $set: { assignedWorkerId: null, assignedWorkerName: '', operationalStatus: 'Available' }
          });
        }

        updateFields.assignedVehicleId = vehicle._id;
        updateFields.assignedVehiclePlate = vehicle.registrationNumber;
        await CollectionVehicle.findByIdAndUpdate(vehicle._id, {
          $set: {
            assignedWorkerId: worker._id,
            assignedWorkerName: updateFields.name || worker.name,
            operationalStatus: 'Assigned'
          }
        });
        historyNotes.push(`Assigned vehicle '${vehicle.registrationNumber}'`);
      } else if (assignedVehicleId === null || assignedVehicleId === '') {
        if (worker.assignedVehicleId) {
          await CollectionVehicle.findByIdAndUpdate(worker.assignedVehicleId, {
            $set: { assignedWorkerId: null, assignedWorkerName: '', operationalStatus: 'Available' }
          });
        }
        updateFields.assignedVehicleId = null;
        updateFields.assignedVehiclePlate = assignedVehiclePlate || '';
      }
    } else if (assignedVehiclePlate !== undefined) {
      updateFields.assignedVehiclePlate = String(assignedVehiclePlate).trim().toUpperCase();
    }

    if (operationalStatus !== undefined) {
      updateFields.operationalStatus = operationalStatus;
    }

    if (isActive !== undefined) {
      updateFields.isActive = Boolean(isActive);
      if (!isActive) {
        updateFields.operationalStatus = 'Inactive';
        historyNotes.push('Worker account deactivated');
        if (worker.assignedVehicleId) {
          await CollectionVehicle.findByIdAndUpdate(worker.assignedVehicleId, {
            $set: { assignedWorkerId: null, assignedWorkerName: '', operationalStatus: 'Available' }
          });
          updateFields.assignedVehicleId = null;
          updateFields.assignedVehiclePlate = '';
        }
      } else if (worker.isActive === false) {
        updateFields.operationalStatus = operationalStatus || 'Available';
        historyNotes.push('Worker account reactivated');
      }
    }

    const updateQuery = { $set: updateFields };
    if (historyNotes.length > 0) {
      updateQuery.$push = {
        assignmentHistory: {
          action: 'Profile / Assignment Updated',
          details: historyNotes.join('; '),
          timestamp: new Date()
        }
      };
    }

    const updated = await User.findByIdAndUpdate(worker._id, updateQuery, { new: true }).select('-password');

    await logAdminAction({
      req,
      action: isActive === false ? 'WORKER_DEACTIVATED' : 'WORKER_UPDATED',
      entityType: 'Worker',
      entityId: updated.employeeId || updated._id,
      summary: `${isActive === false ? 'Deactivated' : 'Updated'} collection worker ${updated.name}`,
      previousValue: prevState,
      updatedValue: updateFields
    });

    return res.json({ success: true, worker: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
