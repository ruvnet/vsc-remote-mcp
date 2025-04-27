/**
 * Common types for the Provider Abstraction Layer
 */
/**
 * Provider type enum
 */
export declare enum ProviderType {
    DOCKER = "docker",
    FLYIO = "flyio"
}
/**
 * Instance status enum
 */
export declare enum InstanceStatus {
    CREATING = "creating",
    RUNNING = "running",
    STOPPED = "stopped",
    FAILED = "failed",
    DELETED = "deleted"
}
/**
 * Resource configuration
 */
export interface ResourceConfig {
    /**
     * CPU configuration
     */
    cpu: {
        /**
         * Number of CPU cores
         */
        cores: number;
        /**
         * CPU limit
         */
        limit?: number;
    };
    /**
     * Memory configuration
     */
    memory: {
        /**
         * Minimum memory in MB
         */
        min: number;
        /**
         * Maximum memory in MB
         */
        max?: number;
    };
    /**
     * Storage configuration
     */
    storage?: {
        /**
         * Storage size in GB
         */
        size: number;
        /**
         * Whether storage is persistent
         */
        persistent: boolean;
    };
    /**
     * Deployment region
     */
    region?: string;
}
/**
 * Resource allocation
 */
export interface ResourceAllocation {
    /**
     * CPU usage
     */
    cpu: {
        /**
         * Used CPU
         */
        used: number;
        /**
         * CPU limit
         */
        limit: number;
    };
    /**
     * Memory usage
     */
    memory: {
        /**
         * Used memory in MB
         */
        used: number;
        /**
         * Memory limit in MB
         */
        limit: number;
    };
    /**
     * Storage usage
     */
    storage?: {
        /**
         * Used storage in GB
         */
        used: number;
        /**
         * Storage limit in GB
         */
        limit: number;
    };
}
/**
 * Network configuration
 */
export interface NetworkConfig {
    /**
     * Port to expose
     */
    port?: number;
    /**
     * Whether to use internal network
     */
    internal?: boolean;
    /**
     * Provider-specific network configuration
     */
    providerSpecific?: Record<string, any>;
}
/**
 * Network information
 */
export interface NetworkInfo {
    /**
     * Internal IP address
     */
    internalIp: string;
    /**
     * External IP address
     */
    externalIp: string;
    /**
     * Port mappings
     */
    ports: {
        /**
         * Internal port
         */
        internal: number;
        /**
         * External port
         */
        external: number;
        /**
         * Protocol
         */
        protocol: string;
    }[];
    /**
     * Access URLs
     */
    urls: string[];
}
/**
 * Authentication configuration
 */
export interface AuthConfig {
    /**
     * Authentication type
     */
    type: 'password' | 'token' | 'ssh';
    /**
     * Authentication credentials
     */
    credentials?: string;
}
/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
    /**
     * Whether the provider supports live resource resizing
     */
    supportsLiveResize: boolean;
    /**
     * Whether the provider supports instance snapshotting
     */
    supportsSnapshotting: boolean;
    /**
     * Whether the provider supports multi-region deployments
     */
    supportsMultiRegion: boolean;
    /**
     * List of supported regions (if multi-region is supported)
     */
    supportedRegions?: string[];
    /**
     * Maximum number of instances per user
     */
    maxInstancesPerUser: number;
    /**
     * Maximum resources per instance
     */
    maxResourcesPerInstance: {
        cpu: {
            cores: number;
            limit?: number;
        };
        memory: {
            min: number;
            max?: number;
        };
        storage?: {
            size: number;
            persistent: boolean;
        };
    };
}
/**
 * Provider configuration
 */
export interface ProviderConfig {
    /**
     * Common configuration
     */
    common: {
        /**
         * Default resource limits
         */
        defaultResourceLimits: {
            cpu: number;
            memory: string;
            storage?: number;
        };
        /**
         * Instance name prefix
         */
        instanceNamePrefix: string;
        /**
         * Tags for resources
         */
        tags?: Record<string, string>;
    };
    /**
     * Provider-specific configuration
     */
    specific: Record<string, any>;
}
