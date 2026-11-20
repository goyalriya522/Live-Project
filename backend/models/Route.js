const mongoose = require('mongoose');

const stopSubSchema = new mongoose.Schema(
  {
    stopId: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    landmark: {
      type: String,
      default: '',
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    estimatedMinutesFromStart: {
      type: Number,
      default: 0,
    },
    morningPickupTime: {
      type: String,
      default: '07:30 AM',
    },
    eveningDropTime: {
      type: String,
      default: '05:30 PM',
    },
  },
  { _id: true }
);

const coordinateSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    routeNumber: {
      type: Number,
      min: 1,
      max: 95,
    },
    destination: {
      type: String,
      default: '',
      trim: true,
    },
    routeCode: {
      type: String,
      required: [true, 'Route code is required (e.g. Route 1 or R-01)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      default: null,
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    startPoint: {
      type: String,
      required: true,
    },
    endPoint: {
      type: String,
      required: true,
    },
    totalDistanceKm: {
      type: Number,
      default: 15.5,
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 45,
    },
    stops: [stopSubSchema],
    pathCoordinates: [coordinateSchema],
    isExamRoute: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Route || mongoose.model('Route', routeSchema);

