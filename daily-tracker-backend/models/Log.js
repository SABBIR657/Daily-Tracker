const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // The three activity types
  type: {
    type: String,
    enum: ['study', 'workout', 'run'],
    required: true,
  },

  // --- Shared fields ---
  duration: { type: Number, required: true }, // in minutes
  date:     { type: Date,   required: true },
  notes:    { type: String, default: '' },

  // --- Study-specific ---
  subject: { type: String, default: '' }, // e.g. "Mathematics"
  topic:   { type: String, default: '' }, // e.g. "Integration"

  // --- Run-specific ---
  distance: { type: Number, default: 0 }, // in km

  // --- Workout-specific ---
  workoutType: {
    type: String,
    enum: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'fullbody', ''],
    default: '',
  },
  exercises: [
    {
      name: { type: String },
      sets: { type: Number },
      reps: { type: Number },
      weight: { type: Number, default: 0 }, // in kg
    }
  ],

}, { timestamps: true });

// Index for fast queries by user + date (dashboard will use this constantly)
logSchema.index({ user: 1, date: -1 });
logSchema.index({ user: 1, type: 1, date: -1 });

module.exports = mongoose.model('Log', logSchema);