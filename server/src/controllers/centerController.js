import RecyclingCentre from '../models/RecyclingCentre.js';
import mongoose from 'mongoose';

export const getAllCentres = async (req, res) => {
  try {
    const { material, search, city } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    let query = {};
    if (material && material !== 'All') {
      query.acceptedMaterials = material;
    }
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const centres = await RecyclingCentre.find(query).sort({ rating: -1 });
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
      return res.status(404).json({ success: false, message: 'Recycling centre not found' });
    }
    return res.json({ success: true, centre });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const VALID_MATERIALS = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass', 'Batteries', 'Paper'];

export const createCentre = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      lat,
      lng,
      operatingHours,
      phone,
      acceptedMaterials,
      materialSpecs,
      imageUrl
    } = req.body;

    // 1. Validate centre name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid centre name.' });
    }

    // 2. Validate address
    if (!address || typeof address !== 'string' || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid street address.' });
    }

    // 3. Validate city
    const cleanCity = city ? String(city).trim() : 'Coimbatore';
    if (!cleanCity) {
      return res.status(400).json({ success: false, message: 'Please provide a valid city name.' });
    }

    // 4. Validate coordinates (do not silently default)
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude coordinates are required for a map-visible centre.'
      });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);

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

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const newCentreData = {
      name: name.trim(),
      address: address.trim(),
      city: cleanCity,
      coordinates: { lat: numLat, lng: numLng },
      operatingHours: operatingHours ? String(operatingHours).trim() : '08:00 - 18:00 (IST)',
      phone: phone ? String(phone).trim() : '',
      acceptedMaterials,
      materialSpecs: materialSpecs ? String(materialSpecs).trim() : '',
      imageUrl: imageUrl ? String(imageUrl).trim() : ''
    };

    const centre = await RecyclingCentre.create(newCentreData);
    return res.status(201).json({ success: true, centre });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCentre = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, coordinates, acceptedMaterials } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const updateFields = { ...req.body };

    if (lat !== undefined || lng !== undefined) {
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

    const updated = await RecyclingCentre.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Centre not found' });
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
    return res.json({ success: true, message: 'Centre deleted successfully from database.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
