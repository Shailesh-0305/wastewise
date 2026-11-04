import WasteReport from '../models/WasteReport.js';
import User from '../models/User.js';
import CollectionVehicle from '../models/CollectionVehicle.js';
import Ward from '../models/Ward.js';
import CollectionSchedule from '../models/CollectionSchedule.js';
import RecyclingCentre from '../models/RecyclingCentre.js';
import Complaint from '../models/Complaint.js';
import AuditLog from '../models/AuditLog.js';
import SystemSettings from '../models/SystemSettings.js';
import mongoose from 'mongoose';
import { estimateReportWeightKg, isReportOverdue, getVehicleCapacityInKg } from '../utils/wasteMetrics.js';
import { getScheduleTimeRange, windowsOverlap } from './scheduleController.js';

const ALL_CATEGORIES = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];
const ALL_STATUSES = ['Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Rejected', 'Cancelled'];

const extractWardLabel = (item) => {
  if (item.ward && String(item.ward).trim()) return String(item.ward).trim();
  if (item.location?.ward && String(item.location.ward).trim()) return String(item.location.ward).trim();
  const addr = item.location?.address || item.address || '';
  const wardMatch = addr.match(/Ward\s*\d+/i);
  if (wardMatch) return wardMatch[0];
  if (addr.toLowerCase().includes('peelamedu')) return 'Ward 24 (Peelamedu)';
  if (addr.toLowerCase().includes('rs puram') || addr.toLowerCase().includes('r.s. puram')) return 'Ward 58 (RS Puram)';
  if (addr.toLowerCase().includes('gandhipuram')) return 'Ward 72 (Gandhipuram)';
  if (addr.toLowerCase().includes('ukkadam')) return 'Ward 82 (Ukkadam)';
  if (addr.toLowerCase().includes('town hall')) return 'Ward 70 (Town Hall)';
  return 'Unassigned Ward';
};

export const getAnalyticsOverview = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection offline. Please check MongoDB Atlas connection.'
      });
    }

    const { dateFrom, dateTo, month, year, ward, category, status } = req.query;

    const [
      allReports,
      users,
      vehicles,
      wards,
      schedules,
      centres,
      complaints,
      auditLogs,
      settings
    ] = await Promise.all([
      WasteReport.find().sort({ createdAt: -1 }).lean(),
      User.find().select('-password').lean(),
      CollectionVehicle.find().lean(),
      Ward.find().lean(),
      CollectionSchedule.find().sort({ date: 1 }).lean(),
      RecyclingCentre.find().lean(),
      Complaint.find().sort({ createdAt: -1 }).lean(),
      AuditLog.find().sort({ timestamp: -1 }).limit(20).lean(),
      SystemSettings.findOne({ settingKey: 'global_municipal_settings' }).lean()
    ]);

    const now = new Date();
    const todayIST = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Filter reports for the analytics charts/tables if filter params are provided
    let filteredReports = [...allReports];
    if (ward && ward !== 'All') {
      filteredReports = filteredReports.filter(r =>
        extractWardLabel(r).toLowerCase().includes(ward.toLowerCase()) ||
        (r.location?.address || '').toLowerCase().includes(ward.toLowerCase())
      );
    }
    if (category && category !== 'All') {
      filteredReports = filteredReports.filter(r => (r.category || '').toLowerCase() === category.toLowerCase());
    }
    if (status && status !== 'All') {
      filteredReports = filteredReports.filter(r => r.status === status);
    }
    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      if (!isNaN(fromTime)) {
        filteredReports = filteredReports.filter(r => new Date(r.createdAt).getTime() >= fromTime);
      }
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (!isNaN(end.getTime())) {
        filteredReports = filteredReports.filter(r => new Date(r.createdAt).getTime() <= end.getTime());
      }
    }
    if (month && year && month !== 'All' && year !== 'All') {
      const m = Number(month) - 1;
      const y = Number(year);
      filteredReports = filteredReports.filter(r => {
        const d = new Date(r.createdAt);
        return d.getMonth() === m && d.getFullYear() === y;
      });
    } else if (year && year !== 'All') {
      const y = Number(year);
      filteredReports = filteredReports.filter(r => new Date(r.createdAt).getFullYear() === y);
    }

    // --- 1. MUNICIPAL OPERATIONS OVERVIEW METRICS ---
    const totalRequests = filteredReports.length;
    const reportedCount = filteredReports.filter(r => r.status === 'Reported').length;
    const confirmedCount = filteredReports.filter(r => r.status === 'Confirmed').length;
    const assignedCount = filteredReports.filter(r => ['Assigned', 'In Progress'].includes(r.status)).length;
    const pendingPickups = reportedCount + confirmedCount + assignedCount;
    const completedPickups = filteredReports.filter(r => ['Collected', 'Recycled'].includes(r.status)).length;
    const cancelledPickups = filteredReports.filter(r => ['Cancelled', 'Rejected'].includes(r.status)).length;

    const collectionsCompletedToday = allReports.filter(r => {
      if (!['Collected', 'Recycled'].includes(r.status)) return false;
      const compDate = r.completedAt || r.pointsAwardedAt || r.createdAt;
      if (!compDate) return false;
      return new Date(compDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === todayIST;
    }).length;

    const overdueReportsList = filteredReports.filter(r => isReportOverdue(r, now));
    const overdueCount = overdueReportsList.length;

    const unassignedReportsList = filteredReports.filter(r =>
      ['Reported', 'Confirmed'].includes(r.status) &&
      (!r.assignedDriver?.driverId && (!r.assignedDriver?.name || r.assignedDriver.name === 'Awaiting Driver Assignment'))
    );

    const citizensList = users.filter(u => u.role === 'citizen');
    const workersList = users.filter(u => u.role === 'driver');
    const activeVehiclesList = vehicles.filter(v => v.isActive && !['Under Maintenance', 'Out of Service', 'Deactivated'].includes(v.operationalStatus));
    const activeCentresList = centres.filter(c => c.isActive !== false);
    const disposalFacilitiesList = activeCentresList.filter(c => c.isDisposalFacility || c.facilityCategory === 'Disposal Facility');

    // --- 2. WASTE VOLUME & COMPLETION METRICS ---
    let totalWasteKg = 0;
    let totalCollectedWasteKg = 0;
    let totalRecycledWasteKg = 0;
    let awaitingCollectionWasteKg = 0;
    let estimatedRecordCount = 0;
    let completionDurationTotalHours = 0;
    let completionDurationSampleCount = 0;

    filteredReports.forEach(r => {
      const est = estimateReportWeightKg(r.quantity, r.unit, settings);
      if (est.isEstimated) estimatedRecordCount++;
      totalWasteKg += est.weightKg;

      if (['Collected', 'Recycled'].includes(r.status)) {
        totalCollectedWasteKg += est.weightKg;
        const start = new Date(r.createdAt).getTime();
        const end = r.completedAt
          ? new Date(r.completedAt).getTime()
          : (r.timeline?.length > 1 ? new Date(r.timeline[r.timeline.length - 1].timestamp).getTime() : NaN);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          completionDurationTotalHours += (end - start) / (1000 * 3600);
          completionDurationSampleCount++;
        }
      } else if (['Reported', 'Confirmed', 'Assigned', 'In Progress'].includes(r.status)) {
        awaitingCollectionWasteKg += est.weightKg;
      }

      if (r.status === 'Recycled') {
        totalRecycledWasteKg += est.weightKg;
      }
    });

    totalWasteKg = Math.round(totalWasteKg * 10) / 10;
    totalCollectedWasteKg = Math.round(totalCollectedWasteKg * 10) / 10;
    totalRecycledWasteKg = Math.round(totalRecycledWasteKg * 10) / 10;
    awaitingCollectionWasteKg = Math.round(awaitingCollectionWasteKg * 10) / 10;
    const nonRecycledCollectedKg = Math.max(0, Math.round((totalCollectedWasteKg - totalRecycledWasteKg) * 10) / 10);

    const recyclingRate = totalCollectedWasteKg > 0
      ? Math.min(100, Math.round((totalRecycledWasteKg / totalCollectedWasteKg) * 100 * 10) / 10)
      : 0;

    const pickupCompletionRate = totalRequests > 0
      ? Math.round((completedPickups / totalRequests) * 100 * 10) / 10
      : 0;

    const missedComplaintsCount = complaints.filter(c => c.category === 'Missed Garbage Collection').length;
    const missedPickupRate = totalRequests > 0
      ? Math.min(100, Math.round(((overdueCount + missedComplaintsCount) / (totalRequests + missedComplaintsCount)) * 100 * 10) / 10)
      : 0;

    const avgCompletionTimeHours = completionDurationSampleCount > 0
      ? Math.round((completionDurationTotalHours / completionDurationSampleCount) * 10) / 10
      : null;

    // --- 3. CATEGORY DISTRIBUTION ---
    const categoryTotals = {};
    ALL_CATEGORIES.forEach(cat => {
      categoryTotals[cat] = { count: 0, weightKg: 0, collectedKg: 0 };
    });

    filteredReports.forEach(r => {
      const cat = ALL_CATEGORIES.find(c => c.toLowerCase() === (r.category || '').toLowerCase()) || 'Recyclable';
      const w = estimateReportWeightKg(r.quantity, r.unit, settings).weightKg;
      categoryTotals[cat].count += 1;
      categoryTotals[cat].weightKg += w;
      if (['Collected', 'Recycled'].includes(r.status)) {
        categoryTotals[cat].collectedKg += w;
      }
    });

    const categoryDistribution = ALL_CATEGORIES.map(cat => {
      const weight = Math.round(categoryTotals[cat].weightKg * 10) / 10;
      const pct = totalWasteKg > 0 ? Math.round((weight / totalWasteKg) * 100) : 0;
      return {
        category: cat,
        count: categoryTotals[cat].count,
        weightKg: weight,
        collectedKg: Math.round(categoryTotals[cat].collectedKg * 10) / 10,
        percentage: pct
      };
    });

    // --- 4. PICKUP STATUS DISTRIBUTION ---
    const statusDistribution = ALL_STATUSES.map(st => ({
      status: st,
      count: filteredReports.filter(r => r.status === st).length
    }));

    // --- 5. WARD-WISE WASTE VOLUME & OVERVIEW ---
    const wardMap = {};
    wards.forEach(w => {
      const key = `${w.wardNumber} (${w.wardName})`;
      wardMap[key] = {
        wardId: w._id,
        wardNumber: w.wardNumber,
        wardName: w.wardName,
        label: key,
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        overdueRequests: 0,
        totalWeightKg: 0,
        collectedWeightKg: 0,
        complaintsCount: 0
      };
    });

    filteredReports.forEach(r => {
      const wLabel = extractWardLabel(r);
      const matchedKey = Object.keys(wardMap).find(k =>
        k.toLowerCase().includes(wLabel.toLowerCase()) ||
        wLabel.toLowerCase().includes((wardMap[k].wardNumber || '').toLowerCase()) ||
        (wardMap[k].wardName && wLabel.toLowerCase().includes(wardMap[k].wardName.toLowerCase()))
      ) || wLabel;

      if (!wardMap[matchedKey]) {
        wardMap[matchedKey] = {
          wardId: null,
          wardNumber: matchedKey,
          wardName: matchedKey,
          label: matchedKey,
          totalRequests: 0,
          pendingRequests: 0,
          completedRequests: 0,
          overdueRequests: 0,
          totalWeightKg: 0,
          collectedWeightKg: 0,
          complaintsCount: 0
        };
      }

      const wWeight = estimateReportWeightKg(r.quantity, r.unit, settings).weightKg;
      wardMap[matchedKey].totalRequests += 1;
      wardMap[matchedKey].totalWeightKg = Math.round((wardMap[matchedKey].totalWeightKg + wWeight) * 10) / 10;

      if (['Collected', 'Recycled'].includes(r.status)) {
        wardMap[matchedKey].completedRequests += 1;
        wardMap[matchedKey].collectedWeightKg = Math.round((wardMap[matchedKey].collectedWeightKg + wWeight) * 10) / 10;
      } else if (['Reported', 'Confirmed', 'Assigned', 'In Progress'].includes(r.status)) {
        wardMap[matchedKey].pendingRequests += 1;
      }
      if (isReportOverdue(r, now)) {
        wardMap[matchedKey].overdueRequests += 1;
      }
    });

    complaints.forEach(c => {
      const wLabel = extractWardLabel(c);
      const matchedKey = Object.keys(wardMap).find(k =>
        k.toLowerCase().includes(wLabel.toLowerCase())
      ) || wLabel;
      if (wardMap[matchedKey]) {
        wardMap[matchedKey].complaintsCount += 1;
      }
    });

    const wardWasteVolume = Object.values(wardMap);

    // --- 6. WORKER WORKLOAD & AVAILABILITY ---
    const workerWorkload = workersList.map(w => {
      const assignedReports = allReports.filter(r =>
        (r.assignedDriver?.driverId && String(r.assignedDriver.driverId) === String(w._id)) ||
        (r.assignedDriver?.name && r.assignedDriver.name.toLowerCase() === w.name.toLowerCase())
      );
      const activeCount = assignedReports.filter(r => ['Assigned', 'In Progress'].includes(r.status)).length;
      const completedCount = assignedReports.filter(r => ['Collected', 'Recycled'].includes(r.status)).length;
      return {
        workerId: w._id,
        name: w.name,
        employeeId: w.employeeId || 'CBE-DRV',
        assignedWard: w.assignedWard || 'All Wards',
        shift: w.assignedShift || 'Morning (06:00 - 14:00)',
        operationalStatus: w.isActive === false ? 'Inactive' : (w.operationalStatus || (activeCount > 0 ? 'Assigned' : 'Available')),
        activeAssignments: activeCount,
        completedCollections: completedCount,
        totalAssigned: assignedReports.length
      };
    });

    // --- 7. VEHICLE UTILISATION & AVAILABILITY ---
    const vehicleUtilisation = vehicles.map(v => {
      const capKg = getVehicleCapacityInKg(v);
      const loadKg = v.currentAssignedLoadKg || 0;
      const utilPct = capKg > 0 ? Math.round((loadKg / capKg) * 100 * 10) / 10 : 0;
      return {
        vehicleId: v._id,
        registrationNumber: v.registrationNumber,
        vehicleType: v.vehicleType,
        capacityKg: capKg,
        currentLoadKg: loadKg,
        utilizationPercent: utilPct,
        operationalStatus: v.operationalStatus,
        assignedWorkerName: v.assignedWorkerName || 'Unassigned',
        assignedWard: v.assignedWard || 'General Fleet'
      };
    });

    // --- 8. COMPLAINT RESOLUTION TRENDS ---
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;
    const unresolvedComplaintsList = complaints.filter(c => !['Resolved', 'Rejected'].includes(c.status));
    const complaintStatusBreakdown = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].map(st => ({
      status: st,
      count: complaints.filter(c => c.status === st).length
    }));

    // --- 9. MONTHLY TRENDS (Last 6 Months) ---
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const mName = monthNames[mIdx];

      const monthReports = filteredReports.filter(r => {
        const rDate = new Date(r.createdAt || Date.now());
        return rDate.getMonth() === mIdx && rDate.getFullYear() === yr;
      });

      let reportedKg = 0;
      let collectedKg = 0;
      let recycledKg = 0;
      monthReports.forEach(r => {
        const w = estimateReportWeightKg(r.quantity, r.unit, settings).weightKg;
        reportedKg += w;
        if (['Collected', 'Recycled'].includes(r.status)) {
          collectedKg += w;
        }
        if (r.status === 'Recycled') {
          recycledKg += w;
        }
      });

      const monthComplaints = complaints.filter(c => {
        const cDate = new Date(c.createdAt || Date.now());
        return cDate.getMonth() === mIdx && cDate.getFullYear() === yr;
      });

      monthlyTrends.push({
        month: mName,
        year: yr,
        reportedKg: Math.round(reportedKg * 10) / 10,
        collectedKg: Math.round(collectedKg * 10) / 10,
        recycledKg: Math.round(recycledKg * 10) / 10,
        count: monthReports.length,
        complaintsTotal: monthComplaints.length,
        complaintsResolved: monthComplaints.filter(c => c.status === 'Resolved').length
      });
    }

    // --- 10. ATTENTION & ALERT PANEL (Strictly derived from actual database records) ---
    const alerts = [];

    if (overdueReportsList.length > 0) {
      alerts.push({
        id: 'alert-overdue',
        type: 'OVERDUE_PICKUPS',
        severity: 'critical',
        title: `${overdueReportsList.length} Overdue Pickup Request(s)`,
        description: `Pickup requests (${overdueReportsList.slice(0, 3).map(r => r.trackingId).join(', ')}) have exceeded their scheduled collection window.`,
        targetModule: 'pickups',
        count: overdueReportsList.length
      });
    }

    if (unassignedReportsList.length > 0) {
      alerts.push({
        id: 'alert-unassigned',
        type: 'UNASSIGNED_PICKUPS',
        severity: 'warning',
        title: `${unassignedReportsList.length} Unassigned Pickup Request(s)`,
        description: `Requests awaiting worker and vehicle assignment.`,
        targetModule: 'pickups',
        count: unassignedReportsList.length
      });
    }

    const missedCollectionComplaints = unresolvedComplaintsList.filter(c => c.category === 'Missed Garbage Collection');
    if (missedCollectionComplaints.length > 0) {
      alerts.push({
        id: 'alert-missed',
        type: 'MISSED_COLLECTIONS',
        severity: 'critical',
        title: `${missedCollectionComplaints.length} Unresolved Missed Collection Complaint(s)`,
        description: `Residents reported missed collections requiring immediate dispatch review.`,
        targetModule: 'complaints',
        count: missedCollectionComplaints.length
      });
    }

    if (unresolvedComplaintsList.length > 0) {
      alerts.push({
        id: 'alert-complaints',
        type: 'UNRESOLVED_COMPLAINTS',
        severity: unresolvedComplaintsList.some(c => c.priority === 'Critical' || c.priority === 'High') ? 'critical' : 'warning',
        title: `${unresolvedComplaintsList.length} Open Civic Complaint(s)`,
        description: `Civic sanitation complaints currently in Submitted, Under Review, or In Progress states.`,
        targetModule: 'complaints',
        count: unresolvedComplaintsList.length
      });
    }

    const maintenanceVehicles = vehicles.filter(v =>
      v.operationalStatus === 'Under Maintenance' ||
      v.operationalStatus === 'Out of Service' ||
      (v.nextMaintenanceDate && new Date(v.nextMaintenanceDate).getTime() <= now.getTime())
    );
    if (maintenanceVehicles.length > 0) {
      alerts.push({
        id: 'alert-vehicles',
        type: 'VEHICLE_MAINTENANCE',
        severity: 'warning',
        title: `${maintenanceVehicles.length} Fleet Vehicle Maintenance Alert(s)`,
        description: `Vehicles (${maintenanceVehicles.map(v => v.registrationNumber).join(', ')}) are under maintenance or past due for inspection.`,
        targetModule: 'fleet',
        count: maintenanceVehicles.length
      });
    }

    // Check if any existing active schedules overlap on same day/worker/vehicle
    const activeSchedules = schedules.filter(s => !['Cancelled', 'Completed'].includes(s.status));
    let scheduleConflictCount = 0;
    for (let i = 0; i < activeSchedules.length; i++) {
      for (let j = i + 1; j < activeSchedules.length; j++) {
        const a = activeSchedules[i];
        const b = activeSchedules[j];
        const dA = new Date(a.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const dB = new Date(b.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        if (dA === dB && windowsOverlap(getScheduleTimeRange(a), getScheduleTimeRange(b))) {
          const sameWorker = a.driverName && b.driverName && a.driverName.toLowerCase() === b.driverName.toLowerCase();
          const sameVehicle = (a.vehiclePlate || a.vehicleId) && (a.vehiclePlate || a.vehicleId) === (b.vehiclePlate || b.vehicleId);
          if (sameWorker || sameVehicle) scheduleConflictCount++;
        }
      }
    }
    if (scheduleConflictCount > 0) {
      alerts.push({
        id: 'alert-schedule-conflict',
        type: 'SCHEDULE_CONFLICTS',
        severity: 'critical',
        title: `${scheduleConflictCount} Collection Schedule Conflict(s)`,
        description: `Overlapping worker or vehicle assignments detected in active schedules.`,
        targetModule: 'schedules',
        count: scheduleConflictCount
      });
    }

    // Environmental estimates with documented assumptions
    const estimatedCO2SavedKg = Math.round(totalCollectedWasteKg * 0.72 * 10) / 10;
    const estimatedTreesPreserved = Math.round((estimatedCO2SavedKg / 22) * 10) / 10;
    const estimatedKWhEnergySaved = Math.round(totalCollectedWasteKg * 1.8 * 10) / 10;

    return res.json({
      success: true,
      stats: {
        // Summary KPIs
        totalRequests,
        reportedRequests: reportedCount,
        confirmedRequests: confirmedCount,
        assignedRequests: assignedCount,
        pendingPickups,
        activePickups: pendingPickups,
        completedPickups,
        collectionsCompletedToday,
        overdueRequests: overdueCount,
        cancelledPickups,
        registeredCitizens: citizensList.length,
        registeredWorkers: workersList.length,
        activeVehicles: activeVehiclesList.length,
        totalVehicles: vehicles.length,
        registeredRecyclingCentres: activeCentresList.length,
        disposalFacilitiesCount: disposalFacilitiesList.length,
        totalWards: wards.length,
        totalComplaints,
        resolvedComplaints,
        unresolvedComplaints: unresolvedComplaintsList.length,

        // Weight & Rate Metrics
        totalWasteKg,
        totalCollectedWasteKg,
        totalRecycledWasteKg,
        nonRecycledCollectedKg,
        awaitingCollectionWasteKg,
        estimatedRecordCount,
        recyclingRate,
        pickupCompletionRate,
        missedPickupRate,
        avgCompletionTimeHours,

        // Distributions & Charts
        categoryDistribution,
        statusDistribution,
        wardWasteVolume,
        workerWorkload,
        vehicleUtilisation,
        complaintStatusBreakdown,
        monthlyTrends,

        // Operational Panels
        alerts,
        requestsRequiringAttention: [...overdueReportsList, ...unassignedReportsList].slice(0, 8),
        upcomingSchedules: activeSchedules.slice(0, 6),
        recentComplaints: complaints.slice(0, 6),
        recentActivity: auditLogs.slice(0, 10),

        // Documented Environmental Estimates
        environmentalEstimates: {
          co2SavedKg: estimatedCO2SavedKg,
          treesPreserved: estimatedTreesPreserved,
          kwhEnergySaved: estimatedKWhEnergySaved,
          isEstimated: true,
          unitConversionNotice: 'Reports submitted in bags or items are converted to estimated kg using documented factors (1 bag = 4.0 kg est., 1 item = 1.5 kg est.).',
          methodology: 'Heuristic estimate calculated solely on collected/diverted municipal waste',
          notice: 'Indicative estimates calculated on diverted waste using EPA lifecycle factors (0.72 kg CO2/kg waste; 22 kg CO2/tree/yr; 1.8 kWh/kg waste).'
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/analytics/ward-scorecards
 * Module 17: Ward Performance Scorecard with transparent weighted formula
 */
export const getWardScorecards = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { dateFrom, dateTo } = req.query;

    const [wards, allReports, allComplaints, settings] = await Promise.all([
      Ward.find().lean(),
      WasteReport.find().lean(),
      Complaint.find().lean(),
      SystemSettings.findOne({ settingKey: 'global_municipal_settings' }).lean()
    ]);

    let reports = [...allReports];
    let complaints = [...allComplaints];

    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      if (!isNaN(fromTime)) {
        reports = reports.filter(r => new Date(r.createdAt).getTime() >= fromTime);
        complaints = complaints.filter(c => new Date(c.createdAt).getTime() >= fromTime);
      }
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (!isNaN(end.getTime())) {
        reports = reports.filter(r => new Date(r.createdAt).getTime() <= end.getTime());
        complaints = complaints.filter(c => new Date(c.createdAt).getTime() <= end.getTime());
      }
    }

    const weights = settings?.wardPerformanceWeights || {
      pickupCompletionWeight: 35,
      complaintResolutionWeight: 25,
      recyclingRateWeight: 20,
      timelinessWeight: 20
    };

    const now = new Date();
    const bucketMap = {};

    // Initialize buckets from registered wards
    wards.forEach(w => {
      const key = w.wardNumber;
      bucketMap[key] = {
        wardId: w._id,
        wardNumber: w.wardNumber,
        wardName: w.wardName,
        zone: w.zone || 'Central Zone',
        localities: w.localities || [],
        operationalStatus: w.operationalStatus || 'Active',
        reports: [],
        complaints: []
      };
    });

    const matchToWardBucket = (item) => {
      const rawWard = extractWardLabel(item);
      for (const key of Object.keys(bucketMap)) {
        const b = bucketMap[key];
        if (
          rawWard.toLowerCase().includes(b.wardNumber.toLowerCase()) ||
          (b.wardName && rawWard.toLowerCase().includes(b.wardName.toLowerCase())) ||
          (b.localities || []).some(loc => rawWard.toLowerCase().includes(loc.toLowerCase()))
        ) {
          return key;
        }
      }
      if (!bucketMap[rawWard]) {
        bucketMap[rawWard] = {
          wardId: null,
          wardNumber: rawWard,
          wardName: rawWard,
          zone: 'Coimbatore Municipal Area',
          localities: [],
          operationalStatus: 'Active',
          reports: [],
          complaints: []
        };
      }
      return rawWard;
    };

    reports.forEach(r => {
      const key = matchToWardBucket(r);
      bucketMap[key].reports.push(r);
    });

    complaints.forEach(c => {
      const key = matchToWardBucket(c);
      bucketMap[key].complaints.push(c);
    });

    const scorecards = Object.values(bucketMap).map(b => {
      const totalPickupRequests = b.reports.length;
      const completedCollections = b.reports.filter(r => ['Collected', 'Recycled'].includes(r.status)).length;
      const pendingCollections = b.reports.filter(r => ['Reported', 'Confirmed', 'Assigned', 'In Progress'].includes(r.status)).length;
      const overdueRequests = b.reports.filter(r => isReportOverdue(r, now)).length;

      let wasteCollectedKg = 0;
      let wasteRecycledKg = 0;
      let totalHours = 0;
      let durationSamples = 0;

      b.reports.forEach(r => {
        const w = estimateReportWeightKg(r.quantity, r.unit, settings).weightKg;
        if (['Collected', 'Recycled'].includes(r.status)) {
          wasteCollectedKg += w;
          const start = new Date(r.createdAt).getTime();
          const end = r.completedAt
            ? new Date(r.completedAt).getTime()
            : (r.timeline?.length > 1 ? new Date(r.timeline[r.timeline.length - 1].timestamp).getTime() : NaN);
          if (!isNaN(start) && !isNaN(end) && end >= start) {
            totalHours += (end - start) / (1000 * 3600);
            durationSamples++;
          }
        }
        if (r.status === 'Recycled') {
          wasteRecycledKg += w;
        }
      });

      const totalComplaints = b.complaints.length;
      const missedCollectionComplaints = b.complaints.filter(c => c.category === 'Missed Garbage Collection').length;
      const resolvedComplaints = b.complaints.filter(c => c.status === 'Resolved').length;

      const pickupCompletionRate = totalPickupRequests > 0
        ? Math.round((completedCollections / totalPickupRequests) * 100 * 10) / 10
        : null;

      const complaintResolutionRate = totalComplaints > 0
        ? Math.round((resolvedComplaints / totalComplaints) * 100 * 10) / 10
        : null;

      const recyclingRate = wasteCollectedKg > 0
        ? Math.round((wasteRecycledKg / wasteCollectedKg) * 100 * 10) / 10
        : null;

      const onTimeRate = totalPickupRequests > 0
        ? Math.round(((totalPickupRequests - overdueRequests) / totalPickupRequests) * 100 * 10) / 10
        : null;

      const averageCompletionTimeHours = durationSamples > 0
        ? Math.round((totalHours / durationSamples) * 10) / 10
        : null;

      // Compute transparent weighted performance score only when actual operational activity exists
      const hasActivity = totalPickupRequests > 0 || totalComplaints > 0;
      let performanceScore = null;
      if (hasActivity) {
        let weightedSum = 0;
        let activeWeightTotal = 0;

        if (pickupCompletionRate !== null) {
          weightedSum += pickupCompletionRate * weights.pickupCompletionWeight;
          activeWeightTotal += weights.pickupCompletionWeight;
        }
        if (complaintResolutionRate !== null) {
          weightedSum += complaintResolutionRate * weights.complaintResolutionWeight;
          activeWeightTotal += weights.complaintResolutionWeight;
        }
        if (recyclingRate !== null) {
          weightedSum += recyclingRate * weights.recyclingRateWeight;
          activeWeightTotal += weights.recyclingRateWeight;
        }
        if (onTimeRate !== null) {
          weightedSum += onTimeRate * weights.timelinessWeight;
          activeWeightTotal += weights.timelinessWeight;
        }

        performanceScore = activeWeightTotal > 0 ? Math.round((weightedSum / activeWeightTotal) * 10) / 10 : null;
      }

      return {
        wardId: b.wardId,
        wardNumber: b.wardNumber,
        wardName: b.wardName,
        zone: b.zone,
        localities: b.localities,
        operationalStatus: b.operationalStatus,
        totalPickupRequests,
        completedCollections,
        pendingCollections,
        overdueRequests,
        totalComplaints,
        missedCollectionComplaints,
        resolvedComplaints,
        complaintResolutionRate,
        pickupCompletionRate,
        wasteCollectedKg: Math.round(wasteCollectedKg * 10) / 10,
        wasteRecycledKg: Math.round(wasteRecycledKg * 10) / 10,
        recyclingRate,
        onTimeRate,
        averageCompletionTimeHours,
        performanceScore,
        hasActivity
      };
    });

    return res.json({
      success: true,
      weightsUsed: weights,
      methodology: 'Weighted average of available operational metrics: Pickup Completion Rate, Complaint Resolution Rate, Recycling Rate, and On-Time Collection Rate. Wards with zero recorded requests or complaints are marked N/A.',
      scorecards
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/analytics/cleanliness-heatmap
 * Module 15: Ward & Location-Based Cleanliness Map
 */
export const getCleanlinessHeatmapData = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { dateFrom, dateTo, ward, complaintType, collectionStatus } = req.query;

    const [wards, allReports, allComplaints, settings] = await Promise.all([
      Ward.find().lean(),
      WasteReport.find().lean(),
      Complaint.find().lean(),
      SystemSettings.findOne({ settingKey: 'global_municipal_settings' }).lean()
    ]);

    const thresholds = settings?.cleanlinessHeatmapThresholds || {
      warningPendingCount: 3,
      criticalPendingCount: 6,
      warningOverdueCount: 1,
      criticalOverdueCount: 3,
      warningComplaintCount: 2,
      criticalComplaintCount: 5
    };

    let reports = [...allReports];
    let complaints = [...allComplaints];

    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      if (!isNaN(fromTime)) {
        reports = reports.filter(r => new Date(r.createdAt).getTime() >= fromTime);
        complaints = complaints.filter(c => new Date(c.createdAt).getTime() >= fromTime);
      }
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (!isNaN(end.getTime())) {
        reports = reports.filter(r => new Date(r.createdAt).getTime() <= end.getTime());
        complaints = complaints.filter(c => new Date(c.createdAt).getTime() <= end.getTime());
      }
    }
    if (ward && ward !== 'All') {
      reports = reports.filter(r => extractWardLabel(r).toLowerCase().includes(ward.toLowerCase()));
      complaints = complaints.filter(c => extractWardLabel(c).toLowerCase().includes(ward.toLowerCase()));
    }
    if (collectionStatus && collectionStatus !== 'All') {
      reports = reports.filter(r => r.status === collectionStatus);
    }
    if (complaintType && complaintType !== 'All') {
      complaints = complaints.filter(c => c.category === complaintType);
    }

    const now = new Date();

    // Build actual GPS coordinate points from reports and complaints (never fabricate coordinates)
    const locationPoints = [];

    reports.forEach(r => {
      if (r.location?.coordinates?.lat !== undefined && r.location?.coordinates?.lng !== undefined) {
        const overdue = isReportOverdue(r, now);
        const isPending = ['Reported', 'Confirmed', 'Assigned', 'In Progress'].includes(r.status);
        locationPoints.push({
          id: r._id,
          recordId: r.trackingId,
          recordType: 'PickupRequest',
          category: r.category,
          status: r.status,
          ward: extractWardLabel(r),
          address: r.location.address,
          coordinates: {
            lat: Number(r.location.coordinates.lat),
            lng: Number(r.location.coordinates.lng)
          },
          isOverdue: overdue,
          isPending,
          weightKg: estimateReportWeightKg(r.quantity, r.unit, settings).weightKg,
          severity: overdue ? 'Red' : (isPending ? 'Yellow' : 'Green'),
          createdAt: r.createdAt
        });
      }
    });

    complaints.forEach(c => {
      if (c.coordinates?.lat !== undefined && c.coordinates?.lng !== undefined) {
        const isUnresolved = !['Resolved', 'Rejected'].includes(c.status);
        locationPoints.push({
          id: c._id,
          recordId: c.complaintId,
          recordType: 'Complaint',
          category: c.category,
          status: c.status,
          priority: c.priority,
          ward: extractWardLabel(c),
          address: c.address,
          coordinates: {
            lat: Number(c.coordinates.lat),
            lng: Number(c.coordinates.lng)
          },
          isUnresolved,
          severity: isUnresolved && ['Critical', 'High'].includes(c.priority) ? 'Red' : (isUnresolved ? 'Yellow' : 'Green'),
          createdAt: c.createdAt
        });
      }
    });

    // Aggregate ward-level status indicators
    const wardGroups = {};
    wards.forEach(w => {
      wardGroups[w.wardNumber] = {
        wardId: w._id,
        wardNumber: w.wardNumber,
        wardName: w.wardName,
        zone: w.zone,
        boundaryAvailable: Boolean(w.boundaryAvailable),
        referenceCoordinates: w.referenceCoordinates?.lat && w.referenceCoordinates?.lng ? w.referenceCoordinates : null,
        pendingPickups: 0,
        overduePickups: 0,
        completedPickups: 0,
        totalPickups: 0,
        wasteVolumeKg: 0,
        unresolvedComplaints: 0,
        missedCollectionComplaints: 0,
        totalComplaints: 0,
        gpsSamples: []
      };
    });

    const getGroup = (item) => {
      const label = extractWardLabel(item);
      const foundKey = Object.keys(wardGroups).find(k =>
        label.toLowerCase().includes(k.toLowerCase()) ||
        (wardGroups[k].wardName && label.toLowerCase().includes(wardGroups[k].wardName.toLowerCase()))
      ) || label;

      if (!wardGroups[foundKey]) {
        wardGroups[foundKey] = {
          wardId: null,
          wardNumber: foundKey,
          wardName: foundKey,
          zone: 'Coimbatore Municipal Area',
          boundaryAvailable: false,
          referenceCoordinates: null,
          pendingPickups: 0,
          overduePickups: 0,
          completedPickups: 0,
          totalPickups: 0,
          wasteVolumeKg: 0,
          unresolvedComplaints: 0,
          missedCollectionComplaints: 0,
          totalComplaints: 0,
          gpsSamples: []
        };
      }
      return wardGroups[foundKey];
    };

    reports.forEach(r => {
      const g = getGroup(r);
      g.totalPickups++;
      g.wasteVolumeKg = Math.round((g.wasteVolumeKg + estimateReportWeightKg(r.quantity, r.unit, settings).weightKg) * 10) / 10;
      if (['Reported', 'Confirmed', 'Assigned', 'In Progress'].includes(r.status)) g.pendingPickups++;
      if (['Collected', 'Recycled'].includes(r.status)) g.completedPickups++;
      if (isReportOverdue(r, now)) g.overduePickups++;
      if (r.location?.coordinates?.lat && r.location?.coordinates?.lng) {
        g.gpsSamples.push(r.location.coordinates);
      }
    });

    complaints.forEach(c => {
      const g = getGroup(c);
      g.totalComplaints++;
      if (!['Resolved', 'Rejected'].includes(c.status)) g.unresolvedComplaints++;
      if (c.category === 'Missed Garbage Collection' && !['Resolved', 'Rejected'].includes(c.status)) {
        g.missedCollectionComplaints++;
      }
      if (c.coordinates?.lat && c.coordinates?.lng) {
        g.gpsSamples.push(c.coordinates);
      }
    });

    const wardIndicators = Object.values(wardGroups).map(g => {
      let statusColor = 'Green';
      let statusLabel = 'Normal Operational Performance';

      if (
        g.overduePickups >= thresholds.criticalOverdueCount ||
        g.pendingPickups >= thresholds.criticalPendingCount ||
        g.unresolvedComplaints >= thresholds.criticalComplaintCount
      ) {
        statusColor = 'Red';
        statusLabel = 'High Number of Unresolved Issues';
      } else if (
        g.overduePickups >= thresholds.warningOverdueCount ||
        g.pendingPickups >= thresholds.warningPendingCount ||
        g.unresolvedComplaints >= thresholds.warningComplaintCount
      ) {
        statusColor = 'Yellow';
        statusLabel = 'Attention Required';
      }

      // Compute centroid from actual verified records in this ward if referenceCoordinates not manually set
      let displayCoordinates = g.referenceCoordinates;
      if (!displayCoordinates && g.gpsSamples.length > 0) {
        const avgLat = g.gpsSamples.reduce((s, p) => s + Number(p.lat), 0) / g.gpsSamples.length;
        const avgLng = g.gpsSamples.reduce((s, p) => s + Number(p.lng), 0) / g.gpsSamples.length;
        displayCoordinates = { lat: Number(avgLat.toFixed(5)), lng: Number(avgLng.toFixed(5)), derivedFromRecords: true };
      }

      const completionRate = g.totalPickups > 0 ? Math.round((g.completedPickups / g.totalPickups) * 100) : 100;
      const { gpsSamples: _unused, ...rest } = g;
      return {
        ...rest,
        completionRate,
        statusColor,
        statusLabel,
        displayCoordinates
      };
    });

    return res.json({
      success: true,
      mapMode: 'Location-Based Operational View (Official Ward Polygons Unavailable)',
      thresholds,
      locationPoints,
      wardIndicators
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
