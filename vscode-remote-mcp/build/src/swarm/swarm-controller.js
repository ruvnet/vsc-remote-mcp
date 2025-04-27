"use strict";
/**
 * Swarm Controller for VSCode Remote Swarm
 * Manages VSCode instances across multiple providers
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
exports.SwarmController = void 0;
const provider_types_1 = require("../providers/core/provider-types");
const provider_factory_1 = require("../providers/core/provider-factory");
const instance_registry_1 = require("./instance-registry");
const health_monitor_1 = require("./health-monitor");
const migration_manager_1 = require("./migration-manager");
const config_1 = require("./config");
const logger = __importStar(require("../utils/logger"));
/**
 * Swarm controller class
 */
class SwarmController {
    /**
     * Constructor
     * @param config Swarm configuration
     */
    constructor(config) {
        /**
         * Map of providers by type
         */
        this.providers = new Map();
        /**
         * Whether the controller is initialized
         */
        this.initialized = false;
        // Merge provided config with defaults
        this.config = {
            ...config_1.defaultSwarmConfig,
            ...config
        };
        // Create registry
        this.registry = new instance_registry_1.InstanceRegistry(this.config);
        // Create health monitor
        this.healthMonitor = new health_monitor_1.HealthMonitor(this.registry, this.providers, this.config);
        // Create migration manager
        this.migrationManager = new migration_manager_1.MigrationManager(this.registry, this.providers, this.config);
    }
    /**
     * Initialize the swarm controller
     */
    async initialize() {
        try {
            logger.info('Initializing swarm controller');
            // Initialize providers
            await this.initializeProviders();
            // Initialize registry
            await this.registry.initialize();
            // Initialize health monitor
            await this.healthMonitor.initialize();
            // Initialize migration manager
            await this.migrationManager.initialize();
            this.initialized = true;
            logger.info('Swarm controller initialized');
        }
        catch (error) {
            logger.error('Failed to initialize swarm controller', error);
            throw error;
        }
    }
    /**
     * Initialize providers
     */
    async initializeProviders() {
        try {
            logger.info('Initializing providers');
            // Initialize Docker provider if enabled
            if (this.config.providers.find(p => p.type === provider_types_1.ProviderType.DOCKER && p.enabled)) {
                logger.info('Initializing Docker provider');
                try {
                    const dockerProvider = provider_factory_1.ProviderFactory.createProvider(provider_types_1.ProviderType.DOCKER, {
                        common: {
                            defaultResourceLimits: {
                                cpu: 2,
                                memory: '2048m',
                                storage: 10
                            },
                            instanceNamePrefix: 'vscode-'
                        },
                        specific: this.config.providers.find(p => p.type === provider_types_1.ProviderType.DOCKER)?.config || {}
                    });
                    await dockerProvider.initialize();
                    this.providers.set(provider_types_1.ProviderType.DOCKER, dockerProvider);
                    logger.info('Docker provider initialized');
                }
                catch (error) {
                    logger.error('Failed to initialize Docker provider', error);
                }
            }
            // Initialize Fly.io provider if enabled
            if (this.config.providers.find(p => p.type === provider_types_1.ProviderType.FLYIO && p.enabled)) {
                logger.info('Initializing Fly.io provider');
                try {
                    const flyProvider = provider_factory_1.ProviderFactory.createProvider(provider_types_1.ProviderType.FLYIO, {
                        common: {
                            defaultResourceLimits: {
                                cpu: 1,
                                memory: '1024m',
                                storage: 5
                            },
                            instanceNamePrefix: 'vscode-'
                        },
                        specific: this.config.providers.find(p => p.type === provider_types_1.ProviderType.FLYIO)?.config || {}
                    });
                    await flyProvider.initialize();
                    this.providers.set(provider_types_1.ProviderType.FLYIO, flyProvider);
                    logger.info('Fly.io provider initialized');
                }
                catch (error) {
                    logger.error('Failed to initialize Fly.io provider', error);
                }
            }
            logger.info(`Initialized ${this.providers.size} providers`);
        }
        catch (error) {
            logger.error('Failed to initialize providers', error);
            throw error;
        }
    }
    /**
     * Create a new VSCode instance
     * @param config Instance configuration
     * @param providerType Provider type
     * @returns Created instance
     */
    async createInstance(config, providerType) {
        this.ensureInitialized();
        // Use default provider type if not specified
        const type = providerType || this.config.general.defaultProviderType;
        // Get provider
        const provider = this.providers.get(type);
        if (!provider) {
            throw new Error(`Provider ${type} not found or not initialized`);
        }
        // Create instance
        logger.info(`Creating instance with provider ${type}`);
        const instance = await provider.createInstance(config);
        // Register instance
        this.registry.registerInstance(instance);
        return instance;
    }
    /**
     * Get an instance by ID
     * @param instanceId Instance ID
     * @returns Instance or null if not found
     */
    async getInstance(instanceId) {
        this.ensureInitialized();
        // Get instance from registry
        const instance = this.registry.getInstance(instanceId);
        if (!instance) {
            return null;
        }
        // Get provider
        const provider = this.providers.get(instance.providerType);
        if (!provider) {
            logger.warn(`Provider ${instance.providerType} not found for instance ${instanceId}`);
            return instance;
        }
        // Get updated instance from provider
        try {
            const updatedInstance = await provider.getInstance(instanceId);
            if (updatedInstance) {
                // Update registry
                this.registry.updateInstance(updatedInstance);
                return updatedInstance;
            }
            return instance;
        }
        catch (error) {
            logger.error(`Failed to get instance ${instanceId} from provider`, error);
            return instance;
        }
    }
    /**
     * List all instances
     * @param filter Optional filter criteria
     * @returns Array of instances
     */
    async listInstances(filter) {
        this.ensureInitialized();
        // Get instances from registry
        let instances = this.registry.listInstances();
        // Apply filter
        if (filter) {
            if (filter.status) {
                const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
                instances = instances.filter(instance => statuses.includes(instance.status));
            }
            if (filter.namePattern) {
                const regex = new RegExp(filter.namePattern, 'i');
                instances = instances.filter(instance => regex.test(instance.name));
            }
            if (filter.createdAfter !== undefined) {
                instances = instances.filter(instance => instance.createdAt >= filter.createdAfter);
            }
            if (filter.createdBefore !== undefined) {
                instances = instances.filter(instance => instance.createdAt <= filter.createdBefore);
            }
            if (filter.tags) {
                instances = instances.filter(instance => {
                    for (const [key, value] of Object.entries(filter.tags)) {
                        if (!instance.metadata || instance.metadata[key] !== value) {
                            return false;
                        }
                    }
                    return true;
                });
            }
            // Apply limit and offset
            if (filter.offset !== undefined && filter.offset > 0) {
                instances = instances.slice(filter.offset);
            }
            if (filter.limit !== undefined && filter.limit > 0) {
                instances = instances.slice(0, filter.limit);
            }
        }
        return instances;
    }
    /**
     * Start an instance
     * @param instanceId Instance ID
     * @returns Updated instance
     */
    async startInstance(instanceId) {
        this.ensureInitialized();
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
        // Start instance
        logger.info(`Starting instance ${instanceId}`);
        const updatedInstance = await provider.startInstance(instanceId);
        // Update registry
        this.registry.updateInstance(updatedInstance);
        return updatedInstance;
    }
    /**
     * Stop an instance
     * @param instanceId Instance ID
     * @param force Force stop if true
     * @returns Updated instance
     */
    async stopInstance(instanceId, force) {
        this.ensureInitialized();
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
        // Stop instance
        logger.info(`Stopping instance ${instanceId}`);
        const updatedInstance = await provider.stopInstance(instanceId, force);
        // Update registry
        this.registry.updateInstance(updatedInstance);
        return updatedInstance;
    }
    /**
     * Delete an instance
     * @param instanceId Instance ID
     * @returns True if successful
     */
    async deleteInstance(instanceId) {
        this.ensureInitialized();
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
        // Delete instance
        logger.info(`Deleting instance ${instanceId}`);
        const success = await provider.deleteInstance(instanceId);
        if (success) {
            // Remove from registry
            this.registry.removeInstance(instanceId);
        }
        return success;
    }
    /**
     * Update instance configuration
     * @param instanceId Instance ID
     * @param config Updated configuration
     * @returns Updated instance
     */
    async updateInstance(instanceId, config) {
        this.ensureInitialized();
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
        // Update instance
        logger.info(`Updating instance ${instanceId}`);
        const updatedInstance = await provider.updateInstance(instanceId, config);
        // Update registry
        this.registry.updateInstance(updatedInstance);
        return updatedInstance;
    }
    /**
     * Check instance health
     * @param instanceId Instance ID
     * @returns Instance health
     */
    async checkInstanceHealth(instanceId) {
        this.ensureInitialized();
        // Get instance
        const instance = this.registry.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Instance ${instanceId} not found`);
        }
        // Check health
        await this.healthMonitor.checkInstanceHealth(instanceId);
        // Get health from registry or create a default one
        const health = {
            instanceId,
            status: config_1.HealthStatus.UNKNOWN,
            lastChecked: new Date(),
            details: {
                message: 'Health check initiated'
            },
            healthHistory: []
        };
        return health;
    }
    /**
     * Recover an unhealthy instance
     * @param instanceId Instance ID
     * @returns True if recovery was successful
     */
    async recoverInstance(instanceId) {
        this.ensureInitialized();
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
            logger.info(`Attempting to recover instance ${instanceId} by restarting`);
            // Stop instance
            await provider.stopInstance(instanceId);
            // Start instance
            await provider.startInstance(instanceId);
            logger.info(`Successfully restarted instance ${instanceId}`);
            return true;
        }
        catch (error) {
            logger.error(`Failed to recover instance ${instanceId}`, error);
            return false;
        }
    }
    /**
     * Create a migration plan
     * @param sourceInstanceId Source instance ID
     * @param targetProviderType Target provider type
     * @param options Migration options
     * @returns Migration plan
     */
    async createMigrationPlan(sourceInstanceId, targetProviderType, options) {
        this.ensureInitialized();
        // Get source instance
        const sourceInstance = this.registry.getInstance(sourceInstanceId);
        if (!sourceInstance) {
            throw new Error(`Source instance ${sourceInstanceId} not found`);
        }
        // Get target provider
        const targetProvider = this.providers.get(targetProviderType);
        if (!targetProvider) {
            throw new Error(`Target provider ${targetProviderType} not found or not initialized`);
        }
        // Create migration plan
        return this.migrationManager.createMigrationPlan(sourceInstanceId, targetProviderType, options);
    }
    /**
     * Start a migration
     * @param migrationId Migration ID
     * @returns Migration result
     */
    async startMigration(migrationId) {
        this.ensureInitialized();
        // Start migration
        return this.migrationManager.startMigration(migrationId);
    }
    /**
     * Cancel a migration
     * @param migrationId Migration ID
     * @returns True if migration was cancelled
     */
    async cancelMigration(migrationId) {
        this.ensureInitialized();
        // Cancel migration
        return this.migrationManager.cancelMigration(migrationId);
    }
    /**
     * Get a migration plan
     * @param migrationId Migration ID
     * @returns Migration plan or null if not found
     */
    getMigrationPlan(migrationId) {
        this.ensureInitialized();
        // Get migration plan
        return this.migrationManager.getMigrationPlan(migrationId);
    }
    /**
     * List migration plans
     * @param status Optional status filter
     * @returns Array of migration plans
     */
    listMigrationPlans(status) {
        this.ensureInitialized();
        // List migration plans
        return this.migrationManager.listMigrationPlans(status);
    }
    /**
     * Get provider capabilities
     * @param providerType Provider type
     * @returns Provider capabilities or null if provider not found
     */
    getProviderCapabilities(providerType) {
        this.ensureInitialized();
        // Get provider
        const provider = this.providers.get(providerType);
        if (!provider) {
            return null;
        }
        // Get capabilities
        return provider.getCapabilities();
    }
    /**
     * Get swarm status
     * @returns Swarm status
     */
    getSwarmStatus() {
        this.ensureInitialized();
        // Get instance counts
        const instanceCounts = {};
        for (const type of Object.values(provider_types_1.ProviderType)) {
            instanceCounts[type] = this.registry.getInstanceCount(type);
        }
        // Get provider status
        const providerStatus = {};
        for (const [type, provider] of this.providers.entries()) {
            providerStatus[type] = true;
        }
        // Create status
        return {
            initialized: this.initialized,
            providers: Object.values(provider_types_1.ProviderType).map(type => ({
                type,
                enabled: this.providers.has(type),
                instanceCount: instanceCounts[type] || 0
            })),
            totalInstances: this.registry.getInstanceCount(),
            healthMonitorEnabled: this.config.healthMonitor.enabled,
            migrationEnabled: this.config.migration.enabled
        };
    }
    /**
     * Dispose of swarm controller resources
     */
    async dispose() {
        logger.info('Disposing swarm controller');
        try {
            // Dispose of health monitor
            if (this.healthMonitor) {
                try {
                    this.healthMonitor.dispose();
                }
                catch (error) {
                    console.error('Error disposing health monitor:', error);
                }
            }
            // Dispose of migration manager
            if (this.migrationManager) {
                try {
                    this.migrationManager.dispose();
                }
                catch (error) {
                    console.error('Error disposing migration manager:', error);
                }
            }
            // Dispose of registry
            if (this.registry) {
                try {
                    this.registry.dispose();
                }
                catch (error) {
                    console.error('Error disposing instance registry:', error);
                }
            }
        }
        catch (error) {
            console.error('Error during swarm controller disposal:', error);
        }
        finally {
            this.initialized = false;
            logger.info('Swarm controller disposed');
        }
    }
    /**
     * Ensure the controller is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Swarm controller not initialized');
        }
    }
}
exports.SwarmController = SwarmController;
//# sourceMappingURL=swarm-controller.js.map