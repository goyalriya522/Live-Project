const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { store } = require('../utils/memoryStore');
const User = require('../models/User');
const mongoose = require('mongoose');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'campusbus_jwt_secret_dev_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', phone, studentId, licenseNumber, assignedBus, assignedRoute, selectedStop } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const emailLower = email.toLowerCase().trim();

    // Check existing
    const existing = store.users.find((u) => u.email === emailLower);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}`;

    const newUser = {
      _id: userId,
      name,
      email: emailLower,
      password: hashedPassword,
      role,
      phone: phone || '',
      studentId: studentId || '',
      licenseNumber: licenseNumber || '',
      assignedBus: assignedBus || null,
      assignedRoute: assignedRoute || null,
      selectedStop: selectedStop || null,
      isActive: true,
      avatar: null,
      createdAt: new Date(),
    };

    store.users.push(newUser);

    const token = generateToken(userId, role);

    // Return safe user object
    const userSafe = { ...newUser };
    delete userSafe.password;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: userSafe,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const emailLower = email.toLowerCase().trim();
    let user = store.users.find((u) => u.email === emailLower);

    // If user not in store or store user has no password, query MongoDB directly with .select('+password')
    if ((!user || !user.password) && mongoose.connection.readyState === 1) {
      try {
        const dbUser = await User.findOne({ email: emailLower }).select('+password').lean();
        if (dbUser) {
          const formattedDbUser = {
            ...dbUser,
            _id: dbUser._id.toString(),
            assignedBus: dbUser.assignedBus ? dbUser.assignedBus.toString() : null,
            assignedRoute: dbUser.assignedRoute ? dbUser.assignedRoute.toString() : null,
          };
          const existingIdx = store.users.findIndex((u) => u.email === emailLower);
          if (existingIdx !== -1) {
            store.users[existingIdx] = { ...store.users[existingIdx], ...formattedDbUser };
            user = store.users[existingIdx];
          } else {
            store.users.push(formattedDbUser);
            user = formattedDbUser;
          }
        }
      } catch (dbErr) {
        console.warn('[Auth] MongoDB user retrieval notice:', dbErr.message);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User with this email does not exist.',
      });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account found, but role mismatch. Expected '${role}', registered as '${user.role}'.`,
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact the administrator.',
      });
    }

    const token = generateToken(user._id, user.role);

    // Fetch assigned bus and route details
    const assignedBusObj = store.buses.find((b) => String(b._id) === String(user.assignedBus));
    const assignedRouteObj = store.routes.find((r) => String(r._id) === String(user.assignedRoute));

    const userSafe = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      studentId: user.studentId,
      licenseNumber: user.licenseNumber,
      assignedBus: assignedBusObj || user.assignedBus,
      assignedRoute: assignedRouteObj || user.assignedRoute,
      selectedStop: user.selectedStop,
      avatar: user.avatar,
    };

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: userSafe,
      data: {
        user: userSafe,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;

    const assignedBusObj = store.buses.find((b) => String(b._id) === String(user.assignedBus));
    const assignedRouteObj = store.routes.find((r) => String(r._id) === String(user.assignedRoute));

    const userSafe = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      studentId: user.studentId,
      licenseNumber: user.licenseNumber,
      assignedBus: assignedBusObj || null,
      assignedRoute: assignedRouteObj || null,
      selectedStop: user.selectedStop,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      data: userSafe,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = store.users.find((u) => String(u._id) === String(req.user._id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { name, phone, studentId, assignedBus, assignedRoute, selectedStop, avatar } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (studentId !== undefined) user.studentId = studentId;
    if (assignedBus !== undefined) user.assignedBus = assignedBus;
    if (assignedRoute !== undefined) user.assignedRoute = assignedRoute;
    if (selectedStop !== undefined) user.selectedStop = selectedStop;
    if (avatar !== undefined) user.avatar = avatar;

    const userSafe = { ...user };
    delete userSafe.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: userSafe,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
};

