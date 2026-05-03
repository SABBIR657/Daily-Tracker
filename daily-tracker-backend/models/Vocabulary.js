const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  word:        { type: String, required: true },
  meaning:     { type: String, required: true }, // English meaning
  bangla:      { type: String, required: true }, // Bangla meaning
  synonyms:    [{ type: String }],
  antonyms:    [{ type: String }],
  mnemonic:    { type: String },                 // memory trick
  sentence:    { type: String },                 // example sentence
  difficulty:  { type: String, enum: ['basic', 'intermediate', 'advanced'] },
});

const quizQuestionSchema = new mongoose.Schema({
  question:      { type: String },
  options:       [{ type: String }],
  correctAnswer: { type: String },
  word:          { type: String },
});

const vocabularySchema = new mongoose.Schema({
  date:       { type: String, required: true },  // 'YYYY-MM-DD'
  difficulty: { type: String, required: true, enum: ['basic', 'intermediate', 'advanced'] },
  words:      [wordSchema],
  quiz:       [quizQuestionSchema],
}, { timestamps: true });

// One set of words per date per difficulty
vocabularySchema.index({ date: 1, difficulty: 1 }, { unique: true });

module.exports = mongoose.model('Vocabulary', vocabularySchema);