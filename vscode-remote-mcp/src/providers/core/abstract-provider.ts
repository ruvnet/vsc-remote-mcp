/**
 * Abstract provider implementation with common functionality
 * Provides a base implementation that can be shared across provider implementations
 */

import { Provider } from './provider.interface';
import { 
  ProviderType, 
  ProviderConfig, 
  ProviderCapabilities,
  InstanceStatus
} from './provider-types';
import { 
  VSCodeInstance, 
  InstanceConfig, 
  InstanceFilter, 
  LogOptions, 
  InstanceLogs, 
  CommandResult 
} from './instance.interface';
import * as logger from '../../utils/logger';

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
export abstract class AbstractProvider implements Provider {
  /**
   * Provider type
   */
  public readonly type: ProviderType;
  
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
  constructor(type: ProviderType, config: ProviderConfig, loggerInstance?: Logger) {
    this.type = type;
    this.config = config;
    this.logger = loggerInstance || logger;
  }
  
  /**
   * Initialize the provider
   */
  public async initialize(): Promise<void> {
    this.logger.info(`Initializing ${this.type} provider`);
  }
  
  /**
   * Get provider capabilities
   */
  public abstract getCapabilities(): ProviderCapabilities;
  
  /**
   * Create a new VSCode instance
   * @param config Instance configuration
   * @returns Created instance
   */
  public abstract createInstance(config: InstanceConfig): Promise<VSCodeInstance>;
  
  /**
   * Get an instance by ID
   * @param instanceId Instance ID
   * @returns Instance or null if not found
   */
  public abstract getInstance(instanceId: string): Promise<VSCodeInstance | null>;
  
  /**
   * List all instances
   * @param filter Optional filter criteria
   * @returns Array of instances
   */
  public abstract listInstances(filter?: InstanceFilter): Promise<VSCodeInstance[]>;
  
  /**
   * Start an instance
   * @param instanceId Instance ID
   * @returns Updated instance
   */
  public abstract startInstance(instanceId: string): Promise<VSCodeInstance>;
  
  /**
   * Stop an instance
   * @param instanceId Instance ID
   * @param force Force stop if true
   * @returns Updated instance
   */
  public abstract stopInstance(instanceId: string, force?: boolean): Promise<VSCodeInstance>;
  
  /**
   * Delete an instance
   * @param instanceId Instance ID
   * @returns True if successful
   */
  public abstract deleteInstance(instanceId: string): Promise<boolean>;
  
  /**
   * Update instance configuration
   * @param instanceId Instance ID
   * @param config Updated configuration
   * @returns Updated instance
   */
  public abstract updateInstance(instanceId: string, config: Partial<InstanceConfig>): Promise<VSCodeInstance>;
  
  /**
   * Get instance logs
   * @param instanceId Instance ID
   * @param options Log options
   * @returns Instance logs
   */
  public abstract getInstanceLogs(instanceId: string, options?: LogOptions): Promise<InstanceLogs>;
  
  /**
   * Execute a command in an instance
   * @param instanceId Instance ID
   * @param command Command to execute
   * @returns Command result
   */
  public abstract executeCommand(instanceId: string, command: string): Promise<CommandResult>;
  
  /**
   * Generate a unique instance ID
   * @returns Unique ID
   */
  protected generateInstanceId(): string {
    return `${this.config.common.instanceNamePrefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  }
  
  /**
   * Validate instance configuration
   * @param config Instance configuration
   * @throws Error if configuration is invalid
   */
  protected validateInstanceConfig(config: InstanceConfig): void {
    if (!config.name) {
      throw new Error('Instance name is required');
    }
    
    if (!config.image) {
      throw new Error('Instance image is required');
    }
    
    if (!config.workspacePath) {
      throw new Error('Workspace path is required');
    }
    
    // Validate resource configuration
    if (!config.resources) {
      throw new Error('Resource configuration is required');
    }
    
    if (!config.resources.cpu || !config.resources.cpu.cores) {
      throw new Error('CPU cores configuration is required');
    }
    
    if (!config.resources.memory || !config.resources.memory.min) {
      throw new Error('Memory configuration is required');
    }
  }
  
  /**
   * Create a base instance object
   * @param id Instance ID
   * @param name Instance name
   * @param providerInstanceId Provider-specific instance ID
   * @param config Instance configuration
   * @returns Base instance object
   */
  protected createBaseInstance(
    id: string,
    name: string,
    providerInstanceId: string,
    config: InstanceConfig
  ): VSCodeInstance {
    return {
      id,
      name,
      providerInstanceId,
      providerType: this.type,
      status: InstanceStatus.CREATING,
      config,
      resources: {
        cpu: {
          used: 0,
          limit: config.resources.cpu.limit || config.resources.cpu.cores * 1000
        },
        memory: {
          used: 0,
          limit: config.resources.memory.max || config.resources.memory.min
        },
        storage: config.resources.storage ? {
          used: 0,
          limit: config.resources.storage.size
        } : undefined
      },
      network: {
        internalIp: '',
        externalIp: 'localhost',
        ports: [],
        urls: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };
  }
}