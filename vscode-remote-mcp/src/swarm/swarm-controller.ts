/**
 * Swarm Controller for VSCode Remote Swarm
 * Manages VSCode instances across multiple providers
 */

import { VSCodeInstance, InstanceConfig, InstanceFilter } from '../providers/core/instance.interface';
import { Provider } from '../providers/core/provider.interface';
import { ProviderType, InstanceStatus, ProviderCapabilities } from '../providers/core/provider-types';
import { ProviderFactory } from '../providers/core/provider-factory';
import { InstanceRegistry } from './instance-registry';
import { HealthMonitor } from './health-monitor';
import { MigrationManager, MigrationPlan, MigrationOptions, MigrationResult, MigrationStatus } from './migration-manager';
import { SwarmConfig, HealthStatus, InstanceHealth, defaultSwarmConfig } from './config';
import * as logger from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Swarm controller class
 */
export class SwarmController {
  /**
   * Instance registry
   */
  private registry: InstanceRegistry;
  
  /**
   * Health monitor
   */
  private healthMonitor: HealthMonitor;
  
  /**
   * Migration manager
   */
  private migrationManager: MigrationManager;
  
  /**
   * Map of providers by type
   */
  private providers: Map<ProviderType, Provider> = new Map();
  
  /**
   * Swarm configuration
   */
  private config: SwarmConfig;
  
  /**
   * Whether the controller is initialized
   */
  private initialized: boolean = false;
  
  /**
   * Constructor
   * @param config Swarm configuration
   */
  constructor(config?: Partial<SwarmConfig>) {
    // Merge provided config with defaults
    this.config = {
      ...defaultSwarmConfig,
      ...config
    };
    
    // Create registry
    this.registry = new InstanceRegistry(this.config);
    
    // Create health monitor
    this.healthMonitor = new HealthMonitor(this.registry, this.providers, this.config);
    
    // Create migration manager
    this.migrationManager = new MigrationManager(this.registry, this.providers, this.config);
  }
  
  /**
   * Initialize the swarm controller
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing swarm controller');
      
      // Initialize providers
      await this.initializeProviders();
      
      // Initialize registry
      await this.registry.initialize();
      
      // Initialize health monitor
      await this.healthMonitor.initialize();
      
      // Initialize migration manager
      await this.migrationManager.initialize();
      
      this.initialized = true;
      
      logger.info('Swarm controller initialized');
    } catch (error) {
      logger.error('Failed to initialize swarm controller', error as Record<string, any>);
      throw error;
    }
  }
  
  /**
   * Initialize providers
   */
  private async initializeProviders(): Promise<void> {
    try {
      logger.info('Initializing providers');
      
      // Initialize Docker provider if enabled
      if (this.config.providers.find(p => p.type === ProviderType.DOCKER && p.enabled)) {
        logger.info('Initializing Docker provider');
        
        try {
          const dockerProvider = ProviderFactory.createProvider(
            ProviderType.DOCKER,
            {
              common: {
                defaultResourceLimits: {
                  cpu: 2,
                  memory: '2048m',
                  storage: 10
                },
                instanceNamePrefix: 'vscode-'
              },
              specific: this.config.providers.find(p => p.type === ProviderType.DOCKER)?.config || {}
            }
          );
          
          await dockerProvider.initialize();
          this.providers.set(ProviderType.DOCKER, dockerProvider);
          
          logger.info('Docker provider initialized');
        } catch (error) {
          logger.error('Failed to initialize Docker provider', error as Record<string, any>);
        }
      }
      
      // Initialize Fly.io provider if enabled
      if (this.config.providers.find(p => p.type === ProviderType.FLYIO && p.enabled)) {
        logger.info('Initializing Fly.io provider');
        
        try {
          const flyProvider = ProviderFactory.createProvider(
            ProviderType.FLYIO,
            {
              common: {
                defaultResourceLimits: {
                  cpu: 1,
                  memory: '1024m',
                  storage: 5
                },
                instanceNamePrefix: 'vscode-'
              },
              specific: this.config.providers.find(p => p.type === ProviderType.FLYIO)?.config || {}
            }
          );
          
          await flyProvider.initialize();
          this.providers.set(ProviderType.FLYIO, flyProvider);
          
          logger.info('Fly.io provider initialized');
        } catch (error) {
          logger.error('Failed to initialize Fly.io provider', error as Record<string, any>);
        }
      }
      
      logger.info(`Initialized ${this.providers.size} providers`);
    } catch (error) {
      logger.error('Failed to initialize providers', error as Record<string, any>);
      throw error;
    }
  }
  
  /**
   * Create a new VSCode instance
   * @param config Instance configuration
   * @param providerType Provider type
   * @returns Created instance
   */
  public async createInstance(
    config: InstanceConfig,
    providerType?: ProviderType
  ): Promise<VSCodeInstance> {
    this.ensureInitialized();
    
    // Use default provider type if not specified
    const type = providerType || this.config.general.defaultProviderType;
    
    // Get provider
    const provider = this.providers.get(type);
    
    if (!provider) {
      throw new Error(`Provider ${type} not found or not initialized`);
    }
    
    // Create instance
    logger.info(`Creating instance with provider ${type}`);
    const instance = await provider.createInstance(config);
    
    // Register instance
    this.registry.registerInstance(instance);
    
    return instance;
  }
  
  /**
   * Get an instance by ID
   * @param instanceId Instance ID
   * @returns Instance or null if not found
   */
  public async getInstance(instanceId: string): Promise<VSCodeInstance | null> {
    this.ensureInitialized();
    
    // Get instance from registry
    const instance = this.registry.getInstance(instanceId);
    
    if (!instance) {
      return null;
    }
    
    // Get provider
    const provider = this.providers.get(instance.providerType);
    
    if (!provider) {
      logger.warn(`Provider ${instance.providerType} not found for instance ${instanceId}`);
      return instance;
    }
    
    // Get updated instance from provider
    try {
      const updatedInstance = await provider.getInstance(instanceId);
      
      if (updatedInstance) {
        // Update registry
        this.registry.updateInstance(updatedInstance);
        return updatedInstance;
      }
      
      return instance;
    } catch (error) {
      logger.error(`Failed to get instance ${instanceId} from provider`, error as Record<string, any>);
      return instance;
    }
  }
  
  /**
   * List all instances
   * @param filter Optional filter criteria
   * @returns Array of instances
   */
  public async listInstances(filter?: InstanceFilter): Promise<VSCodeInstance[]> {
    this.ensureInitialized();
    
    // Get instances from registry
    let instances = this.registry.listInstances();
    
    // Apply filter
    if (filter) {
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        instances = instances.filter(instance => statuses.includes(instance.status));
      }
      
      if (filter.namePattern) {
        const regex = new RegExp(filter.namePattern, 'i');
        instances = instances.filter(instance => regex.test(instance.name));
      }
      
      if (filter.createdAfter !== undefined) {
        instances = instances.filter(instance => instance.createdAt >= filter.createdAfter!);
      }
      
      if (filter.createdBefore !== undefined) {
        instances = instances.filter(instance => instance.createdAt <= filter.createdBefore!);
      }
      
      if (filter.tags) {
        instances = instances.filter(instance => {
          for (const [key, value] of Object.entries(filter.tags!)) {
            if (!instance.metadata || instance.metadata[key] !== value) {
              return false;
            }
          }
          return true;
        });
      }
      
      // Apply limit and offset
      if (filter.offset !== undefined && filter.offset > 0) {
        instances = instances.slice(filter.offset);
      }
      
      if (filter.limit !== undefined && filter.limit > 0) {
        instances = instances.slice(0, filter.limit);
      }
    }
    
    return instances;
  }
  
  /**
   * Start an instance
   * @param instanceId Instance ID
   * @returns Updated instance
   */
  public async startInstance(instanceId: string): Promise<VSCodeInstance> {
    this.ensureInitialized();
    
    // Get instance
    const instance = this.registry.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    
    // Get provider
    const provider = this.providers.get(instance.providerType);
    
    if (!provider) {
      throw new Error(`Provider ${instance.providerType} not found for instance ${instanceId}`);
    }
    
    // Start instance
    logger.info(`Starting instance ${instanceId}`);
    const updatedInstance = await provider.startInstance(instanceId);
    
    // Update registry
    this.registry.updateInstance(updatedInstance);
    
    return updatedInstance;
  }
  
  /**
   * Stop an instance
   * @param instanceId Instance ID
   * @param force Force stop if true
   * @returns Updated instance
   */
  public async stopInstance(instanceId: string, force?: boolean): Promise<VSCodeInstance> {
    this.ensureInitialized();
    
    // Get instance
    const instance = this.registry.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    
    // Get provider
    const provider = this.providers.get(instance.providerType);
    
    if (!provider) {
      throw new Error(`Provider ${instance.providerType} not found for instance ${instanceId}`);
    }
    
    // Stop instance
    logger.info(`Stopping instance ${instanceId}`);
    const updatedInstance = await provider.stopInstance(instanceId, force);
    
    // Update registry
    this.registry.updateInstance(updatedInstance);
    
    return updatedInstance;
  }
  
  /**
   * Delete an instance
   * @param instanceId Instance ID
   * @returns True if successful
   */
  public async deleteInstance(instanceId: string): Promise<boolean> {
    this.ensureInitialized();
    
    // Get instance
    const instance = this.registry.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    
    // Get provider
    const provider = this.providers.get(instance.providerType);
    
    if (!provider) {
      throw new Error(`Provider ${instance.providerType} not found for instance ${instanceId}`);
    }
    
    // Delete instance
    logger.info(`Deleting instance ${instanceId}`);
    const success = await provider.deleteInstance(instanceId);
    
    if (success) {
      // Remove from registry
      this.registry.removeInstance(instanceId);
    }
    
    return success;
  }
  
  /**
   * Update instance configuration
   * @param instanceId Instance ID
   * @param config Updated configuration
   * @returns Updated instance
   */
  public async updateInstance(
    instanceId: string,
    config: Partial<InstanceConfig>
  ): Promise<VSCodeInstance> {
    this.ensureInitialized();
    
    // Get instance
    const instance = this.registry.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    
    // Get provider
    const provider = this.providers.get(instance.providerType);
    
    if (!provider) {
      throw new Error(`Provider ${instance.providerType} not found for instance ${instanceId}`);
    }
    
    // Update instance
    logger.info(`Updating instance ${instanceId}`);
    const updatedInstance = await provider.updateInstance(instanceId, config);
    
    // Update registry
    this.registry.updateInstance(updatedInstance);
    
    return updatedInstance;
  }
  
  /**
   * Check instance health
   * @param instanceId Instance ID
   * @returns Instance health
   */
  public async checkInstanceHealth(instanceId: string): Promise<InstanceHealth> {
    this.ensureInitialized();
    
    // Get instance
    const instance = this.registry.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    
    // Check health
    await this.healthMonitor.checkInstanceHealth(instanceId);
    
    // Get health from registry or create a default one
    const health: InstanceHealth = {
      instanceId,
      status: HealthStatus.UNKNOWN,
      lastChecked: new Date(),
      details: {
        message: 'Health check initiated'
      },
      healthHistory: []
    };
    
    return health;
  }
  
  /**
   * Recover an unhealthy instance
   * @param instanceId Instance ID
   * @returns True if recovery was successful
   */
  public async recoverInstance(instanceId: string): Promise<boolean> {
    this.ensureInitialized();
    
    // Get instance
    const instance = this.registry.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    
    // Get provider
    const provider = this.providers.get(instance.providerType);
    
    if (!provider) {
      throw new Error(`Provider ${instance.providerType} not found for instance ${instanceId}`);
    }
    
    // Try to recover by restarting the instance
    try {
      logger.info(`Attempting to recover instance ${instanceId} by restarting`);
      
      // Stop instance
      await provider.stopInstance(instanceId);
      
      // Start instance
      await provider.startInstance(instanceId);
      
      logger.info(`Successfully restarted instance ${instanceId}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to recover instance ${instanceId}`, error as Record<string, any>);
      return false;
    }
  }
  
  /**
   * Create a migration plan
   * @param sourceInstanceId Source instance ID
   * @param targetProviderType Target provider type
   * @param options Migration options
   * @returns Migration plan
   */
  public async createMigrationPlan(
    sourceInstanceId: string,
    targetProviderType: ProviderType,
    options?: MigrationOptions
  ): Promise<MigrationPlan> {
    this.ensureInitialized();
    
    // Get source instance
    const sourceInstance = this.registry.getInstance(sourceInstanceId);
    
    if (!sourceInstance) {
      throw new Error(`Source instance ${sourceInstanceId} not found`);
    }
    
    // Get target provider
    const targetProvider = this.providers.get(targetProviderType);
    
    if (!targetProvider) {
      throw new Error(`Target provider ${targetProviderType} not found or not initialized`);
    }
    
    // Create migration plan
    return this.migrationManager.createMigrationPlan(
      sourceInstanceId,
      targetProviderType,
      options
    );
  }
  
  /**
   * Start a migration
   * @param migrationId Migration ID
   * @returns Migration result
   */
  public async startMigration(migrationId: string): Promise<MigrationResult> {
    this.ensureInitialized();
    
    // Start migration
    return this.migrationManager.startMigration(migrationId);
  }
  
  /**
   * Cancel a migration
   * @param migrationId Migration ID
   * @returns True if migration was cancelled
   */
  public async cancelMigration(migrationId: string): Promise<boolean> {
    this.ensureInitialized();
    
    // Cancel migration
    return this.migrationManager.cancelMigration(migrationId);
  }
  
  /**
   * Get a migration plan
   * @param migrationId Migration ID
   * @returns Migration plan or null if not found
   */
  public getMigrationPlan(migrationId: string): MigrationPlan | null {
    this.ensureInitialized();
    
    // Get migration plan
    return this.migrationManager.getMigrationPlan(migrationId);
  }
  
  /**
   * List migration plans
   * @param status Optional status filter
   * @returns Array of migration plans
   */
  public listMigrationPlans(status?: MigrationStatus): MigrationPlan[] {
    this.ensureInitialized();
    
    // List migration plans
    return this.migrationManager.listMigrationPlans(status);
  }
  
  /**
   * Get provider capabilities
   * @param providerType Provider type
   * @returns Provider capabilities or null if provider not found
   */
  public getProviderCapabilities(providerType: ProviderType): ProviderCapabilities | null {
    this.ensureInitialized();
    
    // Get provider
    const provider = this.providers.get(providerType);
    
    if (!provider) {
      return null;
    }
    
    // Get capabilities
    return provider.getCapabilities();
  }
  
  /**
   * Get swarm status
   * @returns Swarm status
   */
  public getSwarmStatus(): SwarmStatus {
    this.ensureInitialized();
    
    // Get instance counts
    const instanceCounts: Record<ProviderType, number> = {} as Record<ProviderType, number>;
    
    for (const type of Object.values(ProviderType)) {
      instanceCounts[type] = this.registry.getInstanceCount(type);
    }
    
    // Get provider status
    const providerStatus: Record<ProviderType, boolean> = {} as Record<ProviderType, boolean>;
    
    for (const [type, provider] of this.providers.entries()) {
      providerStatus[type] = true;
    }
    
    // Create status
    return {
      initialized: this.initialized,
      providers: Object.values(ProviderType).map(type => ({
        type,
        enabled: this.providers.has(type),
        instanceCount: instanceCounts[type] || 0
      })),
      totalInstances: this.registry.getInstanceCount(),
      healthMonitorEnabled: this.config.healthMonitor.enabled,
      migrationEnabled: this.config.migration.enabled
    };
  }
  
  /**
   * Dispose of swarm controller resources
   */
  public async dispose(): Promise<void> {
    logger.info('Disposing swarm controller');
    
    try {
      // Dispose of health monitor
      if (this.healthMonitor) {
        try {
          this.healthMonitor.dispose();
        } catch (error) {
          console.error('Error disposing health monitor:', error);
        }
      }
      
      // Dispose of migration manager
      if (this.migrationManager) {
        try {
          this.migrationManager.dispose();
        } catch (error) {
          console.error('Error disposing migration manager:', error);
        }
      }
      
      // Dispose of registry
      if (this.registry) {
        try {
          this.registry.dispose();
        } catch (error) {
          console.error('Error disposing instance registry:', error);
        }
      }
    } catch (error) {
      console.error('Error during swarm controller disposal:', error);
    } finally {
      this.initialized = false;
      logger.info('Swarm controller disposed');
    }
  }
  
  /**
   * Ensure the controller is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Swarm controller not initialized');
    }
  }
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