/**
 * Health Monitor for VSCode Remote Swarm
 * Monitors the health of VSCode instances and provides recovery mechanisms
 */
import { Provider } from '../providers/core/provider.interface';
import { ProviderType } from '../providers/core/provider-types';
import { InstanceRegistry } from './instance-registry';
import { SwarmConfig, HealthStatus, InstanceHealth } from './config';
/**
 * Health check result
 */
export interface HealthCheckResult {
    /**
     * Instance ID
     */
    instanceId: string;
    /**
     * Health status
     */
    status: HealthStatus;
    /**
     * Health check details
     */
    details: {
        /**
         * Health check message
         */
        message: string;
        /**
         * Error message if any
         */
        error?: string;
        /**
         * Response time in milliseconds
         */
        responseTimeMs?: number;
        /**
         * Additional details
         */
        [key: string]: any;
    };
    /**
     * Timestamp of the health check
     */
    timestamp: Date;
}
/**
 * Health monitor class
 */
export declare class HealthMonitor {
    private registry;
    private providers;
    private config;
    /**
     * Map of instance health by ID
     */
    private instanceHealth;
    /**
     * Health check interval ID
     */
    private healthCheckIntervalId;
    /**
     * Storage directory for health data
     */
    private storageDir;
    /**
     * Constructor
     * @param registry Instance registry
     * @param providers Map of providers by type
     * @param config Swarm configuration
     */
    constructor(registry: InstanceRegistry, providers: Map<ProviderType, Provider>, config: SwarmConfig);
    /**
     * Initialize the health monitor
     */
    initialize(): Promise<void>;
    /**
     * Load health data from storage
     */
    private loadHealthData;
    /**
     * Save health data to storage
     */
    private saveHealthData;
    /**
     * Save instance health to storage
     * @param health Instance health
     */
    private saveInstanceHealth;
    /**
     * Start health checks
     */
    private startHealthChecks;
    /**
     * Stop health checks
     */
    private stopHealthChecks;
    /**
     * Check health of all instances
     */
    private checkAllInstancesHealth;
    /**
     * Check health of an instance
     * @param instanceId Instance ID
     */
    checkInstanceHealth(instanceId: string): Promise<HealthCheckResult>;
    /**
     * Update instance health
     * @param result Health check result
     */
    private updateInstanceHealth;
    /**
     * Recover an unhealthy instance
     * @param instanceId Instance ID
     * @returns True if recovery was successful
     */
    recoverInstance(instanceId: string): Promise<boolean>;
    /**
     * Get instance health
     * @param instanceId Instance ID
     * @returns Instance health or null if not found
     */
    getInstanceHealth(instanceId: string): InstanceHealth | null;
    /**
     * List instance health
     * @param status Optional status filter
     * @returns Array of instance health
     */
    listInstanceHealth(status?: HealthStatus): InstanceHealth[];
    /**
     * Dispose of health monitor resources
     */
    dispose(): void;
}
