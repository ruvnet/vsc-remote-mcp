/**
 * Docker provider implementation
 * Implements the Provider interface for Docker-based VSCode instances
 */

import * as path from 'path';
import * as crypto from 'crypto';

import { AbstractProvider } from '../core/abstract-provider';
import { 
  ProviderType, 
  ProviderCapabilities, 
  ProviderConfig,
  InstanceStatus
} from '../core/provider-types';
import { 
  VSCodeInstance, 
  InstanceConfig, 
  InstanceFilter, 
  LogOptions, 
  InstanceLogs, 
  CommandResult 
} from '../core/instance.interface';

import { DockerCommandExecutor } from './docker-command';
import { ContainerUtils } from './container-utils';
import { InstanceStorage } from './instance-storage';
import { DockerLogParser } from './log-parser';
import { DockerProviderConfig, DockerInstanceMetadata } from './docker-types';
import * as loggerModule from '../../utils/logger';

/**
 * Docker provider implementation
 */
export class DockerProvider extends AbstractProvider {
  /**
   * Docker command executor
   */
  private dockerExecutor: DockerCommandExecutor;
  
  /**
   * Container utilities
   */
  private containerUtils: ContainerUtils;
  
  /**
   * Instance storage
   */
  private instanceStorage: InstanceStorage;
  
  /**
   * Log parser
   */
  private logParser: DockerLogParser;
  
  /**
   * Docker-specific configuration
   */
  private dockerConfig: DockerProviderConfig;
  
  /**
   * Constructor
   * @param config Provider configuration
   */
  constructor(config: ProviderConfig) {
    super(ProviderType.DOCKER, config);
    
    // Set Docker-specific configuration
    this.dockerConfig = {
      socketPath: (config.specific.socketPath as string) || '/var/run/docker.sock',
      apiVersion: (config.specific.apiVersion as string) || '1.41',
      networkName: (config.specific.networkName as string) || 'vscode-remote-network',
      volumeDriver: (config.specific.volumeDriver as string) || 'local',
      imageRepository: (config.specific.imageRepository as string) || 'codercom/code-server',
      imageTag: (config.specific.imageTag as string) || 'latest'
    };
    
    // Initialize utilities
    this.dockerExecutor = new DockerCommandExecutor(loggerModule);
    this.containerUtils = new ContainerUtils(this.dockerConfig, this.dockerExecutor, loggerModule);
    this.instanceStorage = new InstanceStorage(path.join(process.cwd(), 'vscode-instances'), loggerModule);
    this.logParser = new DockerLogParser();
  }
  
  /**
   * Initialize the provider
   */
  public async initialize(): Promise<void> {
    await super.initialize();
    
    // Check Docker connection
    try {
      const isAvailable = await this.dockerExecutor.isDockerAvailable();
      
      if (!isAvailable) {
        throw new Error('Docker is not available');
      }
      
      this.logger.info('Docker connection successful');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Docker connection failed: ${err.message}`);
      throw new Error(`Failed to connect to Docker: ${err.message}`);
    }
    
    // Create Docker network if it doesn't exist
    const networkExists = await this.dockerExecutor.networkExists(this.dockerConfig.networkName);
    
    if (!networkExists) {
      this.logger.info(`Creating Docker network: ${this.dockerConfig.networkName}`);
      await this.dockerExecutor.createNetwork(this.dockerConfig.networkName);
    }
  }
  
  /**
   * Get provider capabilities
   */
  public getCapabilities(): ProviderCapabilities {
    return {
      supportsLiveResize: false,
      supportsSnapshotting: false,
      supportsMultiRegion: false,
      maxInstancesPerUser: 10,
      maxResourcesPerInstance: {
        cpu: {
          cores: 4
        },
        memory: {
          min: 512,
          max: 8192
        },
        storage: {
          size: 10,
          persistent: true
        }
      }
    };
  }
  
  /**
   * Create a new VSCode instance
   * @param config Instance configuration
   * @returns Created instance
   */
  public async createInstance(config: InstanceConfig): Promise<VSCodeInstance> {
    this.logger.info(`Creating Docker instance: ${config.name}`);
    
    // Validate configuration
    this.validateInstanceConfig(config);
    
    // Generate instance ID
    const instanceId = this.generateInstanceId();
    
    // Create base instance
    const instance = this.createBaseInstance(
      instanceId,
      config.name,
      instanceId, // Use instance ID as provider instance ID for now
      config
    );
    
    try {
      // Create container
      const containerId = await this.containerUtils.createContainer(instance.name, config);
      
      // Update instance metadata
      instance.metadata = {
        containerId,
        imageId: `${this.dockerConfig.imageRepository}:${this.dockerConfig.imageTag}`
      } as DockerInstanceMetadata;
      
      // Start container
      await this.containerUtils.startContainer(containerId);
      
      // Get container info
      const containerInfo = await this.containerUtils.getContainerInfo(containerId);
      
      // Update instance with container info
      instance.status = InstanceStatus.RUNNING;
      instance.network.internalIp = containerInfo.networkSettings.ipAddress;
      instance.network.ports = containerInfo.networkSettings.ports.map(port => ({
        internal: port.internal,
        external: port.external,
        protocol: port.protocol
      }));
      
      // Generate access URLs
      instance.network.urls = this.generateAccessUrls(instance);
      
      // Save instance
      await this.instanceStorage.saveInstance(instance);
      
      return instance;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create Docker instance: ${err.message}`);
      
      // Update instance status
      instance.status = InstanceStatus.FAILED;
      instance.metadata = {
        ...instance.metadata,
        error: err.message
      };
      
      // Save instance
      await this.instanceStorage.saveInstance(instance);
      
      throw new Error(`Failed to create Docker instance: ${err.message}`);
    }
  }
  
  /**
   * Get an instance by ID
   * @param instanceId Instance ID
   * @returns Instance or null if not found
   */
  public async getInstance(instanceId: string): Promise<VSCodeInstance | null> {
    this.logger.info(`Getting Docker instance: ${instanceId}`);
    
    try {
      // Load instance from file
      const instance = await this.instanceStorage.loadInstance(instanceId);
      
      if (!instance) {
        return null;
      }
      
      // Get container info if instance is not deleted
      if (instance.status !== InstanceStatus.DELETED) {
        const metadata = instance.metadata as DockerInstanceMetadata;
        
        try {
          const containerInfo = await this.containerUtils.getContainerInfo(metadata.containerId);
          
          // Update instance status based on container status
          instance.status = this.containerUtils.mapContainerStatusToInstanceStatus(containerInfo.state);
          
          // Update instance network info
          instance.network.internalIp = containerInfo.networkSettings.ipAddress;
          instance.network.ports = containerInfo.networkSettings.ports.map(port => ({
            internal: port.internal,
            external: port.external,
            protocol: port.protocol
          }));
          
          // Update instance resource usage
          instance.resources.cpu.used = containerInfo.stats.cpuUsage;
          instance.resources.memory.used = containerInfo.stats.memoryUsage;
          
          // Update instance
          instance.updatedAt = new Date();
          
          // Save instance
          await this.instanceStorage.saveInstance(instance);
        } catch (error) {
          // Container might not exist anymore
          if (instance.status !== InstanceStatus.DELETED) {
            instance.status = InstanceStatus.FAILED;
            await this.instanceStorage.saveInstance(instance);
          }
        }
      }
      
      return instance;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get Docker instance: ${err.message}`);
      return null;
    }
  }
  
  /**
   * List all instances
   * @param filter Optional filter criteria
   * @returns Array of instances
   */
  public async listInstances(filter?: InstanceFilter): Promise<VSCodeInstance[]> {
    this.logger.info('Listing Docker instances');
    
    try {
      // Load all instances
      const instances = await this.instanceStorage.loadAllInstances();
      
      // Update instance status
      for (const instance of instances) {
        if (instance.status !== InstanceStatus.DELETED) {
          await this.getInstance(instance.id);
        }
      }
      
      // Apply filters if provided
      if (filter) {
        return this.filterInstances(instances, filter);
      }
      
      return instances;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to list Docker instances: ${err.message}`);
      return [];
    }
  }
  
  /**
   * Start an instance
   * @param instanceId Instance ID
   * @returns Updated instance
   */
  public async startInstance(instanceId: string): Promise<VSCodeInstance> {
    this.logger.info(`Starting Docker instance: ${instanceId}`);
    
    // Get instance
    const instance = await this.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }
    
    // Check if instance is already running
    if (instance.status === InstanceStatus.RUNNING) {
      return instance;
    }
    
    try {
      // Get container ID
      const metadata = instance.metadata as DockerInstanceMetadata;
      
      // Start container
      await this.containerUtils.startContainer(metadata.containerId);
      
      // Update instance status
      instance.status = InstanceStatus.RUNNING;
      instance.updatedAt = new Date();
      
      // Get container info
      const containerInfo = await this.containerUtils.getContainerInfo(metadata.containerId);
      
      // Update instance network info
      instance.network.internalIp = containerInfo.networkSettings.ipAddress;
      instance.network.ports = containerInfo.networkSettings.ports.map(port => ({
        internal: port.internal,
        external: port.external,
        protocol: port.protocol
      }));
      
      // Generate access URLs
      instance.network.urls = this.generateAccessUrls(instance);
      
      // Save instance
      await this.instanceStorage.saveInstance(instance);
      
      return instance;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to start Docker instance: ${err.message}`);
      
      // Update instance status
      instance.status = InstanceStatus.FAILED;
      instance.metadata = {
        ...instance.metadata,
        error: err.message
      };
      
      // Save instance
      await this.instanceStorage.saveInstance(instance);
      
      throw new Error(`Failed to start Docker instance: ${err.message}`);
    }
  }
  
  /**
   * Stop an instance
   * @param instanceId Instance ID
   * @param force Force stop if true
   * @returns Updated instance
   */
  public async stopInstance(instanceId: string, force?: boolean): Promise<VSCodeInstance> {
    this.logger.info(`Stopping Docker instance: ${instanceId}`);
    
    // Get instance
    const instance = await this.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }
    
    // Check if instance is already stopped
    if (instance.status === InstanceStatus.STOPPED) {
      return instance;
    }
    
    try {
      // Get container ID
      const metadata = instance.metadata as DockerInstanceMetadata;
      
      // Stop container
      await this.containerUtils.stopContainer(metadata.containerId, force);
      
      // Update instance status
      instance.status = InstanceStatus.STOPPED;
      instance.updatedAt = new Date();
      
      // Save instance
      await this.instanceStorage.saveInstance(instance);
      
      return instance;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to stop Docker instance: ${err.message}`);
      
      // Update instance status if forced
      if (force) {
        instance.status = InstanceStatus.STOPPED;
        instance.updatedAt = new Date();
        await this.instanceStorage.saveInstance(instance);
        return instance;
      }
      
      throw new Error(`Failed to stop Docker instance: ${err.message}`);
    }
  }
  
  /**
   * Delete an instance
   * @param instanceId Instance ID
   * @returns True if successful
   */
  public async deleteInstance(instanceId: string): Promise<boolean> {
    this.logger.info(`Deleting Docker instance: ${instanceId}`);
    
    // Get instance
    const instance = await this.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }
    
    try {
      // Get container ID
      const metadata = instance.metadata as DockerInstanceMetadata;
      
      // Stop container if running
      if (instance.status === InstanceStatus.RUNNING) {
        await this.containerUtils.stopContainer(metadata.containerId, true);
      }
      
      // Remove container
      await this.containerUtils.removeContainer(metadata.containerId);
      
      // Update instance status
      instance.status = InstanceStatus.DELETED;
      instance.updatedAt = new Date();
      
      // Save instance
      await this.instanceStorage.saveInstance(instance);
      
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to delete Docker instance: ${err.message}`);
      
      // Update instance status
      instance.status = InstanceStatus.FAILED;
      instance.metadata = {
        ...instance.metadata,
        error: err.message
      };
      
      // Save instance
      await this.instanceStorage.saveInstance(instance);
      
      throw new Error(`Failed to delete Docker instance: ${err.message}`);
    }
  }
  
  /**
   * Update instance configuration
   * @param instanceId Instance ID
   * @param config Updated configuration
   * @returns Updated instance
   */
  public async updateInstance(instanceId: string, config: Partial<InstanceConfig>): Promise<VSCodeInstance> {
    this.logger.info(`Updating Docker instance: ${instanceId}`);
    
    // Get instance
    const instance = await this.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }
    
    // Check if instance is running
    const wasRunning = instance.status === InstanceStatus.RUNNING;
    
    try {
      // Stop instance if running
      if (wasRunning) {
        await this.stopInstance(instanceId);
      }
      
      // Update instance configuration
      instance.config = {
        ...instance.config,
        ...config
      };
      
      // Get container ID
      const metadata = instance.metadata as DockerInstanceMetadata;
      
      // Remove old container
      await this.containerUtils.removeContainer(metadata.containerId);
      
      // Create new container
      const containerId = await this.containerUtils.createContainer(instance.name, instance.config);
      
      // Update instance metadata
      instance.metadata = {
        ...instance.metadata,
        containerId
      };
      
      // Start container if it was running before
      if (wasRunning) {
        await this.containerUtils.startContainer(containerId);
        
        // Get container info
        const containerInfo = await this.containerUtils.getContainerInfo(containerId);
        
        // Update instance status
        instance.status = InstanceStatus.RUNNING;
        
        // Update instance network info
        instance.network.internalIp = containerInfo.networkSettings.ipAddress;
        instance.network.ports = containerInfo.networkSettings.ports.map(port => ({
          internal: port.internal,
          external: port.external,
          protocol: port.protocol
        }));
        
        // Generate access URLs
        instance.network.urls = this.generateAccessUrls(instance);
      } else {
        instance.status = InstanceStatus.STOPPED;
      }
      
      // Update timestamp
      instance.updatedAt = new Date();
      
      // Save instance
      await this.instanceStorage.saveInstance(instance);
      
      return instance;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to update Docker instance: ${err.message}`);
      
      // Update instance status
      instance.status = InstanceStatus.FAILED;
      instance.metadata = {
        ...instance.metadata,
        error: err.message
      };
      
      // Save instance
      await this.instanceStorage.saveInstance(instance);
      
      throw new Error(`Failed to update Docker instance: ${err.message}`);
    }
  }
  
  /**
   * Get instance logs
   * @param instanceId Instance ID
   * @param options Log options
   * @returns Instance logs
   */
  public async getInstanceLogs(instanceId: string, options?: LogOptions): Promise<InstanceLogs> {
    this.logger.info(`Getting Docker instance logs: ${instanceId}`);
    
    // Get instance
    const instance = await this.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }
    
    try {
      // Get container ID
      const metadata = instance.metadata as DockerInstanceMetadata;
      
      // Get container logs
      const logs = await this.containerUtils.getContainerLogs(metadata.containerId, {
        lines: options?.lines,
        since: options?.since,
        follow: options?.follow
      });
      
      // Parse logs
      const entries = this.logParser.parseDockerLogs(logs, options?.pattern);
      
      // Format logs
      return this.logParser.formatInstanceLogs(
        instanceId,
        entries,
        entries.length === (options?.lines || 100)
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get Docker instance logs: ${err.message}`);
      
      throw new Error(`Failed to get Docker instance logs: ${err.message}`);
    }
  }
  
  /**
   * Execute a command in an instance
   * @param instanceId Instance ID
   * @param command Command to execute
   * @returns Command result
   */
  public async executeCommand(instanceId: string, command: string): Promise<CommandResult> {
    this.logger.info(`Executing command in Docker instance: ${instanceId}`);
    
    // Get instance
    const instance = await this.getInstance(instanceId);
    
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }
    
    // Check if instance is running
    if (instance.status !== InstanceStatus.RUNNING) {
      throw new Error(`Instance is not running: ${instanceId}`);
    }
    
    try {
      // Get container ID
      const metadata = instance.metadata as DockerInstanceMetadata;
      
      // Execute command
      const result = await this.containerUtils.executeCommand(metadata.containerId, command);
      
      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.exitCode !== 0 ? 'Command failed' : undefined
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to execute command in Docker instance: ${err.message}`);
      
      return {
        exitCode: 1,
        stdout: '',
        stderr: '',
        error: err.message
      };
    }
  }
  
  /**
   * Filter instances based on criteria
   * @param instances Instances to filter
   * @param filter Filter criteria
   * @returns Filtered instances
   */
  private filterInstances(instances: VSCodeInstance[], filter: InstanceFilter): VSCodeInstance[] {
    let filtered = [...instances];
    
    // Filter by status
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      filtered = filtered.filter(instance => statuses.includes(instance.status));
    }
    
    // Filter by name pattern
    if (filter.namePattern) {
      const regex = new RegExp(filter.namePattern);
      filtered = filtered.filter(instance => regex.test(instance.name));
    }
    
    // Filter by creation date
    if (filter.createdAfter) {
      filtered = filtered.filter(instance => instance.createdAt >= filter.createdAfter!);
    }
    
    if (filter.createdBefore) {
      filtered = filtered.filter(instance => instance.createdAt <= filter.createdBefore!);
    }
    
    // Filter by tags
    if (filter.tags) {
      filtered = filtered.filter(instance => {
        for (const [key, value] of Object.entries(filter.tags || {})) {
          if (instance.metadata[key] !== value) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // Apply limit and offset
    if (filter.offset) {
      filtered = filtered.slice(filter.offset);
    }
    
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }
    
    return filtered;
  }
  
  /**
   * Generate access URLs for an instance
   * @param instance Instance
   * @returns Access URLs
   */
  private generateAccessUrls(instance: VSCodeInstance): string[] {
    const urls: string[] = [];
    
    // Find HTTP port
    const httpPort = instance.network.ports.find(port => port.internal === 8080);
    
    if (httpPort) {
      urls.push(`http://localhost:${httpPort.external}`);
      
      // Add hostname URL if not localhost
      if (instance.network.externalIp !== 'localhost' && instance.network.externalIp !== '127.0.0.1') {
        urls.push(`http://${instance.network.externalIp}:${httpPort.external}`);
      }
    }
    
    return urls;
  }
  
  /**
   * Generate a unique instance ID
   * @returns Instance ID
   */
  protected generateInstanceId(): string {
    const hash = crypto.createHash('sha1');
    hash.update(`${Date.now()}-${Math.random()}`);
    return `vscode-${hash.digest('hex').substring(0, 8)}`;
  }
}