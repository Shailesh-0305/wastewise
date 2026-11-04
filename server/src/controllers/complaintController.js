import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';

const VALID_COMPLAINT_CATEGORIES = [
  'Missed Garbage Collection',
  'Illegal Dumping',
  'Overflowing Public Bins',
  'Waste Left in Public Spaces',
  'Damaged Waste Collection Infrastructure',
  'Uncollected Hazardous Waste',
  'Other Sanitation Issues'
];

const VALID_COMPLAINT_STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected'
];

/**
 * POST /api/complaints
 * Submit a new civic sanitation complaint (Citizens & Admins)
 */
export const createComplaint = async (req, res) => {
  try {
    const {
      category,
      description,
      address,
      locality = '',
      ward = '',
      lat,
      lng,
      attachments = [],
      priority
    } = req.body;

    if (!category || !description || !address) {
      return res.status(400).json({
        success: false,
        message: 'Complaint category, description, and location address are required.'
      });
    }

    if (!VALID_COMPLAINT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid complaint category. Allowed: ${VALID_COMPLAINT_CATEGORIES.join(', ')}`
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const userId = req.user?.id;
    let citizenName = req.user?.name || 'Citizen';
    let citizenEmail = req.user?.email || '';
    let citizenPhone = '';

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const userDoc = await User.findById(userId);
      if (userDoc) {
        citizenName = userDoc.name;
        citizenEmail = userDoc.email;
        citizenPhone = userDoc.phone || '';
      }
    }

    const hasCoords = lat !== undefined && lat !== null && lat !== '' && !isNaN(Number(lat)) &&
                      lng !== undefined && lng !== null && lng !== '' && !isNaN(Number(lng));

    const autoPriority = priority || (category === 'Uncollected Hazardous Waste' ? 'Critical' : (category === 'Missed Garbage Collection' ? 'High' : 'Medium'));

    const complaint = await Complaint.create({
      citizen: {
        userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : undefined,
        name: citizenName,
        email: citizenEmail,
        phone: citizenPhone
      },
      category,
      description: String(description).trim(),
      address: String(address).trim(),
      locality: locality ? String(locality).trim() : '',
      ward: ward ? String(ward).trim() : '',
      coordinates: hasCoords ? { lat: Number(lat), lng: Number(lng) } : undefined,
      attachments: Array.isArray(attachments) ? attachments : [],
      priority: autoPriority,
      status: 'Submitted',
      history: [
        {
          status: 'Submitted',
          note: `Complaint submitted by ${citizenName}`,
          updatedBy: citizenName,
          timestamp: new Date()
        }
      ]
    });

    return res.status(201).json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/complaints
 * Citizens: strictly only their own complaints.
 * Admins: all complaints with ward, priority, category, status, and search filters.
 */
export const getAllComplaints = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const { search, ward, priority, status, category } = req.query;
    const andConditions = [];

    // Enforce citizen data ownership
    if (req.user?.role === 'citizen') {
      andConditions.push({
        $or: [
          { 'citizen.userId': req.user.id },
          { 'citizen.email': req.user.email }
        ]
      });
    } else if (req.user?.role === 'driver') {
      andConditions.push({ 'assignedWorker.workerId': req.user.id });
    }

    if (ward && ward !== 'All') {
      andConditions.push({
        $or: [
          { ward: { $regex: ward, $options: 'i' } },
          { locality: { $regex: ward, $options: 'i' } },
          { address: { $regex: ward, $options: 'i' } }
        ]
      });
    }
    if (priority && priority !== 'All') {
      andConditions.push({ priority });
    }
    if (status && status !== 'All') {
      andConditions.push({ status });
    }
    if (category && category !== 'All') {
      andConditions.push({ category });
    }
    if (search) {
      andConditions.push({
        $or: [
          { complaintId: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { 'citizen.name': { $regex: search, $options: 'i' } }
        ]
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/complaints/:id
 * Get single complaint with strict ownership verification
 */
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const complaint = await Complaint.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
        { complaintId: id }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (req.user?.role === 'citizen') {
      const isOwner =
        (complaint.citizen?.userId && String(complaint.citizen.userId) === String(req.user.id)) ||
        (complaint.citizen?.email && complaint.citizen.email.toLowerCase() === (req.user.email || '').toLowerCase());
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own complaints.' });
      }
    }

    return res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/complaints/:id
 * Admin review: update status, priority, assigned worker/department, internal notes, or resolution notes
 */
export const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      assignedDepartment,
      workerId,
      workerName,
      internalNote,
      resolutionNotes,
      ward
    } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const complaint = await Complaint.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
        { complaintId: id }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (status && !VALID_COMPLAINT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VALID_COMPLAINT_STATUSES.join(', ')}`
      });
    }

    const prevStatus = complaint.status;
    const setFields = {};
    const pushFields = {};

    if (status) {
      setFields.status = status;
      if (status === 'Resolved') {
        setFields.resolvedAt = new Date();
      }
    }
    if (priority) setFields.priority = priority;
    if (assignedDepartment !== undefined) setFields.assignedDepartment = assignedDepartment;
    if (ward !== undefined) setFields.ward = ward;
    if (resolutionNotes !== undefined) setFields.resolutionNotes = resolutionNotes;

    if (workerId && mongoose.Types.ObjectId.isValid(workerId)) {
      const worker = await User.findById(workerId);
      if (worker) {
        setFields.assignedWorker = {
          workerId: worker._id,
          name: worker.name,
          phone: worker.phone || ''
        };
        if (!status && complaint.status === 'Submitted') {
          setFields.status = 'Assigned';
        }
      }
    } else if (workerName !== undefined) {
      setFields.assignedWorker = {
        workerId: null,
        name: workerName,
        phone: ''
      };
    }

    if (internalNote && String(internalNote).trim()) {
      pushFields.internalNotes = {
        note: String(internalNote).trim(),
        authorName: req.user?.name || 'Municipal Admin',
        authorId: req.user?.id || '',
        timestamp: new Date()
      };
    }

    const effectiveNextStatus = setFields.status || complaint.status;
    if (status || workerId || resolutionNotes) {
      pushFields.history = {
        status: effectiveNextStatus,
        note: resolutionNotes || internalNote || `Updated to ${effectiveNextStatus} by ${req.user?.name || 'Admin'}`,
        updatedBy: req.user?.name || 'Admin',
        timestamp: new Date()
      };
    }

    const updateDoc = { $set: setFields };
    if (Object.keys(pushFields).length > 0) {
      updateDoc.$push = pushFields;
    }

    const updated = await Complaint.findByIdAndUpdate(complaint._id, updateDoc, { new: true });

    await logAdminAction({
      req,
      action: 'COMPLAINT_UPDATED',
      entityType: 'Complaint',
      entityId: updated.complaintId,
      summary: `Updated complaint ${updated.complaintId} (${prevStatus} -> ${updated.status})`,
      previousValue: { status: prevStatus, priority: complaint.priority },
      updatedValue: { status: updated.status, priority: updated.priority, resolutionNotes: updated.resolutionNotes }
    });

    return res.json({ success: true, complaint: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

