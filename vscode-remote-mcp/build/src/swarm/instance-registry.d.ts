/**
 * Instance Registry for VSCode Remote Swarm
 * Tracks and manages VSCode instances across different providers
 */
import { VSCodeInstance } from '../providers/core/instance.interface';
import { ProviderType, InstanceStatus } from '../providers/core/provider-types';
import { SwarmConfig } from './config';
/**
 * Instance registry class
 */
export declare class InstanceRegistry {
    private config;
    /**
     * Map of instances by ID
     */
    private instances;
    /**
     * Map of instance IDs by provider type
     */
    private instancesByProvider;
    /**
     * Storage directory for instance data
     */
    private storageDir;
    /**
     * Auto-save interval ID
     */
    private autoSaveIntervalId;
    /**
     * Constructor
     * @param config Swarm configuration
     */
    constructor(config: SwarmConfig);
    /**
     * Initialize the registry
     */
    initialize(): Promise<void>;
    /**
     * Load instances from storage
     */
    private loadInstances;
    /**
     * Save instances to storage
     */
    private saveInstances;
    /**
     * Save an instance to storage
     * @param instance Instance to save
     */
    private saveInstance;
    /**
     * Register an instance
     * @param instance Instance to register
     */
    registerInstance(instance: VSCodeInstance): void;
    /**
     * Update an instance
     * @param instance Updated instance
     */
    updateInstance(instance: VSCodeInstance): void;
    /**
     * Remove an instance
     * @param instanceId Instance ID
     * @returns True if instance was removed
     */
    removeInstance(instanceId: string): boolean;
    /**
     * Get an instance by ID
     * @param instanceId Instance ID
     * @returns Instance or null if not found
     */
    getInstance(instanceId: string): VSCodeInstance | null;
    /**
     * List all instances
     * @param providerType Optional provider type filter
     * @param status Optional status filter
     * @returns Array of instances
     */
    listInstances(providerType?: ProviderType, status?: InstanceStatus): VSCodeInstance[];
    /**
     * Get instance count
     * @param providerType Optional provider type filter
     * @returns Number of instances
     */
    getInstanceCount(providerType?: ProviderType): number;
    /**
     * Find instances by name pattern
     * @param namePattern Name pattern (case-insensitive)
     * @returns Array of matching instances
     */
    findInstancesByName(namePattern: string): VSCodeInstance[];
    /**
     * Find instances by metadata
     * @param key Metadata key
     * @param value Metadata value
     * @returns Array of matching instances
     */
    findInstancesByMetadata(key: string, value: any): VSCodeInstance[];
    /**
     * Dispose of registry resources
     */
    dispose(): void;
}
