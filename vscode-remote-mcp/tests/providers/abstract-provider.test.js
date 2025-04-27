/**
 * Abstract provider tests
 */

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock provider types
const ProviderType = {
  DOCKER: 'docker',
  FLY: 'fly',
  TEST: 'test'
};

// Mock instance status
const InstanceStatus = {
  CREATING: 'creating',
  RUNNING: 'running',
  STOPPED: 'stopped',
  FAILED: 'failed',
  DELETED: 'deleted'
};

// Mock modules
jest.mock('../../src/utils/logger', () => mockLogger);
jest.mock('../../src/providers/core/provider-types', () => ({
  ProviderType,
  InstanceStatus
}));

// Import after mocking
const { AbstractProvider } = require('../../src/providers/core/abstract-provider');

// Create a concrete implementation of AbstractProvider for testing
class TestProvider extends AbstractProvider {
  constructor(config) {
    super(ProviderType.TEST, config);
  }
  
  async createInstance(config) {
    return this.createBaseInstance('test-id', config.name, 'provider-id', config);
  }
  
  async getInstance(instanceId) {
    return null;
  }
  
  async listInstances(filter) {
    return [];
  }
  
  async startInstance(instanceId) {
    throw new Error('Not implemented');
  }
  
  async stopInstance(instanceId, force) {
    throw new Error('Not implemented');
  }
  
  async deleteInstance(instanceId) {
    throw new Error('Not implemented');
  }
  
  async updateInstance(instanceId, config) {
    throw new Error('Not implemented');
  }
  
  async getInstanceLogs(instanceId, options) {
    throw new Error('Not implemented');
  }
  
  async executeCommand(instanceId, command) {
    throw new Error('Not implemented');
  }
  
  getCapabilities() {
    return {
      supportsLiveResize: false,
      supportsSnapshotting: false,
      supportsMultiRegion: false,
      maxInstancesPerUser: 5,
      maxResourcesPerInstance: {
        cpu: {
          cores: 2
        },
        memory: {
          min: 512,
          max: 2048
        },
        storage: {
          size: 5,
          persistent: true
        }
      }
    };
  }
}

describe('AbstractProvider', () => {
  let provider;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create provider
    provider = new TestProvider({
      type: ProviderType.TEST,
      name: 'test',
      region: 'local',
      specific: {
        testOption: 'value'
      }
    });
  });
  
  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      // Verify
      expect(provider.type).toBe(ProviderType.TEST);
      expect(provider.name).toBe('test');
      expect(provider.region).toBe('local');
      expect(provider.config).toEqual({
        type: ProviderType.TEST,
        name: 'test',
        region: 'local',
        specific: {
          testOption: 'value'
        }
      });
      expect(provider.logger).toBe(mockLogger);
    });
    
    it('should throw an error if type is invalid', () => {
      // Execute & Verify
      expect(() => new TestProvider({
        type: 'invalid',
        name: 'test',
        region: 'local'
      })).toThrow('Invalid provider type: invalid');
    });
    
    it('should throw an error if name is missing', () => {
      // Execute & Verify
      expect(() => new TestProvider({
        type: ProviderType.TEST,
        region: 'local'
      })).toThrow('Invalid provider config: missing name');
    });
    
    it('should throw an error if region is missing', () => {
      // Execute & Verify
      expect(() => new TestProvider({
        type: ProviderType.TEST,
        name: 'test'
      })).toThrow('Invalid provider config: missing region');
    });
  });
  
  describe('initialize', () => {
    it('should initialize the provider', async () => {
      // Execute
      await provider.initialize();
      
      // Verify
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing provider: test');
    });
  });
  
  describe('validateInstanceConfig', () => {
    it('should validate a valid instance config', () => {
      // Setup
      const config = {
        name: 'test-instance',
        workspacePath: '/path/to/workspace',
        resources: {
          cpu: {
            cores: 1
          },
          memory: {
            min: 512,
            max: 1024
          },
          storage: {
            size: 1,
            persistent: true
          }
        },
        network: {
          port: 8080
        }
      };
      
      // Execute
      provider.validateInstanceConfig(config);
      
      // No error should be thrown
    });
    
    it('should throw an error if name is missing', () => {
      // Setup
      const config = {
        workspacePath: '/path/to/workspace',
        resources: {
          cpu: {
            cores: 1
          },
          memory: {
            min: 512,
            max: 1024
          },
          storage: {
            size: 1,
            persistent: true
          }
        }
      };
      
      // Execute & Verify
      expect(() => provider.validateInstanceConfig(config)).toThrow('Invalid instance config: missing name');
    });
    
    it('should throw an error if workspacePath is missing', () => {
      // Setup
      const config = {
        name: 'test-instance',
        resources: {
          cpu: {
            cores: 1
          },
          memory: {
            min: 512,
            max: 1024
          },
          storage: {
            size: 1,
            persistent: true
          }
        }
      };
      
      // Execute & Verify
      expect(() => provider.validateInstanceConfig(config)).toThrow('Invalid instance config: missing workspacePath');
    });
    
    it('should throw an error if resources exceed capabilities', () => {
      // Setup
      const config = {
        name: 'test-instance',
        workspacePath: '/path/to/workspace',
        resources: {
          cpu: {
            cores: 4 // Exceeds max of 2
          },
          memory: {
            min: 512,
            max: 4096 // Exceeds max of 2048
          },
          storage: {
            size: 10, // Exceeds max of 5
            persistent: true
          }
        }
      };
      
      // Execute & Verify
      expect(() => provider.validateInstanceConfig(config)).toThrow('Invalid instance config: CPU cores exceed maximum');
    });
  });
  
  describe('createBaseInstance', () => {
    it('should create a base instance with correct properties', () => {
      // Setup
      const instanceId = 'test-id';
      const name = 'test-instance';
      const providerInstanceId = 'provider-id';
      const config = {
        name: 'test-instance',
        workspacePath: '/path/to/workspace',
        resources: {
          cpu: {
            cores: 1
          },
          memory: {
            min: 512,
            max: 1024
          },
          storage: {
            size: 1,
            persistent: true
          }
        },
        network: {
          port: 8080
        },
        env: {
          TEST_ENV: 'test'
        },
        auth: {
          type: 'password',
          credentials: 'password123'
        }
      };
      
      // Execute
      const instance = provider.createBaseInstance(instanceId, name, providerInstanceId, config);
      
      // Verify
      expect(instance).toEqual({
        id: instanceId,
        name,
        type: ProviderType.TEST,
        providerName: 'test',
        providerRegion: 'local',
        providerInstanceId,
        status: InstanceStatus.CREATING,
        config,
        resources: {
          cpu: {
            cores: 1,
            used: 0
          },
          memory: {
            min: 512,
            max: 1024,
            used: 0
          },
          storage: {
            size: 1,
            persistent: true,
            used: 0
          }
        },
        network: {
          internalIp: '',
          externalIp: 'localhost',
          port: 8080,
          ports: [],
          urls: []
        },
        metadata: {},
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });
  
  describe('createInstance', () => {
    it('should create an instance with base properties', async () => {
      // Setup
      const config = {
        name: 'test-instance',
        workspacePath: '/path/to/workspace',
        resources: {
          cpu: {
            cores: 1
          },
          memory: {
            min: 512,
            max: 1024
          },
          storage: {
            size: 1,
            persistent: true
          }
        }
      };
      
      // Execute
      const instance = await provider.createInstance(config);
      
      // Verify
      expect(instance).toEqual({
        id: 'test-id',
        name: 'test-instance',
        type: ProviderType.TEST,
        providerName: 'test',
        providerRegion: 'local',
        providerInstanceId: 'provider-id',
        status: InstanceStatus.CREATING,
        config,
        resources: {
          cpu: {
            cores: 1,
            used: 0
          },
          memory: {
            min: 512,
            max: 1024,
            used: 0
          },
          storage: {
            size: 1,
            persistent: true,
            used: 0
          }
        },
        network: {
          internalIp: '',
          externalIp: 'localhost',
          ports: [],
          urls: []
        },
        metadata: {},
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });
});