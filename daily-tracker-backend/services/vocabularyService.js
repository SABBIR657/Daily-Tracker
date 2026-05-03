const Groq = require('groq-sdk');
const Vocabulary = require('../models/Vocabulary');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateVocabulary = async (date, difficulty) => {
  const difficultyGuide = {
    basic:        'common everyday English words suitable for beginners (A2-B1 level)',
    intermediate: 'moderately advanced words suitable for intermediate learners (B2 level)',
    advanced:     'sophisticated and academic words suitable for advanced learners (C1-C2 level)',
  };

  const prompt = `Generate exactly 10 English vocabulary words for ${difficultyGuide[difficulty]}.

For each word provide:
1. The word itself
2. Clear English meaning
3. Bangla meaning (in Bengali script)
4. 2-3 synonyms
5. 2-3 antonyms (if applicable, otherwise empty array)
6. A fun mnemonic or memory trick to remember the word easily
7. A natural example sentence using the word

Also generate 5 quiz questions based on these 10 words. Each question should be multiple choice with 4 options and test synonym, antonym, or meaning knowledge.

Respond with ONLY a valid JSON object in this exact format, no markdown, no extra text:
{
  "words": [
    {
      "word": "example",
      "meaning": "English meaning here",
      "bangla": "বাংলা অর্থ",
      "synonyms": ["syn1", "syn2"],
      "antonyms": ["ant1", "ant2"],
      "mnemonic": "memory trick here",
      "sentence": "Example sentence using the word."
    }
  ],
  "quiz": [
    {
      "question": "What is a synonym of 'example'?",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "option1",
      "word": "example"
    }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4000,
    messages:   [{ role: 'user', content: prompt }],
  });

  const text   = response.choices[0].message.content.trim();
  const clean  = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  const words = parsed.words.map((w) => ({ ...w, difficulty }));

  const vocab = await Vocabulary.create({
    date,
    difficulty,
    words,
    quiz: parsed.quiz,
  });

  return vocab;
};

const getOrGenerateVocabulary = async (date, difficulty) => {
  const existing = await Vocabulary.findOne({ date, difficulty });
  if (existing) return existing;
  return await generateVocabulary(date, difficulty);
};

module.exports = { getOrGenerateVocabulary };