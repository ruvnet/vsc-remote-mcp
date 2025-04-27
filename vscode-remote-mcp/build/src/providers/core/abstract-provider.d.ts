/**
 * Abstract provider implementation with common functionality
 * Provides a base implementation that can be shared across provider implementations
 */
import { Provider } from './provider.interface';
import { ProviderType, ProviderConfig, ProviderCapabilities } from './provider-types';
import { VSCodeInstance, InstanceConfig, InstanceFilter, LogOptions, InstanceLogs, CommandResult } from './instance.interface';
/**
 * Logger interface
 */
interface Logger {
    info(message: string, metadata?: any): void;
    error(message: string, metadata?: any): void;
    warn(message: string, metadata?: any): void;
    debug(message: string, metadata?: any): void;
}
/**
 * Abstract provider implementation
 */
export declare abstract class AbstractProvider implements Provider {
    /**
     * Provider type
     */
    readonly type: ProviderType;
    /**
     * Provider configuration
     */
    protected config: ProviderConfig;
    /**
     * Logger instance
     */
    protected logger: Logger;
    /**
     * Constructor
     * @param type Provider type
     * @param config Provider configuration
     * @param loggerInstance Logger instance
     */
    constructor(type: ProviderType, config: ProviderConfig, loggerInstance?: Logger);
    /**
     * Initialize the provider
     */
    initialize(): Promise<void>;
    /**
     * Get provider capabilities
     */
    abstract getCapabilities(): ProviderCapabilities;
    /**
     * Create a new VSCode instance
     * @param config Instance configuration
     * @returns Created instance
     */
    abstract createInstance(config: InstanceConfig): Promise<VSCodeInstance>;
    /**
     * Get an instance by ID
     * @param instanceId Instance ID
     * @returns Instance or null if not found
     */
    abstract getInstance(instanceId: string): Promise<VSCodeInstance | null>;
    /**
     * List all instances
     * @param filter Optional filter criteria
     * @returns Array of instances
     */
    abstract listInstances(filter?: InstanceFilter): Promise<VSCodeInstance[]>;
    /**
     * Start an instance
     * @param instanceId Instance ID
     * @returns Updated instance
     */
    abstract startInstance(instanceId: string): Promise<VSCodeInstance>;
    /**
     * Stop an instance
     * @param instanceId Instance ID
     * @param force Force stop if true
     * @returns Updated instance
     */
    abstract stopInstance(instanceId: string, force?: boolean): Promise<VSCodeInstance>;
    /**
     * Delete an instance
     * @param instanceId Instance ID
     * @returns True if successful
     */
    abstract deleteInstance(instanceId: string): Promise<boolean>;
    /**
     * Update instance configuration
     * @param instanceId Instance ID
     * @param config Updated configuration
     * @returns Updated instance
     */
    abstract updateInstance(instanceId: string, config: Partial<InstanceConfig>): Promise<VSCodeInstance>;
    /**
     * Get instance logs
     * @param instanceId Instance ID
     * @param options Log options
     * @returns Instance logs
     */
    abstract getInstanceLogs(instanceId: string, options?: LogOptions): Promise<InstanceLogs>;
    /**
     * Execute a command in an instance
     * @param instanceId Instance ID
     * @param command Command to execute
     * @returns Command result
     */
    abstract executeCommand(instanceId: string, command: string): Promise<CommandResult>;
    /**
     * Generate a unique instance ID
     * @returns Unique ID
     */
    protected generateInstanceId(): string;
    /**
     * Validate instance configuration
     * @param config Instance configuration
     * @throws Error if configuration is invalid
     */
    protected validateInstanceConfig(config: InstanceConfig): void;
    /**
     * Create a base instance object
     * @param id Instance ID
     * @param name Instance name
     * @param providerInstanceId Provider-specific instance ID
     * @param config Instance configuration
     * @returns Base instance object
     */
    protected createBaseInstance(id: string, name: string, providerInstanceId: string, config: InstanceConfig): VSCodeInstance;
}
export {};
