const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());                        // Allow requests from React frontend
app.use(express.json());               // Parse incoming JSON request bodies

// Health check route — just to confirm server is running
app.get('/', (req, res) => {
  res.json({ message: 'Daily Tracker API is running' });
});

// Routes will be added here soon
app.use('/api/auth', require('./routes/auth'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/subjects', require('./routes/subjects'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});