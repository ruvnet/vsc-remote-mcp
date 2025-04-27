"use strict";
/**
 * Instance Registry for VSCode Remote Swarm
 * Tracks and manages VSCode instances across different providers
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
exports.InstanceRegistry = void 0;
const provider_types_1 = require("../providers/core/provider-types");
const logger = __importStar(require("../utils/logger"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Instance registry class
 */
class InstanceRegistry {
    /**
     * Constructor
     * @param config Swarm configuration
     */
    constructor(config) {
        this.config = config;
        /**
         * Map of instances by ID
         */
        this.instances = new Map();
        /**
         * Map of instance IDs by provider type
         */
        this.instancesByProvider = new Map();
        /**
         * Auto-save interval ID
         */
        this.autoSaveIntervalId = null;
        this.storageDir = path.join(config.general.stateDir, 'instances');
        // Create storage directory if it doesn't exist
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
        // Initialize provider maps
        Object.values(provider_types_1.ProviderType).forEach(type => {
            this.instancesByProvider.set(type, new Set());
        });
    }
    /**
     * Initialize the registry
     */
    async initialize() {
        logger.info('Initializing instance registry');
        // Load instances from storage
        if (this.config.general.loadStateOnStartup) {
            this.loadInstances();
        }
        // Set up auto-save interval
        if (this.config.general.autoSaveIntervalMs > 0) {
            this.autoSaveIntervalId = setInterval(() => {
                this.saveInstances();
            }, this.config.general.autoSaveIntervalMs);
        }
        logger.info('Instance registry initialized');
    }
    /**
     * Load instances from storage
     */
    loadInstances() {
        try {
            logger.info(`Loading instances from ${this.storageDir}`);
            // Clear existing instances
            this.instances.clear();
            this.instancesByProvider.forEach(set => set.clear());
            // Read instance files
            const files = fs.readdirSync(this.storageDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(this.storageDir, file);
                        const data = fs.readFileSync(filePath, 'utf8');
                        const instance = JSON.parse(data);
                        // Restore Date objects
                        instance.createdAt = new Date(instance.createdAt);
                        instance.updatedAt = new Date(instance.updatedAt);
                        // Register instance
                        this.registerInstance(instance);
                        logger.debug(`Loaded instance ${instance.id} from ${filePath}`);
                    }
                    catch (error) {
                        logger.error(`Failed to load instance from ${file}`, error);
                    }
                }
            }
            logger.info(`Loaded ${this.instances.size} instances`);
        }
        catch (error) {
            logger.error('Failed to load instances', error);
        }
    }
    /**
     * Save instances to storage
     */
    saveInstances() {
        try {
            logger.debug(`Saving instances to ${this.storageDir}`);
            // Save each instance
            for (const instance of this.instances.values()) {
                this.saveInstance(instance);
            }
            logger.debug(`Saved ${this.instances.size} instances`);
        }
        catch (error) {
            logger.error('Failed to save instances', error);
        }
    }
    /**
     * Save an instance to storage
     * @param instance Instance to save
     */
    saveInstance(instance) {
        try {
            const filePath = path.join(this.storageDir, `${instance.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(instance, null, 2), 'utf8');
        }
        catch (error) {
            logger.error(`Failed to save instance ${instance.id}`, error);
        }
    }
    /**
     * Register an instance
     * @param instance Instance to register
     */
    registerInstance(instance) {
        // Add to instances map
        this.instances.set(instance.id, instance);
        // Add to provider map
        const providerInstances = this.instancesByProvider.get(instance.providerType);
        if (providerInstances) {
            providerInstances.add(instance.id);
        }
        else {
            // Create new set if provider type doesn't exist
            this.instancesByProvider.set(instance.providerType, new Set([instance.id]));
        }
        // Save instance
        this.saveInstance(instance);
        logger.info(`Registered instance ${instance.id} (${instance.name}) with provider ${instance.providerType}`);
    }
    /**
     * Update an instance
     * @param instance Updated instance
     */
    updateInstance(instance) {
        // Check if instance exists
        if (!this.instances.has(instance.id)) {
            throw new Error(`Instance ${instance.id} not found`);
        }
        // Get existing instance
        const existingInstance = this.instances.get(instance.id);
        // Check if provider type changed
        if (existingInstance.providerType !== instance.providerType) {
            // Remove from old provider map
            const oldProviderInstances = this.instancesByProvider.get(existingInstance.providerType);
            if (oldProviderInstances) {
                oldProviderInstances.delete(instance.id);
            }
            // Add to new provider map
            const newProviderInstances = this.instancesByProvider.get(instance.providerType);
            if (newProviderInstances) {
                newProviderInstances.add(instance.id);
            }
            else {
                // Create new set if provider type doesn't exist
                this.instancesByProvider.set(instance.providerType, new Set([instance.id]));
            }
        }
        // Update instance
        instance.updatedAt = new Date();
        this.instances.set(instance.id, instance);
        // Save instance
        this.saveInstance(instance);
        logger.info(`Updated instance ${instance.id} (${instance.name})`);
    }
    /**
     * Remove an instance
     * @param instanceId Instance ID
     * @returns True if instance was removed
     */
    removeInstance(instanceId) {
        // Check if instance exists
        if (!this.instances.has(instanceId)) {
            return false;
        }
        // Get instance
        const instance = this.instances.get(instanceId);
        // Remove from provider map
        const providerInstances = this.instancesByProvider.get(instance.providerType);
        if (providerInstances) {
            providerInstances.delete(instanceId);
        }
        // Remove from instances map
        this.instances.delete(instanceId);
        // Remove instance file
        try {
            const filePath = path.join(this.storageDir, `${instanceId}.json`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (error) {
            logger.error(`Failed to remove instance file for ${instanceId}`, error);
        }
        logger.info(`Removed instance ${instanceId}`);
        return true;
    }
    /**
     * Get an instance by ID
     * @param instanceId Instance ID
     * @returns Instance or null if not found
     */
    getInstance(instanceId) {
        return this.instances.get(instanceId) || null;
    }
    /**
     * List all instances
     * @param providerType Optional provider type filter
     * @param status Optional status filter
     * @returns Array of instances
     */
    listInstances(providerType, status) {
        let instances = Array.from(this.instances.values());
        // Filter by provider type
        if (providerType !== undefined) {
            instances = instances.filter(instance => instance.providerType === providerType);
        }
        // Filter by status
        if (status !== undefined) {
            instances = instances.filter(instance => instance.status === status);
        }
        return instances;
    }
    /**
     * Get instance count
     * @param providerType Optional provider type filter
     * @returns Number of instances
     */
    getInstanceCount(providerType) {
        if (providerType !== undefined) {
            const providerInstances = this.instancesByProvider.get(providerType);
            return providerInstances ? providerInstances.size : 0;
        }
        return this.instances.size;
    }
    /**
     * Find instances by name pattern
     * @param namePattern Name pattern (case-insensitive)
     * @returns Array of matching instances
     */
    findInstancesByName(namePattern) {
        const regex = new RegExp(namePattern, 'i');
        return Array.from(this.instances.values()).filter(instance => regex.test(instance.name));
    }
    /**
     * Find instances by metadata
     * @param key Metadata key
     * @param value Metadata value
     * @returns Array of matching instances
     */
    findInstancesByMetadata(key, value) {
        return Array.from(this.instances.values()).filter(instance => {
            return instance.metadata && instance.metadata[key] === value;
        });
    }
    /**
     * Dispose of registry resources
     */
    dispose() {
        // Clear auto-save interval
        if (this.autoSaveIntervalId) {
            clearInterval(this.autoSaveIntervalId);
            this.autoSaveIntervalId = null;
        }
        // Save instances
        this.saveInstances();
    }
}
exports.InstanceRegistry = InstanceRegistry;
//# sourceMappingURL=instance-registry.js.map