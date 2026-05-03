const dotenv = require('dotenv');
dotenv.config(); // must be the very first line before any other require

const express   = require('express');
const cors      = require('cors');
const connectDB = require('./config/db');
const { startDigestCron, runWeeklyDigest } = require('./services/weeklyDigest');

const app = express();

// Middleware
// app.use(cors());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/logs',     require('./routes/logs'));
app.use('/api/todos',    require('./routes/todos'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/profile',  require('./routes/profile'));
app.use('/api/vocabulary', require('./routes/vocabulary'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Daily Tracker API is running' });
});

// TEMP — remove after testing


const PORT = process.env.PORT || 5000;

// Connect DB once, then start server + cron
connectDB().then(() => {
  startDigestCron();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});