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
export declare class ContainerUtils {
    /**
     * Docker command executor
     */
    private dockerExecutor;
    /**
     * Docker provider configuration
     */
    private config;
    /**
     * Logger instance
     */
    private logger;
    /**
     * Constructor
     * @param config Docker provider configuration
     * @param dockerExecutor Docker command executor
     * @param loggerInstance Logger instance
     */
    constructor(config: DockerProviderConfig, dockerExecutor: DockerCommandExecutor, loggerInstance?: typeof logger);
    /**
     * Create a Docker container
     * @param name Container name
     * @param instanceConfig Instance configuration
     * @returns Container ID
     */
    createContainer(name: string, instanceConfig: InstanceConfig): Promise<string>;
    /**
     * Start a Docker container
     * @param containerId Container ID
     * @returns True if successful
     */
    startContainer(containerId: string): Promise<boolean>;
    /**
     * Stop a Docker container
     * @param containerId Container ID
     * @param force Force stop if true
     * @returns True if successful
     */
    stopContainer(containerId: string, force?: boolean): Promise<boolean>;
    /**
     * Remove a Docker container
     * @param containerId Container ID
     * @returns True if successful
     */
    removeContainer(containerId: string): Promise<boolean>;
    /**
     * Get Docker container info
     * @param containerId Container ID
     * @returns Container info
     */
    getContainerInfo(containerId: string): Promise<DockerContainerInfo>;
    /**
     * Map Docker container status to instance status
     * @param containerStatus Container status
     * @returns Instance status
     */
    mapContainerStatusToInstanceStatus(containerStatus: string): InstanceStatus;
    /**
     * Execute a command in a container
     * @param containerId Container ID
     * @param command Command to execute
     * @returns Command output
     */
    executeCommand(containerId: string, command: string): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
    }>;
    /**
     * Get container logs
     * @param containerId Container ID
     * @param options Log options
     * @returns Container logs
     */
    getContainerLogs(containerId: string, options?: {
        lines?: number;
        since?: Date;
        follow?: boolean;
    }): Promise<string>;
}
