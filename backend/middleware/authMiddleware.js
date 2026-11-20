const jwt = require('jsonwebtoken');
const { store } = require('../utils/memoryStore');
const User = require('../models/User');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please provide a valid Bearer token.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'campusbus_jwt_secret_dev_key_2026';
    const decoded = jwt.verify(token, secret);

    // Look in store first or DB
    let user = store.users.find((u) => String(u._id) === String(decoded.id));

    if (!user && mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated. Please contact the administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Token is invalid or expired.',
      error: error.message,
    });
  }
};

module.exports = { protect };

