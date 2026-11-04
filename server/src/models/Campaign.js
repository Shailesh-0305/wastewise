import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Plastic-Free Neighbourhood Week',
      'E-Waste Collection Drives',
      'Community Cleanliness Drives',
      'Home Composting Awareness',
      'Waste Segregation Campaigns',
      'Environmental Awareness Events',
      'Municipal Announcement'
    ],
    default: 'Community Cleanliness Drives'
  },
  type: {
    type: String,
    enum: ['Campaign', 'Announcement'],
    default: 'Campaign'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  targetWards: [
    {
      type: String,
      trim: true
    }
  ],
  targetAudience: {
    type: String,
    enum: ['All Citizens', 'Specific Wards', 'Collection Workers', 'All Users'],
    default: 'All Citizens'
  },
  location: {
    type: String,
    default: 'Coimbatore Municipal Limits'
  },
  bannerImage: {
    type: String,
    default: ''
  },
  participationInstructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Active', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'Municipal Administrator' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

campaignSchema.index({ status: 1, startDate: 1 });
campaignSchema.index({ targetWards: 1 });

export default mongoose.model('Campaign', campaignSchema);
