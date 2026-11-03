import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import mongoose from 'mongoose';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server configuration error: JWT_SECRET environment variable is missing.');
  }
  return secret;
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, role: user.role, email: user.email, name: user.name },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, street, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Security requirement: Enforce role citizen for all public registrations
    const role = 'citizen';
    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
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
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please verify MongoDB Atlas connection.'
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

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
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
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please verify MongoDB Atlas connection.'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      return res.json({ success: true, user });
    } else {
      return res.status(503).json({ success: false, message: 'Database service unavailable.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
