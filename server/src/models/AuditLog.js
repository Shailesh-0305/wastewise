import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminName: {
    type: String,
    default: 'Municipal Administrator'
  },
  adminEmail: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'PickupRequest',
      'Worker',
      'Vehicle',
      'Ward',
      'Schedule',
      'RecyclingCentre',
      'DisposalFacility',
      'Route',
      'Complaint',
      'Campaign',
      'User',
      'SystemSettings'
    ]
  },
  entityId: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    required: true
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  updatedValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entityType: 1, action: 1 });
auditLogSchema.index({ adminId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
