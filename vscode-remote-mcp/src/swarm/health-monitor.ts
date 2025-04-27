/**
 * Health Monitor for VSCode Remote Swarm
 * Monitors the health of VSCode instances and provides recovery mechanisms
 */

import { VSCodeInstance } from '../providers/core/instance.interface';
import { Provider } from '../providers/core/provider.interface';
import { ProviderType, InstanceStatus } from '../providers/core/provider-types';
import { InstanceRegistry } from './instance-registry';
import { SwarmConfig, HealthStatus, InstanceHealth } from './config';
import * as logger from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Health check result
 */
export interface HealthCheckResult {
  /**
   * Instance ID
   */
  instanceId: string;
  
  /**
   * Health status
   */
  status: HealthStatus;
  
  /**
   * Health check details
   */
  details: {
    /**
     * Health check message
     */
    message: string;
    
    /**
     * Error message if any
     */
    error?: string;
    
    /**
     * Response time in milliseconds
     */
    responseTimeMs?: number;
    
    /**
     * Additional details
     */
    [key: string]: any;
  };
  
  /**
   * Timestamp of the health check
   */
  timestamp: Date;
}

/**
 * Health monitor class
 */
export class HealthMonitor {
  /**
   * Map of instance health by ID
   */
  private instanceHealth: Map<string, InstanceHealth> = new Map();
  
  /**
   * Health check interval ID
   */
  private healthCheckIntervalId: NodeJS.Timeout | null = null;
  
  /**
   * Storage directory for health data
   */
  private storageDir: string;
  
  /**
   * Constructor
   * @param registry Instance registry
   * @param providers Map of providers by type
   * @param config Swarm configuration
   */
  constructor(
    private registry: InstanceRegistry,
    private providers: Map<ProviderType, Provider>,
    private config: SwarmConfig
  ) {
    this.storageDir = path.join(config.general.stateDir, 'health');
    
    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }
  
  /**
   * Initialize the health monitor
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing health monitor');
    
    // Load health data
    this.loadHealthData();
    
    // Start health check interval if enabled
    if (this.config.healthMonitor.enabled && this.config.healthMonitor.checkIntervalMs > 0) {
      this.startHealthChecks();
    }
    
    logger.info('Health monitor initialized');
  }
  
  /**
   * Load health data from storage
   */
  private loadHealthData(): void {
    try {
      logger.info(`Loading health data from ${this.storageDir}`);
      
      // Clear existing health data
      this.instanceHealth.clear();
      
      // Read health files
      const files = fs.readdirSync(this.storageDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.storageDir, file);
            const data = fs.readFileSync(filePath, 'utf8');
            const health = JSON.parse(data) as InstanceHealth;
            
            // Restore Date objects
            health.lastChecked = new Date(health.lastChecked);
            
            for (const entry of health.healthHistory) {
              entry.timestamp = new Date(entry.timestamp);
            }
            
            this.instanceHealth.set(health.instanceId, health);
            
            logger.debug(`Loaded health data for instance ${health.instanceId}`);
          } catch (error) {
            logger.error(`Failed to load health data from ${file}`, error as Record<string, any>);
          }
        }
      }
      
      logger.info(`Loaded health data for ${this.instanceHealth.size} instances`);
    } catch (error) {
      logger.error('Failed to load health data', error as Record<string, any>);
    }
  }
  
  /**
   * Save health data to storage
   */
  private saveHealthData(): void {
    try {
      logger.debug(`Saving health data to ${this.storageDir}`);
      
      // Save each instance health
      for (const health of this.instanceHealth.values()) {
        this.saveInstanceHealth(health);
      }
      
      logger.debug(`Saved health data for ${this.instanceHealth.size} instances`);
    } catch (error) {
      logger.error('Failed to save health data', error as Record<string, any>);
    }
  }
  
  /**
   * Save instance health to storage
   * @param health Instance health
   */
  private saveInstanceHealth(health: InstanceHealth): void {
    try {
      const filePath = path.join(this.storageDir, `${health.instanceId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(health, null, 2), 'utf8');
    } catch (error) {
      logger.error(`Failed to save health data for instance ${health.instanceId}`, error as Record<string, any>);
    }
  }
  
  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    logger.info(`Starting health checks with interval ${this.config.healthMonitor.checkIntervalMs}ms`);
    
    // Clear existing interval
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
    }
    
    // Start new interval
    this.healthCheckIntervalId = setInterval(() => {
      this.checkAllInstancesHealth();
    }, this.config.healthMonitor.checkIntervalMs);
  }
  
  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    logger.info('Stopping health checks');
    
    // Clear interval
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = null;
    }
  }
  
  /**
   * Check health of all instances
   */
  private async checkAllInstancesHealth(): Promise<void> {
    try {
      logger.debug('Checking health of all instances');
      
      // Get all instances
      const instances = this.registry.listInstances();
      
      // Check health of each instance
      for (const instance of instances) {
        try {
          // Skip instances that are not running
          if (instance.status !== InstanceStatus.RUNNING) {
            continue;
          }
          
          await this.checkInstanceHealth(instance.id);
        } catch (error) {
          logger.error(`Failed to check health of instance ${instance.id}`, error as Record<string, any>);
        }
      }
      
      // Save health data
      this.saveHealthData();
    } catch (error) {
      logger.error('Failed to check health of all instances', error as Record<string, any>);
    }
  }
  
  /**
   * Check health of an instance
   * @param instanceId Instance ID
   */
  public async checkInstanceHealth(instanceId: string): Promise<HealthCheckResult> {
    try {
      logger.debug(`Checking health of instance ${instanceId}`);
      
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
      
      // Check if instance is running
      if (instance.status !== InstanceStatus.RUNNING) {
        const result: HealthCheckResult = {
          instanceId,
          status: HealthStatus.UNKNOWN,
          details: {
            message: `Instance is not running (status: ${instance.status})`
          },
          timestamp: new Date()
        };
        
        this.updateInstanceHealth(result);
        return result;
      }
      
      // Perform health check
      const startTime = Date.now();
      
      try {
        // Get instance from provider to check if it's still running
        const providerInstance = await provider.getInstance(instanceId);
        
        if (!providerInstance) {
          const result: HealthCheckResult = {
            instanceId,
            status: HealthStatus.UNHEALTHY,
            details: {
              message: 'Instance not found in provider'
            },
            timestamp: new Date()
          };
          
          this.updateInstanceHealth(result);
          return result;
        }
        
        if (providerInstance.status !== InstanceStatus.RUNNING) {
          const result: HealthCheckResult = {
            instanceId,
            status: HealthStatus.UNHEALTHY,
            details: {
              message: `Instance is not running in provider (status: ${providerInstance.status})`
            },
            timestamp: new Date()
          };
          
          this.updateInstanceHealth(result);
          return result;
        }
        
        // Execute a simple command to check if the instance is responsive
        const commandResult = await provider.executeCommand(instanceId, 'echo "health check"');
        
        const responseTime = Date.now() - startTime;
        
        if (commandResult.exitCode !== 0) {
          const result: HealthCheckResult = {
            instanceId,
            status: HealthStatus.UNHEALTHY,
            details: {
              message: 'Instance is not responsive',
              error: commandResult.stderr,
              responseTimeMs: responseTime
            },
            timestamp: new Date()
          };
          
          this.updateInstanceHealth(result);
          return result;
        }
        
        // Instance is healthy
        const result: HealthCheckResult = {
          instanceId,
          status: HealthStatus.HEALTHY,
          details: {
            message: 'Instance is healthy',
            responseTimeMs: responseTime
          },
          timestamp: new Date()
        };
        
        this.updateInstanceHealth(result);
        return result;
      } catch (error) {
        // Health check failed
        const result: HealthCheckResult = {
          instanceId,
          status: HealthStatus.UNHEALTHY,
          details: {
            message: 'Health check failed',
            error: `${error}`
          },
          timestamp: new Date()
        };
        
        this.updateInstanceHealth(result);
        return result;
      }
    } catch (error) {
      logger.error(`Failed to check health of instance ${instanceId}`, error as Record<string, any>);
      
      // Return unknown health status
      const result: HealthCheckResult = {
        instanceId,
        status: HealthStatus.UNKNOWN,
        details: {
          message: 'Failed to check health',
          error: `${error}`
        },
        timestamp: new Date()
      };
      
      this.updateInstanceHealth(result);
      return result;
    }
  }
  
  /**
   * Update instance health
   * @param result Health check result
   */
  private updateInstanceHealth(result: HealthCheckResult): void {
    // Get existing health or create new one
    let health = this.instanceHealth.get(result.instanceId);
    
    if (!health) {
      health = {
        instanceId: result.instanceId,
        status: result.status,
        lastChecked: result.timestamp,
        details: result.details,
        healthHistory: []
      };
    } else {
      // Update health
      health.status = result.status;
      health.lastChecked = result.timestamp;
      health.details = result.details;
    }
    
    // Add to history
    health.healthHistory.unshift({
      status: result.status,
      timestamp: result.timestamp,
      details: result.details
    });
    
    // Limit history size
    if (health.healthHistory.length > this.config.healthMonitor.historySize) {
      health.healthHistory = health.healthHistory.slice(0, this.config.healthMonitor.historySize);
    }
    
    // Save health
    this.instanceHealth.set(result.instanceId, health);
    
    // Auto-recover if enabled
    if (
      this.config.healthMonitor.autoRecover &&
      result.status === HealthStatus.UNHEALTHY
    ) {
      this.recoverInstance(result.instanceId);
    }
  }
  
  /**
   * Recover an unhealthy instance
   * @param instanceId Instance ID
   * @returns True if recovery was successful
   */
  public async recoverInstance(instanceId: string): Promise<boolean> {
    try {
      logger.info(`Attempting to recover instance ${instanceId}`);
      
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
        logger.info(`Restarting instance ${instanceId}`);
        
        // Stop instance
        await provider.stopInstance(instanceId);
        
        // Start instance
        await provider.startInstance(instanceId);
        
        logger.info(`Successfully restarted instance ${instanceId}`);
        
        // Update health
        const result: HealthCheckResult = {
          instanceId,
          status: HealthStatus.RECOVERING,
          details: {
            message: 'Instance restarted for recovery'
          },
          timestamp: new Date()
        };
        
        this.updateInstanceHealth(result);
        
        return true;
      } catch (error) {
        logger.error(`Failed to restart instance ${instanceId}`, error as Record<string, any>);
        
        // Update health
        const result: HealthCheckResult = {
          instanceId,
          status: HealthStatus.UNHEALTHY,
          details: {
            message: 'Recovery failed',
            error: `${error}`
          },
          timestamp: new Date()
        };
        
        this.updateInstanceHealth(result);
        
        return false;
      }
    } catch (error) {
      logger.error(`Failed to recover instance ${instanceId}`, error as Record<string, any>);
      return false;
    }
  }
  
  /**
   * Get instance health
   * @param instanceId Instance ID
   * @returns Instance health or null if not found
   */
  public getInstanceHealth(instanceId: string): InstanceHealth | null {
    return this.instanceHealth.get(instanceId) || null;
  }
  
  /**
   * List instance health
   * @param status Optional status filter
   * @returns Array of instance health
   */
  public listInstanceHealth(status?: HealthStatus): InstanceHealth[] {
    let healthList = Array.from(this.instanceHealth.values());
    
    // Filter by status
    if (status !== undefined) {
      healthList = healthList.filter(health => health.status === status);
    }
    
    return healthList;
  }
  
  /**
   * Dispose of health monitor resources
   */
  public dispose(): void {
    logger.info('Disposing health monitor');
    
    // Stop health checks
    this.stopHealthChecks();
    
    // Save health data
    this.saveHealthData();
  }
}