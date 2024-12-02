const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Load environment variables from config.env
dotenv.config({ path: './config.env' });

// Initialize express app
const app = express();
// Create uploads directory if it doesn't exist

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept audio files only
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed!'), false);
        }
    }
});

// Make upload middleware available globally
app.locals.upload = upload;

// Essential Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev')); // HTTP request logger
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

// mongoose.connect(MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
//     socketTimeoutMS: 45000, // Increase socket timeout
//     family: 4 // Force IPv4
// })
// .then(() => {
//     console.log('📦 Connected to MongoDB successfully');
// })
// .catch((err) => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
// });

// // MongoDB connection error handling
// mongoose.connection.on('error', (err) => {
//     console.error('MongoDB connection error:', err);
// });

// mongoose.connection.on('disconnected', () => {
//     console.warn('MongoDB disconnected. Attempting to reconnect...');
// });

// mongoose.connection.on('reconnected', () => {
//     console.log('MongoDB reconnected successfully');
// });

// Basic error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Import routes
const routes = require('./routes');

// Routes
app.use('/api', routes); // Mount all routes from routes.js under /api

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to the API",
        status: "Server is running",
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Environment variables
const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`➡️  http://localhost:${PORT}`);
});
