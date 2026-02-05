import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
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
import cors from 'cors';
import { limiter } from './src/middleware/rateLimiter.js';
import { protect } from './src/middleware/auth.js';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const httpServer = createServer(app);
// Middleware
// Debug logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
    next();
});

const allowedOrigins = [
    process.env.ADMINURL,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean) as string[];

// Initialize Socket.IO with CORS
const io = new SocketServer(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Initialize Tracking Gateway (WebSocket)
const trackingGateway = new TrackingGateway(io);
console.log('✅ Tracking Gateway initialized');

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow ALL origins for debugging
        console.log('CORS Origin Check:', origin);
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply Rate Limiting globally
app.use(limiter);

// Public Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes); // Admin Login

// Protected Routes
app.use('/api/services', protect, serviceRoutes);
app.use('/api/tracking', protect, trackingRoutes);
app.use('/api/assignments', protect, assignmentRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/bookings', protect, bookingRoutes);
app.use('/api/sub-services', protect, subServiceRoutes);

// For technicians, we need to allow login.
// I will NOT add `protect` here at the top level for technicians, but will add it INSIDE `technician.routes.ts` for non-login routes.
app.use('/api', technicianRoutes);

// WebSocket stats endpoint (Protected)
app.get('/api/tracking/ws/stats', protect, (req: Request, res: Response) => {
    const stats = trackingGateway.getStats();
    res.json({
        success: true,
        data: stats
    });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to Pest Control API',
        version: '1.0.0',
        websocket: {
            enabled: true,
            endpoint: `ws://localhost:${PORT}`,
            namespace: '/',
            events: {
                locationUpdate: 'tracking:location:update',
                locationUpdated: 'tracking:location:updated',
                subscribeTechnician: 'tracking:subscribe:technician',
                subscribeAll: 'tracking:subscribe:all'
            }
        },
        endpoints: {
            health: '/api/health',
            detailedHealth: '/api/health/detailed',
            services: '/api/services',
            technicians: '/api/technicians',
            technicianLogin: '/api/technicians/login',
            tracking: '/api/tracking',
            trackingWebSocketStats: '/api/tracking/ws/stats',
            assignments: '/api/assignments',
            customers: '/api/customers',
            bookings: '/api/bookings',
            dashboard: {
                stats: '/api/dashboard/stats',
                trends: '/api/dashboard/trends',
                technicianActivity: '/api/dashboard/technician-activity',
                revenueAnalytics: '/api/dashboard/revenue-analytics',
                all: '/api/dashboard/all'
            }
        }
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

// Connect to Database and start server
const startServer = async () => {
    try {
        await connectDB();

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
            console.log(`📍 Detailed health: http://localhost:${PORT}/api/health/detailed`);
            console.log(`🔌 WebSocket server is running on ws://localhost:${PORT}`);
            console.log(`📊 WebSocket stats: http://localhost:${PORT}/api/tracking/ws/stats`);
            console.log('frontend url', process.env.ADMINURL);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
