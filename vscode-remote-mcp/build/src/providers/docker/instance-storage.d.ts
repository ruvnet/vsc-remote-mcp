/**
 * Instance storage utilities
 * Provides functions for storing and retrieving instance data
 */
import { VSCodeInstance } from '../core/instance.interface';
import * as logger from '../../utils/logger';
/**
 * Instance storage class
 */
export declare class InstanceStorage {
    /**
     * Instance storage path
     */
    private storagePath;
    /**
     * Logger instance
     */
    private logger;
    /**
     * Constructor
     * @param storagePath Storage path
     * @param loggerInstance Logger instance
     */
    constructor(storagePath: string, loggerInstance?: typeof logger);
    /**
     * Save instance to file
     * @param instance Instance
     */
    saveInstance(instance: VSCodeInstance): Promise<void>;
    /**
     * Load instance from file
     * @param instanceId Instance ID
     * @returns Instance or null if not found
     */
    loadInstance(instanceId: string): Promise<VSCodeInstance | null>;
    /**
     * Delete instance file
     * @param instanceId Instance ID
     * @returns True if successful
     */
    deleteInstance(instanceId: string): Promise<boolean>;
    /**
     * List all instance IDs
     * @returns Array of instance IDs
     */
    listInstanceIds(): Promise<string[]>;
    /**
     * Load all instances
     * @returns Array of instances
     */
    loadAllInstances(): Promise<VSCodeInstance[]>;
    /**
     * Check if instance exists
     * @param instanceId Instance ID
     * @returns True if instance exists
     */
    instanceExists(instanceId: string): Promise<boolean>;
}
