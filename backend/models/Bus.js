const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Bus number is required (e.g. Bus 1 or PB-03-101)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required (e.g. PB-03-AB-1234)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Bus capacity is required'],
      default: 52,
    },
    model: {
      type: String,
      default: 'College Standard Transit Bus',
    },
    year: {
      type: Number,
      default: 2023,
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive', 'on_trip'],
      default: 'active',
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
    },
    currentTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Bus || mongoose.model('Bus', busSchema);

