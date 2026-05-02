const cron    = require('node-cron');
const User    = require('../models/User');
const Log     = require('../models/Log');
const Todo    = require('../models/Todo');
const Subject = require('../models/Subject');
const { sendWeeklyDigest } = require('./emailService');

const runWeeklyDigest = async () => {
  console.log('[Digest] Starting weekly digest job...');

  const users = await User.find({}).select('name email');

  const since = new Date();
  since.setDate(since.getDate() - 7);

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const logs = await Log.find({ user: user._id, date: { $gte: since } });

      const studyLogs   = logs.filter((l) => l.type === 'study');
      const runLogs     = logs.filter((l) => l.type === 'run');
      const workoutLogs = logs.filter((l) => l.type === 'workout');

      const [doneTodos, pendingTodos, subjects] = await Promise.all([
        Todo.countDocuments({ user: user._id, status: 'done', updatedAt: { $gte: since } }),
        Todo.countDocuments({ user: user._id, status: { $ne: 'done' } }),
        Subject.find({ user: user._id }),
      ]);

      await sendWeeklyDigest({
        to:   user.email,
        name: user.name,
        stats: {
          studyHours:  Math.round(studyLogs.reduce((s, l) => s + l.duration, 0) / 60 * 10) / 10,
          totalKm:     Math.round(runLogs.reduce((s, l) => s + l.distance, 0) * 10) / 10,
          workoutDays: new Set(workoutLogs.map((l) => new Date(l.date).toDateString())).size,
          doneTodos,
          pendingTodos,
        },
        todos: [],
        subjects: subjects.map((s) => ({
          name:             s.name,
          color:            s.color,
          completionPercent: s.completionPercent,
        })),
      });

      sent++;
      console.log(`[Digest] Sent to ${user.email}`);
    } catch (err) {
      failed++;
      console.error(`[Digest] Failed for ${user.email}:`, err.message);
    }
  }

  console.log(`[Digest] Done — ${sent} sent, ${failed} failed`);
};

// Schedule: every Sunday at 8:00 AM
const startDigestCron = () => {
  cron.schedule('0 8 * * 0', runWeeklyDigest, {
    timezone: 'Asia/Dhaka',
  });
  console.log('[Digest] Weekly digest cron scheduled — Sundays at 8:00 AM (Dhaka time)');
};

module.exports = { startDigestCron, runWeeklyDigest };