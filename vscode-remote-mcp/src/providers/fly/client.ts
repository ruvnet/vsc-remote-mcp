/**
 * Fly.io Client for VSCode Remote Swarm
 * 
 * This module provides a TypeScript client for interacting with the Fly.io API
 * through the fly-admin package. It handles machine creation/deletion, app management,
 * IP address allocation, and volume management.
 * 
 * @module fly-client
 */

import { createClient } from 'fly-admin';

/**
 * Configuration options for the Fly.io client
 */
export interface FlyClientConfig {
  /** Organization ID or slug */
  organization?: string;
  /** Default region for resource creation */
  defaultRegion: string;
  /** Available regions for resource creation */
  regions: string[];
  /** Retry options for API calls */
  retryOptions: RetryOptions;
  /** Optional logger instance */
  logger?: Logger;
}

/**
 * Retry options for API calls
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff factor for exponential backoff */
  backoffFactor: number;
}

/**
 * Logger interface for client logging
 */
export interface Logger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
}

/**
 * Default logger implementation
 */
class DefaultLogger implements Logger {
  debug(message: string, context?: Record<string, any>): void {
    console.debug(`[FlyClient] ${message}`, context);
  }

  info(message: string, context?: Record<string, any>): void {
    console.info(`[FlyClient] ${message}`, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    console.warn(`[FlyClient] ${message}`, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    console.error(`[FlyClient] ${message}`, error, context);
  }
}

/**
 * Error categories for Fly.io client
 */
export enum FlyErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  RESOURCE = 'RESOURCE',
  NETWORK = 'NETWORK',
  API = 'API',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL'
}

/**
 * Error codes for Fly.io client
 */
export enum FlyErrorCode {
  // Authentication errors
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED_TOKEN = 'AUTH_EXPIRED_TOKEN',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // Network errors
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // API errors
  API_INVALID_REQUEST = 'API_INVALID_REQUEST',
  API_UNSUPPORTED_OPERATION = 'API_UNSUPPORTED_OPERATION',
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Options for creating a FlyError
 */
export interface FlyErrorOptions {
  message: string;
  code: FlyErrorCode;
  category: FlyErrorCategory;
  retryable: boolean;
  cause?: Error;
  context?: Record<string, any>;
}

/**
 * Custom error class for Fly.io client errors
 */
export class FlyError extends Error {
  code: FlyErrorCode;
  category: FlyErrorCategory;
  retryable: boolean;
  cause?: Error;
  context?: Record<string, any>;

  constructor(options: FlyErrorOptions) {
    super(options.message);
    this.name = 'FlyError';
    this.code = options.code;
    this.category = options.category;
    this.retryable = options.retryable;
    this.cause = options.cause;
    this.context = options.context;
  }
}

/**
 * App representation in Fly.io
 */
export interface App {
  id: string;
  name: string;
  organization: string;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * App status enum
 */
export enum AppStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * Options for creating an app
 */
export interface CreateAppOptions {
  name: string;
  organization?: string;
  region?: string;
}

/**
 * Machine representation in Fly.io
 */
export interface Machine {
  id: string;
  name?: string;
  state: MachineState;
  region: string;
  instanceId: string;
  createdAt: string;
  updatedAt: string;
  config: MachineConfig;
  events?: MachineEvent[];
}

/**
 * Machine state enum
 */
export enum MachineState {
  CREATED = 'created',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed',
  CRASHED = 'crashed',
  FAILED = 'failed'
}

/**
 * Machine configuration
 */
export interface MachineConfig {
  image: string;
  guest?: {
    cpus: number;
    memory_mb: number;
    cpu_kind?: 'shared' | 'performance';
  };
  env?: Record<string, string>;
  services?: ServiceConfig[];
  mounts?: MountConfig[];
  metadata?: Record<string, string>;
}

/**
 * Service configuration for machine
 */
export interface ServiceConfig {
  ports: PortConfig[];
  protocol: 'tcp' | 'udp';
  internal_port: number;
}

/**
 * Port configuration for service
 */
export interface PortConfig {
  port: number;
  handlers: string[];
}

/**
 * Mount configuration for machine
 */
export interface MountConfig {
  volume: string;
  path: string;
}

/**
 * Options for creating a machine
 */
export interface CreateMachineOptions {
  app_name: string;
  region?: string;
  name?: string;
  config: MachineConfig;
}

/**
 * Machine event
 */
export interface MachineEvent {
  id: string;
  type: string;
  timestamp: string;
  data?: any;
}

/**
 * IP address representation in Fly.io
 */
export interface IpAddress {
  id: string;
  address: string;
  type: 'v4' | 'v6';
  created_at: string;
}

/**
 * Options for allocating an IP address
 */
export interface AllocateIpOptions {
  app_name: string;
  type: 'v4' | 'v6';
  region?: string;
}

/**
 * Volume representation in Fly.io
 */
export interface Volume {
  id: string;
  name: string;
  size_gb: number;
  region: string;
  state: VolumeState;
  attached_machine_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Volume state enum
 */
export enum VolumeState {
  CREATED = 'created',
  ATTACHING = 'attaching',
  ATTACHED = 'attached',
  DETACHING = 'detaching',
  DETACHED = 'detached',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed'
}

/**
 * Options for creating a volume
 */
export interface CreateVolumeOptions {
  app_name: string;
  name: string;
  size_gb: number;
  region?: string;
  snapshot_id?: string;
}

/**
 * Default configuration for the Fly.io client
 */
const DEFAULT_CONFIG: FlyClientConfig = {
  defaultRegion: 'ams',
  regions: ['ams', 'sea', 'sjc', 'ewr', 'ord', 'syd', 'hkg', 'nrt', 'fra'],
  retryOptions: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffFactor: 2
  }
};

/**
 * Generate a random ID for resources
 * @returns Random ID string
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Map API error to FlyError
 * @param apiError API error
 * @returns Mapped FlyError
 */
function mapApiErrorToFlyError(apiError: any): FlyError {
  // Check for authentication errors
  if (apiError.status === 401) {
    return new FlyError({
      message: 'Invalid or expired API token',
      code: FlyErrorCode.AUTH_INVALID_TOKEN,
      category: FlyErrorCategory.AUTHENTICATION,
      retryable: false,
      cause: apiError
    });
  }
  
  // Check for resource not found
  if (apiError.status === 404) {
    return new FlyError({
      message: 'Resource not found',
      code: FlyErrorCode.RESOURCE_NOT_FOUND,
      category: FlyErrorCategory.RESOURCE,
      retryable: false,
      cause: apiError
    });
  }
  
  // Check for rate limiting
  if (apiError.status === 429) {
    return new FlyError({
      message: 'Rate limit exceeded',
      code: FlyErrorCode.RATE_LIMIT_EXCEEDED,
      category: FlyErrorCategory.RATE_LIMIT,
      retryable: true,
      cause: apiError
    });
  }
  
  // Default to internal error
  return new FlyError({
    message: apiError.message || 'Unknown Fly.io API error',
    code: FlyErrorCode.INTERNAL_ERROR,
    category: FlyErrorCategory.INTERNAL,
    retryable: true,
    cause: apiError
  });
}

/**
 * Retry an operation with exponential backoff
 * @param operation Operation to retry
 * @param options Retry options
 * @returns Operation result
 * @throws Last error encountered
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries <= options.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if error is not retryable
      if (error instanceof FlyError && !error.retryable) {
        throw error;
      }
      
      if (retries >= options.maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.initialDelayMs * Math.pow(options.backoffFactor, retries),
        options.maxDelayMs
      );
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      retries++;
    }
  }
  
  throw lastError;
}

/**
 * Fly.io client for interacting with the Fly.io API
 */
export class FlyClient {
  private flyAdmin: any; // fly-admin client
  private config: FlyClientConfig;
  private logger: Logger;

  /**
   * Create a new Fly.io client
   * @param apiToken Fly.io API token
   * @param config Client configuration
   */
  constructor(private apiToken: string, config?: Partial<FlyClientConfig>) {
    this.config = this.mergeWithDefaultConfig(config);
    this.logger = this.config.logger || new DefaultLogger();
    this.flyAdmin = createClient(apiToken);
  }

  /**
   * Merge provided configuration with default configuration
   * @param config Partial configuration
   * @returns Complete configuration
   */
  private mergeWithDefaultConfig(config?: Partial<FlyClientConfig>): FlyClientConfig {
    return {
      ...DEFAULT_CONFIG,
      ...config,
      retryOptions: {
        ...DEFAULT_CONFIG.retryOptions,
        ...config?.retryOptions
      }
    };
  }

  /**
   * Execute an operation with retry logic
   * @param operation Operation to execute
   * @returns Operation result
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    return retryWithBackoff(operation, this.config.retryOptions);
  }

  /**
   * Validate the API token
   * @returns True if token is valid
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.flyAdmin.App.listApps();
      return true;
    } catch (error) {
      return false;
    }
  }

  // App Management Methods

  /**
   * Create a new app
   * @param options App creation options
   * @returns Created app
   */
  async createApp(options: CreateAppOptions): Promise<App> {
    this.logger.info(`Creating app: ${options.name}`, options);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.App.createApp({
          name: options.name,
          organization_id: options.organization || this.config.organization
        })
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to create app: ${options.name}`, flyError);
      throw flyError;
    }
  }

  /**
   * Get app details
   * @param appName App name
   * @returns App details or null if not found
   */
  async getApp(appName: string): Promise<App | null> {
    this.logger.info(`Getting app: ${appName}`);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.App.getApp(appName)
      );
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to get app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * List all apps
   * @returns List of apps
   */
  async listApps(): Promise<App[]> {
    this.logger.info('Listing apps');
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.App.listApps()
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error('Failed to list apps', flyError);
      throw flyError;
    }
  }

  /**
   * Delete an app
   * @param appName App name
   */
  async deleteApp(appName: string): Promise<void> {
    this.logger.info(`Deleting app: ${appName}`);
    
    try {
      await this.executeWithRetry(() => 
        this.flyAdmin.App.deleteApp(appName)
      );
    } catch (error: any) {
      if (error.status === 404) {
        this.logger.warn(`App not found: ${appName}`);
        return;
      }
      
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to delete app: ${appName}`, flyError);
      throw flyError;
    }
  }

  // Machine Management Methods

  /**
   * Create a new machine
   * @param options Machine creation options
   * @returns Created machine
   */
  async createMachine(options: CreateMachineOptions): Promise<Machine> {
    this.logger.info(`Creating machine for app: ${options.app_name}`, options);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.Machine.createMachine(options)
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to create machine for app: ${options.app_name}`, flyError);
      throw flyError;
    }
  }

  /**
   * Get machine details
   * @param appName App name
   * @param machineId Machine ID
   * @returns Machine details or null if not found
   */
  async getMachine(appName: string, machineId: string): Promise<Machine | null> {
    this.logger.info(`Getting machine: ${machineId} for app: ${appName}`);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.Machine.getMachine(appName, machineId)
      );
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to get machine: ${machineId} for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * List all machines for an app
   * @param appName App name
   * @returns List of machines
   */
  async listMachines(appName: string): Promise<Machine[]> {
    this.logger.info(`Listing machines for app: ${appName}`);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.Machine.listMachines(appName)
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to list machines for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * Start a machine
   * @param appName App name
   * @param machineId Machine ID
   */
  async startMachine(appName: string, machineId: string): Promise<void> {
    this.logger.info(`Starting machine: ${machineId} for app: ${appName}`);
    
    try {
      await this.executeWithRetry(() => 
        this.flyAdmin.Machine.startMachine(appName, machineId)
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to start machine: ${machineId} for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * Stop a machine
   * @param appName App name
   * @param machineId Machine ID
   */
  async stopMachine(appName: string, machineId: string): Promise<void> {
    this.logger.info(`Stopping machine: ${machineId} for app: ${appName}`);
    
    try {
      await this.executeWithRetry(() => 
        this.flyAdmin.Machine.stopMachine(appName, machineId)
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to stop machine: ${machineId} for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * Restart a machine
   * @param appName App name
   * @param machineId Machine ID
   */
  async restartMachine(appName: string, machineId: string): Promise<void> {
    this.logger.info(`Restarting machine: ${machineId} for app: ${appName}`);
    
    try {
      await this.executeWithRetry(() => 
        this.flyAdmin.Machine.restartMachine(appName, machineId)
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to restart machine: ${machineId} for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * Delete a machine
   * @param appName App name
   * @param machineId Machine ID
   */
  async deleteMachine(appName: string, machineId: string): Promise<void> {
    this.logger.info(`Deleting machine: ${machineId} for app: ${appName}`);
    
    try {
      await this.executeWithRetry(() => 
        this.flyAdmin.Machine.deleteMachine(appName, machineId)
      );
    } catch (error: any) {
      if (error.status === 404) {
        this.logger.warn(`Machine not found: ${machineId} for app: ${appName}`);
        return;
      }
      
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to delete machine: ${machineId} for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  // IP Address Management Methods

  /**
   * Allocate an IP address
   * @param options IP allocation options
   * @returns Allocated IP address
   */
  async allocateIpAddress(options: AllocateIpOptions): Promise<IpAddress> {
    this.logger.info(`Allocating ${options.type} IP address for app: ${options.app_name}`);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.Network.allocateIpAddress(options)
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to allocate IP address for app: ${options.app_name}`, flyError);
      throw flyError;
    }
  }

  /**
   * Release an IP address
   * @param appName App name
   * @param ipId IP address ID
   */
  async releaseIpAddress(appName: string, ipId: string): Promise<void> {
    this.logger.info(`Releasing IP address: ${ipId} for app: ${appName}`);
    
    try {
      await this.executeWithRetry(() => 
        this.flyAdmin.Network.releaseIpAddress(appName, ipId)
      );
    } catch (error: any) {
      if (error.status === 404) {
        this.logger.warn(`IP address not found: ${ipId} for app: ${appName}`);
        return;
      }
      
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to release IP address: ${ipId} for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * List IP addresses for an app
   * @param appName App name
   * @returns List of IP addresses
   */
  async listIpAddresses(appName: string): Promise<IpAddress[]> {
    this.logger.info(`Listing IP addresses for app: ${appName}`);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.Network.listIpAddresses(appName)
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to list IP addresses for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  // Volume Management Methods

  /**
   * Create a volume
   * @param options Volume creation options
   * @returns Created volume
   */
  async createVolume(options: CreateVolumeOptions): Promise<Volume> {
    this.logger.info(`Creating volume: ${options.name} for app: ${options.app_name}`, options);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.Volume.createVolume(options)
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to create volume: ${options.name} for app: ${options.app_name}`, flyError);
      throw flyError;
    }
  }

  /**
   * Get volume details
   * @param appName App name
   * @param volumeId Volume ID
   * @returns Volume details or null if not found
   */
  async getVolume(appName: string, volumeId: string): Promise<Volume | null> {
    this.logger.info(`Getting volume: ${volumeId} for app: ${appName}`);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.Volume.getVolume(appName, volumeId)
      );
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to get volume: ${volumeId} for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * List volumes for an app
   * @param appName App name
   * @returns List of volumes
   */
  async listVolumes(appName: string): Promise<Volume[]> {
    this.logger.info(`Listing volumes for app: ${appName}`);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.Volume.listVolumes(appName)
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to list volumes for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * Extend a volume
   * @param appName App name
   * @param volumeId Volume ID
   * @param sizeGb New size in GB
   * @returns Updated volume
   */
  async extendVolume(appName: string, volumeId: string, sizeGb: number): Promise<Volume> {
    this.logger.info(`Extending volume: ${volumeId} for app: ${appName} to ${sizeGb}GB`);
    
    try {
      return await this.executeWithRetry(() => 
        this.flyAdmin.Volume.extendVolume(appName, volumeId, { size_gb: sizeGb })
      );
    } catch (error) {
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to extend volume: ${volumeId} for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * Delete a volume
   * @param appName App name
   * @param volumeId Volume ID
   */
  async deleteVolume(appName: string, volumeId: string): Promise<void> {
    this.logger.info(`Deleting volume: ${volumeId} for app: ${appName}`);
    
    try {
      await this.executeWithRetry(() => 
        this.flyAdmin.Volume.deleteVolume(appName, volumeId)
      );
    } catch (error: any) {
      if (error.status === 404) {
        this.logger.warn(`Volume not found: ${volumeId} for app: ${appName}`);
        return;
      }
      
      const flyError = mapApiErrorToFlyError(error);
      this.logger.error(`Failed to delete volume: ${volumeId} for app: ${appName}`, flyError);
      throw flyError;
    }
  }

  /**
   * Create a VSCode instance
   * @param options VSCode instance options
   * @returns Created instance details
   */
  async createVSCodeInstance(options: {
    name?: string;
    region?: string;
    cpus?: number;
    memoryMb?: number;
    volumeSizeGb?: number;
    env?: Record<string, string>;
  }): Promise<{
    app: App;
    machine: Machine;
    volume: Volume;
    ipAddress: IpAddress;
    url: string;
  }> {
    const name = options.name || `vscode-${generateId()}`;
    const region = options.region || this.config.defaultRegion;
    const cpus = options.cpus || 1;
    const memoryMb = options.memoryMb || 2048;
    const volumeSizeGb = options.volumeSizeGb || 10;
    
    this.logger.info(`Creating VSCode instance: ${name}`, options);
    
    // Create app
    const app = await this.createApp({
      name,
      region
    });
    
    try {
      // Create volume
      const volume = await this.createVolume({
        app_name: app.name,
        name: `${name}-data`,
        size_gb: volumeSizeGb,
        region
      });
      
      // Create machine
      const machine = await this.createMachine({
        app_name: app.name,
        region,
        config: {
          image: 'codercom/code-server:latest',
          guest: {
            cpus,
            memory_mb: memoryMb,
            cpu_kind: cpus > 1 ? 'performance' : 'shared'
          },
          env: {
            PASSWORD: generateId(),
            ...options.env
          },
          services: [
            {
              ports: [
                {
                  port: 8080,
                  handlers: ['http']
                }
              ],
              protocol: 'tcp',
              internal_port: 8080
            }
          ],
          mounts: [
            {
              volume: volume.name,
              path: '/home/coder/project'
            }
          ]
        }
      });
      
      // Allocate IP address
      const ipAddress = await this.allocateIpAddress({
        app_name: app.name,
        type: 'v4'
      });
      
      return {
        app,
        machine,
        volume,
        ipAddress,
        url: `http://${ipAddress.address}:8080`
      };
    } catch (error) {
      // Clean up resources on failure
      this.logger.error(`Failed to create VSCode instance: ${name}`, error as Error);
      await this.deleteApp(app.name).catch(e => this.logger.error(`Failed to clean up app: ${app.name}`, e));
      throw error;
    }
  }
}