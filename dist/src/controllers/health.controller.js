/**
 * Health check controller
 * Returns the health status of the API
 */
export const healthCheck = (req, res) => {
    const healthStatus = {
        status: 'OK',
        message: 'Pest Control API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    };
    res.status(200).json(healthStatus);
};
/**
 * Detailed health check with system information
 */
export const detailedHealthCheck = (req, res) => {
    const healthStatus = {
        status: 'OK',
        message: 'Pest Control API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            memory: {
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
            },
            cpu: process.cpuUsage()
        }
    };
    res.status(200).json(healthStatus);
};
