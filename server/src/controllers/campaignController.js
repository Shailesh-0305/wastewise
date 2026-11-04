import Campaign from '../models/Campaign.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * GET /api/campaigns
 * Admin: returns all campaigns and announcements with filters.
 * Citizens/Workers: returns only published/active campaigns targeted to their audience or ward.
 */
export const getAllCampaigns = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { status, category, type, ward, search } = req.query;
    const andConditions = [];

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      // Citizens/Workers only receive published/active campaigns matching their target audience & ward
      andConditions.push({
        $or: [
          { isPublished: true },
          { status: { $in: ['Scheduled', 'Active'] } }
        ]
      });

      if (req.user?.role === 'citizen') {
        andConditions.push({
          targetAudience: { $in: ['All Citizens', 'Specific Wards', 'All Users'] }
        });
      } else if (req.user?.role === 'driver') {
        andConditions.push({
          targetAudience: { $in: ['Collection Workers', 'All Users'] }
        });
      }

      if (ward && ward !== 'All') {
        andConditions.push({
          $or: [
            { targetWards: { $size: 0 } },
            { targetWards: 'All Wards' },
            { targetWards: { $regex: ward, $options: 'i' } }
          ]
        });
      }
    } else {
      if (status && status !== 'All') andConditions.push({ status });
      if (category && category !== 'All') andConditions.push({ category });
      if (type && type !== 'All') andConditions.push({ type });
      if (ward && ward !== 'All') {
        andConditions.push({ targetWards: { $regex: ward, $options: 'i' } });
      }
    }

    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};
    const campaigns = await Campaign.find(query).sort({ startDate: 1, createdAt: -1 });
    return res.json({ success: true, count: campaigns.length, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/campaigns
 * Create a new community campaign or municipal announcement (Admin only)
 */
export const createCampaign = async (req, res) => {
  try {
    const {
      title,
      description,
      category = 'Community Cleanliness Drives',
      type = 'Campaign',
      startDate,
      endDate,
      targetWards = ['All Wards'],
      targetAudience = 'All Citizens',
      location = 'Coimbatore Municipal Limits',
      bannerImage = '',
      participationInstructions = '',
      status = 'Draft',
      isPublished = false
    } = req.body;

    if (!title || !String(title).trim() || !description || !String(description).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Campaign title and description are required.'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const parsedStart = startDate ? new Date(startDate) : new Date();
    const parsedEnd = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 86400000);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime()) || parsedEnd < parsedStart) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid start and end dates (end date must be on or after start date).'
      });
    }

    const parsedWards = Array.isArray(targetWards)
      ? targetWards.map(w => String(w).trim()).filter(Boolean)
      : String(targetWards || 'All Wards').split(',').map(w => w.trim()).filter(Boolean);

    const publishFlag = Boolean(isPublished || ['Scheduled', 'Active'].includes(status));

    const campaign = await Campaign.create({
      title: String(title).trim(),
      description: String(description).trim(),
      category,
      type,
      startDate: parsedStart,
      endDate: parsedEnd,
      targetWards: parsedWards.length > 0 ? parsedWards : ['All Wards'],
      targetAudience,
      location: String(location).trim(),
      bannerImage,
      participationInstructions,
      status,
      isPublished: publishFlag,
      publishedAt: publishFlag ? new Date() : null,
      createdBy: {
        userId: req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : null,
        name: req.user?.name || 'Municipal Administrator'
      }
    });

    await logAdminAction({
      req,
      action: publishFlag ? 'CAMPAIGN_PUBLISHED' : 'CAMPAIGN_CREATED',
      entityType: 'Campaign',
      entityId: campaign._id,
      summary: `${publishFlag ? 'Published' : 'Created'} ${campaign.type}: '${campaign.title}' (${campaign.status})`,
      previousValue: null,
      updatedValue: { title: campaign.title, status: campaign.status, targetWards: campaign.targetWards }
    });

    return res.status(201).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/campaigns/:id
 * Update or publish/cancel a campaign or announcement (Admin only)
 */
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const existing = await Campaign.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const updateFields = { ...req.body };
    if (req.body.targetWards !== undefined && !Array.isArray(req.body.targetWards)) {
      updateFields.targetWards = String(req.body.targetWards)
        .split(',')
        .map(w => w.trim())
        .filter(Boolean);
    }

    if (req.body.isPublished === true || ['Scheduled', 'Active'].includes(req.body.status)) {
      updateFields.isPublished = true;
      if (!existing.publishedAt) updateFields.publishedAt = new Date();
    } else if (req.body.status === 'Draft' || req.body.status === 'Cancelled') {
      updateFields.isPublished = false;
    }

    const updated = await Campaign.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    await logAdminAction({
      req,
      action: updated.isPublished && !existing.isPublished ? 'CAMPAIGN_PUBLISHED' : 'CAMPAIGN_UPDATED',
      entityType: 'Campaign',
      entityId: updated._id,
      summary: `Updated campaign '${updated.title}' (Status: ${updated.status})`,
      previousValue: { status: existing.status, isPublished: existing.isPublished },
      updatedValue: { status: updated.status, isPublished: updated.isPublished }
    });

    return res.json({ success: true, campaign: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/campaigns/:id
 */
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const deleted = await Campaign.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    await logAdminAction({
      req,
      action: 'CAMPAIGN_DELETED',
      entityType: 'Campaign',
      entityId: deleted._id,
      summary: `Deleted campaign '${deleted.title}'`,
      previousValue: { title: deleted.title },
      updatedValue: null
    });

    return res.json({ success: true, message: 'Campaign deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

