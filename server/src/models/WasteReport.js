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
    phone: { type: String, default: '+1 (555) 234-5678' }
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
      lat: { type: Number, required: true, default: 42.8864 },
      lng: { type: Number, required: true, default: -78.8784 }
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
    name: { type: String, default: 'Travis Jordan' },
    phone: { type: String, default: '+1 (555) 948-2831' },
    driverIdCode: { type: String, default: 'DRV-587-254' },
    vehiclePlate: { type: String, default: 'NY-EV-7821' },
    currentLocation: {
      lat: { type: Number, default: 42.8950 },
      lng: { type: Number, default: -78.8680 }
    },
    distanceKm: { type: Number, default: 3.4 },
    etaMinutes: { type: Number, default: 8 }
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
