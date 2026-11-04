import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';

/**
 * Append-only administrative audit logger.
 * Safely records administrative mutations to MongoDB without blocking primary operations if logging fails.
 */
export const logAdminAction = async ({
  req,
  action,
  entityType,
  entityId = '',
  summary,
  previousValue = null,
  updatedValue = null
}) => {
  try {
    if (mongoose.connection.readyState !== 1) return null;

    const adminId = req?.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)
      ? req.user.id
      : null;

    const entry = await AuditLog.create({
      adminId,
      adminName: req?.user?.name || 'Municipal Administrator',
      adminEmail: req?.user?.email || '',
      action,
      entityType,
      entityId: String(entityId || ''),
      summary,
      previousValue,
      updatedValue,
      timestamp: new Date()
    });
    return entry;
  } catch (err) {
    console.warn('[AuditLog Warning]: Failed to record audit entry:', err.message);
    return null;
  }
};
