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

export const createCentre = async (req, res) => {
  try {
    const {
      name,
      address,
      city = 'Coimbatore',
      lat = 11.0055,
      lng = 76.9661,
      operatingHours = '08:00 - 18:00 (IST)',
      phone = '+91 422 230 0100',
      acceptedMaterials = ['Plastic', 'Recyclable'],
      materialSpecs = 'Standard recyclables',
      imageUrl = ''
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Please provide center name and address.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const newCentreData = {
      name,
      address,
      city,
      coordinates: { lat: Number(lat), lng: Number(lng) },
      operatingHours,
      phone,
      acceptedMaterials,
      materialSpecs,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      distanceTimes: { walkMin: 20, bikeMin: 10, driveMin: 5 }
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

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database connection offline.' });
    }

    const updated = await RecyclingCentre.findByIdAndUpdate(id, req.body, { new: true });
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
