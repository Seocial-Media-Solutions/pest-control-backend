// Tracking Gateway - WebSocket layer for real-time tracking

import { Server as SocketServer, Socket } from 'socket.io';
import { TrackingService } from './tracking.service.js';
import {
    TrackingEventType,
    LocationUpdatePayload,
    SubscribePayload,
    ErrorPayload,
    ConnectedPayload
} from './tracking.events.js';

export class TrackingGateway {
    private io: SocketServer;
    private service: TrackingService;
    private technicianSubscriptions: Map<string, Set<string>>; // technicianId -> Set of socketIds
    private allSubscribers: Set<string>; // socketIds subscribed to all updates

    constructor(io: SocketServer) {
        this.io = io;
        this.service = new TrackingService();
        this.technicianSubscriptions = new Map();
        this.allSubscribers = new Set();
        this.initialize();
    }

    /**
     * Initialize WebSocket event handlers
     */
    private initialize() {
        this.io.on('connection', (socket: Socket) => {
            console.log(`[Tracking] Client connected: ${socket.id}`);

            // Send connection confirmation
            const connectedPayload: ConnectedPayload = {
                message: 'Connected to tracking service',
                userId: socket.id,
                timestamp: new Date()
            };
            socket.emit(TrackingEventType.CONNECTED, connectedPayload);

            // Handle location updates
            socket.on(TrackingEventType.LOCATION_UPDATE, async (data: LocationUpdatePayload) => {
                await this.handleLocationUpdate(socket, data);
            });

            // Handle subscribe to specific technician
            socket.on(TrackingEventType.SUBSCRIBE_TECHNICIAN, (data: SubscribePayload) => {
                this.handleSubscribeTechnician(socket, data);
            });

            // Handle unsubscribe from specific technician
            socket.on(TrackingEventType.UNSUBSCRIBE_TECHNICIAN, (data: SubscribePayload) => {
                this.handleUnsubscribeTechnician(socket, data);
            });

            // Handle subscribe to all updates
            socket.on(TrackingEventType.SUBSCRIBE_ALL, () => {
                this.handleSubscribeAll(socket);
            });

            // Handle unsubscribe from all updates
            socket.on(TrackingEventType.UNSUBSCRIBE_ALL, () => {
                this.handleUnsubscribeAll(socket);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }

    /**
     * Handle location update from technician
     */
    private async handleLocationUpdate(socket: Socket, data: LocationUpdatePayload) {
        try {
            // Validate payload
            const validation = this.service.validateLocationUpdate(data);
            if (!validation.valid) {
                const errorPayload: ErrorPayload = {
                    message: validation.error || 'Invalid location update',
                    code: 'VALIDATION_ERROR'
                };
                socket.emit(TrackingEventType.ERROR, errorPayload);
                return;
            }

            // Process location update
            const result = await this.service.processLocationUpdate(data);

            // Emit to subscribers of this specific technician
            this.broadcastToTechnicianSubscribers(data.technicianId, TrackingEventType.LOCATION_UPDATED, result);

            // Emit to all subscribers
            this.broadcastToAllSubscribers(TrackingEventType.LOCATION_UPDATED, result);

            // Send confirmation to sender
            socket.emit(TrackingEventType.LOCATION_UPDATED, result);

        } catch (error: any) {
            console.error('[Tracking] Error processing location update:', error);
            const errorPayload: ErrorPayload = {
                message: error.message || 'Failed to process location update',
                code: 'PROCESSING_ERROR',
                details: error
            };
            socket.emit(TrackingEventType.ERROR, errorPayload);
        }
    }

    /**
     * Handle subscribe to specific technician updates
     */
    private handleSubscribeTechnician(socket: Socket, data: SubscribePayload) {
        const { technicianId } = data;

        if (!this.technicianSubscriptions.has(technicianId)) {
            this.technicianSubscriptions.set(technicianId, new Set());
        }

        this.technicianSubscriptions.get(technicianId)!.add(socket.id);

        console.log(`[Tracking] Socket ${socket.id} subscribed to technician ${technicianId}`);

        // Send latest location if available
        this.sendLatestLocation(socket, technicianId);
    }

    /**
     * Handle unsubscribe from specific technician updates
     */
    private handleUnsubscribeTechnician(socket: Socket, data: SubscribePayload) {
        const { technicianId } = data;

        if (this.technicianSubscriptions.has(technicianId)) {
            this.technicianSubscriptions.get(technicianId)!.delete(socket.id);

            // Clean up empty sets
            if (this.technicianSubscriptions.get(technicianId)!.size === 0) {
                this.technicianSubscriptions.delete(technicianId);
            }
        }

        console.log(`[Tracking] Socket ${socket.id} unsubscribed from technician ${technicianId}`);
    }

    /**
     * Handle subscribe to all tracking updates
     */
    private async handleSubscribeAll(socket: Socket) {
        this.allSubscribers.add(socket.id);
        console.log(`[Tracking] Socket ${socket.id} subscribed to all updates`);

        // NEW: Send all latest locations to the new subscriber immediately
        try {
            const allLocations = await this.service.getLatestLocationsForAll();
            // Emit each location individually so the frontend processes them as "updates"
            for (const loc of allLocations) {
                socket.emit(TrackingEventType.LOCATION_UPDATED, loc);
            }
        } catch (err) {
            console.error('[Tracking] Error sending initial locations to subscriber:', err);
        }
    }

    /**
     * Handle unsubscribe from all tracking updates
     */
    private handleUnsubscribeAll(socket: Socket) {
        this.allSubscribers.delete(socket.id);
        console.log(`[Tracking] Socket ${socket.id} unsubscribed from all updates`);
    }

    /**
     * Handle client disconnection
     */
    private handleDisconnect(socket: Socket) {
        console.log(`[Tracking] Client disconnected: ${socket.id}`);

        // Remove from all subscriptions
        this.allSubscribers.delete(socket.id);

        // Remove from technician-specific subscriptions
        this.technicianSubscriptions.forEach((subscribers, technicianId) => {
            subscribers.delete(socket.id);
            if (subscribers.size === 0) {
                this.technicianSubscriptions.delete(technicianId);
            }
        });
    }

    /**
     * Broadcast to subscribers of a specific technician
     */
    private broadcastToTechnicianSubscribers(technicianId: string, event: string, data: any) {
        const subscribers = this.technicianSubscriptions.get(technicianId);
        if (subscribers) {
            subscribers.forEach(socketId => {
                this.io.to(socketId).emit(event, data);
            });
        }
    }

    /**
     * Broadcast to all subscribers
     */
    private broadcastToAllSubscribers(event: string, data: any) {
        this.allSubscribers.forEach(socketId => {
            this.io.to(socketId).emit(event, data);
        });
    }

    /**
     * Send latest location to a socket
     */
    private async sendLatestLocation(socket: Socket, technicianId: string) {
        try {
            const latestLocation = await this.service.getLatestLocation(technicianId);
            if (latestLocation) {
                socket.emit(TrackingEventType.LOCATION_UPDATED, latestLocation);
            }
        } catch (error) {
            console.error('[Tracking] Error sending latest location:', error);
        }
    }

    /**
     * Get statistics about active connections
     */
    getStats() {
        return {
            totalConnections: this.io.sockets.sockets.size,
            allSubscribers: this.allSubscribers.size,
            technicianSubscriptions: this.technicianSubscriptions.size,
            subscriptionDetails: Array.from(this.technicianSubscriptions.entries()).map(([technicianId, subscribers]) => ({
                technicianId,
                subscriberCount: subscribers.size
            }))
        };
    }
}
