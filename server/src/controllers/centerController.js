import RecyclingCentre from '../models/RecyclingCentre.js';
import mongoose from 'mongoose';
import { logAdminAction } from '../utils/auditLogger.js';

const VALID_MATERIALS = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass', 'Batteries', 'Paper', 'Hazardous'];
const VALID_CENTRE_TYPES = [
  'General Recycling',
  'E-Waste',
  'Hazardous Waste',
  'Composting',
  'Material Recovery Facility',
  'Glass and Metal Recovery',
  'Plastic Recovery',
  'Battery Disposal',
  'Medical Waste Collection',
  'Special Recovery Facility'
];
const SPECIAL_DISPOSAL_TYPES = [
  'E-Waste',
  'Hazardous Waste',
  'Composting',
  'Battery Disposal',
  'Medical Waste Collection',
  'Special Recovery Facility'
];

export const getAllCentres = async (req, res) => {
  try {
    const {
      material,
      search,
      city,
      locality,
      ward,
      centreType,
      facilityCategory,
      isDisposalFacility,
      verificationStatus,
      operationalStatus,
      includeInactive
    } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const andConditions = [];

    // Unless admin explicitly requests inactive records, only show active facilities to public/citizens
    if (includeInactive !== 'true') {
      andConditions.push({ isActive: { $ne: false } });
    }

    if (material && material !== 'All') {
      andConditions.push({ acceptedMaterials: material });
    }
    if (city && city !== 'All') {
      andConditions.push({ city: { $regex: city, $options: 'i' } });
    }
    if (locality && locality !== 'All') {
      andConditions.push({
        $or: [
          { locality: { $regex: locality, $options: 'i' } },
          { address: { $regex: locality, $options: 'i' } }
        ]
      });
    }
    if (ward && ward !== 'All') {
      andConditions.push({ ward: { $regex: ward, $options: 'i' } });
    }
    if (centreType && centreType !== 'All') {
      andConditions.push({ centreType });
    }
    if (facilityCategory && facilityCategory !== 'All') {
      andConditions.push({ facilityCategory });
    }
    if (isDisposalFacility === 'true') {
      andConditions.push({
        $or: [
          { isDisposalFacility: true },
          { facilityCategory: { $in: ['Disposal Facility', 'Integrated Facility'] } },
          { centreType: { $in: SPECIAL_DISPOSAL_TYPES } },
          { acceptedMaterials: { $in: ['Electronic', 'Medical', 'Batteries', 'Hazardous'] } }
        ]
      });
    }
    if (verificationStatus && verificationStatus !== 'All') {
      andConditions.push({ verificationStatus });
    }
    if (operationalStatus && operationalStatus !== 'All') {
      andConditions.push({ operationalStatus });
    }
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { locality: { $regex: search, $options: 'i' } },
          { ward: { $regex: search, $options: 'i' } },
          { centreType: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};
    const centres = await RecyclingCentre.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: centres.length, centres });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCentreById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const centre = await RecyclingCentre.findById(id);
    if (!centre) {
      return res.status(404).json({ success: false, message: 'Recycling centre or facility not found' });
    }
    return res.json({ success: true, centre });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCentre = async (req, res) => {
  try {
    const {
      name,
      address,
      locality = '',
      ward = '',
      city,
      centreType = 'General Recycling',
      facilityCategory,
      isDisposalFacility,
      verificationStatus = 'Pending Verification',
      operationalStatus = 'Operational',
      lat,
      lng,
      coordinates,
      operatingHours = '',
      phone = '',
      contactPerson = '',
      email = '',
      acceptedMaterials,
      materialSpecs = '',
      imageUrl = ''
    } = req.body;

    // 1. Validate centre name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid centre or facility name.' });
    }

    // 2. Validate address
    if (!address || typeof address !== 'string' || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid street address.' });
    }

    // 3. Validate city
    const cleanCity = city ? String(city).trim() : 'Coimbatore';

    // 4. Validate actual coordinates (never default silently to Coimbatore city centre)
    const rawLat = lat !== undefined ? lat : coordinates?.lat;
    const rawLng = lng !== undefined ? lng : coordinates?.lng;

    if (rawLat === undefined || rawLat === null || rawLat === '' || rawLng === undefined || rawLng === null || rawLng === '') {
      return res.status(400).json({
        success: false,
        message: 'Valid actual latitude and longitude coordinates are required. Defaulting to city-centre coordinates is not permitted.'
      });
    }

    const numLat = Number(rawLat);
    const numLng = Number(rawLng);

    if (isNaN(numLat) || numLat < -90 || numLat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be a valid number between -90 and 90 degrees.'
      });
    }

    if (isNaN(numLng) || numLng < -180 || numLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be a valid number between -180 and 180 degrees.'
      });
    }

    // 5. Validate accepted material categories
    if (!Array.isArray(acceptedMaterials) || acceptedMaterials.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Accepted materials must be a non-empty array from: ${VALID_MATERIALS.join(', ')}`
      });
    }

    const invalidMaterials = acceptedMaterials.filter(m => !VALID_MATERIALS.includes(m));
    if (invalidMaterials.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid materials: ${invalidMaterials.join(', ')}. Valid options: ${VALID_MATERIALS.join(', ')}`
      });
    }

    if (centreType && !VALID_CENTRE_TYPES.includes(centreType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid centreType. Must be one of: ${VALID_CENTRE_TYPES.join(', ')}`
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const computedIsDisposal = isDisposalFacility !== undefined
      ? Boolean(isDisposalFacility)
      : (facilityCategory === 'Disposal Facility' || SPECIAL_DISPOSAL_TYPES.includes(centreType));

    const newCentreData = {
      name: name.trim(),
      address: address.trim(),
      locality: locality ? String(locality).trim() : '',
      ward: ward ? String(ward).trim() : '',
      city: cleanCity,
      centreType,
      facilityCategory: facilityCategory || (computedIsDisposal ? 'Disposal Facility' : 'Recycling Centre'),
      isDisposalFacility: computedIsDisposal,
      verificationStatus: verificationStatus || 'Pending Verification',
      operationalStatus: operationalStatus || 'Operational',
      isActive: operationalStatus !== 'Deactivated',
      coordinates: { lat: numLat, lng: numLng },
      operatingHours: operatingHours ? String(operatingHours).trim() : '',
      phone: phone ? String(phone).trim() : '',
      contactPerson: contactPerson ? String(contactPerson).trim() : '',
      email: email ? String(email).trim() : '',
      acceptedMaterials,
      materialSpecs: materialSpecs ? String(materialSpecs).trim() : '',
      imageUrl: imageUrl ? String(imageUrl).trim() : ''
    };

    const centre = await RecyclingCentre.create(newCentreData);

    await logAdminAction({
      req,
      action: computedIsDisposal ? 'FACILITY_CREATED' : 'CENTRE_CREATED',
      entityType: computedIsDisposal ? 'DisposalFacility' : 'RecyclingCentre',
      entityId: centre._id,
      summary: `Created ${centre.facilityCategory}: ${centre.name} (${centre.centreType})`,
      previousValue: null,
      updatedValue: { name: centre.name, centreType: centre.centreType, verificationStatus: centre.verificationStatus }
    });

    return res.status(201).json({ success: true, centre });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCentre = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, coordinates, acceptedMaterials, operationalStatus, isActive } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const existing = await RecyclingCentre.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Centre or facility not found' });

    const updateFields = { ...req.body };

    if (lat !== undefined || lng !== undefined || coordinates !== undefined) {
      const numLat = Number(lat !== undefined ? lat : coordinates?.lat);
      const numLng = Number(lng !== undefined ? lng : coordinates?.lng);
      if (isNaN(numLat) || numLat < -90 || numLat > 90 || isNaN(numLng) || numLng < -180 || numLng > 180) {
        return res.status(400).json({ success: false, message: 'Coordinates must be valid numbers (lat -90..90, lng -180..180).' });
      }
      updateFields.coordinates = { lat: numLat, lng: numLng };
    }

    if (acceptedMaterials !== undefined) {
      if (!Array.isArray(acceptedMaterials) || acceptedMaterials.length === 0) {
        return res.status(400).json({ success: false, message: 'Accepted materials must be a non-empty array.' });
      }
      const invalid = acceptedMaterials.filter(m => !VALID_MATERIALS.includes(m));
      if (invalid.length > 0) {
        return res.status(400).json({ success: false, message: `Invalid materials: ${invalid.join(', ')}` });
      }
    }

    if (operationalStatus === 'Deactivated' || isActive === false) {
      updateFields.isActive = false;
      updateFields.operationalStatus = 'Deactivated';
    } else if (isActive === true && existing.operationalStatus === 'Deactivated') {
      updateFields.isActive = true;
      if (!operationalStatus) updateFields.operationalStatus = 'Operational';
    }

    const updated = await RecyclingCentre.findByIdAndUpdate(id, updateFields, { new: true });

    await logAdminAction({
      req,
      action: existing.isDisposalFacility ? 'FACILITY_UPDATED' : 'CENTRE_UPDATED',
      entityType: existing.isDisposalFacility ? 'DisposalFacility' : 'RecyclingCentre',
      entityId: updated._id,
      summary: `Updated ${updated.name} (${updated.operationalStatus}, ${updated.verificationStatus})`,
      previousValue: { operationalStatus: existing.operationalStatus, verificationStatus: existing.verificationStatus },
      updatedValue: { operationalStatus: updated.operationalStatus, verificationStatus: updated.verificationStatus }
    });

    return res.json({ success: true, centre: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCentre = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const deleted = await RecyclingCentre.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Centre not found' });

    await logAdminAction({
      req,
      action: deleted.isDisposalFacility ? 'FACILITY_DELETED' : 'CENTRE_DELETED',
      entityType: deleted.isDisposalFacility ? 'DisposalFacility' : 'RecyclingCentre',
      entityId: deleted._id,
      summary: `Deleted facility ${deleted.name}`,
      previousValue: { name: deleted.name, address: deleted.address },
      updatedValue: null
    });

    return res.json({ success: true, message: 'Centre deleted successfully from database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
