const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  word:       { type: String, required: true },
  meaning:    { type: String },
  bangla:     { type: String },
  synonyms:   [{ type: String }],
  antonyms:   [{ type: String }],
  mnemonic:   { type: String },
  sentence:   { type: String },
  difficulty: { type: String },
}, { timestamps: true });

favouriteSchema.index({ user: 1, word: 1 }, { unique: true });

module.exports = mongoose.model('Favourite', favouriteSchema);