/**
 * Docker provider types and interfaces
 */

import { VSCodeInstance } from '../core/instance.interface';

/**
 * Docker-specific instance metadata
 */
export interface DockerInstanceMetadata {
  /**
   * Docker container ID
   */
  containerId: string;
  
  /**
   * Docker image ID
   */
  imageId: string;
  
  /**
   * Docker network ID
   */
  networkId?: string;
  
  /**
   * Docker volume ID
   */
  volumeId?: string;
  
  /**
   * Error message if any
   */
  error?: string;
}

/**
 * Docker container information
 */
export interface DockerContainerInfo {
  /**
   * Container ID
   */
  id: string;
  
  /**
   * Container name
   */
  name: string;
  
  /**
   * Container state
   */
  state: string;
  
  /**
   * Network settings
   */
  networkSettings: {
    /**
     * IP address
     */
    ipAddress: string;
    
    /**
     * Port mappings
     */
    ports: {
      /**
       * Internal port
       */
      internal: number;
      
      /**
       * External port
       */
      external: number;
      
      /**
       * Protocol
       */
      protocol: string;
    }[];
  };
  
  /**
   * Resource usage statistics
   */
  stats: {
    /**
     * CPU usage (0-1)
     */
    cpuUsage: number;
    
    /**
     * Memory usage in MB
     */
    memoryUsage: number;
  };
}

/**
 * Docker provider configuration
 */
export interface DockerProviderConfig {
  /**
   * Docker socket path
   */
  socketPath: string;
  
  /**
   * Docker API version
   */
  apiVersion: string;
  
  /**
   * Docker network name
   */
  networkName: string;
  
  /**
   * Docker volume driver
   */
  volumeDriver: string;
  
  /**
   * Docker image repository
   */
  imageRepository: string;
  
  /**
   * Docker image tag
   */
  imageTag: string;
}

/**
 * Docker instance with typed metadata
 */
export type DockerInstance = VSCodeInstance & {
  metadata: DockerInstanceMetadata;
};