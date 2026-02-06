const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS – allow your Vercel frontend + localhost (for dev)
const corsOptions = {
  origin: [
    'https://moneymanager-frontend-eight.vercel.app', // your Vercel frontend
    'http://localhost:5173',                          // Vite dev
    'http://localhost:3000'                           // optional
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Database Connection
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing Mongo connection string. Set MONGO_URI (or MONGODB_URI) in environment variables.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Routes
const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
  res.send('Money Manager API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
