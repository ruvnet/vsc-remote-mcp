/**
 * Docker provider implementation
 * Implements the Provider interface for Docker-based VSCode instances
 */
import { AbstractProvider } from '../core/abstract-provider';
import { ProviderCapabilities, ProviderConfig } from '../core/provider-types';
import { VSCodeInstance, InstanceConfig, InstanceFilter, LogOptions, InstanceLogs, CommandResult } from '../core/instance.interface';
/**
 * Docker provider implementation
 */
export declare class DockerProvider extends AbstractProvider {
    /**
     * Docker command executor
     */
    private dockerExecutor;
    /**
     * Container utilities
     */
    private containerUtils;
    /**
     * Instance storage
     */
    private instanceStorage;
    /**
     * Log parser
     */
    private logParser;
    /**
     * Docker-specific configuration
     */
    private dockerConfig;
    /**
     * Constructor
     * @param config Provider configuration
     */
    constructor(config: ProviderConfig);
    /**
     * Initialize the provider
     */
    initialize(): Promise<void>;
    /**
     * Get provider capabilities
     */
    getCapabilities(): ProviderCapabilities;
    /**
     * Create a new VSCode instance
     * @param config Instance configuration
     * @returns Created instance
     */
    createInstance(config: InstanceConfig): Promise<VSCodeInstance>;
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
     * Get instance logs
     * @param instanceId Instance ID
     * @param options Log options
     * @returns Instance logs
     */
    getInstanceLogs(instanceId: string, options?: LogOptions): Promise<InstanceLogs>;
    /**
     * Execute a command in an instance
     * @param instanceId Instance ID
     * @param command Command to execute
     * @returns Command result
     */
    executeCommand(instanceId: string, command: string): Promise<CommandResult>;
    /**
     * Filter instances based on criteria
     * @param instances Instances to filter
     * @param filter Filter criteria
     * @returns Filtered instances
     */
    private filterInstances;
    /**
     * Generate access URLs for an instance
     * @param instance Instance
     * @returns Access URLs
     */
    private generateAccessUrls;
    /**
     * Generate a unique instance ID
     * @returns Instance ID
     */
    protected generateInstanceId(): string;
}
