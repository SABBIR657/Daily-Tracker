const mongoose = require('mongoose');

const revisionHistorySchema = new mongoose.Schema({
  date:       { type: Date, required: true },
  confidence: { type: String, enum: ['hard', 'medium', 'easy', 'very-easy'], required: true },
  resource:   { type: String, default: '' },
  notes:      { type: String, default: '' },
}, { timestamps: true });

const revisionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    required: true,
  },
  subject:  { type: String, required: true },
  topic:    { type: String, required: true },

  // Spaced repetition tracking
  revisionCount:   { type: Number, default: 0 },
  nextRevisionDate: { type: Date, required: true },
  lastRevisionDate: { type: Date, default: null },
  mastered:        { type: Boolean, default: false },

  // Full history of every revision session
  history: [revisionHistorySchema],

  // Initial study date — when they first learned this
  firstStudiedDate: { type: Date, default: Date.now },

}, { timestamps: true });

revisionSchema.index({ user: 1, nextRevisionDate: 1 });
revisionSchema.index({ user: 1, subject: 1 });
revisionSchema.index({ user: 1, topic: 1, subject: 1 });

module.exports = mongoose.model('Revision', revisionSchema);