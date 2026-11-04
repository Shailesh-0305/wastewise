import mongoose from 'mongoose';

const recyclingCentreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  locality: {
    type: String,
    default: '',
    trim: true
  },
  ward: {
    type: String,
    default: '',
    trim: true
  },
  city: {
    type: String,
    default: 'Coimbatore'
  },
  centreType: {
    type: String,
    enum: [
      'General Recycling',
      'E-Waste',
      'Hazardous Waste',
      'Composting',
      'Material Recovery Facility',
      'Glass and Metal Recovery',
      'Plastic Recovery',
      'Battery Disposal',
      'Medical Waste Collection',
      'Special Recovery Facility'
    ],
    default: 'General Recycling'
  },
  facilityCategory: {
    type: String,
    enum: ['Recycling Centre', 'Disposal Facility', 'Integrated Facility'],
    default: 'Recycling Centre'
  },
  isDisposalFacility: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['Verified Municipal Facility', 'Authorised Partner', 'Pending Verification', 'Unverified'],
    default: 'Pending Verification'
  },
  operationalStatus: {
    type: String,
    enum: ['Operational', 'Maintenance', 'Full Capacity', 'Deactivated'],
    default: 'Operational'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  operatingHours: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  contactPerson: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  acceptedMaterials: [
    {
      type: String,
      enum: ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass', 'Batteries', 'Paper', 'Hazardous']
    }
  ],
  materialSpecs: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  rating: {
    type: Number
  },
  distanceTimes: {
    walkMin: { type: Number },
    bikeMin: { type: Number },
    driveMin: { type: Number }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('RecyclingCentre', recyclingCentreSchema);
