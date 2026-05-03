const dotenv = require('dotenv');
dotenv.config();

const express   = require('express');
const cors      = require('cors');
const connectDB = require('./config/db');
const { startDigestCron } = require('./services/weeklyDigest');

const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight
app.options('*', cors());

app.use(express.json());

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/logs',       require('./routes/logs'));
app.use('/api/todos',      require('./routes/todos'));
app.use('/api/subjects',   require('./routes/subjects'));
app.use('/api/profile',    require('./routes/profile'));
app.use('/api/vocabulary', require('./routes/vocabulary'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Daily Tracker API is running' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startDigestCron();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});