const express = require('express');
const router  = express.Router();
const {
  getTodayVocabulary,
  getFavourites,
  addFavourite,
  removeFavourite,
} = require('../controllers/vocabularyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/today',              getTodayVocabulary);
router.get('/favourites',         getFavourites);
router.post('/favourites',        addFavourite);
router.delete('/favourites/:word', removeFavourite);

module.exports = router;