import WasteReport from '../models/WasteReport.js';
import mongoose from 'mongoose';

const ALL_CATEGORIES = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];

export const getAnalyticsOverview = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection offline. Please check MongoDB Atlas connection.'
      });
    }

    const reports = await WasteReport.find().lean();

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
    let totalCollectedWasteKg = 0;
    let totalRecycledWasteKg = 0;

    reports.forEach(r => {
      const w = calculateWeight(r.quantity, r.unit);
      totalWasteKg += w;
      if (['Collected', 'Recycled'].includes(r.status)) {
        totalCollectedWasteKg += w;
      }
      if (r.status === 'Recycled') {
        totalRecycledWasteKg += w;
      }
    });

    totalWasteKg = Math.round(totalWasteKg * 10) / 10;
    totalCollectedWasteKg = Math.round(totalCollectedWasteKg * 10) / 10;
    totalRecycledWasteKg = Math.round(totalRecycledWasteKg * 10) / 10;

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

    // Environmental impact estimates calculated ONLY on diverted/collected waste
    // Standard EPA factors: ~0.72 kg CO2 saved per kg recycled waste; 1 mature tree absorbs ~22kg CO2/year; 1.8 kWh energy saved/kg
    const estimatedCO2SavedKg = Math.round(totalCollectedWasteKg * 0.72 * 10) / 10;
    const estimatedTreesPreserved = Math.round((estimatedCO2SavedKg / 22) * 10) / 10;
    const estimatedKWhEnergySaved = Math.round(totalCollectedWasteKg * 1.8 * 10) / 10;

    // Recycling rate strictly as (Total recycled waste quantity / Total collected waste quantity) * 100
    const recyclingRate = totalCollectedWasteKg > 0
      ? Math.min(100, Math.round((totalRecycledWasteKg / totalCollectedWasteKg) * 100 * 10) / 10)
      : 0;

    // Monthly Trends for past 6 months - only include collected/recycled reports
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyTrends = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const mName = monthNames[mIdx];

      // Filter reports in this calendar month that reached Collected or Recycled stage
      const monthReports = reports.filter(r => {
        const rDate = new Date(r.createdAt || Date.now());
        const isThisMonth = rDate.getMonth() === mIdx && rDate.getFullYear() === yr;
        return isThisMonth && ['Collected', 'Recycled'].includes(r.status);
      });

      let collectedKg = 0;
      let recycledKg = 0;
      monthReports.forEach(r => {
        const w = calculateWeight(r.quantity, r.unit);
        collectedKg += w;
        if (r.status === 'Recycled') {
          recycledKg += w;
        }
      });

      monthlyTrends.push({
        month: mName,
        year: yr,
        collectedKg: Math.round(collectedKg * 10) / 10,
        recycledKg: Math.round(recycledKg * 10) / 10,
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
        totalCollectedWasteKg,
        totalRecycledWasteKg,
        recyclingRate,
        categoryDistribution,
        monthlyTrends,
        environmentalEstimates: {
          co2SavedKg: estimatedCO2SavedKg,
          treesPreserved: estimatedTreesPreserved,
          kwhEnergySaved: estimatedKWhEnergySaved,
          isEstimated: true,
          methodology: 'Heuristic estimate calculated on collected and diverted municipal waste',
          notice: 'Heuristic figures calculated solely on diverted/collected waste using standard EPA lifecycle carbon factors (0.72 kg CO2/kg waste; 22 kg CO2/tree/yr; 1.8 kWh/kg waste).'
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
