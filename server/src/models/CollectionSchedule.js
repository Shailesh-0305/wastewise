import mongoose from 'mongoose';

const collectionScheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  zone: {
    type: String,
    required: true,
    default: 'Coimbatore Central Zone'
  },
  ward: {
    type: String,
    default: '',
    trim: true
  },
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    default: null
  },
  date: {
    type: Date,
    required: true
  },
  dayOfWeek: {
    type: String,
    default: 'Monday'
  },
  timeWindow: {
    type: String,
    default: '07:00 AM - 09:00 AM (IST)'
  },
  startTime: {
    type: String,
    default: '07:00'
  },
  endTime: {
    type: String,
    default: '09:00'
  },
  categories: [
    {
      type: String,
      enum: ['Organic', 'Recycling', 'Recyclable', 'Plastic', 'Electronic', 'Medical', 'General', 'Metal', 'Glass', 'Hazardous']
    }
  ],
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  driverName: {
    type: String,
    default: ''
  },
  vehicleObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionVehicle',
    default: null
  },
  vehicleId: {
    type: String,
    default: ''
  },
  vehiclePlate: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Today', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: 'Please place segregated bins at doorstep before scheduled collection time'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('CollectionSchedule', collectionScheduleSchema);
