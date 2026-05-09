const express = require('express');
const router  = express.Router();
const {
  getRevisions, getDueRevisions, getRevisionStats,
  createRevision, markRevised, deleteRevision,
} = require('../controllers/revisionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/due',     getDueRevisions);  // before /:id
router.get('/stats',   getRevisionStats);
router.get('/',        getRevisions);
router.post('/',       createRevision);
router.post('/:id/revise', markRevised);
router.delete('/:id',  deleteRevision);

module.exports = router;