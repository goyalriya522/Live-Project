const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    examModeEnabled: {
      type: Boolean,
      default: false,
    },
    activeExamScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSchedule',
      default: null,
    },
    examModeMessage: {
      type: String,
      default: 'Semester End Examination transportation schedules and express routes are now active.',
    },
    emergencyAlertActive: {
      type: Boolean,
      default: false,
    },
    activeEmergencyMessage: {
      type: String,
      default: '',
    },
    announcement: {
      type: String,
      default: 'Welcome to CampusBus - Smart College Bus Tracking System.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.SystemSettings || mongoose.model('SystemSettings', systemSettingsSchema);

