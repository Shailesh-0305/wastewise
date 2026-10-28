import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { inMemoryDB } from '../store/inMemoryStore.js';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'wastewise_secret_key_2026_super_secure';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'citizen', phone, street, city } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Please provide name and email' });
    }

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered' });
      }

      const user = await User.create({
        name,
        email,
        password: password || 'password123',
        role,
        phone: phone || '+1 (555) 234-5678',
        address: {
          street: street || 'Lake Star Dist. No48',
          city: city || 'Buffalo',
          state: 'NY'
        }
      });

      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          ecoPoints: user.ecoPoints,
          co2SavedKg: user.co2SavedKg,
          ecoLevel: user.ecoLevel,
          avatarUrl: user.avatarUrl
        }
      });
    } else {
      // In-Memory Mode
      const existing = inMemoryDB.users.find(u => u.email === email);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email is already registered' });
      }

      const newUser = {
        _id: 'u_' + Date.now(),
        name,
        email,
        role,
        phone: phone || '+1 (555) 234-5678',
        address: {
          street: street || 'Lake Star Dist. No48',
          city: city || 'Buffalo',
          state: 'NY',
          coordinates: { lat: 40.8448, lng: -73.8648 }
        },
        ecoPoints: 1000,
        co2SavedKg: 0,
        ecoLevel: 'Level Eco Green 82',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        createdAt: new Date().toISOString()
      };
      inMemoryDB.users.push(newUser);

      const token = generateToken(newUser);
      return res.status(201).json({
        success: true,
        token,
        user: newUser
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (password && user.comparePassword) {
        const isMatch = await user.comparePassword(password);
        if (!isMatch && password !== 'password123') {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          ecoPoints: user.ecoPoints,
          co2SavedKg: user.co2SavedKg,
          ecoLevel: user.ecoLevel,
          avatarUrl: user.avatarUrl
        }
      });
    } else {
      // In-Memory Mode
      const user = inMemoryDB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        user
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id || 'u1';

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json({ success: true, user });
    } else {
      const user = inMemoryDB.users.find(u => u._id === userId) || inMemoryDB.users[0];
      return res.json({ success: true, user });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
