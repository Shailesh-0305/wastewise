import CollectionVehicle from '../models/CollectionVehicle.js';
import User from '../models/User.js';
import WasteReport from '../models/WasteReport.js';
import CollectionRoute from '../models/CollectionRoute.js';
import SystemSettings from '../models/SystemSettings.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';
import { estimateReportWeightKg, getVehicleCapacityInKg } from '../utils/wasteMetrics.js';

/**
 * GET /api/vehicles
 * List all fleet vehicles with capacity & load monitoring metrics
 */
export const getAllVehicles = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { search, status, vehicleType, ward, includeInactive } = req.query;
    const andConditions = [];

    if (includeInactive !== 'true') {
      andConditions.push({ isActive: { $ne: false } });
    }
    if (status && status !== 'All') {
      andConditions.push({ operationalStatus: status });
    }
    if (vehicleType && vehicleType !== 'All') {
      andConditions.push({ vehicleType });
    }
    if (ward && ward !== 'All') {
      andConditions.push({ assignedWard: { $regex: ward, $options: 'i' } });
    }
    if (search) {
      andConditions.push({
        $or: [
          { registrationNumber: { $regex: search, $options: 'i' } },
          { vehicleType: { $regex: search, $options: 'i' } },
          { assignedWorkerName: { $regex: search, $options: 'i' } },
          { assignedWard: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const [vehicles, activeReports, activeRoutes, settings] = await Promise.all([
      CollectionVehicle.find(andConditions.length > 0 ? { $and: andConditions } : {}).sort({ createdAt: -1 }).lean(),
      WasteReport.find({ status: { $in: ['Assigned', 'In Progress'] } }).lean(),
      CollectionRoute.find({ status: { $in: ['Approved', 'Dispatched', 'In Progress'] } }).lean(),
      SystemSettings.findOne({ settingKey: 'global_municipal_settings' }).lean()
    ]);

    const warningPct = settings?.vehicleCapacityDefaults?.warningThresholdPercent || 85;

    const enrichedVehicles = vehicles.map(v => {
      const capKg = getVehicleCapacityInKg(v);

      // Compute assigned load from active reports matching this vehicle plate or ID
      const matchingReports = activeReports.filter(r =>
        (r.assignedDriver?.vehicleId && String(r.assignedDriver.vehicleId) === String(v._id)) ||
        (r.assignedDriver?.vehiclePlate && r.assignedDriver.vehiclePlate.toUpperCase() === v.registrationNumber.toUpperCase())
      );

      let calculatedLoadKg = 0;
      let hasEstimatedUnits = false;
      matchingReports.forEach(r => {
        const est = estimateReportWeightKg(r.quantity, r.unit, settings);
        calculatedLoadKg += est.weightKg;
        if (est.isEstimated) hasEstimatedUnits = true;
      });

      const activeRoute = activeRoutes.find(rt =>
        (rt.assignedVehicle?.vehicleId && String(rt.assignedVehicle.vehicleId) === String(v._id)) ||
        (rt.assignedVehicle?.registrationNumber && rt.assignedVehicle.registrationNumber.toUpperCase() === v.registrationNumber.toUpperCase())
      );

      const effectiveLoadKg = Math.round(Math.max(calculatedLoadKg, v.currentAssignedLoadKg || 0) * 10) / 10;
      const effectiveStops = Math.max(matchingReports.length, v.assignedStopCount || 0);
      const remainingCapacityKg = Math.max(0, Math.round((capKg - effectiveLoadKg) * 10) / 10);
      const utilizationPercent = capKg > 0 ? Math.round((effectiveLoadKg / capKg) * 100 * 10) / 10 : 0;

      return {
        ...v,
        capacityInKg: capKg,
        currentAssignedLoadKg: effectiveLoadKg,
        remainingCapacityKg,
        assignedStopCount: effectiveStops,
        utilizationPercent,
        isNearCapacity: utilizationPercent >= warningPct && utilizationPercent <= 100,
        isOverCapacity: utilizationPercent > 100,
        isLoadEstimated: true,
        loadEstimationNote: hasEstimatedUnits
          ? 'Assigned load includes estimated weights converted from bag/item counts (1 bag = 4.0 kg, 1 item = 1.5 kg).'
          : 'Assigned load calculated from assigned pickup records (not live physical axle scale sensor data).',
        activeRouteCode: activeRoute ? activeRoute.routeCode : null
      };
    });

    return res.json({
      success: true,
      count: enrichedVehicles.length,
      conversionAssumptions: {
        bagWeightKg: settings?.vehicleCapacityDefaults?.bagWeightKgEstimate || 4.0,
        itemWeightKg: settings?.vehicleCapacityDefaults?.itemWeightKgEstimate || 1.5,
        warningThresholdPercent: warningPct,
        notice: 'Capacity monitoring uses documented unit conversion assumptions for bag/item reports. Real-time physical load telemetry requires on-vehicle weighbridge hardware.'
      },
      vehicles: enrichedVehicles
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/vehicles
 * Register a new municipal collection vehicle
 */
export const createVehicle = async (req, res) => {
  try {
    const {
      registrationNumber,
      vehicleType = 'Mini Tipper',
      vehicleCategory = 'Light Commercial',
      carryingCapacity,
      capacityValue,
      capacityUnit = 'kg',
      assignedWorkerId = null,
      assignedWorkerName = '',
      assignedWard = '',
      operationalStatus = 'Available',
      lastMaintenanceDate = null,
      nextMaintenanceDate = null,
      notes = ''
    } = req.body;

    if (!registrationNumber || !String(registrationNumber).trim()) {
      return res.status(400).json({ success: false, message: 'Vehicle registration number is required (e.g., TN-38-BZ-4921).' });
    }

    const numCap = Number(carryingCapacity ?? capacityValue ?? 1000);
    if (isNaN(numCap) || numCap <= 0) {
      return res.status(400).json({ success: false, message: 'Carrying capacity must be a positive number.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const cleanPlate = String(registrationNumber).trim().toUpperCase();
    const existing = await CollectionVehicle.findOne({ registrationNumber: cleanPlate });
    if (existing) {
      return res.status(400).json({ success: false, message: `A vehicle with registration number '${cleanPlate}' is already registered.` });
    }

    let resolvedWorkerId = null;
    let resolvedWorkerName = assignedWorkerName ? String(assignedWorkerName).trim() : '';

    if (assignedWorkerId && mongoose.Types.ObjectId.isValid(assignedWorkerId)) {
      if (['Under Maintenance', 'Out of Service', 'Deactivated'].includes(operationalStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign a worker to a vehicle with status '${operationalStatus}'.`
        });
      }
      const worker = await User.findById(assignedWorkerId);
      if (!worker || worker.role !== 'driver' || worker.isActive === false) {
        return res.status(400).json({ success: false, message: 'Selected worker is invalid or inactive.' });
      }
      if (worker.assignedVehicleId) {
        return res.status(409).json({
          success: false,
          message: `Worker '${worker.name}' is already assigned to vehicle '${worker.assignedVehiclePlate}'.`
        });
      }
      resolvedWorkerId = worker._id;
      resolvedWorkerName = worker.name;
    }

    const effectiveStatus = resolvedWorkerId && operationalStatus === 'Available' ? 'Assigned' : operationalStatus;

    const vehicle = await CollectionVehicle.create({
      registrationNumber: cleanPlate,
      vehicleType,
      vehicleCategory,
      carryingCapacity: numCap,
      capacityUnit,
      assignedWorkerId: resolvedWorkerId,
      assignedWorkerName: resolvedWorkerName,
      assignedWard: assignedWard ? String(assignedWard).trim() : '',
      operationalStatus: effectiveStatus,
      isActive: effectiveStatus !== 'Deactivated',
      lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
      notes
    });

    if (resolvedWorkerId) {
      await User.findByIdAndUpdate(resolvedWorkerId, {
        $set: {
          assignedVehicleId: vehicle._id,
          assignedVehiclePlate: vehicle.registrationNumber,
          operationalStatus: 'Assigned'
        }
      });
    }

    await logAdminAction({
      req,
      action: 'VEHICLE_CREATED',
      entityType: 'Vehicle',
      entityId: vehicle.registrationNumber,
      summary: `Registered vehicle ${vehicle.registrationNumber} (${vehicle.vehicleType}, ${vehicle.carryingCapacity} ${vehicle.capacityUnit})`,
      previousValue: null,
      updatedValue: { registrationNumber: vehicle.registrationNumber, vehicleType: vehicle.vehicleType, operationalStatus: vehicle.operationalStatus }
    });

    return res.status(201).json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/vehicles/:id
 * Update vehicle details, status, worker assignment, or maintenance records
 */
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      registrationNumber,
      vehicleType,
      vehicleCategory,
      carryingCapacity,
      capacityUnit,
      assignedWorkerId,
      assignedWorkerName,
      assignedWard,
      operationalStatus,
      isActive,
      lastMaintenanceDate,
      nextMaintenanceDate,
      newMaintenanceRecord,
      notes
    } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const vehicle = await CollectionVehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const prevState = {
      operationalStatus: vehicle.operationalStatus,
      assignedWorkerName: vehicle.assignedWorkerName,
      carryingCapacity: vehicle.carryingCapacity
    };

    const targetStatus = operationalStatus || vehicle.operationalStatus;

    // Prevent assigning a worker to an unavailable vehicle
    if (assignedWorkerId && ['Under Maintenance', 'Out of Service', 'Deactivated'].includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign a worker to vehicle '${vehicle.registrationNumber}' while status is '${targetStatus}'.`
      });
    }

    const updateFields = {};
    if (registrationNumber !== undefined && String(registrationNumber).trim()) {
      updateFields.registrationNumber = String(registrationNumber).trim().toUpperCase();
    }
    if (vehicleType !== undefined) updateFields.vehicleType = vehicleType;
    if (vehicleCategory !== undefined) updateFields.vehicleCategory = vehicleCategory;
    if (carryingCapacity !== undefined) {
      const numCap = Number(carryingCapacity);
      if (isNaN(numCap) || numCap <= 0) {
        return res.status(400).json({ success: false, message: 'Carrying capacity must be a positive number.' });
      }
      updateFields.carryingCapacity = numCap;
    }
    if (capacityUnit !== undefined) updateFields.capacityUnit = capacityUnit;
    if (assignedWard !== undefined) updateFields.assignedWard = String(assignedWard).trim();
    if (operationalStatus !== undefined) updateFields.operationalStatus = operationalStatus;
    if (lastMaintenanceDate !== undefined) updateFields.lastMaintenanceDate = lastMaintenanceDate ? new Date(lastMaintenanceDate) : null;
    if (nextMaintenanceDate !== undefined) updateFields.nextMaintenanceDate = nextMaintenanceDate ? new Date(nextMaintenanceDate) : null;
    if (notes !== undefined) updateFields.notes = notes;

    if (assignedWorkerId !== undefined) {
      if (assignedWorkerId && mongoose.Types.ObjectId.isValid(assignedWorkerId)) {
        const worker = await User.findById(assignedWorkerId);
        if (!worker || worker.role !== 'driver' || worker.isActive === false) {
          return res.status(400).json({ success: false, message: 'Selected worker is invalid or deactivated.' });
        }
        // Prevent conflicting simultaneous assignment
        if (worker.assignedVehicleId && String(worker.assignedVehicleId) !== String(vehicle._id)) {
          return res.status(409).json({
            success: false,
            message: `Worker '${worker.name}' is already assigned to vehicle '${worker.assignedVehiclePlate}'.`
          });
        }
        updateFields.assignedWorkerId = worker._id;
        updateFields.assignedWorkerName = worker.name;
        if (targetStatus === 'Available') updateFields.operationalStatus = 'Assigned';

        await User.findByIdAndUpdate(worker._id, {
          $set: {
            assignedVehicleId: vehicle._id,
            assignedVehiclePlate: updateFields.registrationNumber || vehicle.registrationNumber,
            operationalStatus: 'Assigned'
          }
        });
      } else {
        if (vehicle.assignedWorkerId) {
          await User.findByIdAndUpdate(vehicle.assignedWorkerId, {
            $set: { assignedVehicleId: null, assignedVehiclePlate: '' }
          });
        }
        updateFields.assignedWorkerId = null;
        updateFields.assignedWorkerName = assignedWorkerName || '';
      }
    } else if (assignedWorkerName !== undefined) {
      updateFields.assignedWorkerName = assignedWorkerName;
    }

    if (isActive === false || operationalStatus === 'Deactivated') {
      updateFields.isActive = false;
      updateFields.operationalStatus = 'Deactivated';
      updateFields.assignedWorkerId = null;
      updateFields.assignedWorkerName = '';
    } else if (isActive === true && !vehicle.isActive) {
      updateFields.isActive = true;
      if (!operationalStatus) updateFields.operationalStatus = 'Available';
    }

    const updateDoc = { $set: updateFields };
    if (newMaintenanceRecord && newMaintenanceRecord.description) {
      updateDoc.$push = {
        maintenanceRecords: {
          date: newMaintenanceRecord.date ? new Date(newMaintenanceRecord.date) : new Date(),
          type: newMaintenanceRecord.type || 'Maintenance Service',
          description: newMaintenanceRecord.description,
          technician: newMaintenanceRecord.technician || '',
          status: newMaintenanceRecord.status || 'Completed'
        }
      };
      updateFields.lastMaintenanceDate = new Date();
    }

    const updated = await CollectionVehicle.findByIdAndUpdate(vehicle._id, updateDoc, { new: true });

    await logAdminAction({
      req,
      action: updateFields.isActive === false ? 'VEHICLE_DEACTIVATED' : 'VEHICLE_UPDATED',
      entityType: 'Vehicle',
      entityId: updated.registrationNumber,
      summary: `Updated vehicle ${updated.registrationNumber} (${updated.operationalStatus})`,
      previousValue: prevState,
      updatedValue: { operationalStatus: updated.operationalStatus, assignedWorkerName: updated.assignedWorkerName }
    });

    return res.json({ success: true, vehicle: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
