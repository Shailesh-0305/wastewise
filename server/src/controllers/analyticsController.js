import WasteReport from '../models/WasteReport.js';
import { inMemoryDB } from '../store/inMemoryStore.js';
import mongoose from 'mongoose';

const ALL_CATEGORIES = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];

export const getAnalyticsOverview = async (req, res) => {
  try {
    let reports = [];

    if (mongoose.connection.readyState === 1) {
      reports = await WasteReport.find().lean();
    } else {
      reports = inMemoryDB.reports;
    }

    const totalRequests = reports.length;
    const pendingPickups = reports.filter(r => ['Reported', 'Confirmed', 'Assigned', 'In Progress'].includes(r.status)).length;
    const completedPickups = reports.filter(r => ['Collected', 'Recycled'].includes(r.status)).length;
    const cancelledPickups = reports.filter(r => r.status === 'Cancelled').length;

    // Weight factors per unit (approximate: 1 bag = 4kg, 1 item = 1.5kg, kg = 1kg)
    const calculateWeight = (qty, unit) => {
      const q = Number(qty) || 1;
      if (unit === 'kg') return q;
      if (unit === 'items') return q * 1.5;
      return q * 4.0; // standard bag
    };

    let totalWasteKg = 0;
    reports.forEach(r => {
      totalWasteKg += calculateWeight(r.quantity, r.unit);
    });
    totalWasteKg = Math.round(totalWasteKg * 10) / 10;

    // Category distribution directly from database records
    const categoryTotals = {};
    ALL_CATEGORIES.forEach(cat => {
      categoryTotals[cat] = { count: 0, weightKg: 0 };
    });

    reports.forEach(r => {
      const cat = ALL_CATEGORIES.find(c => c.toLowerCase() === (r.category || '').toLowerCase()) || 'Recyclable';
      const w = calculateWeight(r.quantity, r.unit);
      categoryTotals[cat].count += 1;
      categoryTotals[cat].weightKg += w;
    });

    const categoryDistribution = ALL_CATEGORIES.map(cat => {
      const weight = Math.round(categoryTotals[cat].weightKg * 10) / 10;
      const pct = totalWasteKg > 0 ? Math.round((weight / totalWasteKg) * 100) : 0;
      return {
        category: cat,
        count: categoryTotals[cat].count,
        weightKg: weight,
        percentage: pct
      };
    });

    // Environmental impact estimates
    // Standard EPA factors: ~0.72 kg CO2 saved per kg recycled waste, 1 tree absorbs ~22kg CO2/year
    const estimatedCO2SavedKg = Math.round(totalWasteKg * 0.72 * 10) / 10;
    const estimatedTreesPreserved = Math.round((estimatedCO2SavedKg / 22) * 10) / 10;
    const estimatedKWhEnergySaved = Math.round(totalWasteKg * 1.8 * 10) / 10;

    // Recycling rate calculation
    const nonCancelled = totalRequests - cancelledPickups;
    const recyclingRate = nonCancelled > 0 ? Math.min(100, Math.round((completedPickups / nonCancelled) * 100 * 10) / 10) : 0;

    // Monthly Trends for past 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyTrends = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const mName = monthNames[mIdx];

      // Filter reports in this calendar month
      const monthReports = reports.filter(r => {
        const rDate = new Date(r.createdAt || Date.now());
        return rDate.getMonth() === mIdx && rDate.getFullYear() === yr;
      });

      let collectedKg = 0;
      let recycledKg = 0;
      monthReports.forEach(r => {
        const w = calculateWeight(r.quantity, r.unit);
        collectedKg += w;
        if (['Collected', 'Recycled'].includes(r.status)) {
          recycledKg += w;
        }
      });

      monthlyTrends.push({
        month: mName,
        year: yr,
        collectedKg: Math.round(collectedKg),
        recycledKg: Math.round(recycledKg),
        count: monthReports.length
      });
    }

    res.json({
      success: true,
      stats: {
        totalRequests,
        pendingPickups,
        activePickups: pendingPickups,
        completedPickups,
        cancelledPickups,
        totalWasteKg,
        recyclingRate,
        categoryDistribution,
        monthlyTrends,
        environmentalEstimates: {
          co2SavedKg: estimatedCO2SavedKg,
          treesPreserved: estimatedTreesPreserved,
          kwhEnergySaved: estimatedKWhEnergySaved,
          isEstimated: true,
          notice: 'Figures calculated from recorded waste metrics using standard EPA lifecycle carbon factors.'
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
