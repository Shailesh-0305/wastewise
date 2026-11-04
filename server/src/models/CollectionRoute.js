import mongoose from 'mongoose';

const routeStopSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WasteReport' },
  trackingId: { type: String, default: '' },
  citizenName: { type: String, default: '' },
  address: { type: String, default: '' },
  ward: { type: String, default: '' },
  category: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'bags' },
  estimatedWeightKg: { type: Number, default: 4 },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  hasActualCoordinates: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Skipped'],
    default: 'Pending'
  }
});

const collectionRouteSchema = new mongoose.Schema({
  routeCode: {
    type: String,
    required: true,
    unique: true,
    default: () => 'RT-CBE-' + Math.floor(1000 + Math.random() * 9000)
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  ward: {
    type: String,
    default: 'All Wards'
  },
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    default: null
  },
  assignedWorker: {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    employeeId: { type: String, default: '' }
  },
  assignedVehicle: {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionVehicle', default: null },
    registrationNumber: { type: String, default: '' },
    vehicleType: { type: String, default: '' },
    capacityKg: { type: Number, default: 1000 }
  },
  depot: {
    name: { type: String, default: 'CCMC Central Fleet Depot, Town Hall' },
    address: { type: String, default: 'Big Bazaar Street, Town Hall, Coimbatore 641001' },
    coordinates: {
      lat: { type: Number, default: 11.0018 },
      lng: { type: Number, default: 76.9628 }
    }
  },
  destinationFacility: {
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecyclingCentre', default: null },
    name: { type: String, default: 'Vellalore Integrated Solid Waste Management Facility' },
    address: { type: String, default: 'Vellalore Road, Coimbatore 641111' },
    coordinates: {
      lat: { type: Number, default: 10.9634 },
      lng: { type: Number, default: 77.0125 }
    }
  },
  stops: [routeStopSchema],
  totalStops: {
    type: Number,
    default: 0
  },
  totalEstimatedLoadKg: {
    type: Number,
    default: 0
  },
  vehicleCapacityKg: {
    type: Number,
    default: 1000
  },
  capacityUtilizationPercent: {
    type: Number,
    default: 0
  },
  straightLineDistanceKm: {
    type: Number,
    default: 0
  },
  estimatedRoadDistanceKm: {
    type: Number,
    default: 0
  },
  actualGpsTrackedDistanceKm: {
    type: Number,
    default: null
  },
  distanceCalculationMethod: {
    type: String,
    default: 'Nearest-Neighbour TSP (Straight-Line Haversine + 1.32x Urban Road Tortuosity Factor Estimate)'
  },
  estimatedDurationMin: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Approved', 'Dispatched', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Dispatched'
  },
  notes: {
    type: String,
    default: ''
  },
  cancelReason: {
    type: String,
    default: ''
  },
  dispatchedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

collectionRouteSchema.index({ status: 1, createdAt: -1 });
collectionRouteSchema.index({ 'assignedWorker.workerId': 1 });
collectionRouteSchema.index({ 'assignedVehicle.vehicleId': 1 });

export default mongoose.model('CollectionRoute', collectionRouteSchema);

