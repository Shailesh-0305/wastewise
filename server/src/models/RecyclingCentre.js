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
  city: {
    type: String,
    default: 'Coimbatore'
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  operatingHours: {
    type: String,
    default: '08:00 - 18:00 (IST)'
  },
  phone: {
    type: String,
    default: ''
  },
  acceptedMaterials: [
    {
      type: String,
      enum: ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass', 'Batteries', 'Paper']
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
