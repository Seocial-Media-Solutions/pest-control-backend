// Tracking Events - Event types and payloads for WebSocket communication
export var TrackingEventType;
(function (TrackingEventType) {
    // Client to Server
    TrackingEventType["LOCATION_UPDATE"] = "tracking:location:update";
    TrackingEventType["SUBSCRIBE_TECHNICIAN"] = "tracking:subscribe:technician";
    TrackingEventType["UNSUBSCRIBE_TECHNICIAN"] = "tracking:unsubscribe:technician";
    TrackingEventType["SUBSCRIBE_ALL"] = "tracking:subscribe:all";
    TrackingEventType["UNSUBSCRIBE_ALL"] = "tracking:unsubscribe:all";
    // Server to Client
    TrackingEventType["LOCATION_UPDATED"] = "tracking:location:updated";
    TrackingEventType["TECHNICIAN_STATUS_CHANGED"] = "tracking:status:changed";
    TrackingEventType["ERROR"] = "tracking:error";
    TrackingEventType["CONNECTED"] = "tracking:connected";
    TrackingEventType["DISCONNECTED"] = "tracking:disconnected";
})(TrackingEventType || (TrackingEventType = {}));
