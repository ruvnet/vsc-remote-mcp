/**
 * Instance storage utilities
 * Provides functions for storing and retrieving instance data
 */

import * as fs from 'fs';
import * as path from 'path';
import { VSCodeInstance } from '../core/instance.interface';
import * as logger from '../../utils/logger';

/**
 * Instance storage class
 */
export class InstanceStorage {
  /**
   * Instance storage path
   */
  private storagePath: string;
  
  /**
   * Logger instance
   */
  private logger: typeof logger;
  
  /**
   * Constructor
   * @param storagePath Storage path
   * @param loggerInstance Logger instance
   */
  constructor(storagePath: string, loggerInstance: typeof logger = logger) {
    this.storagePath = storagePath;
    this.logger = loggerInstance;
    
    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }
  
  /**
   * Save instance to file
   * @param instance Instance
   */
  public async saveInstance(instance: VSCodeInstance): Promise<void> {
    const filePath = path.join(this.storagePath, `${instance.id}.json`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(instance, null, 2));
      this.logger.debug(`Instance saved: ${instance.id}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to save instance: ${err.message}`);
      throw new Error(`Failed to save instance: ${err.message}`);
    }
  }
  
  /**
   * Load instance from file
   * @param instanceId Instance ID
   * @returns Instance or null if not found
   */
  public async loadInstance(instanceId: string): Promise<VSCodeInstance | null> {
    const filePath = path.join(this.storagePath, `${instanceId}.json`);
    
    if (!fs.existsSync(filePath)) {
      this.logger.debug(`Instance not found: ${instanceId}`);
      return null;
    }
    
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const instance = JSON.parse(data) as VSCodeInstance;
      
      // Convert date strings to Date objects
      instance.createdAt = new Date(instance.createdAt);
      instance.updatedAt = new Date(instance.updatedAt);
      
      this.logger.debug(`Instance loaded: ${instanceId}`);
      return instance;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to load instance: ${err.message}`);
      return null;
    }
  }
  
  /**
   * Delete instance file
   * @param instanceId Instance ID
   * @returns True if successful
   */
  public async deleteInstance(instanceId: string): Promise<boolean> {
    const filePath = path.join(this.storagePath, `${instanceId}.json`);
    
    if (!fs.existsSync(filePath)) {
      this.logger.debug(`Instance not found for deletion: ${instanceId}`);
      return false;
    }
    
    try {
      fs.unlinkSync(filePath);
      this.logger.debug(`Instance deleted: ${instanceId}`);
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to delete instance: ${err.message}`);
      return false;
    }
  }
  
  /**
   * List all instance IDs
   * @returns Array of instance IDs
   */
  public async listInstanceIds(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.storagePath);
      const instanceIds = files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
      
      return instanceIds;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to list instances: ${err.message}`);
      return [];
    }
  }
  
  /**
   * Load all instances
   * @returns Array of instances
   */
  public async loadAllInstances(): Promise<VSCodeInstance[]> {
    const instanceIds = await this.listInstanceIds();
    const instances: VSCodeInstance[] = [];
    
    for (const id of instanceIds) {
      const instance = await this.loadInstance(id);
      
      if (instance) {
        instances.push(instance);
      }
    }
    
    return instances;
  }
  
  /**
   * Check if instance exists
   * @param instanceId Instance ID
   * @returns True if instance exists
   */
  public async instanceExists(instanceId: string): Promise<boolean> {
    const filePath = path.join(this.storagePath, `${instanceId}.json`);
    return fs.existsSync(filePath);
  }
}