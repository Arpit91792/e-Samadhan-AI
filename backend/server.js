// ── Env + Mongoose setup MUST be first (before models / routes) ───────────────
import './config/loadEnv.js';
import './config/mongooseSetup.js';

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import connectDB, { isDbConnected, getDbStateLabel } from './config/db.js';
import clearDatabase from './config/clearDB.js';
import { printEnvReport } from './config/validateEnv.js';
import { verifyEmailConnection } from './utils/sendEmail.js';
import errorHandler from './middleware/errorHandler.js';

// ── Dev database system ───────────────────────────────────────────────────────
import initializeDatabase from './utils/dbInitializer.js';
import { registerShutdownHandlers } from './utils/shutdownHandler.js';

printEnvReport();

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import citizenComplaintRoutes from './routes/citizenComplaintRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import officerRoutes from './routes/officerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import faceRoutes from './routes/faceRoutes.js';
import livenessRoutes from './routes/livenessRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { initSocket } from './socket/index.js';

// ── Register all Mongoose models ──────────────────────────────────────────────
import './models/User.js';
import './models/Admin.js';
import './models/Officer.js';
import './models/Complaint.js';
import './models/Department.js';
import './models/Notification.js';
import './models/OTP.js';
import './models/AuditLog.js';
import './models/Feedback.js';
import './models/Verification.js';
import './models/LivenessSession.js';
import './models/LivenessAttempt.js';
import { cleanupLivenessData, autoResetOnStartup } from './services/livenessAttempts.js';

// ── Database must connect before accepting traffic ───────────────────────────
const dbReady = await connectDB();
if (!dbReady) {
      console.error('\n🛑 Server startup aborted: MongoDB is required.\n');
      console.error('   Fix MONGO_URI / Atlas network access, then restart.\n');
      process.exit(1);
}

// ── Temporary Development Database System ────────────────────────────────────
// Runs startup initializer: creates folders, resets DB if DEV_RESET_DATABASE=true
await initializeDatabase();

// ── Legacy clear + liveness cleanup ──────────────────────────────────────────
await clearDatabase();
await autoResetOnStartup();
await cleanupLivenessData();
verifyEmailConnection();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Ensure upload dirs exist (also handled by initializeDatabase) ─────────────
['uploads/profiles', 'uploads/complaints', 'uploads/govt-ids', 'uploads/liveness', 'uploads/ids', 'uploads/reports'].forEach(dir => {
      const full = path.join(__dirname, dir);
      if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Department'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/admin/register', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('API Running'));

app.use('/api/auth', authRoutes);
// Citizen dashboard stats — register before /api/complaints to avoid /:id conflicts
app.use('/api/complaints/citizen', citizenComplaintRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/liveness', livenessRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
      const dbConnected = isDbConnected();
      res.status(dbConnected ? 200 : 503).json({
            success: dbConnected,
            message: dbConnected
                  ? '✅ e-Samadhan AI API is running'
                  : 'API running but database is disconnected',
            database: { connected: dbConnected, state: getDbStateLabel() },
            environment: process.env.NODE_ENV,
            devMode: {
                  enabled: process.env.NODE_ENV === 'development',
                  autoReset: process.env.DEV_RESET_DATABASE === 'true',
                  dataErasedOnShutdown: process.env.NODE_ENV === 'development',
            },
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            endpoints: {
                  auth: '/api/auth',
                  complaints: '/api/complaints',
                  citizenStats: '/api/complaints/citizen/stats',
                  admin: '/api/admin',
                  officer: '/api/officer',
                  notifications: '/api/notifications',
            },
      });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
      res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
      const isDev = process.env.NODE_ENV === 'development';
      const autoReset = process.env.DEV_RESET_DATABASE === 'true';

      console.log('\n┌─────────────────────────────────────────────────────┐');
      console.log('│  🚀 e-Samadhan AI Server v2.0                        │');
      console.log(`│  📡 http://localhost:${PORT}/api                        │`);
      console.log(`│  🗄️  MongoDB: connected                              │`);
      console.log(`│  🔌 Socket.io real-time enabled                      │`);
      console.log(`│  ❤️  http://localhost:${PORT}/api/health                 │`);
      console.log(`│  🌍 Mode: ${(process.env.NODE_ENV || 'development').padEnd(42)}│`);
      if (isDev) {
            console.log(`│  🔧 Temp DB: ${autoReset ? '✅ Auto-reset ON ' : '⏸️  Auto-reset OFF'}                        │`);
            console.log('│  🗑️  Data erased automatically on shutdown           │');
      }
      console.log('└─────────────────────────────────────────────────────┘\n');
      console.log(`Server running on port ${PORT}`);
});

// ── Register graceful shutdown (erases all dev data on Ctrl+C / stop) ────────
registerShutdownHandlers(httpServer);
