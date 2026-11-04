import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'CMP-' + Math.floor(10000 + Math.random() * 90000)
  },
  citizen: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Missed Garbage Collection',
      'Illegal Dumping',
      'Overflowing Public Bins',
      'Waste Left in Public Spaces',
      'Damaged Waste Collection Infrastructure',
      'Uncollected Hazardous Waste',
      'Other Sanitation Issues'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
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
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    default: null
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  attachments: [
    {
      type: String
    }
  ],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  assignedDepartment: {
    type: String,
    default: 'Municipal Sanitation Operations'
  },
  assignedWorker: {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Submitted'
  },
  internalNotes: [
    {
      note: { type: String, required: true },
      authorName: { type: String, default: 'Admin' },
      authorId: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  resolutionNotes: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  history: [
    {
      status: { type: String, required: true },
      note: { type: String, default: '' },
      updatedBy: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ ward: 1 });
complaintSchema.index({ 'citizen.userId': 1 });

export default mongoose.model('Complaint', complaintSchema);
