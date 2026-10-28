import mongoose from 'mongoose';

const collectionScheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  zone: {
    type: String,
    required: true,
    default: 'District 4 - Metro North'
  },
  date: {
    type: Date,
    required: true
  },
  dayOfWeek: {
    type: String,
    default: 'Thursday'
  },
  timeWindow: {
    type: String,
    default: '07:00 AM - 09:00 AM'
  },
  categories: [
    {
      type: String,
      enum: ['Organic', 'Recycling', 'Plastic', 'Electronic', 'Medical', 'General', 'Metal', 'Glass']
    }
  ],
  driverName: {
    type: String,
    default: 'Muhammad Gilang Pratama'
  },
  vehicleId: {
    type: String,
    default: 'TRK-GREEN-08'
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Today', 'In Progress', 'Completed'],
    default: 'Upcoming'
  },
  notes: {
    type: String,
    default: 'Please place segregated bins at curbside before 06:45 AM'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('CollectionSchedule', collectionScheduleSchema);
