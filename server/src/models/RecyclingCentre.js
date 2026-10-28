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
    default: 'New York'
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  operatingHours: {
    type: String,
    default: '00:00 - 23:59 (24/7)'
  },
  phone: {
    type: String,
    default: '+1 (212) 555-0199'
  },
  acceptedMaterials: [
    {
      type: String,
      enum: ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass', 'Batteries', 'Paper']
    }
  ],
  materialSpecs: {
    type: String,
    default: 'AA, Lithium-Ion, NiMH, PET, HDPE, LDPE'
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'
  },
  rating: {
    type: Number,
    default: 4.8
  },
  distanceTimes: {
    walkMin: { type: Number, default: 20 },
    bikeMin: { type: Number, default: 10 },
    driveMin: { type: Number, default: 5 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('RecyclingCentre', recyclingCentreSchema);
