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
    default: ''
  },
  address: {
    street: { type: String, default: '' },
    locality: { type: String, default: '' },
    city: { type: String, default: 'Coimbatore' },
    state: { type: String, default: 'Tamil Nadu' },
    zip: { type: String, default: '' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  ecoPoints: {
    type: Number,
    default: 0
  },
  co2SavedKg: {
    type: Number,
    default: 0
  },
  ecoLevel: {
    type: String,
    default: 'Eco Starter'
  },
  avatarUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  employeeId: {
    type: String,
    default: '',
    trim: true
  },
  assignedWard: {
    type: String,
    default: '',
    trim: true
  },
  assignedWardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    default: null
  },
  assignedShift: {
    type: String,
    enum: ['Morning (06:00 - 14:00)', 'Afternoon (14:00 - 22:00)', 'Night (22:00 - 06:00)', 'Flexible', ''],
    default: 'Morning (06:00 - 14:00)'
  },
  assignedVehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionVehicle',
    default: null
  },
  assignedVehiclePlate: {
    type: String,
    default: ''
  },
  operationalStatus: {
    type: String,
    enum: ['Available', 'On Duty', 'Assigned', 'Off Duty', 'On Leave', 'Inactive'],
    default: 'Available'
  },
  assignmentHistory: [
    {
      action: { type: String, required: true },
      details: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ assignedWard: 1 });

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
