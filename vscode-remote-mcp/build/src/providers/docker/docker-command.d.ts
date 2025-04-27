/**
 * Docker command utilities
 * Provides functions for executing Docker commands
 */
import * as logger from '../../utils/logger';
/**
 * Command execution result
 */
export interface CommandResult {
    /**
     * Standard output
     */
    stdout: string;
    /**
     * Standard error
     */
    stderr: string;
}
/**
 * Docker command executor
 */
export declare class DockerCommandExecutor {
    /**
     * Logger instance
     */
    private logger;
    /**
     * Constructor
     * @param loggerInstance Logger instance
     */
    constructor(loggerInstance?: typeof logger);
    /**
     * Execute a Docker command
     * @param command Docker command
     * @returns Command output
     */
    execute(command: string): Promise<CommandResult>;
    /**
     * Check if Docker is available
     * @returns True if Docker is available
     */
    isDockerAvailable(): Promise<boolean>;
    /**
     * Get Docker version
     * @returns Docker version
     */
    getDockerVersion(): Promise<string>;
    /**
     * Check if a Docker network exists
     * @param networkName Network name
     * @returns True if network exists
     */
    networkExists(networkName: string): Promise<boolean>;
    /**
     * Create a Docker network
     * @param networkName Network name
     * @returns True if network was created
     */
    createNetwork(networkName: string): Promise<boolean>;
    /**
     * Check if a Docker container exists
     * @param containerId Container ID or name
     * @returns True if container exists
     */
    containerExists(containerId: string): Promise<boolean>;
    /**
     * Check if a Docker container is running
     * @param containerId Container ID or name
     * @returns True if container is running
     */
    isContainerRunning(containerId: string): Promise<boolean>;
}
