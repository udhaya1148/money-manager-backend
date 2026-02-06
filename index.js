const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const allowVercelPreviews = String(process.env.ALLOW_VERCEL_PREVIEWS || '').toLowerCase() === 'true';

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.length === 0 && !allowVercelPreviews) return callback(null, true);

        const isAllowed =
            allowedOrigins.includes(origin) ||
            (allowVercelPreviews && /^https:\/\/.*\.vercel\.app$/i.test(origin));

        return callback(isAllowed ? null : new Error(`CORS blocked for origin: ${origin}`), isAllowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Database Connection
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
    console.error('Missing Mongo connection string. Set MONGO_URI (or MONGODB_URI) in environment variables.');
    process.exit(1);
}

mongoose.connect(mongoUri)
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
