"use strict";
/**
 * Health Monitor for VSCode Remote Swarm
 * Monitors the health of VSCode instances and provides recovery mechanisms
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthMonitor = void 0;
const provider_types_1 = require("../providers/core/provider-types");
const config_1 = require("./config");
const logger = __importStar(require("../utils/logger"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Health monitor class
 */
class HealthMonitor {
    /**
     * Constructor
     * @param registry Instance registry
     * @param providers Map of providers by type
     * @param config Swarm configuration
     */
    constructor(registry, providers, config) {
        this.registry = registry;
        this.providers = providers;
        this.config = config;
        /**
         * Map of instance health by ID
         */
        this.instanceHealth = new Map();
        /**
         * Health check interval ID
         */
        this.healthCheckIntervalId = null;
        this.storageDir = path.join(config.general.stateDir, 'health');
        // Create storage directory if it doesn't exist
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }
    /**
     * Initialize the health monitor
     */
    async initialize() {
        logger.info('Initializing health monitor');
        // Load health data
        this.loadHealthData();
        // Start health check interval if enabled
        if (this.config.healthMonitor.enabled && this.config.healthMonitor.checkIntervalMs > 0) {
            this.startHealthChecks();
        }
        logger.info('Health monitor initialized');
    }
    /**
     * Load health data from storage
     */
    loadHealthData() {
        try {
            logger.info(`Loading health data from ${this.storageDir}`);
            // Clear existing health data
            this.instanceHealth.clear();
            // Read health files
            const files = fs.readdirSync(this.storageDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(this.storageDir, file);
                        const data = fs.readFileSync(filePath, 'utf8');
                        const health = JSON.parse(data);
                        // Restore Date objects
                        health.lastChecked = new Date(health.lastChecked);
                        for (const entry of health.healthHistory) {
                            entry.timestamp = new Date(entry.timestamp);
                        }
                        this.instanceHealth.set(health.instanceId, health);
                        logger.debug(`Loaded health data for instance ${health.instanceId}`);
                    }
                    catch (error) {
                        logger.error(`Failed to load health data from ${file}`, error);
                    }
                }
            }
            logger.info(`Loaded health data for ${this.instanceHealth.size} instances`);
        }
        catch (error) {
            logger.error('Failed to load health data', error);
        }
    }
    /**
     * Save health data to storage
     */
    saveHealthData() {
        try {
            logger.debug(`Saving health data to ${this.storageDir}`);
            // Save each instance health
            for (const health of this.instanceHealth.values()) {
                this.saveInstanceHealth(health);
            }
            logger.debug(`Saved health data for ${this.instanceHealth.size} instances`);
        }
        catch (error) {
            logger.error('Failed to save health data', error);
        }
    }
    /**
     * Save instance health to storage
     * @param health Instance health
     */
    saveInstanceHealth(health) {
        try {
            const filePath = path.join(this.storageDir, `${health.instanceId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(health, null, 2), 'utf8');
        }
        catch (error) {
            logger.error(`Failed to save health data for instance ${health.instanceId}`, error);
        }
    }
    /**
     * Start health checks
     */
    startHealthChecks() {
        logger.info(`Starting health checks with interval ${this.config.healthMonitor.checkIntervalMs}ms`);
        // Clear existing interval
        if (this.healthCheckIntervalId) {
            clearInterval(this.healthCheckIntervalId);
        }
        // Start new interval
        this.healthCheckIntervalId = setInterval(() => {
            this.checkAllInstancesHealth();
        }, this.config.healthMonitor.checkIntervalMs);
    }
    /**
     * Stop health checks
     */
    stopHealthChecks() {
        logger.info('Stopping health checks');
        // Clear interval
        if (this.healthCheckIntervalId) {
            clearInterval(this.healthCheckIntervalId);
            this.healthCheckIntervalId = null;
        }
    }
    /**
     * Check health of all instances
     */
    async checkAllInstancesHealth() {
        try {
            logger.debug('Checking health of all instances');
            // Get all instances
            const instances = this.registry.listInstances();
            // Check health of each instance
            for (const instance of instances) {
                try {
                    // Skip instances that are not running
                    if (instance.status !== provider_types_1.InstanceStatus.RUNNING) {
                        continue;
                    }
                    await this.checkInstanceHealth(instance.id);
                }
                catch (error) {
                    logger.error(`Failed to check health of instance ${instance.id}`, error);
                }
            }
            // Save health data
            this.saveHealthData();
        }
        catch (error) {
            logger.error('Failed to check health of all instances', error);
        }
    }
    /**
     * Check health of an instance
     * @param instanceId Instance ID
     */
    async checkInstanceHealth(instanceId) {
        try {
            logger.debug(`Checking health of instance ${instanceId}`);
            // Get instance
            const instance = this.registry.getInstance(instanceId);
            if (!instance) {
                throw new Error(`Instance ${instanceId} not found`);
            }
            // Get provider
            const provider = this.providers.get(instance.providerType);
            if (!provider) {
                throw new Error(`Provider ${instance.providerType} not found for instance ${instanceId}`);
            }
            // Check if instance is running
            if (instance.status !== provider_types_1.InstanceStatus.RUNNING) {
                const result = {
                    instanceId,
                    status: config_1.HealthStatus.UNKNOWN,
                    details: {
                        message: `Instance is not running (status: ${instance.status})`
                    },
                    timestamp: new Date()
                };
                this.updateInstanceHealth(result);
                return result;
            }
            // Perform health check
            const startTime = Date.now();
            try {
                // Get instance from provider to check if it's still running
                const providerInstance = await provider.getInstance(instanceId);
                if (!providerInstance) {
                    const result = {
                        instanceId,
                        status: config_1.HealthStatus.UNHEALTHY,
                        details: {
                            message: 'Instance not found in provider'
                        },
                        timestamp: new Date()
                    };
                    this.updateInstanceHealth(result);
                    return result;
                }
                if (providerInstance.status !== provider_types_1.InstanceStatus.RUNNING) {
                    const result = {
                        instanceId,
                        status: config_1.HealthStatus.UNHEALTHY,
                        details: {
                            message: `Instance is not running in provider (status: ${providerInstance.status})`
                        },
                        timestamp: new Date()
                    };
                    this.updateInstanceHealth(result);
                    return result;
                }
                // Execute a simple command to check if the instance is responsive
                const commandResult = await provider.executeCommand(instanceId, 'echo "health check"');
                const responseTime = Date.now() - startTime;
                if (commandResult.exitCode !== 0) {
                    const result = {
                        instanceId,
                        status: config_1.HealthStatus.UNHEALTHY,
                        details: {
                            message: 'Instance is not responsive',
                            error: commandResult.stderr,
                            responseTimeMs: responseTime
                        },
                        timestamp: new Date()
                    };
                    this.updateInstanceHealth(result);
                    return result;
                }
                // Instance is healthy
                const result = {
                    instanceId,
                    status: config_1.HealthStatus.HEALTHY,
                    details: {
                        message: 'Instance is healthy',
                        responseTimeMs: responseTime
                    },
                    timestamp: new Date()
                };
                this.updateInstanceHealth(result);
                return result;
            }
            catch (error) {
                // Health check failed
                const result = {
                    instanceId,
                    status: config_1.HealthStatus.UNHEALTHY,
                    details: {
                        message: 'Health check failed',
                        error: `${error}`
                    },
                    timestamp: new Date()
                };
                this.updateInstanceHealth(result);
                return result;
            }
        }
        catch (error) {
            logger.error(`Failed to check health of instance ${instanceId}`, error);
            // Return unknown health status
            const result = {
                instanceId,
                status: config_1.HealthStatus.UNKNOWN,
                details: {
                    message: 'Failed to check health',
                    error: `${error}`
                },
                timestamp: new Date()
            };
            this.updateInstanceHealth(result);
            return result;
        }
    }
    /**
     * Update instance health
     * @param result Health check result
     */
    updateInstanceHealth(result) {
        // Get existing health or create new one
        let health = this.instanceHealth.get(result.instanceId);
        if (!health) {
            health = {
                instanceId: result.instanceId,
                status: result.status,
                lastChecked: result.timestamp,
                details: result.details,
                healthHistory: []
            };
        }
        else {
            // Update health
            health.status = result.status;
            health.lastChecked = result.timestamp;
            health.details = result.details;
        }
        // Add to history
        health.healthHistory.unshift({
            status: result.status,
            timestamp: result.timestamp,
            details: result.details
        });
        // Limit history size
        if (health.healthHistory.length > this.config.healthMonitor.historySize) {
            health.healthHistory = health.healthHistory.slice(0, this.config.healthMonitor.historySize);
        }
        // Save health
        this.instanceHealth.set(result.instanceId, health);
        // Auto-recover if enabled
        if (this.config.healthMonitor.autoRecover &&
            result.status === config_1.HealthStatus.UNHEALTHY) {
            this.recoverInstance(result.instanceId);
        }
    }
    /**
     * Recover an unhealthy instance
     * @param instanceId Instance ID
     * @returns True if recovery was successful
     */
    async recoverInstance(instanceId) {
        try {
            logger.info(`Attempting to recover instance ${instanceId}`);
            // Get instance
            const instance = this.registry.getInstance(instanceId);
            if (!instance) {
                throw new Error(`Instance ${instanceId} not found`);
            }
            // Get provider
            const provider = this.providers.get(instance.providerType);
            if (!provider) {
                throw new Error(`Provider ${instance.providerType} not found for instance ${instanceId}`);
            }
            // Try to recover by restarting the instance
            try {
                logger.info(`Restarting instance ${instanceId}`);
                // Stop instance
                await provider.stopInstance(instanceId);
                // Start instance
                await provider.startInstance(instanceId);
                logger.info(`Successfully restarted instance ${instanceId}`);
                // Update health
                const result = {
                    instanceId,
                    status: config_1.HealthStatus.RECOVERING,
                    details: {
                        message: 'Instance restarted for recovery'
                    },
                    timestamp: new Date()
                };
                this.updateInstanceHealth(result);
                return true;
            }
            catch (error) {
                logger.error(`Failed to restart instance ${instanceId}`, error);
                // Update health
                const result = {
                    instanceId,
                    status: config_1.HealthStatus.UNHEALTHY,
                    details: {
                        message: 'Recovery failed',
                        error: `${error}`
                    },
                    timestamp: new Date()
                };
                this.updateInstanceHealth(result);
                return false;
            }
        }
        catch (error) {
            logger.error(`Failed to recover instance ${instanceId}`, error);
            return false;
        }
    }
    /**
     * Get instance health
     * @param instanceId Instance ID
     * @returns Instance health or null if not found
     */
    getInstanceHealth(instanceId) {
        return this.instanceHealth.get(instanceId) || null;
    }
    /**
     * List instance health
     * @param status Optional status filter
     * @returns Array of instance health
     */
    listInstanceHealth(status) {
        let healthList = Array.from(this.instanceHealth.values());
        // Filter by status
        if (status !== undefined) {
            healthList = healthList.filter(health => health.status === status);
        }
        return healthList;
    }
    /**
     * Dispose of health monitor resources
     */
    dispose() {
        logger.info('Disposing health monitor');
        // Stop health checks
        this.stopHealthChecks();
        // Save health data
        this.saveHealthData();
    }
}
exports.HealthMonitor = HealthMonitor;
//# sourceMappingURL=health-monitor.js.map