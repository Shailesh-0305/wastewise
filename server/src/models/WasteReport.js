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
    coordinates: {
      lat: { type: Number, required: true, default: 11.0055 },
      lng: { type: Number, required: true, default: 76.9661 }
    }
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
    enum: ['Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Cancelled'],
    default: 'Reported'
  },
  assignedDriver: {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'Awaiting Driver Assignment' },
    phone: { type: String, default: '+91 94431 82910' },
    driverIdCode: { type: String, default: 'CBE-DRV-101' },
    vehiclePlate: { type: String, default: 'TN-38-BZ-4921' },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number }
    },
    isLiveStreaming: { type: Boolean, default: false },
    lastLocationUpdate: { type: Date },
    distanceKm: { type: Number },
    etaMinutes: { type: Number }
  },
  notes: {
    type: String,
    default: ''
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

export default mongoose.model('WasteReport', wasteReportSchema);
