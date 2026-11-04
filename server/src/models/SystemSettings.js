import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    default: 'global_municipal_settings',
    unique: true
  },
  city: {
    type: String,
    default: 'Coimbatore'
  },
  state: {
    type: String,
    default: 'Tamil Nadu'
  },
  country: {
    type: String,
    default: 'India'
  },
  countryCallingCode: {
    type: String,
    default: '+91'
  },
  postalTerminology: {
    type: String,
    default: 'PIN code'
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  wasteCategories: [
    {
      name: { type: String, required: true },
      unitDefault: { type: String, default: 'bags' },
      ecoPointsPerUnit: { type: Number, default: 15 },
      estimatedKgPerBag: { type: Number, default: 4.0 },
      estimatedKgPerItem: { type: Number, default: 1.5 },
      isHazardous: { type: Boolean, default: false },
      active: { type: Boolean, default: true }
    }
  ],
  collectionTimeWindows: [
    {
      label: { type: String, required: true },
      startTime: { type: String, default: '06:30' },
      endTime: { type: String, default: '09:30' },
      active: { type: Boolean, default: true }
    }
  ],
  vehicleCapacityDefaults: {
    minCapacityKg: { type: Number, default: 250 },
    defaultCapacityKg: { type: Number, default: 1000 },
    warningThresholdPercent: { type: Number, default: 85 },
    maxThresholdPercent: { type: Number, default: 100 },
    bagWeightKgEstimate: { type: Number, default: 4.0 },
    itemWeightKgEstimate: { type: Number, default: 1.5 }
  },
  routeOptimizationSettings: {
    defaultDepotName: { type: String, default: 'CCMC Central Fleet Depot, Town Hall' },
    defaultDepotAddress: { type: String, default: 'Big Bazaar Street, Town Hall, Coimbatore 641001' },
    defaultDepotCoordinates: {
      lat: { type: Number, default: 11.0018 },
      lng: { type: Number, default: 76.9628 }
    },
    roadTortuosityFactor: { type: Number, default: 1.32 },
    avgUrbanSpeedKmh: { type: Number, default: 22 },
    stopServiceTimeMin: { type: Number, default: 5 },
    preventOverCapacityDispatch: { type: Boolean, default: true }
  },
  cleanlinessHeatmapThresholds: {
    warningPendingCount: { type: Number, default: 3 },
    criticalPendingCount: { type: Number, default: 6 },
    warningOverdueCount: { type: Number, default: 1 },
    criticalOverdueCount: { type: Number, default: 3 },
    warningComplaintCount: { type: Number, default: 2 },
    criticalComplaintCount: { type: Number, default: 5 }
  },
  wardPerformanceWeights: {
    pickupCompletionWeight: { type: Number, default: 35 },
    complaintResolutionWeight: { type: Number, default: 25 },
    recyclingRateWeight: { type: Number, default: 20 },
    timelinessWeight: { type: Number, default: 20 }
  },
  complaintPriorityThresholds: {
    overdueHoursForHigh: { type: Number, default: 24 },
    overdueHoursForCritical: { type: Number, default: 48 },
    autoEscalateHazardous: { type: Boolean, default: true }
  },
  notificationPreferences: {
    enableCitizenNotifications: { type: Boolean, default: true },
    restrictToTargetWard: { type: Boolean, default: true },
    notifyOnSchedulePublish: { type: Boolean, default: true },
    notifyOnComplaintResolution: { type: Boolean, default: true }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SystemSettings', systemSettingsSchema);

