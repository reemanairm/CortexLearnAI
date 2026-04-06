import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport.js';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js'
import errorHandler from '../Back-End/middleware/errorHandler.js'

import authRoutes from './Routes/authRoutes.js'
import DocumentRoutes from './Routes/documentRoutes.js'
import FlashcardRoutes from './Routes/flashcardRoutes.js'
import aiRoutes from './Routes/aiRoutes.js'
import quizRoutes from './Routes/quizRoutes.js'
import progressRoutes from './Routes/progressRoutes.js'
import adminRoutes from './Routes/adminRoutes.js'
import helpRoutes from './Routes/helpRoutes.js'


//ES6 module __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Initialize express app
const app = express();

//connect to MongoDB and start server after successful connection
const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB connection established');

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB during startup', err);
    process.exit(1);
  }
};
startServer();

//Middleware to handle CORS 
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8000',
      'https://cortexlearnai.onrender.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Routes

app.use('/api/auth', authRoutes);
app.use('/api/documents', DocumentRoutes);
app.use('/api/flashcard', FlashcardRoutes);
app.use('/api/aiRoutes', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/help', helpRoutes);

app.use(errorHandler);

//server
app.use(express.static(path.join(__dirname,"../Front-End/AI-Study-Partner/dist")));

    app.get(/.*/,(req, res) => {
      res.sendFile(path.join(__dirname,"../Front-End/AI-Study-Partner/dist/index.html"));
    });

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    statusCode: 404
  })
  });

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${err.message}`);
  process.exit(1);
});


