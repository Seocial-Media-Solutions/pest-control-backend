// Tracking Events - Event types and payloads for WebSocket communication

export enum TrackingEventType {
    // Client to Server
    LOCATION_UPDATE = 'tracking:location:update',
    SUBSCRIBE_TECHNICIAN = 'tracking:subscribe:technician',
    UNSUBSCRIBE_TECHNICIAN = 'tracking:unsubscribe:technician',
    SUBSCRIBE_ALL = 'tracking:subscribe:all',
    UNSUBSCRIBE_ALL = 'tracking:unsubscribe:all',

    // Server to Client
    LOCATION_UPDATED = 'tracking:location:updated',
    TECHNICIAN_STATUS_CHANGED = 'tracking:status:changed',
    ERROR = 'tracking:error',
    CONNECTED = 'tracking:connected',
    DISCONNECTED = 'tracking:disconnected'
}

export interface LocationUpdatePayload {
    technicianId: string;
    latitude: number;
    longitude: number;
    address?: string;
    notes?: string;
    status?: 'Active' | 'Inactive' | 'On Break' | 'Completed';
    timestamp?: Date;
}

export interface SubscribePayload {
    technicianId: string;
}

export interface LocationUpdatedPayload {
    trackingId: string;
    technicianId: string;
    technicianName: string;
    latitude: number;
    longitude: number;
    address?: string;
    status: string;
    timestamp: Date;
}

export interface StatusChangedPayload {
    technicianId: string;
    oldStatus: string;
    newStatus: string;
    timestamp: Date;
}

export interface ErrorPayload {
    message: string;
    code?: string;
    details?: any;
}

export interface ConnectedPayload {
    message: string;
    userId: string;
    timestamp: Date;
}
