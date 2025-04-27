/**
 * Configuration for VSCode Remote Swarm
 * Defines configuration options for the swarm controller
 */
import { ProviderType } from '../providers/core/provider-types';
/**
 * Health status enum
 */
export declare enum HealthStatus {
    HEALTHY = "healthy",
    UNHEALTHY = "unhealthy",
    DEGRADED = "degraded",
    RECOVERING = "recovering",
    UNKNOWN = "unknown"
}
/**
 * Health history entry
 */
export interface HealthHistoryEntry {
    /**
     * Health status
     */
    status: HealthStatus;
    /**
     * Timestamp
     */
    timestamp: Date;
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
}
/**
 * Instance health
 */
export interface InstanceHealth {
    /**
     * Instance ID
     */
    instanceId: string;
    /**
     * Health status
     */
    status: HealthStatus;
    /**
     * Last checked timestamp
     */
    lastChecked: Date;
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
     * Health history
     */
    healthHistory: HealthHistoryEntry[];
}
/**
 * Migration strategy enum
 */
export declare enum MigrationStrategy {
    /**
     * Stop source instance, then create target instance
     */
    STOP_AND_RECREATE = "stop_and_recreate",
    /**
     * Create target instance, then stop source instance
     */
    CREATE_THEN_STOP = "create_then_stop"
}
/**
 * Provider configuration
 */
export interface ProviderConfig {
    /**
     * Provider type
     */
    type: ProviderType;
    /**
     * Whether the provider is enabled
     */
    enabled: boolean;
    /**
     * Provider-specific configuration
     */
    config: Record<string, any>;
}
/**
 * Swarm configuration
 */
export interface SwarmConfig {
    /**
     * General configuration
     */
    general: {
        /**
         * State directory
         */
        stateDir: string;
        /**
         * Default provider type
         */
        defaultProviderType: ProviderType;
        /**
         * Whether to load state on startup
         */
        loadStateOnStartup: boolean;
        /**
         * Auto-save interval in milliseconds
         */
        autoSaveIntervalMs: number;
    };
    /**
     * Provider configuration
     */
    providers: ProviderConfig[];
    /**
     * Health monitor configuration
     */
    healthMonitor: {
        /**
         * Whether health monitoring is enabled
         */
        enabled: boolean;
        /**
         * Health check interval in milliseconds
         */
        checkIntervalMs: number;
        /**
         * Whether to auto-recover unhealthy instances
         */
        autoRecover: boolean;
        /**
         * Maximum number of recovery attempts
         */
        maxRecoveryAttempts: number;
        /**
         * Number of health history entries to keep
         */
        historySize: number;
        /**
         * Recovery actions
         */
        recoveryActions: {
            /**
             * Whether to restart unhealthy instances
             */
            restart: boolean;
            /**
             * Whether to recreate unhealthy instances
             */
            recreate: boolean;
            /**
             * Whether to migrate unhealthy instances
             */
            migrate: boolean;
        };
    };
    /**
     * Migration configuration
     */
    migration: {
        /**
         * Whether migration is enabled
         */
        enabled: boolean;
        /**
         * Default migration strategy
         */
        defaultStrategy: MigrationStrategy;
        /**
         * Migration timeout in milliseconds
         */
        timeoutMs: number;
    };
}
/**
 * Default swarm configuration
 */
export declare const defaultSwarmConfig: SwarmConfig;
