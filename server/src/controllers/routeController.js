import WasteReport from '../models/WasteReport.js';
import RecyclingCentre from '../models/RecyclingCentre.js';
import CollectionRoute from '../models/CollectionRoute.js';
import CollectionVehicle from '../models/CollectionVehicle.js';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';
import { estimateReportWeightKg, getVehicleCapacityInKg } from '../utils/wasteMetrics.js';

// Haversine distance in km (straight-line great-circle distance)
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DEFAULT_DEPOT = {
  name: 'Coimbatore Municipal Corporation Central Operations',
  type: 'depot',
  address: 'Town Hall, Big Bazaar Street, Coimbatore, Tamil Nadu 641001',
  coordinates: { lat: 11.0018, lng: 76.9628 }
};

const DEFAULT_DROPOFF = {
  name: 'Vellalore Integrated Solid Waste Management Facility',
  type: 'dropoff',
  address: 'Vellalore Road, Coimbatore, Tamil Nadu 641111',
  coordinates: { lat: 10.9634, lng: 77.0125 }
};

/**
 * Helper to compute Nearest-Neighbour TSP sequence and metrics
 */
const computeRouteSolution = ({
  reports,
  centres,
  depot = DEFAULT_DEPOT,
  destinationFacility = null,
  vehicleCapacityKg = 1000,
  tortuosityFactor = 1.32,
  avgSpeedKmh = 22,
  stopServiceTimeMin = 5
}) => {
  const availableCentres = centres.length > 0 ? centres : [DEFAULT_DROPOFF];

  if (reports.length === 0) {
    const dropoff = destinationFacility || availableCentres[0];
    return {
      depot,
      dropoff: { ...dropoff, type: 'dropoff' },
      stops: [],
      totalStops: 0,
      gpsVerifiedStops: 0,
      addressOnlyStops: 0,
      totalEstimatedLoadKg: 0,
      vehicleCapacityKg,
      capacityUtilizationPercent: 0,
      isOverCapacity: false,
      isNearCapacity: false,
      straightLineDistanceKm: 0,
      estimatedRoadDistanceKm: 0,
      actualGpsTrackedDistanceKm: null,
      totalDistanceKm: 0,
      estimatedTimeMin: 0,
      waypoints: [depot, { ...dropoff, type: 'dropoff' }],
      routePolyline: [
        [depot.coordinates.lat, depot.coordinates.lng],
        [dropoff.coordinates.lat, dropoff.coordinates.lng]
      ],
      metadata: {
        algorithm: 'Nearest-Neighbour Heuristic (TSP Straight-Line Haversine Distance)',
        distanceType: 'straight-line (haversine) + estimated road distance (1.32x urban tortuosity factor)',
        notice: 'No pending pickup requests selected for route optimisation.'
      }
    };
  }

  let totalEstimatedLoadKg = 0;

  // Separate stops with genuine GPS coordinates from address-only stops (never fabricate coordinates)
  const gpsStops = [];
  const addressOnlyStops = [];

  reports.forEach(r => {
    const weightInfo = estimateReportWeightKg(r.quantity, r.unit);
    totalEstimatedLoadKg += weightInfo.weightKg;

    const hasCoords =
      r.location?.coordinates &&
      r.location.coordinates.lat !== undefined &&
      r.location.coordinates.lat !== null &&
      r.location.coordinates.lng !== undefined &&
      r.location.coordinates.lng !== null &&
      !isNaN(Number(r.location.coordinates.lat)) &&
      !isNaN(Number(r.location.coordinates.lng));

    const stopObj = {
      id: r._id,
      reportId: r._id,
      trackingId: r.trackingId,
      citizenName: r.citizen?.name || 'Citizen',
      address: r.location?.address || 'Pickup Point',
      ward: r.ward || r.location?.ward || '',
      category: r.category,
      quantity: r.quantity,
      unit: r.unit,
      quantityLabel: `${r.quantity} ${r.unit}`,
      estimatedWeightKg: weightInfo.weightKg,
      isWeightEstimated: weightInfo.isEstimated,
      coordinates: hasCoords
        ? { lat: Number(r.location.coordinates.lat), lng: Number(r.location.coordinates.lng) }
        : null,
      hasActualCoordinates: Boolean(hasCoords),
      type: 'pickup'
    };

    if (hasCoords) {
      gpsStops.push(stopObj);
    } else {
      addressOnlyStops.push(stopObj);
    }
  });

  totalEstimatedLoadKg = Math.round(totalEstimatedLoadKg * 10) / 10;

  // Nearest-Neighbour TSP on verified GPS stops
  const unvisited = [...gpsStops];
  const orderedGpsStops = [];
  let currentLocation = depot.coordinates;
  let straightLineDistanceKm = 0;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineDistance(
        currentLocation.lat,
        currentLocation.lng,
        unvisited[i].coordinates.lat,
        unvisited[i].coordinates.lng
      );
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }

    straightLineDistanceKm += minDistance;
    const [nextStop] = unvisited.splice(nearestIdx, 1);
    orderedGpsStops.push(nextStop);
    currentLocation = nextStop.coordinates;
  }

  // Select destination facility (either explicitly chosen or nearest to final stop)
  let bestCentre = destinationFacility;
  if (!bestCentre) {
    bestCentre = availableCentres[0];
    let minCentreDist = Infinity;
    for (const c of availableCentres) {
      if (!c.coordinates?.lat || !c.coordinates?.lng) continue;
      const d = haversineDistance(
        currentLocation.lat,
        currentLocation.lng,
        c.coordinates.lat,
        c.coordinates.lng
      );
      if (d < minCentreDist) {
        minCentreDist = d;
        bestCentre = c;
      }
    }
  }

  if (bestCentre?.coordinates?.lat && bestCentre?.coordinates?.lng) {
    straightLineDistanceKm += haversineDistance(
      currentLocation.lat,
      currentLocation.lng,
      bestCentre.coordinates.lat,
      bestCentre.coordinates.lng
    );
  }

  const allOrderedStops = [...orderedGpsStops, ...addressOnlyStops].map((s, idx) => ({
    ...s,
    order: idx + 1
  }));

  const waypoints = [
    depot,
    ...orderedGpsStops,
    { ...bestCentre, type: 'dropoff' }
  ];

  const straightKm = Number(straightLineDistanceKm.toFixed(2));
  const roadKm = Number((straightLineDistanceKm * tortuosityFactor).toFixed(2));
  const travelMinutes = Math.round((roadKm / avgSpeedKmh) * 60);
  const serviceMinutes = allOrderedStops.length * stopServiceTimeMin;
  const estimatedTimeMin = travelMinutes + serviceMinutes;

  const capacityUtilizationPercent = vehicleCapacityKg > 0
    ? Math.round((totalEstimatedLoadKg / vehicleCapacityKg) * 100 * 10) / 10
    : 0;

  return {
    depot,
    dropoff: { ...bestCentre, type: 'dropoff' },
    stops: allOrderedStops,
    totalStops: allOrderedStops.length,
    gpsVerifiedStops: orderedGpsStops.length,
    addressOnlyStops: addressOnlyStops.length,
    totalEstimatedLoadKg,
    vehicleCapacityKg,
     remainingCapacityKg: Math.max(0, Math.round((vehicleCapacityKg - totalEstimatedLoadKg) * 10) / 10),
    capacityUtilizationPercent,
    isOverCapacity: totalEstimatedLoadKg > vehicleCapacityKg,
    isNearCapacity: capacityUtilizationPercent >= 85 && totalEstimatedLoadKg <= vehicleCapacityKg,
    straightLineDistanceKm: straightKm,
    estimatedRoadDistanceKm: roadKm,
    actualGpsTrackedDistanceKm: null,
    totalDistanceKm: straightKm,
    estimatedTimeMin,
    waypoints,
    routePolyline: waypoints
      .filter(w => w.coordinates?.lat !== undefined && w.coordinates?.lng !== undefined)
      .map(w => [w.coordinates.lat, w.coordinates.lng]),
    metadata: {
      algorithm: 'Nearest-Neighbour TSP Heuristic',
      straightLineNote: 'Straight-line (Haversine) great-circle distance between GPS-verified stops.',
      estimatedRoadNote: `Estimated road distance computed using a ${tortuosityFactor}x urban road tortuosity multiplier over straight-line distance (not live turn-by-turn road navigation).`,
      actualGpsNote: 'Actual GPS-tracked travel distance is null until real-time vehicle telemetry is recorded.',
      coordinatesNotice: addressOnlyStops.length > 0
        ? `${addressOnlyStops.length} pickup stop(s) lack resident GPS coordinates and are listed as address-only stops without fabricated map pins.`
        : 'All selected pickup stops include verified GPS coordinates.'
    }
  };
};

/**
 * GET /api/routes/collection-route & POST /api/routes/optimize-preview
 * Generate / preview an optimised collection route
 */
export const getOptimizedRoute = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection offline. Please check MongoDB Atlas connection.'
      });
    }

    const params = { ...req.query, ...req.body };
    const {
      ward,
      reportIds,
      workerId,
      vehicleId,
      depotName,
      depotAddress,
      depotLat,
      depotLng,
      destinationFacilityId
    } = params;

    // Fetch active pickup requests not already completed/cancelled/rejected
    const reportQuery = {
      status: { $in: ['Reported', 'Confirmed', 'Assigned', 'In Progress'] }
    };

    if (Array.isArray(reportIds) && reportIds.length > 0) {
      const validIds = reportIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      reportQuery.$or = [
        { _id: { $in: validIds } },
        { trackingId: { $in: reportIds } }
      ];
    } else if (ward && ward !== 'All') {
      reportQuery.$or = [
        { ward: { $regex: ward, $options: 'i' } },
        { 'location.ward': { $regex: ward, $options: 'i' } },
        { 'location.address': { $regex: ward, $options: 'i' } }
      ];
    }

    const [reports, centres, settings] = await Promise.all([
      WasteReport.find(reportQuery).lean(),
      RecyclingCentre.find({ isActive: { $ne: false } }).lean(),
      SystemSettings.findOne({ settingKey: 'global_municipal_settings' }).lean()
    ]);

    let vehicleCapacityKg = settings?.vehicleCapacityDefaults?.defaultCapacityKg || 1000;
    let selectedVehicle = null;
    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
      selectedVehicle = await CollectionVehicle.findById(vehicleId).lean();
      if (selectedVehicle) {
        vehicleCapacityKg = getVehicleCapacityInKg(selectedVehicle);
      }
    }

    let selectedWorker = null;
    if (workerId && mongoose.Types.ObjectId.isValid(workerId)) {
      selectedWorker = await User.findById(workerId).select('-password').lean();
    }

    let destinationFacility = null;
    if (destinationFacilityId && mongoose.Types.ObjectId.isValid(destinationFacilityId)) {
      destinationFacility = centres.find(c => String(c._id) === String(destinationFacilityId)) || null;
    }

    const depot = {
      name: depotName || settings?.routeOptimizationSettings?.defaultDepotName || DEFAULT_DEPOT.name,
      type: 'depot',
      address: depotAddress || settings?.routeOptimizationSettings?.defaultDepotAddress || DEFAULT_DEPOT.address,
      coordinates: {
        lat: depotLat !== undefined && !isNaN(Number(depotLat)) ? Number(depotLat) : (settings?.routeOptimizationSettings?.defaultDepotCoordinates?.lat || DEFAULT_DEPOT.coordinates.lat),
        lng: depotLng !== undefined && !isNaN(Number(depotLng)) ? Number(depotLng) : (settings?.routeOptimizationSettings?.defaultDepotCoordinates?.lng || DEFAULT_DEPOT.coordinates.lng)
      }
    };

    const solution = computeRouteSolution({
      reports,
      centres,
      depot,
      destinationFacility,
      vehicleCapacityKg,
      tortuosityFactor: settings?.routeOptimizationSettings?.roadTortuosityFactor || 1.32,
      avgSpeedKmh: settings?.routeOptimizationSettings?.avgUrbanSpeedKmh || 22,
      stopServiceTimeMin: settings?.routeOptimizationSettings?.stopServiceTimeMin || 5
    });

    return res.json({
      success: true,
      ...solution,
      selectedWorker: selectedWorker ? { id: selectedWorker._id, name: selectedWorker.name, phone: selectedWorker.phone } : null,
      selectedVehicle: selectedVehicle ? { id: selectedVehicle._id, registrationNumber: selectedVehicle.registrationNumber, capacityKg: vehicleCapacityKg } : null
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/routes/dispatch
 * Approve, save, and dispatch an optimised route to a worker and vehicle
 */
export const dispatchRoute = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const {
      title,
      ward = 'All Wards',
      reportIds = [],
      workerId,
      vehicleId,
      destinationFacilityId,
      depot,
      notes = ''
    } = req.body;

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one pending pickup request to dispatch a route.'
      });
    }

    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid available collection worker for route dispatch.'
      });
    }

    if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid available collection vehicle for route dispatch.'
      });
    }

    const [worker, vehicle, settings] = await Promise.all([
      User.findById(workerId),
      CollectionVehicle.findById(vehicleId),
      SystemSettings.findOne({ settingKey: 'global_municipal_settings' }).lean()
    ]);

    if (!worker || worker.role !== 'driver' || worker.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Selected worker is invalid or deactivated.'
      });
    }

    if (['On Leave', 'Inactive'].includes(worker.operationalStatus)) {
      return res.status(400).json({
        success: false,
        message: `Worker '${worker.name}' is currently '${worker.operationalStatus}' and unavailable for dispatch.`
      });
    }

    if (!vehicle || !vehicle.isActive || ['Under Maintenance', 'Out of Service', 'Deactivated'].includes(vehicle.operationalStatus)) {
      return res.status(400).json({
        success: false,
        message: `Vehicle '${vehicle?.registrationNumber || vehicleId}' is unavailable for dispatch (${vehicle?.operationalStatus || 'Not Found'}).`
      });
    }

    // Check if vehicle is already assigned to another active route
    const conflictingVehicleRoute = await CollectionRoute.findOne({
      'assignedVehicle.vehicleId': vehicle._id,
      status: { $in: ['Approved', 'Dispatched', 'In Progress'] }
    });
    if (conflictingVehicleRoute) {
      return res.status(409).json({
        success: false,
        message: `Vehicle '${vehicle.registrationNumber}' is already assigned to active route '${conflictingVehicleRoute.routeCode}'.`
      });
    }

    // Fetch selected pickup reports
    const validObjIds = reportIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const reports = await WasteReport.find({
      $or: [
        { _id: { $in: validObjIds } },
        { trackingId: { $in: reportIds } }
      ]
    });

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'None of the selected pickup requests were found.'
      });
    }

    // Prevent assigning pickup requests that are already on an active route
    const reportObjectIds = reports.map(r => r._id);
    const conflictingRoute = await CollectionRoute.findOne({
      status: { $in: ['Approved', 'Dispatched', 'In Progress'] },
      'stops.reportId': { $in: reportObjectIds }
    });

    if (conflictingRoute) {
      return res.status(409).json({
        success: false,
        message: `One or more selected pickup requests are already assigned to active route '${conflictingRoute.routeCode}'.`
      });
    }

    const centres = await RecyclingCentre.find({ isActive: { $ne: false } }).lean();
    let destinationFacility = null;
    if (destinationFacilityId && mongoose.Types.ObjectId.isValid(destinationFacilityId)) {
      destinationFacility = centres.find(c => String(c._id) === String(destinationFacilityId)) || null;
    }

    const vehicleCapacityKg = getVehicleCapacityInKg(vehicle);
    const solution = computeRouteSolution({
      reports,
      centres,
      depot: depot || DEFAULT_DEPOT,
      destinationFacility,
      vehicleCapacityKg
    });

    // Enforce vehicle capacity limit
    const preventOverCapacity = settings?.routeOptimizationSettings?.preventOverCapacityDispatch !== false;
    if (solution.isOverCapacity && preventOverCapacity) {
      return res.status(400).json({
        success: false,
        message: `Route load (${solution.totalEstimatedLoadKg} kg est.) exceeds vehicle '${vehicle.registrationNumber}' capacity (${vehicleCapacityKg} kg). Reduce stops or select a larger vehicle.`
      });
    }

    const routeCode = 'RT-CBE-' + Math.floor(1000 + Math.random() * 9000);
    const createdRoute = await CollectionRoute.create({
      routeCode,
      title: title || `${ward} Collection Dispatch (${worker.name})`,
      ward,
      assignedWorker: {
        workerId: worker._id,
        name: worker.name,
        phone: worker.phone || '',
        employeeId: worker.employeeId || ''
      },
      assignedVehicle: {
        vehicleId: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        vehicleType: vehicle.vehicleType,
        capacityKg: vehicleCapacityKg
      },
      depot: solution.depot,
      destinationFacility: {
        facilityId: solution.dropoff._id || null,
        name: solution.dropoff.name,
        address: solution.dropoff.address,
        coordinates: solution.dropoff.coordinates
      },
      stops: solution.stops,
      totalStops: solution.totalStops,
      totalEstimatedLoadKg: solution.totalEstimatedLoadKg,
      vehicleCapacityKg,
      capacityUtilizationPercent: solution.capacityUtilizationPercent,
      straightLineDistanceKm: solution.straightLineDistanceKm,
      estimatedRoadDistanceKm: solution.estimatedRoadDistanceKm,
      actualGpsTrackedDistanceKm: null,
      estimatedDurationMin: solution.estimatedTimeMin,
      status: 'Dispatched',
      notes,
      dispatchedAt: new Date(),
      createdBy: req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : null
    });

    // Update all linked pickup requests
    for (const r of reports) {
      await WasteReport.findByIdAndUpdate(r._id, {
        $set: {
          status: 'Assigned',
          assignedRouteId: createdRoute._id,
          assignedDriver: {
            driverId: worker._id,
            name: worker.name,
            phone: worker.phone || '',
            driverIdCode: worker.employeeId || 'CBE-DRV',
            vehicleId: vehicle._id,
            vehiclePlate: vehicle.registrationNumber
          }
        },
        $push: {
          timeline: {
            status: 'Assigned',
            timestamp: new Date(),
            note: `Dispatched on Route ${routeCode} with worker ${worker.name} (${vehicle.registrationNumber})`
          }
        }
      });
    }

    // Update vehicle and worker state
    await CollectionVehicle.findByIdAndUpdate(vehicle._id, {
      $set: {
        operationalStatus: 'Assigned',
        assignedWorkerId: worker._id,
        assignedWorkerName: worker.name,
        assignedRouteId: createdRoute._id,
        currentAssignedLoadKg: solution.totalEstimatedLoadKg,
        assignedStopCount: solution.totalStops
      }
    });

    await User.findByIdAndUpdate(worker._id, {
      $set: {
        operationalStatus: 'Assigned',
        assignedVehicleId: vehicle._id,
        assignedVehiclePlate: vehicle.registrationNumber
      },
      $push: {
        assignmentHistory: {
          action: 'Route Dispatched',
          details: `Dispatched on ${routeCode} (${solution.totalStops} stops, est. ${solution.totalEstimatedLoadKg} kg)`,
          timestamp: new Date()
        }
      }
    });

    await logAdminAction({
      req,
      action: 'ROUTE_DISPATCHED',
      entityType: 'Route',
      entityId: createdRoute.routeCode,
      summary: `Dispatched route ${createdRoute.routeCode} (${solution.totalStops} stops, ${solution.totalEstimatedLoadKg} kg) to ${worker.name} (${vehicle.registrationNumber})`,
      previousValue: null,
      updatedValue: {
        routeCode: createdRoute.routeCode,
        worker: worker.name,
        vehicle: vehicle.registrationNumber,
        stops: solution.totalStops,
        loadKg: solution.totalEstimatedLoadKg
      }
    });

    return res.status(201).json({
      success: true,
      route: createdRoute,
      message: `Route ${routeCode} approved and dispatched to ${worker.name}.`
    });
  } catch (error) {
    console.error('Dispatch route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/routes
 * List all saved / dispatched collection routes
 */
export const getAllRoutes = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { status, ward, workerId, vehicleId } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (ward && ward !== 'All') query.ward = { $regex: ward, $options: 'i' };
    if (workerId && mongoose.Types.ObjectId.isValid(workerId)) {
      query['assignedWorker.workerId'] = workerId;
    }
    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
      query['assignedVehicle.vehicleId'] = vehicleId;
    }

    const routes = await CollectionRoute.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: routes.length, routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/routes/:id/status
 * Update route status (In Progress, Completed, Cancelled) or reassign
 */
export const updateRouteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason, workerId, vehicleId } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const route = await CollectionRoute.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { routeCode: id }]
    });

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    const prevStatus = route.status;
    const updateFields = {};

    if (status) {
      updateFields.status = status;
      if (status === 'Completed') {
        updateFields.completedAt = new Date();
      } else if (status === 'Cancelled') {
        updateFields.cancelledAt = new Date();
        updateFields.cancelReason = cancelReason || 'Cancelled by municipal administrator';
      }
    }

    // Handle optional reassignment of worker/vehicle
    if (workerId && mongoose.Types.ObjectId.isValid(workerId)) {
      const newWorker = await User.findById(workerId);
      if (newWorker && newWorker.role === 'driver' && newWorker.isActive !== false) {
        updateFields.assignedWorker = {
          workerId: newWorker._id,
          name: newWorker.name,
          phone: newWorker.phone || '',
          employeeId: newWorker.employeeId || ''
        };
      }
    }

    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
      const newVehicle = await CollectionVehicle.findById(vehicleId);
      if (newVehicle && newVehicle.isActive) {
        updateFields.assignedVehicle = {
          vehicleId: newVehicle._id,
          registrationNumber: newVehicle.registrationNumber,
          vehicleType: newVehicle.vehicleType,
          capacityKg: getVehicleCapacityInKg(newVehicle)
        };
      }
    }

    const updated = await CollectionRoute.findByIdAndUpdate(route._id, { $set: updateFields }, { new: true });

    // If route is Completed or Cancelled, release vehicle load and update stops
    if (['Completed', 'Cancelled'].includes(status)) {
      if (route.assignedVehicle?.vehicleId) {
        await CollectionVehicle.findByIdAndUpdate(route.assignedVehicle.vehicleId, {
          $set: {
            operationalStatus: 'Available',
            assignedRouteId: null,
            currentAssignedLoadKg: 0,
            assignedStopCount: 0
          }
        });
      }
      if (route.assignedWorker?.workerId) {
        await User.findByIdAndUpdate(route.assignedWorker.workerId, {
          $set: { operationalStatus: 'Available' }
        });
      }

      if (status === 'Cancelled') {
        const stopReportIds = (route.stops || []).map(s => s.reportId).filter(Boolean);
        await WasteReport.updateMany(
          { _id: { $in: stopReportIds }, status: 'Assigned' },
          {
            $set: {
              status: 'Confirmed',
              assignedRouteId: null,
              'assignedDriver.name': 'Awaiting Driver Assignment',
              'assignedDriver.driverId': null
            },
            $push: {
              timeline: {
                status: 'Confirmed',
                timestamp: new Date(),
                note: `Route ${route.routeCode} was cancelled (${updateFields.cancelReason}). Returned to Confirmed queue.`
              }
            }
          }
        );
      }
    }

    await logAdminAction({
      req,
      action: status === 'Cancelled' ? 'ROUTE_CANCELLED' : 'ROUTE_UPDATED',
      entityType: 'Route',
      entityId: updated.routeCode,
      summary: `Updated route ${updated.routeCode} status from ${prevStatus} to ${updated.status}`,
      previousValue: { status: prevStatus },
      updatedValue: { status: updated.status, cancelReason: updated.cancelReason }
    });

    return res.json({ success: true, route: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
