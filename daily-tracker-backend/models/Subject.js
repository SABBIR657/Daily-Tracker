const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'done', 'revised'],
    default: 'not-started',
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const subjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#6366f1', // used in UI to color-code subjects
  },
  targetDate: {
    type: Date,
    default: null, // exam or completion deadline
  },
  topics: [topicSchema],

}, { timestamps: true });

// Virtual — auto-calculate completion percentage
subjectSchema.virtual('completionPercent').get(function () {
  if (!this.topics.length) return 0;
  const done = this.topics.filter(t => t.status === 'done' || t.status === 'revised').length;
  return Math.round((done / this.topics.length) * 100);
});

subjectSchema.set('toJSON', { virtuals: true });

subjectSchema.index({ user: 1 });

module.exports = mongoose.model('Subject', subjectSchema);