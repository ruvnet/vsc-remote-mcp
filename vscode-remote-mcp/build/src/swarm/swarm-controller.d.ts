/**
 * Swarm Controller for VSCode Remote Swarm
 * Manages VSCode instances across multiple providers
 */
import { VSCodeInstance, InstanceConfig, InstanceFilter } from '../providers/core/instance.interface';
import { ProviderType, ProviderCapabilities } from '../providers/core/provider-types';
import { MigrationPlan, MigrationOptions, MigrationResult, MigrationStatus } from './migration-manager';
import { SwarmConfig, InstanceHealth } from './config';
/**
 * Swarm controller class
 */
export declare class SwarmController {
    /**
     * Instance registry
     */
    private registry;
    /**
     * Health monitor
     */
    private healthMonitor;
    /**
     * Migration manager
     */
    private migrationManager;
    /**
     * Map of providers by type
     */
    private providers;
    /**
     * Swarm configuration
     */
    private config;
    /**
     * Whether the controller is initialized
     */
    private initialized;
    /**
     * Constructor
     * @param config Swarm configuration
     */
    constructor(config?: Partial<SwarmConfig>);
    /**
     * Initialize the swarm controller
     */
    initialize(): Promise<void>;
    /**
     * Initialize providers
     */
    private initializeProviders;
    /**
     * Create a new VSCode instance
     * @param config Instance configuration
     * @param providerType Provider type
     * @returns Created instance
     */
    createInstance(config: InstanceConfig, providerType?: ProviderType): Promise<VSCodeInstance>;
    /**
     * Get an instance by ID
     * @param instanceId Instance ID
     * @returns Instance or null if not found
     */
    getInstance(instanceId: string): Promise<VSCodeInstance | null>;
    /**
     * List all instances
     * @param filter Optional filter criteria
     * @returns Array of instances
     */
    listInstances(filter?: InstanceFilter): Promise<VSCodeInstance[]>;
    /**
     * Start an instance
     * @param instanceId Instance ID
     * @returns Updated instance
     */
    startInstance(instanceId: string): Promise<VSCodeInstance>;
    /**
     * Stop an instance
     * @param instanceId Instance ID
     * @param force Force stop if true
     * @returns Updated instance
     */
    stopInstance(instanceId: string, force?: boolean): Promise<VSCodeInstance>;
    /**
     * Delete an instance
     * @param instanceId Instance ID
     * @returns True if successful
     */
    deleteInstance(instanceId: string): Promise<boolean>;
    /**
     * Update instance configuration
     * @param instanceId Instance ID
     * @param config Updated configuration
     * @returns Updated instance
     */
    updateInstance(instanceId: string, config: Partial<InstanceConfig>): Promise<VSCodeInstance>;
    /**
     * Check instance health
     * @param instanceId Instance ID
     * @returns Instance health
     */
    checkInstanceHealth(instanceId: string): Promise<InstanceHealth>;
    /**
     * Recover an unhealthy instance
     * @param instanceId Instance ID
     * @returns True if recovery was successful
     */
    recoverInstance(instanceId: string): Promise<boolean>;
    /**
     * Create a migration plan
     * @param sourceInstanceId Source instance ID
     * @param targetProviderType Target provider type
     * @param options Migration options
     * @returns Migration plan
     */
    createMigrationPlan(sourceInstanceId: string, targetProviderType: ProviderType, options?: MigrationOptions): Promise<MigrationPlan>;
    /**
     * Start a migration
     * @param migrationId Migration ID
     * @returns Migration result
     */
    startMigration(migrationId: string): Promise<MigrationResult>;
    /**
     * Cancel a migration
     * @param migrationId Migration ID
     * @returns True if migration was cancelled
     */
    cancelMigration(migrationId: string): Promise<boolean>;
    /**
     * Get a migration plan
     * @param migrationId Migration ID
     * @returns Migration plan or null if not found
     */
    getMigrationPlan(migrationId: string): MigrationPlan | null;
    /**
     * List migration plans
     * @param status Optional status filter
     * @returns Array of migration plans
     */
    listMigrationPlans(status?: MigrationStatus): MigrationPlan[];
    /**
     * Get provider capabilities
     * @param providerType Provider type
     * @returns Provider capabilities or null if provider not found
     */
    getProviderCapabilities(providerType: ProviderType): ProviderCapabilities | null;
    /**
     * Get swarm status
     * @returns Swarm status
     */
    getSwarmStatus(): SwarmStatus;
    /**
     * Dispose of swarm controller resources
     */
    dispose(): Promise<void>;
    /**
     * Ensure the controller is initialized
     */
    private ensureInitialized;
}
/**
 * Swarm status
 */
export interface SwarmStatus {
    /**
     * Whether the swarm is initialized
     */
    initialized: boolean;
    /**
     * Provider status
     */
    providers: {
        /**
         * Provider type
         */
        type: ProviderType;
        /**
         * Whether the provider is enabled
         */
        enabled: boolean;
        /**
         * Number of instances for this provider
         */
        instanceCount: number;
    }[];
    /**
     * Total number of instances
     */
    totalInstances: number;
    /**
     * Whether health monitoring is enabled
     */
    healthMonitorEnabled: boolean;
    /**
     * Whether migration is enabled
     */
    migrationEnabled: boolean;
}
