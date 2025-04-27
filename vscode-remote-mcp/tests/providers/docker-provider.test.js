/**
 * Docker provider tests
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock Docker command executor
const mockDockerExecutor = {
  execute: jest.fn(),
  isDockerAvailable: jest.fn(),
  networkExists: jest.fn(),
  createNetwork: jest.fn()
};

// Mock container utils
const mockContainerUtils = {
  createContainer: jest.fn(),
  startContainer: jest.fn(),
  stopContainer: jest.fn(),
  removeContainer: jest.fn(),
  getContainerInfo: jest.fn(),
  mapContainerStatusToInstanceStatus: jest.fn(),
  executeCommand: jest.fn(),
  getContainerLogs: jest.fn()
};

// Mock instance storage
const mockInstanceStorage = {
  saveInstance: jest.fn(),
  loadInstance: jest.fn(),
  deleteInstance: jest.fn(),
  listInstanceIds: jest.fn(),
  loadAllInstances: jest.fn(),
  instanceExists: jest.fn()
};

// Mock log parser
const mockLogParser = {
  parseDockerLogs: jest.fn(),
  formatInstanceLogs: jest.fn()
};

// Mock modules
jest.mock('../../src/utils/logger', () => mockLogger);
jest.mock('../../src/providers/docker/docker-command', () => ({
  DockerCommandExecutor: jest.fn().mockImplementation(() => mockDockerExecutor)
}));
jest.mock('../../src/providers/docker/container-utils', () => ({
  ContainerUtils: jest.fn().mockImplementation(() => mockContainerUtils)
}));
jest.mock('../../src/providers/docker/instance-storage', () => ({
  InstanceStorage: jest.fn().mockImplementation(() => mockInstanceStorage)
}));
jest.mock('../../src/providers/docker/log-parser', () => ({
  DockerLogParser: jest.fn().mockImplementation(() => mockLogParser)
}));

// Import after mocking
const { DockerProvider } = require('../../src/providers/docker/docker-provider');
const { ProviderType, InstanceStatus } = require('../../src/providers/core/provider-types');

describe('DockerProvider', () => {
  let provider;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create provider
    provider = new DockerProvider({
      type: ProviderType.DOCKER,
      name: 'docker',
      region: 'local',
      specific: {
        socketPath: '/var/run/docker.sock',
        apiVersion: '1.41',
        networkName: 'vscode-remote-network',
        volumeDriver: 'local',
        imageRepository: 'codercom/code-server',
        imageTag: 'latest'
      }
    });
  });
  
  describe('initialize', () => {
    it('should initialize the provider', async () => {
      // Setup
      mockDockerExecutor.isDockerAvailable.mockResolvedValue(true);
      mockDockerExecutor.networkExists.mockResolvedValue(false);
      mockDockerExecutor.createNetwork.mockResolvedValue();
      
      // Execute
      await provider.initialize();
      
      // Verify
      expect(mockDockerExecutor.isDockerAvailable).toHaveBeenCalled();
      expect(mockDockerExecutor.networkExists).toHaveBeenCalledWith('vscode-remote-network');
      expect(mockDockerExecutor.createNetwork).toHaveBeenCalledWith('vscode-remote-network');
    });
    
    it('should throw an error if Docker is not available', async () => {
      // Setup
      mockDockerExecutor.isDockerAvailable.mockResolvedValue(false);
      
      // Execute & Verify
      await expect(provider.initialize()).rejects.toThrow('Docker is not available');
    });
    
    it('should not create network if it already exists', async () => {
      // Setup
      mockDockerExecutor.isDockerAvailable.mockResolvedValue(true);
      mockDockerExecutor.networkExists.mockResolvedValue(true);
      
      // Execute
      await provider.initialize();
      
      // Verify
      expect(mockDockerExecutor.createNetwork).not.toHaveBeenCalled();
    });
  });
  
  describe('getCapabilities', () => {
    it('should return provider capabilities', () => {
      // Execute
      const capabilities = provider.getCapabilities();
      
      // Verify
      expect(capabilities).toEqual({
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
      });
    });
  });
  
  describe('createInstance', () => {
    it('should create a new instance', async () => {
      // Setup
      const instanceConfig = {
        name: 'test-instance',
        workspacePath: '/path/to/workspace',
        resources: {
          cpu: {
            cores: 2
          },
          memory: {
            min: 1024,
            max: 2048
          },
          storage: {
            size: 5,
            persistent: true
          }
        },
        network: {
          port: 8080
        },
        env: {
          TEST_ENV: 'test'
        }
      };
      
      const containerId = 'container-123';
      const containerInfo = {
        id: containerId,
        name: 'test-instance',
        state: 'running',
        networkSettings: {
          ipAddress: '172.17.0.2',
          ports: [
            {
              internal: 8080,
              external: 49152,
              protocol: 'tcp'
            }
          ]
        },
        stats: {
          cpuUsage: 0.1,
          memoryUsage: 512
        }
      };
      
      mockContainerUtils.createContainer.mockResolvedValue(containerId);
      mockContainerUtils.startContainer.mockResolvedValue(true);
      mockContainerUtils.getContainerInfo.mockResolvedValue(containerInfo);
      mockInstanceStorage.saveInstance.mockResolvedValue();
      
      // Execute
      const instance = await provider.createInstance(instanceConfig);
      
      // Verify
      expect(mockContainerUtils.createContainer).toHaveBeenCalledWith(instance.name, instanceConfig);
      expect(mockContainerUtils.startContainer).toHaveBeenCalledWith(containerId);
      expect(mockContainerUtils.getContainerInfo).toHaveBeenCalledWith(containerId);
      expect(mockInstanceStorage.saveInstance).toHaveBeenCalledWith(instance);
      
      expect(instance).toMatchObject({
        name: 'test-instance',
        status: InstanceStatus.RUNNING,
        config: instanceConfig,
        metadata: {
          containerId,
          imageId: 'codercom/code-server:latest'
        },
        network: {
          internalIp: '172.17.0.2',
          ports: [
            {
              internal: 8080,
              external: 49152,
              protocol: 'tcp'
            }
          ],
          urls: [
            'http://localhost:49152'
          ]
        }
      });
    });
    
    it('should handle errors during instance creation', async () => {
      // Setup
      const instanceConfig = {
        name: 'test-instance',
        workspacePath: '/path/to/workspace',
        resources: {
          cpu: {
            cores: 2
          },
          memory: {
            min: 1024,
            max: 2048
          },
          storage: {
            size: 5,
            persistent: true
          }
        },
        network: {
          port: 8080
        }
      };
      
      const error = new Error('Failed to create container');
      mockContainerUtils.createContainer.mockRejectedValue(error);
      mockInstanceStorage.saveInstance.mockResolvedValue();
      
      // Execute & Verify
      await expect(provider.createInstance(instanceConfig)).rejects.toThrow('Failed to create Docker instance: Failed to create container');
      
      // Verify instance was saved with failed status
      expect(mockInstanceStorage.saveInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InstanceStatus.FAILED,
          metadata: expect.objectContaining({
            error: 'Failed to create container'
          })
        })
      );
    });
  });
  
  describe('getInstance', () => {
    it('should get an instance by ID', async () => {
      // Setup
      const instanceId = 'instance-123';
      const instance = {
        id: instanceId,
        name: 'test-instance',
        status: InstanceStatus.RUNNING,
        metadata: {
          containerId: 'container-123'
        },
        network: {
          internalIp: '',
          ports: []
        },
        resources: {
          cpu: {
            used: 0
          },
          memory: {
            used: 0
          }
        },
        updatedAt: new Date()
      };
      
      const containerInfo = {
        id: 'container-123',
        name: 'test-instance',
        state: 'running',
        networkSettings: {
          ipAddress: '172.17.0.2',
          ports: [
            {
              internal: 8080,
              external: 49152,
              protocol: 'tcp'
            }
          ]
        },
        stats: {
          cpuUsage: 0.1,
          memoryUsage: 512
        }
      };
      
      mockInstanceStorage.loadInstance.mockResolvedValue(instance);
      mockContainerUtils.getContainerInfo.mockResolvedValue(containerInfo);
      mockContainerUtils.mapContainerStatusToInstanceStatus.mockReturnValue(InstanceStatus.RUNNING);
      mockInstanceStorage.saveInstance.mockResolvedValue();
      
      // Execute
      const result = await provider.getInstance(instanceId);
      
      // Verify
      expect(mockInstanceStorage.loadInstance).toHaveBeenCalledWith(instanceId);
      expect(mockContainerUtils.getContainerInfo).toHaveBeenCalledWith('container-123');
      expect(mockContainerUtils.mapContainerStatusToInstanceStatus).toHaveBeenCalledWith('running');
      expect(mockInstanceStorage.saveInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          id: instanceId,
          status: InstanceStatus.RUNNING,
          network: {
            internalIp: '172.17.0.2',
            ports: [
              {
                internal: 8080,
                external: 49152,
                protocol: 'tcp'
              }
            ]
          },
          resources: {
            cpu: {
              used: 0.1
            },
            memory: {
              used: 512
            }
          }
        })
      );
      
      expect(result).toEqual(
        expect.objectContaining({
          id: instanceId,
          status: InstanceStatus.RUNNING
        })
      );
    });
    
    it('should return null if instance not found', async () => {
      // Setup
      const instanceId = 'instance-123';
      mockInstanceStorage.loadInstance.mockResolvedValue(null);
      
      // Execute
      const result = await provider.getInstance(instanceId);
      
      // Verify
      expect(result).toBeNull();
    });
    
    it('should handle container not found', async () => {
      // Setup
      const instanceId = 'instance-123';
      const instance = {
        id: instanceId,
        name: 'test-instance',
        status: InstanceStatus.RUNNING,
        metadata: {
          containerId: 'container-123'
        },
        network: {
          internalIp: '',
          ports: []
        },
        resources: {
          cpu: {
            used: 0
          },
          memory: {
            used: 0
          }
        },
        updatedAt: new Date()
      };
      
      mockInstanceStorage.loadInstance.mockResolvedValue(instance);
      mockContainerUtils.getContainerInfo.mockRejectedValue(new Error('Container not found'));
      mockInstanceStorage.saveInstance.mockResolvedValue();
      
      // Execute
      const result = await provider.getInstance(instanceId);
      
      // Verify
      expect(mockInstanceStorage.saveInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          id: instanceId,
          status: InstanceStatus.FAILED
        })
      );
      
      expect(result).toEqual(
        expect.objectContaining({
          id: instanceId,
          status: InstanceStatus.FAILED
        })
      );
    });
  });
  
  // Add more tests for other methods as needed
});