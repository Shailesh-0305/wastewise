import mongoose from 'mongoose';

const wardSchema = new mongoose.Schema({
  wardNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  wardName: {
    type: String,
    required: true,
    trim: true
  },
  zone: {
    type: String,
    enum: ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone', 'Unassigned'],
    default: 'Central Zone'
  },
  localities: [
    {
      type: String,
      trim: true
    }
  ],
  collectionArea: {
    type: String,
    default: ''
  },
  boundaryAvailable: {
    type: Boolean,
    default: false
  },
  geographicBoundary: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  referenceCoordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  assignedWorkers: [
    {
      workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      shift: { type: String, default: '' }
    }
  ],
  assignedVehicles: [
    {
      vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionVehicle' },
      registrationNumber: { type: String, default: '' },
      vehicleType: { type: String, default: '' }
    }
  ],
  operationalStatus: {
    type: String,
    enum: ['Active', 'Under Review', 'Deactivated'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

wardSchema.index({ zone: 1, operationalStatus: 1 });

export default mongoose.model('Ward', wardSchema);
