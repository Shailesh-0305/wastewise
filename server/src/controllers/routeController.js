import WasteReport from '../models/WasteReport.js';
import RecyclingCentre from '../models/RecyclingCentre.js';
import mongoose from 'mongoose';

// Haversine distance in km (straight-line great-circle distance)
function haversineDistance(lat1, lon1, lat2, lon2) {
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

export const getOptimizedRoute = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection offline. Please check MongoDB Atlas connection.'
      });
    }

    const reports = await WasteReport.find({
      status: { $in: ['Reported', 'Confirmed', 'Assigned', 'In Progress'] }
    }).lean();

    const centres = await RecyclingCentre.find().lean();

    // Driver starting depot
    const depot = {
      name: 'WasteWise Central Fleet Depot',
      type: 'depot',
      address: '100 Municipal Drive, Buffalo, NY',
      coordinates: { lat: 40.8520, lng: -73.8790 }
    };

    // Fallback recycling centre if none exists in database
    const defaultCenter = {
      name: 'Bronx Composting Station',
      type: 'dropoff',
      address: '123 Main Street, New York, NY 10001',
      coordinates: { lat: 40.8448, lng: -73.8648 }
    };

    // If no active stops exist, return a clean empty route
    if (reports.length === 0) {
      const dropoff = centres[0] || defaultCenter;
      return res.json({
        success: true,
        depot,
        dropoff,
        totalStops: 0,
        totalDistanceKm: 0,
        estimatedTimeMin: 0,
        fuelSavedPercent: 0,
        waypoints: [depot, { ...dropoff, type: 'dropoff' }],
        routePolyline: [[depot.coordinates.lat, depot.coordinates.lng], [dropoff.coordinates.lat, dropoff.coordinates.lng]],
        metadata: {
          algorithm: 'Nearest-Neighbor Heuristic (TSP Straight-Line Haversine Distance)',
          distanceType: 'straight-line (haversine)',
          notice: 'No pending or in-progress pickups requiring route assignment.'
        }
      });
    }

    // Prepare stops from active reports
    const stops = reports.map(r => ({
      id: r._id,
      trackingId: r.trackingId,
      citizenName: r.citizen?.name || 'Citizen',
      address: r.location?.address || 'Pickup Point',
      category: r.category,
      quantity: `${r.quantity} ${r.unit}`,
      coordinates: r.location?.coordinates || { lat: 40.8448, lng: -73.8648 },
      type: 'pickup'
    }));

    // --- 1. Compute Nearest-Neighbor Optimized TSP Sequence ---
    const unvisited = [...stops];
    const orderedWaypoints = [depot];
    let currentLocation = depot.coordinates;
    let optimizedDistanceKm = 0;

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

      optimizedDistanceKm += minDistance;
      const [nextStop] = unvisited.splice(nearestIdx, 1);
      orderedWaypoints.push(nextStop);
      currentLocation = nextStop.coordinates;
    }

    // Determine the actual nearest recycling centre from the final stop
    const availableCentres = centres.length > 0 ? centres : [defaultCenter];
    let bestCentre = availableCentres[0];
    let minCentreDist = Infinity;

    for (const c of availableCentres) {
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

    optimizedDistanceKm += minCentreDist;
    orderedWaypoints.push({
      ...bestCentre,
      type: 'dropoff'
    });

    // --- 2. Compute Baseline Unoptimized Route (order of creation) ---
    let baselineDistanceKm = 0;
    let baselineLoc = depot.coordinates;
    for (let i = 0; i < stops.length; i++) {
      baselineDistanceKm += haversineDistance(
        baselineLoc.lat,
        baselineLoc.lng,
        stops[i].coordinates.lat,
        stops[i].coordinates.lng
      );
      baselineLoc = stops[i].coordinates;
    }
    // Baseline legs to its closest centre
    let baselineMinCentre = Infinity;
    for (const c of availableCentres) {
      const d = haversineDistance(
        baselineLoc.lat,
        baselineLoc.lng,
        c.coordinates.lat,
        c.coordinates.lng
      );
      if (d < baselineMinCentre) baselineMinCentre = d;
    }
    baselineDistanceKm += baselineMinCentre;

    // Calculate realistic fuel & distance savings percentage
    let fuelSavedPercent = 0;
    if (baselineDistanceKm > optimizedDistanceKm && baselineDistanceKm > 0) {
      fuelSavedPercent = Math.round(((baselineDistanceKm - optimizedDistanceKm) / baselineDistanceKm) * 100 * 10) / 10;
    }

    const estimatedTimeMin = Math.round(optimizedDistanceKm * 2.8) + (stops.length * 5); // Travel time + 5 min per stop

    res.json({
      success: true,
      depot,
      dropoff: bestCentre,
      totalStops: stops.length,
      totalDistanceKm: Number(optimizedDistanceKm.toFixed(1)),
      baselineDistanceKm: Number(baselineDistanceKm.toFixed(1)),
      estimatedTimeMin,
      fuelSavedPercent,
      waypoints: orderedWaypoints,
      routePolyline: orderedWaypoints.map(w => [w.coordinates.lat, w.coordinates.lng]),
      metadata: {
        algorithm: 'Nearest-Neighbor Heuristic (TSP Straight-Line Haversine Distance)',
        distanceType: 'straight-line (haversine)',
        notice: 'Route sequence determined using straight-line Euclidean distance heuristic to approximate vehicle travel savings.'
      }
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
