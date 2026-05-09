const Revision = require('../models/Revision');
const dayjs    = require('dayjs');

// Spaced repetition intervals based on confidence
const getNextRevisionDate = (confidence, revisionCount) => {
  const intervals = {
    'hard':      1,
    'medium':    3,
    'easy':      7,
    'very-easy': 14,
  };

  // Increase interval slightly with each successful revision
  const baseInterval = intervals[confidence];
  const multiplier   = confidence === 'hard' ? 1 : 1 + (revisionCount * 0.1);
  const days         = Math.round(baseInterval * multiplier);

  return dayjs().add(days, 'day').toDate();
};

// GET /api/revisions — get all revisions for user
const getRevisions = async (req, res) => {
  try {
    const { subject, mastered } = req.query;
    const filter = { user: req.user._id };

    if (subject)  filter.subject  = subject;
    if (mastered !== undefined) filter.mastered = mastered === 'true';

    const revisions = await Revision.find(filter).sort({ nextRevisionDate: 1 });
    res.json(revisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/revisions/due — topics due for revision today
const getDueRevisions = async (req, res) => {
  try {
    const endOfToday = dayjs().endOf('day').toDate();

    const due = await Revision.find({
      user:             req.user._id,
      mastered:         false,
      nextRevisionDate: { $lte: endOfToday },
    }).sort({ nextRevisionDate: 1 });

    res.json(due);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/revisions/stats — summary for dashboard
const getRevisionStats = async (req, res) => {
  try {
    const endOfToday = dayjs().endOf('day').toDate();

    const [total, mastered, dueToday] = await Promise.all([
      Revision.countDocuments({ user: req.user._id }),
      Revision.countDocuments({ user: req.user._id, mastered: true }),
      Revision.countDocuments({
        user:             req.user._id,
        mastered:         false,
        nextRevisionDate: { $lte: endOfToday },
      }),
    ]);

    res.json({ total, mastered, dueToday, active: total - mastered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/revisions — add a new topic to revision tracker
const createRevision = async (req, res) => {
  try {
    const { subject, topic, firstStudiedDate } = req.body;

    // Check for duplicate
    const existing = await Revision.findOne({
      user: req.user._id,
      subject,
      topic,
    });

    if (existing) {
      return res.status(400).json({ message: 'This topic is already in your revision list' });
    }

    // First revision due tomorrow by default
    const nextRevisionDate = dayjs().add(1, 'day').toDate();

    const revision = await Revision.create({
      user: req.user._id,
      subject,
      topic,
      firstStudiedDate: firstStudiedDate || new Date(),
      nextRevisionDate,
    });

    res.status(201).json(revision);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/revisions/:id/revise — mark as revised with confidence
const markRevised = async (req, res) => {
  try {
    const { confidence, resource, notes } = req.body;
    const revision = await Revision.findById(req.params.id);

    if (!revision) return res.status(404).json({ message: 'Revision not found' });
    if (revision.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    const now = new Date();

    // Add to history
    revision.history.push({ date: now, confidence, resource, notes });
    revision.revisionCount   += 1;
    revision.lastRevisionDate = now;
    revision.nextRevisionDate = getNextRevisionDate(confidence, revision.revisionCount);

    // Mark as mastered after 5 easy/very-easy revisions
    const easyRevisions = revision.history.filter(
      (h) => h.confidence === 'easy' || h.confidence === 'very-easy'
    ).length;
    if (easyRevisions >= 5) revision.mastered = true;

    await revision.save();
    res.json(revision);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/revisions/:id
const deleteRevision = async (req, res) => {
  try {
    const revision = await Revision.findById(req.params.id);

    if (!revision) return res.status(404).json({ message: 'Revision not found' });
    if (revision.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    await revision.deleteOne();
    res.json({ message: 'Removed from revision list' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRevisions, getDueRevisions, getRevisionStats,
  createRevision, markRevised, deleteRevision,
};