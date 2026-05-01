const Subject = require('../models/Subject');

// GET /api/subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/subjects
const createSubject = async (req, res) => {
  try {
    const { name, description, color, targetDate } = req.body;

    const subject = await Subject.create({
      user: req.user._id,
      name,
      description,
      color,
      targetDate,
      topics: [],
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/subjects/:id
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    const { name, description, color, targetDate } = req.body;
    Object.assign(subject, { name, description, color, targetDate });
    const updated = await subject.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/subjects/:id
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    await subject.deleteOne();
    res.json({ message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/subjects/:id/topics — add a topic to a subject
const addTopic = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    subject.topics.push(req.body);
    await subject.save();

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/subjects/:id/topics/:topicId — update a topic status
const updateTopic = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    const topic = subject.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    Object.assign(topic, req.body);
    await subject.save();

    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/subjects/:id/topics/:topicId
const deleteTopic = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    subject.topics.pull(req.params.topicId);
    await subject.save();

    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSubjects, createSubject, updateSubject, deleteSubject,
  addTopic, updateTopic, deleteTopic,
};