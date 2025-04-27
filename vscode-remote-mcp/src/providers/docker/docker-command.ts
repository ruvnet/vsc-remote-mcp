/**
 * Docker command utilities
 * Provides functions for executing Docker commands
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as logger from '../../utils/logger';

// Promisify exec
const execAsync = promisify(exec);

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
export class DockerCommandExecutor {
  /**
   * Logger instance
   */
  private logger: typeof logger;
  
  /**
   * Constructor
   * @param loggerInstance Logger instance
   */
  constructor(loggerInstance: typeof logger = logger) {
    this.logger = loggerInstance;
  }
  
  /**
   * Execute a Docker command
   * @param command Docker command
   * @returns Command output
   */
  public async execute(command: string): Promise<CommandResult> {
    this.logger.debug(`Executing Docker command: ${command}`);
    
    try {
      const result = await execAsync(`docker ${command}`);
      return result;
    } catch (error) {
      const err = error as Error & { stdout?: string; stderr?: string };
      this.logger.error(`Docker command failed: ${err.message}`);
      
      // Return stdout and stderr even if command fails
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || err.message
      };
    }
  }
  
  /**
   * Check if Docker is available
   * @returns True if Docker is available
   */
  public async isDockerAvailable(): Promise<boolean> {
    try {
      await this.execute('version --format "{{.Server.Version}}"');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get Docker version
   * @returns Docker version
   */
  public async getDockerVersion(): Promise<string> {
    const { stdout } = await this.execute('version --format "{{.Server.Version}}"');
    return stdout.trim();
  }
  
  /**
   * Check if a Docker network exists
   * @param networkName Network name
   * @returns True if network exists
   */
  public async networkExists(networkName: string): Promise<boolean> {
    try {
      await this.execute(`network inspect ${networkName}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Create a Docker network
   * @param networkName Network name
   * @returns True if network was created
   */
  public async createNetwork(networkName: string): Promise<boolean> {
    try {
      await this.execute(`network create ${networkName}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Check if a Docker container exists
   * @param containerId Container ID or name
   * @returns True if container exists
   */
  public async containerExists(containerId: string): Promise<boolean> {
    try {
      await this.execute(`container inspect ${containerId}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Check if a Docker container is running
   * @param containerId Container ID or name
   * @returns True if container is running
   */
  public async isContainerRunning(containerId: string): Promise<boolean> {
    try {
      const { stdout } = await this.execute(`container inspect -f '{{.State.Running}}' ${containerId}`);
      return stdout.trim() === 'true';
    } catch (error) {
      return false;
    }
  }
}