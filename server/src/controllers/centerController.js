import RecyclingCentre from '../models/RecyclingCentre.js';
import { inMemoryDB } from '../store/inMemoryStore.js';
import mongoose from 'mongoose';

export const getAllCentres = async (req, res) => {
  try {
    const { material, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (material && material !== 'All') {
        query.acceptedMaterials = material;
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
    } else {
      let list = [...inMemoryDB.centres];
      if (material && material !== 'All') {
        list = list.filter(c =>
          c.acceptedMaterials.some(m => m.toLowerCase() === material.toLowerCase())
        );
      }
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(c =>
          c.name.toLowerCase().includes(s) ||
          c.address.toLowerCase().includes(s) ||
          c.city.toLowerCase().includes(s)
        );
      }
      return res.json({ success: true, count: list.length, centres: list });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCentreById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const centre = await RecyclingCentre.findById(id);
      if (!centre) {
        return res.status(404).json({ success: false, message: 'Recycling centre not found' });
      }
      return res.json({ success: true, centre });
    } else {
      const centre = inMemoryDB.centres.find(c => c._id === id);
      if (!centre) {
        return res.status(404).json({ success: false, message: 'Recycling centre not found' });
      }
      return res.json({ success: true, centre });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCentre = async (req, res) => {
  try {
    const {
      name,
      address,
      city = 'New York',
      lat = 40.8448,
      lng = -73.8648,
      operatingHours = '08:00 - 20:00',
      phone = '+1 (212) 555-0100',
      acceptedMaterials = ['Plastic', 'Recyclable'],
      materialSpecs = 'Standard recyclables',
      imageUrl = ''
    } = req.body;

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

    if (mongoose.connection.readyState === 1) {
      const centre = await RecyclingCentre.create(newCentreData);
      return res.status(201).json({ success: true, centre });
    } else {
      const centre = {
        _id: 'c_' + Date.now(),
        ...newCentreData,
        createdAt: new Date().toISOString()
      };
      inMemoryDB.centres.push(centre);
      return res.status(201).json({ success: true, centre });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCentre = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const updated = await RecyclingCentre.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Centre not found' });
      return res.json({ success: true, centre: updated });
    } else {
      const index = inMemoryDB.centres.findIndex(c => c._id === id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Centre not found' });
      inMemoryDB.centres[index] = { ...inMemoryDB.centres[index], ...req.body };
      return res.json({ success: true, centre: inMemoryDB.centres[index] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCentre = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      await RecyclingCentre.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Centre deleted successfully' });
    } else {
      const index = inMemoryDB.centres.findIndex(c => c._id === id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Centre not found' });
      inMemoryDB.centres.splice(index, 1);
      return res.json({ success: true, message: 'Centre deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
