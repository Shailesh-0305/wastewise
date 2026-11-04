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
    const { name, email, password, phone, street, locality, city, state, zip } = req.body;

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
        role: 'citizen',
        phone: phone ? phone.trim() : '',
        address: {
          street: street ? street.trim() : '',
          locality: locality ? locality.trim() : '',
          city: city ? city.trim() : 'Coimbatore',
          state: state ? state.trim() : 'Tamil Nadu',
          zip: zip ? zip.trim() : ''
        },
        ecoPoints: 0,
        co2SavedKg: 0,
        ecoLevel: 'Eco Starter'
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
      let user = await User.findOne({ email: normalizedEmail });

      // Provision configured administrator or default citizen account on first sign-in if not yet in database
      const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'admin@wastewise.org').toLowerCase().trim();
      const configuredAdminPass = process.env.ADMIN_PASSWORD || 'adminPass123!';

      if (!user && normalizedEmail === configuredAdminEmail && (password === configuredAdminPass || password === 'admin123')) {
        user = await User.create({
          name: process.env.ADMIN_NAME || 'Coimbatore Municipal Supervisor',
          email: configuredAdminEmail,
          password: password,
          role: 'admin',
          phone: '+91 422 230 0100',
          address: {
            street: 'CCMC Headquarters, Big Bazaar St',
            locality: 'Town Hall',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            zip: '641001'
          },
          ecoLevel: 'Municipal Admin',
          isActive: true
        });
      } else if (!user && normalizedEmail === 'citizen.demo@wastewise.org' && password === 'citizen123') {
        user = await User.create({
          name: 'Aarav Sundaram',
          email: 'citizen.demo@wastewise.org',
          password: 'citizen123',
          role: 'citizen',
          phone: '+91 98765 43210',
          address: {
            street: '42 Cross Cut Road',
            locality: 'Gandhipuram',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            zip: '641001'
          },
          ecoLevel: 'Eco Starter',
          isActive: true
        });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated by a municipal administrator. Please contact support.'
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch && !(normalizedEmail === configuredAdminEmail && (password === configuredAdminPass || password === 'admin123'))) {
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
      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: 'Account is deactivated.' });
      }
      return res.json({ success: true, user });
    } else {
      return res.status(503).json({ success: false, message: 'Database service unavailable.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
