import express from 'express';
import User from '../models/User.js';
import { generateToken, authMiddleware } from '../utils/auth.js';

const router = express.Router();

// Create initial developer account (only works if no developer exists)
router.post('/create-developer', async (req, res) => {
  try {
    // Check if a developer already exists
    const existingDev = await User.findOne({ role: 'developer' });
    if (existingDev) {
      return res.status(403).json({ 
        message: 'Developer account already exists' 
      });
    }

    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Username, email, and password are required' 
      });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email already registered' 
      });
    }

    // Create developer account
    const developer = new User({
      username,
      email,
      password,
      role: 'developer'
    });

    await developer.save();

    // Generate token and send response
    const token = generateToken(developer);
    res.status(201).json({
      message: 'Developer account created successfully',
      token,
      user: {
        id: developer._id,
        username: developer.username,
        email: developer.email,
        role: developer.role
      }
    });
  } catch (error) {
    console.error('Create developer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Developer creates admin account
router.post('/create-admin', authMiddleware, async (req, res) => {
  try {
    const { username, email, password, company } = req.body;

    // Check if the creator is a developer
    if (req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Only developers can create admin accounts' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const admin = new User({
      username,
      email,
      password,
      role: 'admin',
      company
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        company: admin.company
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;