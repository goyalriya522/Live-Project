const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    departureTime: {
      type: String,
      required: true, // e.g. "07:30 AM"
    },
    estimatedArrivalTime: {
      type: String,
      required: true, // e.g. "08:25 AM"
    },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'exam_special'],
      default: 'morning',
    },
    daysOfWeek: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    isExamSchedule: {
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

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);

