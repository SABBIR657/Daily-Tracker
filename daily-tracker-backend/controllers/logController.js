const Log = require('../models/Log');

// GET /api/logs — get all logs for logged-in user (with filters)
const getLogs = async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 50 } = req.query;

    const filter = { user: req.user._id };

    if (type) filter.type = type;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }

    const logs = await Log.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/logs/:id — get a single log
const getLogById = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);

    if (!log) return res.status(404).json({ message: 'Log not found' });

    // Make sure the log belongs to the requesting user
    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/logs — create a new log
const createLog = async (req, res) => {
  try {
    const { type, duration, date, notes, subject, topic,
            distance, workoutType, exercises } = req.body;

    const log = await Log.create({
      user: req.user._id,
      type,
      duration,
      date,
      notes,
      subject,
      topic,
      distance,
      workoutType,
      exercises,
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/logs/:id — update a log
const updateLog = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);

    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    const updated = await Log.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/logs/:id — delete a log
const deleteLog = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);

    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    await log.deleteOne();
    res.json({ message: 'Log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/logs/analytics — weekly/monthly summary for dashboard
const getAnalytics = async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    // Use end of today (23:59:59) as the upper bound
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const startDate = new Date();

    if (period === 'week')  startDate.setDate(startDate.getDate() - 7);
    if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    if (period === 'year')  startDate.setFullYear(startDate.getFullYear() - 1);

    // Start from beginning of that day
    startDate.setHours(0, 0, 0, 0);

    const logs = await Log.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: now },
    });

    // Study summary
    const studyLogs = logs.filter(l => l.type === 'study');
    const studyHours = studyLogs.reduce((sum, l) => sum + l.duration, 0) / 60;
    const studyBySubject = studyLogs.reduce((acc, l) => {
      acc[l.subject] = (acc[l.subject] || 0) + l.duration;
      return acc;
    }, {});

    // Run summary
    const runLogs = logs.filter(l => l.type === 'run');
    const totalKm = runLogs.reduce((sum, l) => sum + l.distance, 0);
    const totalRunMinutes = runLogs.reduce((sum, l) => sum + l.duration, 0);

    // Workout summary
    const workoutLogs = logs.filter(l => l.type === 'workout');
    const workoutDays = new Set(
      workoutLogs.map(l => new Date(l.date).toDateString())
    ).size;

    // Heatmap
    const heatmap = logs.reduce((acc, l) => {
      const day = new Date(l.date).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + l.duration;
      return acc;
    }, {});

    res.json({
      period,
      study: {
        totalHours:    Math.round(studyHours * 10) / 10,
        totalSessions: studyLogs.length,
        bySubject:     studyBySubject,
      },
      run: {
        totalKm:       Math.round(totalKm * 10) / 10,
        totalSessions: runLogs.length,
        totalMinutes:  totalRunMinutes,
      },
      workout: {
        totalDays:     workoutDays,
        totalSessions: workoutLogs.length,
      },
      heatmap,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLogs, getLogById, createLog, updateLog, deleteLog, getAnalytics };