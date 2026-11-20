const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Stop name is required'],
      trim: true,
    },
    landmark: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    zone: {
      type: String,
      default: 'Main Campus Corridor',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Stop || mongoose.model('Stop', stopSchema);

