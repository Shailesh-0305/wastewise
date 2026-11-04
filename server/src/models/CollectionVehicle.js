import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, default: 'Scheduled Inspection' },
  description: { type: String, default: '' },
  technician: { type: String, default: '' },
  status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed'], default: 'Completed' }
});

const collectionVehicleSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String,
    required: true,
    enum: [
      'Compactor Truck',
      'Mini Tipper',
      'E-Cart / Battery Trike',
      'Hazardous Waste Van',
      'Roll-Off Container Truck',
      'Organic Collection Truck'
    ],
    default: 'Mini Tipper'
  },
  vehicleCategory: {
    type: String,
    enum: ['Light Commercial', 'Medium Duty', 'Heavy Duty', 'Electric Utility', 'Specialised Hazmat'],
    default: 'Light Commercial'
  },
  carryingCapacity: {
    type: Number,
    required: true,
    min: 10,
    default: 1000
  },
  capacityUnit: {
    type: String,
    enum: ['kg', 'tonnes'],
    default: 'kg'
  },
  currentAssignedLoadKg: {
    type: Number,
    default: 0,
    min: 0
  },
  assignedStopCount: {
    type: Number,
    default: 0,
    min: 0
  },
  assignedWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedWorkerName: {
    type: String,
    default: ''
  },
  assignedWard: {
    type: String,
    default: ''
  },
  assignedWardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    default: null
  },
  assignedRouteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionRoute',
    default: null
  },
  operationalStatus: {
    type: String,
    enum: ['Available', 'Assigned', 'In Service', 'Under Maintenance', 'Out of Service', 'Deactivated'],
    default: 'Available'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastMaintenanceDate: {
    type: Date,
    default: null
  },
  nextMaintenanceDate: {
    type: Date,
    default: null
  },
  maintenanceRecords: [maintenanceRecordSchema],
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

collectionVehicleSchema.index({ operationalStatus: 1, isActive: 1 });
collectionVehicleSchema.index({ assignedWard: 1 });

export default mongoose.model('CollectionVehicle', collectionVehicleSchema);

