const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Log     = require('../models/Log');
const Todo    = require('../models/Todo');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/authMiddleware');

// PUT /api/profile/visibility — toggle public on/off (protected)
router.put('/visibility', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isPublic: req.body.isPublic },
      { new: true }
    ).select('-password');
    res.json({ isPublic: user.isPublic });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/profile/:userId — public read-only profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -email');

    if (!user)           return res.status(404).json({ message: 'User not found' });
    if (!user.isPublic)  return res.status(403).json({ message: 'This profile is private' });

    // Last 30 days analytics
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const logs = await Log.find({ user: user._id, date: { $gte: since } });

    const studyLogs   = logs.filter((l) => l.type === 'study');
    const runLogs     = logs.filter((l) => l.type === 'run');
    const workoutLogs = logs.filter((l) => l.type === 'workout');

    const heatmap = logs.reduce((acc, l) => {
      const day = new Date(l.date).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + l.duration;
      return acc;
    }, {});

    const subjects = await Subject.find({ user: user._id });

    const [doneTodos, pendingTodos] = await Promise.all([
      Todo.countDocuments({ user: user._id, status: 'done' }),
      Todo.countDocuments({ user: user._id, status: { $ne: 'done' } }),
    ]);

    res.json({
      user: { name: user.name, avatar: user.avatar, goals: user.goals },
      stats: {
        studyHours:   Math.round(studyLogs.reduce((s, l) => s + l.duration, 0) / 60 * 10) / 10,
        totalKm:      Math.round(runLogs.reduce((s, l) => s + l.distance, 0) * 10) / 10,
        workoutDays:  new Set(workoutLogs.map((l) => new Date(l.date).toDateString())).size,
        doneTodos,
        pendingTodos,
        totalSessions: logs.length,
      },
      subjects: subjects.map((s) => ({
        name:             s.name,
        color:            s.color,
        completionPercent: s.completionPercent,
        totalTopics:      s.topics.length,
      })),
      heatmap,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;