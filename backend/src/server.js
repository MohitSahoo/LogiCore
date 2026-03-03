import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import productsRouter from './routes/products.js';
import suppliersRouter from './routes/suppliers.js';
import ordersRouter from './routes/orders.js';
import reportsRouter from './routes/reports.js';
import authRouter from './routes/auth.js';
import aiReportsRouter from './routes/aiReports.js';
import adminRouter from './routes/admin.js';

import { pool } from './db.js';
import { connectMongoDB } from './mongodb.js';



dotenv.config();

const app = express();
const port = process.env.PORT || 4001;
const host = process.env.HOST || '0.0.0.0';

// Initialize MongoDB connection
connectMongoDB().catch((err) => {
  console.error('⚠️  MongoDB connection failed, continuing without MongoDB features');
});

// Configure CORS to allow Vercel frontend
const allowedOrigins = [
  'https://logi-core-gules.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or if CORS_ORIGIN is set to *
    if (process.env.CORS_ORIGIN === '*' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Custom logging middleware (after body parser)
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`\n📥 ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusEmoji = res.statusCode < 400 ? '✅' : '❌';
    console.log(`${statusEmoji} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'LogiCore API is running' });
});

app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);
app.use('/api/ai-reports', aiReportsRouter);
app.use('/api/admin', adminRouter);


app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(port, host, () => {
  console.log(`API server listening on http://${host}:${port}`);
});