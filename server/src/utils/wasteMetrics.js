/**
 * Deterministic waste weight & status transition helpers for WasteWise Coimbatore.
 * Conversion assumptions (when report is not recorded directly in kg):
 * - 1 standard household bag = 4.0 kg (estimated)
 * - 1 individual item = 1.5 kg (estimated)
 * - 1 kg = 1.0 kg (measured/direct)
 */

export const DEFAULT_BAG_WEIGHT_KG = 4.0;
export const DEFAULT_ITEM_WEIGHT_KG = 1.5;

export const estimateReportWeightKg = (quantity, unit = 'bags', settings = null) => {
  const q = Math.max(0, Number(quantity) || 0);
  const bagFactor = settings?.vehicleCapacityDefaults?.bagWeightKgEstimate || DEFAULT_BAG_WEIGHT_KG;
  const itemFactor = settings?.vehicleCapacityDefaults?.itemWeightKgEstimate || DEFAULT_ITEM_WEIGHT_KG;

  if (unit === 'kg') {
    return { weightKg: Math.round(q * 10) / 10, isEstimated: false, unitUsed: 'kg' };
  }
  if (unit === 'items') {
    return { weightKg: Math.round(q * itemFactor * 10) / 10, isEstimated: true, unitUsed: 'items', conversionFactor: itemFactor };
  }
  return { weightKg: Math.round(q * bagFactor * 10) / 10, isEstimated: true, unitUsed: 'bags', conversionFactor: bagFactor };
};

export const getVehicleCapacityInKg = (vehicle) => {
  if (!vehicle) return 1000;
  const cap = Number(vehicle.carryingCapacity) || 1000;
  if (vehicle.capacityUnit === 'tonnes') {
    return cap * 1000;
  }
  return cap;
};

/**
 * Explicit pickup request lifecycle transitions:
 * Reported -> Confirmed -> Assigned -> In Progress -> Collected -> Recycled
 * Plus Rejection and Cancellation states.
 */
export const VALID_STATUS_TRANSITIONS = {
  Reported: ['Confirmed', 'Assigned', 'Rejected', 'Cancelled'],
  Confirmed: ['Assigned', 'In Progress', 'Rejected', 'Cancelled'],
  Assigned: ['In Progress', 'Collected', 'Confirmed', 'Cancelled'],
  'In Progress': ['Collected', 'Cancelled'],
  Collected: ['Recycled'],
  Recycled: [],
  Rejected: ['Confirmed'],
  Cancelled: []
};

export const isValidStatusTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
};

export const isReportOverdue = (report, now = new Date()) => {
  if (!report) return false;
  if (['Collected', 'Recycled', 'Cancelled', 'Rejected'].includes(report.status)) {
    return false;
  }
  const slotDate = report.preferredSlot?.date ? new Date(report.preferredSlot.date) : null;
  if (slotDate && !isNaN(slotDate.getTime())) {
    // Consider overdue if preferred collection date has passed by more than 24 hours
    return slotDate.getTime() + 24 * 3600 * 1000 < now.getTime();
  }
  const created = report.createdAt ? new Date(report.createdAt) : null;
  if (created && !isNaN(created.getTime())) {
    // Or if open for more than 48 hours without completion
    return created.getTime() + 48 * 3600 * 1000 < now.getTime();
  }
  return false;
};

