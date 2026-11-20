const mongoose = require('mongoose');

const busLocationSchema = new mongoose.Schema(
  {
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
      unique: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    speedKmH: {
      type: Number,
      default: 35,
    },
    heading: {
      type: Number,
      default: 90, // Degrees 0-360
    },
    nextStopName: {
      type: String,
      default: '',
    },
    nextStopOrder: {
      type: Number,
      default: 0,
    },
    etaNextStopMinutes: {
      type: Number,
      default: 5,
    },
    currentStopIndex: {
      type: Number,
      default: 0,
    },
    pathProgressPercent: {
      type: Number,
      default: 0,
    },
    isLive: {
      type: Boolean,
      default: true,
    },
    isSimulated: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.BusLocation || mongoose.model('BusLocation', busLocationSchema);

