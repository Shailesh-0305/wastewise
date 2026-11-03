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
    default: '+91 98765 43210'
  },
  address: {
    street: { type: String, default: '42 Cross Cut Road' },
    city: { type: String, default: 'Coimbatore' },
    state: { type: String, default: 'Tamil Nadu' },
    zip: { type: String, default: '641001' },
    coordinates: {
      lat: { type: Number, default: 11.0055 },
      lng: { type: Number, default: 76.9661 }
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
