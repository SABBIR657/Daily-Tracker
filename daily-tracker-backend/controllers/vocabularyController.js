const { getOrGenerateVocabulary } = require('../services/vocabularyService');
const Favourite = require('../models/Favourite');
const dayjs = require('dayjs');

// GET /api/vocabulary/today?difficulty=intermediate
const getTodayVocabulary = async (req, res) => {
  try {
    const { difficulty = 'intermediate' } = req.query;
    const date = dayjs().format('YYYY-MM-DD');

    const vocab = await getOrGenerateVocabulary(date, difficulty);
    res.json(vocab);
  } catch (error) {
    console.error('[Vocabulary] Error:', error.message);
    res.status(500).json({ message: 'Failed to generate vocabulary. Try again.' });
  }
};

// GET /api/vocabulary/favourites
const getFavourites = async (req, res) => {
  try {
    const favs = await Favourite.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(favs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/vocabulary/favourites
const addFavourite = async (req, res) => {
  try {
    const { word, meaning, bangla, synonyms, antonyms, mnemonic, sentence, difficulty } = req.body;

    // upsert — won't duplicate if already saved
    const fav = await Favourite.findOneAndUpdate(
      { user: req.user._id, word },
      { word, meaning, bangla, synonyms, antonyms, mnemonic, sentence, difficulty },
      { upsert: true, new: true }
    );

    res.status(201).json(fav);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/vocabulary/favourites/:word
const removeFavourite = async (req, res) => {
  try {
    await Favourite.findOneAndDelete({
      user: req.user._id,
      word: req.params.word,
    });
    res.json({ message: 'Removed from favourites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTodayVocabulary, getFavourites, addFavourite, removeFavourite };