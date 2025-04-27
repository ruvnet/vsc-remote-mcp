/**
 * Provider interface for VSCode Remote Swarm
 * Defines the contract that all provider implementations must fulfill
 */

import {
  ProviderType,
  ProviderCapabilities,
  ProviderConfig
} from './provider-types';

import {
  VSCodeInstance,
  InstanceConfig,
  InstanceFilter,
  LogOptions,
  InstanceLogs,
  CommandResult
} from './instance.interface';


/**
 * Provider interface that all provider implementations must fulfill
 */
export interface Provider {
  /**
   * Get the provider type
   */
  readonly type: ProviderType;
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities;
  
  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;
  
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
}

/**
 * Provider constructor type
 */
export type ProviderConstructor = new (config: ProviderConfig) => Provider;