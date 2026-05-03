const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      goals: user.goals,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id:      user._id,
      name:     user.name,
      email:    user.email,
      goals:    user.goals,
      isPublic: user.isPublic,
      token:    generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me  — returns logged-in user's profile
const getMe = async (req, res) => {
  res.json(req.user); // req.user is set by the auth middleware
};

// PUT /api/auth/goals  — update weekly goals
const updateGoals = async (req, res) => {
  try {
    const { studyHours, workoutDays, runKm } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        goals: { studyHours, workoutDays, runKm }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ goals: user.goals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, updateGoals };