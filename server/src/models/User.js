import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['citizen', 'driver', 'admin'],
    default: 'citizen'
  },
  phone: {
    type: String,
    default: '+1 (555) 234-5678'
  },
  address: {
    street: { type: String, default: 'Lake Star Dist. No48' },
    city: { type: String, default: 'Buffalo' },
    state: { type: String, default: 'NY' },
    zip: { type: String, default: '14201' },
    coordinates: {
      lat: { type: Number, default: 42.8864 },
      lng: { type: Number, default: -78.8784 }
    }
  },
  ecoPoints: {
    type: Number,
    default: 1250
  },
  co2SavedKg: {
    type: Number,
    default: 18.4
  },
  ecoLevel: {
    type: String,
    default: 'Level Eco Green 82'
  },
  avatarUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
