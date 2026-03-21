import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import healthRoutes from './src/routes/health.routes.js';
import serviceRoutes from './src/routes/service.routes.js';
import technicianRoutes from './src/routes/technician.routes.js';
import trackingRoutes from './src/routes/tracking.routes.js';
import assignmentRoutes from './src/routes/assignment.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import customerRoutes from './src/routes/customer.routes.js';
import bookingRoutes from './src/routes/booking.routes.js';
import subServiceRoutes from './src/routes/subService.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import connectDB from './src/config/db.config.js';
import { TrackingGateway } from './src/modules/tracking/index.js';
import { limiter } from './src/middleware/rateLimiter.js';
import { protect } from './src/middleware/auth.js';
const app = express();
const PORT = process.env.PORT || 3000;
/* ---------------------- ALLOWED ORIGINS ---------------------- */
const allowedOrigins = [
    "http://localhost:5173",
    process.env.ADMINURL
].filter(Boolean);
/* ---------------------- HTTP SERVER ---------------------- */
const httpServer = createServer(app);
/* ---------------------- SOCKET.IO ---------------------- */
const io = new SocketServer(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});
const trackingGateway = new TrackingGateway(io);
console.log("✅ Tracking Gateway initialized");
/* ---------------------- MIDDLEWARE ---------------------- */
app.use(cors({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
/* ---------------------- ROUTES ---------------------- */
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', protect, serviceRoutes);
app.use('/api/tracking', protect, trackingRoutes);
app.use('/api/assignments', protect, assignmentRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/bookings', protect, bookingRoutes);
app.use('/api/sub-services', protect, subServiceRoutes);
app.use('/api', technicianRoutes);
/* ---------------------- WS STATS ---------------------- */
app.get('/api/tracking/ws/stats', protect, (req, res) => {
    const stats = trackingGateway.getStats();
    res.json({
        success: true,
        data: stats
    });
});
/* ---------------------- ROOT ---------------------- */
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Pest Control API',
        websocket: `ws://localhost:${PORT}`
    });
});
/* ---------------------- 404 ---------------------- */
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});
/* ---------------------- SERVER START ---------------------- */
const startServer = async () => {
    try {
        await connectDB();
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Admin URL: ${process.env.ADMINURL}`);
            console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
export default app;
