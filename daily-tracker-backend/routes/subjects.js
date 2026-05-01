const express = require('express');
const router = express.Router();
const {
  getSubjects, createSubject, updateSubject, deleteSubject,
  addTopic, updateTopic, deleteTopic,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',                              getSubjects);
router.post('/',                             createSubject);
router.put('/:id',                           updateSubject);
router.delete('/:id',                        deleteSubject);
router.post('/:id/topics',                   addTopic);
router.put('/:id/topics/:topicId',           updateTopic);
router.delete('/:id/topics/:topicId',        deleteTopic);

module.exports = router;