import mongoose from 'mongoose';

const wasteReportSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'WW-' + Math.floor(10000 + Math.random() * 90000)
  },
  citizen: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, default: '+91 98765 43210' }
  },
  category: {
    type: String,
    required: true,
    enum: ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass']
  },
  subCategory: {
    type: String,
    default: 'Mixed standard waste'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 1
  },
  unit: {
    type: String,
    enum: ['bags', 'kg', 'items'],
    default: 'bags'
  },
  location: {
    address: { type: String, required: true },
    landmark: { type: String, default: '' },
    locality: { type: String, default: '' },
    ward: { type: String, default: '' },
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', default: null },
    coordinates: {
      lat: { type: Number, required: false },
      lng: { type: Number, required: false }
    }
  },
  ward: {
    type: String,
    default: ''
  },
  locality: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['Normal', 'High', 'Urgent', 'Hazardous'],
    default: 'Normal'
  },
  specialHandling: {
    type: Boolean,
    default: false
  },
  specialHandlingNotes: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  aiClassification: {
    detectedCategory: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    estimatedCO2Grams: { type: Number, default: 0 },
    ecoPointsEarned: { type: Number, default: 0 }
  },
  preferredSlot: {
    date: { type: Date, default: () => new Date(Date.now() + 86400000) },
    dayName: { type: String, default: 'Tomorrow' },
    timeSlot: { type: String, default: '07:00 AM - 09:00 AM' }
  },
  status: {
    type: String,
    enum: ['Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Rejected', 'Cancelled'],
    default: 'Reported'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  assignedDriver: {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'Awaiting Driver Assignment' },
    phone: { type: String, default: '' },
    driverIdCode: { type: String, default: '' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollectionVehicle', default: null },
    vehiclePlate: { type: String, default: '' },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number }
    },
    isLiveStreaming: { type: Boolean, default: false },
    lastLocationUpdate: { type: Date },
    distanceKm: { type: Number },
    etaMinutes: { type: Number }
  },
  assignedRouteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionRoute',
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  pointsAwarded: {
    type: Boolean,
    default: false
  },
  pointsAwardedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  timeline: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      note: { type: String, default: '' }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

wasteReportSchema.index({ status: 1, createdAt: -1 });
wasteReportSchema.index({ ward: 1 });
wasteReportSchema.index({ category: 1 });
wasteReportSchema.index({ 'assignedDriver.driverId': 1 });
wasteReportSchema.index({ 'citizen.userId': 1 });

export default mongoose.model('WasteReport', wasteReportSchema);
