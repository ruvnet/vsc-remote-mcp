/**
 * VSCode instance interfaces and types
 * Defines the common representation of VSCode instances across different providers
 */
import { ProviderType, InstanceStatus, ResourceConfig, ResourceAllocation, NetworkConfig, NetworkInfo, AuthConfig } from './provider-types';
/**
 * VSCode instance representation
 */
export interface VSCodeInstance {
    /**
     * Instance ID
     */
    id: string;
    /**
     * Instance name
     */
    name: string;
    /**
     * Provider-specific instance ID
     */
    providerInstanceId: string;
    /**
     * Provider type
     */
    providerType: ProviderType;
    /**
     * Instance status
     */
    status: InstanceStatus;
    /**
     * Instance configuration
     */
    config: InstanceConfig;
    /**
     * Resource allocation
     */
    resources: ResourceAllocation;
    /**
     * Network information
     */
    network: NetworkInfo;
    /**
     * Creation timestamp
     */
    createdAt: Date;
    /**
     * Last update timestamp
     */
    updatedAt: Date;
    /**
     * Additional metadata
     */
    metadata: Record<string, any>;
}
/**
 * Instance configuration
 */
export interface InstanceConfig {
    /**
     * Instance name
     */
    name: string;
    /**
     * Container image
     */
    image: string;
    /**
     * Workspace path to mount
     */
    workspacePath: string;
    /**
     * Environment variables
     */
    env?: Record<string, string>;
    /**
     * Resource configuration
     */
    resources: ResourceConfig;
    /**
     * Network configuration
     */
    network: NetworkConfig;
    /**
     * Extensions to install
     */
    extensions?: string[];
    /**
     * Authentication configuration
     */
    auth?: AuthConfig;
}
/**
 * Instance filter criteria
 */
export interface InstanceFilter {
    /**
     * Filter by status
     */
    status?: InstanceStatus | InstanceStatus[];
    /**
     * Filter by name pattern
     */
    namePattern?: string;
    /**
     * Filter by creation date range
     */
    createdAfter?: Date;
    createdBefore?: Date;
    /**
     * Filter by tags
     */
    tags?: Record<string, string>;
    /**
     * Maximum number of results
     */
    limit?: number;
    /**
     * Result offset
     */
    offset?: number;
}
/**
 * Log options
 */
export interface LogOptions {
    /**
     * Number of lines to retrieve
     */
    lines?: number;
    /**
     * Whether to follow logs
     */
    follow?: boolean;
    /**
     * Start timestamp
     */
    since?: Date;
    /**
     * End timestamp
     */
    until?: Date;
    /**
     * Filter logs by pattern
     */
    pattern?: string;
}
/**
 * Instance logs
 */
export interface InstanceLogs {
    /**
     * Instance ID
     */
    instanceId: string;
    /**
     * Log entries
     */
    entries: {
        /**
         * Timestamp
         */
        timestamp: Date;
        /**
         * Log level
         */
        level: string;
        /**
         * Log message
         */
        message: string;
        /**
         * Source
         */
        source: string;
    }[];
    /**
     * Whether there are more logs available
     */
    hasMore: boolean;
    /**
     * Next token for pagination
     */
    nextToken?: string;
}
/**
 * Command result
 */
export interface CommandResult {
    /**
     * Exit code
     */
    exitCode: number;
    /**
     * Standard output
     */
    stdout: string;
    /**
     * Standard error
     */
    stderr: string;
    /**
     * Error message if command failed
     */
    error?: string;
}
