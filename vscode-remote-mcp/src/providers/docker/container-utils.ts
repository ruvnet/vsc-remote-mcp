/**
 * Docker container utilities
 * Provides functions for managing Docker containers
 */

import { DockerCommandExecutor } from './docker-command';
import { DockerContainerInfo, DockerProviderConfig } from './docker-types';
import { InstanceConfig } from '../core/instance.interface';
import { InstanceStatus } from '../core/provider-types';
import * as logger from '../../utils/logger';

/**
 * Container utilities class
 */
export class ContainerUtils {
  /**
   * Docker command executor
   */
  private dockerExecutor: DockerCommandExecutor;
  
  /**
   * Docker provider configuration
   */
  private config: DockerProviderConfig;
  
  /**
   * Logger instance
   */
  private logger: typeof logger;
  
  /**
   * Constructor
   * @param config Docker provider configuration
   * @param dockerExecutor Docker command executor
   * @param loggerInstance Logger instance
   */
  constructor(
    config: DockerProviderConfig,
    dockerExecutor: DockerCommandExecutor,
    loggerInstance: typeof logger = logger
  ) {
    this.config = config;
    this.dockerExecutor = dockerExecutor;
    this.logger = loggerInstance;
  }
  
  /**
   * Create a Docker container
   * @param name Container name
   * @param instanceConfig Instance configuration
   * @returns Container ID
   */
  public async createContainer(name: string, instanceConfig: InstanceConfig): Promise<string> {
    this.logger.info(`Creating Docker container: ${name}`);
    
    // Build Docker run command
    let command = 'create';
    
    // Add container name
    command += ` --name ${name}`;
    
    // Add network
    command += ` --network ${this.config.networkName}`;
    
    // Add resource limits
    command += ` --cpus ${instanceConfig.resources.cpu.cores}`;
    command += ` --memory ${instanceConfig.resources.memory.min}m`;
    
    // Add port mappings
    if (instanceConfig.network.port) {
      command += ` -p ${instanceConfig.network.port}:8080`;
    }
    
    // Add volume mount
    command += ` -v ${instanceConfig.workspacePath}:/home/coder/project`;
    
    // Add environment variables
    if (instanceConfig.env) {
      for (const [key, value] of Object.entries(instanceConfig.env)) {
        command += ` -e ${key}=${value}`;
      }
    }
    
    // Add password if provided
    if (instanceConfig.auth && instanceConfig.auth.type === 'password' && instanceConfig.auth.credentials) {
      command += ` -e PASSWORD=${instanceConfig.auth.credentials}`;
    }
    
    // Add image
    command += ` ${this.config.imageRepository}:${this.config.imageTag}`;
    
    // Execute command
    const { stdout } = await this.dockerExecutor.execute(command);
    
    // Return container ID
    return stdout.trim();
  }
  
  /**
   * Start a Docker container
   * @param containerId Container ID
   * @returns True if successful
   */
  public async startContainer(containerId: string): Promise<boolean> {
    this.logger.info(`Starting Docker container: ${containerId}`);
    
    try {
      await this.dockerExecutor.execute(`start ${containerId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to start container: ${containerId}`);
      return false;
    }
  }
  
  /**
   * Stop a Docker container
   * @param containerId Container ID
   * @param force Force stop if true
   * @returns True if successful
   */
  public async stopContainer(containerId: string, force = false): Promise<boolean> {
    this.logger.info(`Stopping Docker container: ${containerId}`);
    
    try {
      if (force) {
        await this.dockerExecutor.execute(`kill ${containerId}`);
      } else {
        await this.dockerExecutor.execute(`stop ${containerId}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to stop container: ${containerId}`);
      return false;
    }
  }
  
  /**
   * Remove a Docker container
   * @param containerId Container ID
   * @returns True if successful
   */
  public async removeContainer(containerId: string): Promise<boolean> {
    this.logger.info(`Removing Docker container: ${containerId}`);
    
    try {
      await this.dockerExecutor.execute(`rm -f ${containerId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove container: ${containerId}`);
      return false;
    }
  }
  
  /**
   * Get Docker container info
   * @param containerId Container ID
   * @returns Container info
   */
  public async getContainerInfo(containerId: string): Promise<DockerContainerInfo> {
    this.logger.info(`Getting Docker container info: ${containerId}`);
    
    // Get container info
    const { stdout: inspectOutput } = await this.dockerExecutor.execute(`inspect ${containerId}`);
    const inspectData = JSON.parse(inspectOutput)[0];
    
    // Get container stats
    const { stdout: statsOutput } = await this.dockerExecutor.execute(`stats ${containerId} --no-stream --format "{{.CPUPerc}},{{.MemUsage}}"`);
    const [cpuPerc, memUsage] = statsOutput.split(',');
    
    // Parse CPU percentage
    const cpuUsage = parseFloat(cpuPerc.replace('%', '')) / 100;
    
    // Parse memory usage
    const memMatch = memUsage.match(/([0-9.]+)([A-Za-z]+)/);
    let memoryUsage = 0;
    
    if (memMatch) {
      const value = parseFloat(memMatch[1]);
      const unit = memMatch[2].toLowerCase();
      
      switch (unit) {
        case 'b':
          memoryUsage = value / (1024 * 1024);
          break;
        case 'kb':
        case 'kib':
          memoryUsage = value / 1024;
          break;
        case 'mb':
        case 'mib':
          memoryUsage = value;
          break;
        case 'gb':
        case 'gib':
          memoryUsage = value * 1024;
          break;
      }
    }
    
    // Parse ports
    const ports: { internal: number; external: number; protocol: string }[] = [];
    
    if (inspectData.NetworkSettings && inspectData.NetworkSettings.Ports) {
      for (const [key, value] of Object.entries(inspectData.NetworkSettings.Ports)) {
        if (value && Array.isArray(value)) {
          const [internalPort, protocol] = key.split('/');
          
          for (const binding of value) {
            ports.push({
              internal: parseInt(internalPort, 10),
              external: parseInt(binding.HostPort, 10),
              protocol
            });
          }
        }
      }
    }
    
    return {
      id: inspectData.Id,
      name: inspectData.Name.replace(/^\//, ''),
      state: inspectData.State.Status,
      networkSettings: {
        ipAddress: inspectData.NetworkSettings.Networks[this.config.networkName]?.IPAddress || '',
        ports
      },
      stats: {
        cpuUsage,
        memoryUsage
      }
    };
  }
  
  /**
   * Map Docker container status to instance status
   * @param containerStatus Container status
   * @returns Instance status
   */
  public mapContainerStatusToInstanceStatus(containerStatus: string): InstanceStatus {
    switch (containerStatus) {
      case 'running':
        return InstanceStatus.RUNNING;
      case 'exited':
      case 'created':
        return InstanceStatus.STOPPED;
      case 'paused':
        return InstanceStatus.STOPPED;
      case 'restarting':
        return InstanceStatus.CREATING;
      case 'removing':
        return InstanceStatus.DELETED;
      case 'dead':
        return InstanceStatus.FAILED;
      default:
        return InstanceStatus.FAILED;
    }
  }
  
  /**
   * Execute a command in a container
   * @param containerId Container ID
   * @param command Command to execute
   * @returns Command output
   */
  public async executeCommand(containerId: string, command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    this.logger.info(`Executing command in container: ${containerId}`);
    
    try {
      const { stdout, stderr } = await this.dockerExecutor.execute(`exec ${containerId} ${command}`);
      
      return {
        stdout,
        stderr,
        exitCode: 0
      };
    } catch (error) {
      const err = error as Error & { stdout?: string; stderr?: string };
      
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || err.message,
        exitCode: 1
      };
    }
  }
  
  /**
   * Get container logs
   * @param containerId Container ID
   * @param options Log options
   * @returns Container logs
   */
  public async getContainerLogs(
    containerId: string,
    options?: {
      lines?: number;
      since?: Date;
      follow?: boolean;
    }
  ): Promise<string> {
    this.logger.info(`Getting container logs: ${containerId}`);
    
    // Build Docker logs command
    let command = `logs ${containerId}`;
    
    if (options) {
      if (options.lines) {
        command += ` --tail ${options.lines}`;
      }
      
      if (options.since) {
        command += ` --since ${Math.floor(options.since.getTime() / 1000)}`;
      }
      
      if (options.follow) {
        command += ' --follow';
      }
    }
    
    // Execute command
    const { stdout } = await this.dockerExecutor.execute(command);
    
    return stdout;
  }
}