const express = require('express');
const router = express.Router();
const {
  getLogs, getLogById, createLog, updateLog, deleteLog, getAnalytics
} = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

// All log routes are protected
router.use(protect);

router.get('/analytics', getAnalytics); // must be before /:id
router.get('/',          getLogs);
router.get('/:id',       getLogById);
router.post('/',         createLog);
router.put('/:id',       updateLog);
router.delete('/:id',    deleteLog);

module.exports = router;