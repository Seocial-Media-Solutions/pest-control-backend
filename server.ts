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
import connectDB from './src/config/db.config.js';
import { TrackingGateway } from './src/modules/tracking/index.js';
import cors from 'cors';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketServer(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Connect to Database
connectDB();

// Initialize Tracking Gateway (WebSocket)
const trackingGateway = new TrackingGateway(io);
console.log('✅ Tracking Gateway initialized');

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api', technicianRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sub-services', subServiceRoutes);

// WebSocket stats endpoint
app.get('/api/tracking/ws/stats', (req: Request, res: Response) => {
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

// Start server with WebSocket support
httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📍 Detailed health: http://localhost:${PORT}/api/health/detailed`);
    console.log(`🔌 WebSocket server is running on ws://localhost:${PORT}`);
    console.log(`📊 WebSocket stats: http://localhost:${PORT}/api/tracking/ws/stats`);
});

export default app;
