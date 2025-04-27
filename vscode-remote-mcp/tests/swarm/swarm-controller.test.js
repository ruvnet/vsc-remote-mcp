/**
 * Unit tests for the Swarm Controller
 */

const { SwarmController } = require('../../src/swarm/swarm-controller');
const { InstanceRegistry } = require('../../src/swarm/instance-registry');
const { HealthMonitor } = require('../../src/swarm/health-monitor');
const { MigrationManager } = require('../../src/swarm/migration-manager');
const { ProviderFactory } = require('../../src/providers/core/provider-factory');
const { ProviderType, InstanceStatus } = require('../../src/providers/core/provider-types');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Mock the provider factory
jest.mock('../../src/providers/core/provider-factory', () => ({
  ProviderFactory: {
    createProvider: jest.fn()
  }
}));

// Mock the instance registry
jest.mock('../../src/swarm/instance-registry', () => {
  return {
    InstanceRegistry: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      registerInstance: jest.fn(),
      updateInstance: jest.fn(),
      removeInstance: jest.fn(),
      getInstance: jest.fn(),
      listInstances: jest.fn().mockReturnValue([]),
      getInstanceCount: jest.fn().mockReturnValue(0),
      dispose: jest.fn()
    }))
  };
});

// Mock the health monitor
jest.mock('../../src/swarm/health-monitor', () => {
  return {
    HealthMonitor: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      checkInstanceHealth: jest.fn().mockResolvedValue({
        instanceId: 'test-instance',
        status: 'healthy',
        lastChecked: new Date(),
        details: { message: 'Instance is healthy' },
        healthHistory: []
      }),
      recoverInstance: jest.fn().mockResolvedValue(true),
      dispose: jest.fn()
    }))
  };
});

// Mock the migration manager
jest.mock('../../src/swarm/migration-manager', () => {
  return {
    MigrationManager: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      createMigrationPlan: jest.fn().mockResolvedValue({
        id: 'test-migration',
        sourceInstanceId: 'test-instance',
        sourceProviderType: 'docker',
        targetProviderType: 'flyio',
        strategy: 'stop_and_recreate',
        keepSource: false,
        startTarget: true,
        timeoutSeconds: 300,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        steps: [],
        currentStepIndex: 0,
        status: 'pending'
      }),
      startMigration: jest.fn().mockResolvedValue({
        plan: {
          id: 'test-migration',
          status: 'completed'
        },
        success: true
      }),
      cancelMigration: jest.fn().mockResolvedValue(true),
      getMigrationPlan: jest.fn(),
      listMigrationPlans: jest.fn().mockReturnValue([]),
      dispose: jest.fn()
    }))
  };
});

// Mock provider
const mockProvider = {
  type: ProviderType.DOCKER,
  getCapabilities: jest.fn().mockReturnValue({
    supportsLiveResize: true,
    supportsSnapshotting: true,
    supportsMultiRegion: false,
    maxInstancesPerUser: 10,
    maxResourcesPerInstance: {
      cpu: { cores: 4 },
      memory: { min: 1024, max: 8192 }
    }
  }),
  initialize: jest.fn().mockResolvedValue(undefined),
  createInstance: jest.fn().mockImplementation((config) => {
    const instance = {
      id: `test-instance-${Date.now()}`,
      name: config.name,
      providerType: ProviderType.DOCKER,
      providerInstanceId: `docker-instance-${Date.now()}`,
      status: InstanceStatus.RUNNING,
      config,
      network: {
        internalIp: '172.17.0.2',
        externalIp: 'localhost',
        ports: [
          { internal: 8080, external: 8080, protocol: 'tcp' }
        ],
        urls: ['http://localhost:8080']
      },
      resources: {
        cpu: { used: 0.1, limit: 2 },
        memory: { used: 512, limit: 2048 }
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return Promise.resolve(instance);
  }),
  getInstance: jest.fn().mockImplementation((instanceId) => {
    if (instanceId === 'non-existent-instance') {
      return Promise.resolve(null);
    }
    
    const instance = {
      id: instanceId,
      name: 'test-instance',
      providerType: ProviderType.DOCKER,
      providerInstanceId: `docker-instance-${instanceId}`,
      status: InstanceStatus.RUNNING,
      config: {},
      network: {
        internalIp: '172.17.0.2',
        externalIp: 'localhost',
        ports: [
          { internal: 8080, external: 8080, protocol: 'tcp' }
        ],
        urls: ['http://localhost:8080']
      },
      resources: {
        cpu: { used: 0.1, limit: 2 },
        memory: { used: 512, limit: 2048 }
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return Promise.resolve(instance);
  }),
  startInstance: jest.fn().mockResolvedValue({
    id: 'test-instance',
    providerInstanceId: 'docker-instance-test-instance',
    name: 'test-instance',
    providerType: ProviderType.DOCKER,
    status: InstanceStatus.RUNNING,
    config: {},
    network: {},
    resources: {},
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  stopInstance: jest.fn().mockResolvedValue({
    id: 'test-instance',
    providerInstanceId: 'docker-instance-test-instance',
    name: 'test-instance',
    providerType: ProviderType.DOCKER,
    status: InstanceStatus.STOPPED,
    config: {},
    network: {},
    resources: {},
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  deleteInstance: jest.fn().mockResolvedValue(true),
  updateInstance: jest.fn().mockResolvedValue({
    id: 'test-instance',
    providerInstanceId: 'docker-instance-test-instance',
    name: 'test-instance',
    providerType: ProviderType.DOCKER,
    status: InstanceStatus.RUNNING,
    config: {},
    network: {},
    resources: {},
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

// Test configuration
const testConfig = {
  general: {
    stateDir: path.join(os.tmpdir(), 'vscode-remote-swarm-test'),
    defaultProviderType: ProviderType.DOCKER,
    loadStateOnStartup: false,
    autoSaveIntervalMs: 0
  },
  providers: [
    {
      type: ProviderType.DOCKER,
      enabled: true,
      config: {}
    }
  ],
  healthMonitor: {
    enabled: true,
    checkIntervalMs: 0,
    autoRecover: false,
    maxRecoveryAttempts: 3,
    historySize: 10,
    recoveryActions: {
      restart: true,
      recreate: false,
      migrate: false
    }
  },
  migration: {
    enabled: true,
    defaultStrategy: 'stop_and_recreate',
    timeoutMs: 300000
  }
};

describe('SwarmController', () => {
  let swarmController;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test directory
    if (!fs.existsSync(testConfig.general.stateDir)) {
      fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
    }
    
    // Mock provider factory
    ProviderFactory.createProvider.mockReturnValue(mockProvider);
    
    // Create swarm controller
    swarmController = new SwarmController(testConfig);
  });
  
  afterEach(() => {
    // Clean up
    swarmController.dispose();
    
    // Remove test directory
    if (fs.existsSync(testConfig.general.stateDir)) {
      fs.rmSync(testConfig.general.stateDir, { recursive: true, force: true });
    }
  });
  
  describe('initialize', () => {
    it('should initialize the swarm controller', async () => {
      await swarmController.initialize();
      
      expect(ProviderFactory.createProvider).toHaveBeenCalledTimes(1);
      expect(mockProvider.initialize).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('createInstance', () => {
    beforeEach(async () => {
      await swarmController.initialize();
    });
    
    it('should create a new instance', async () => {
      const config = {
        name: 'test-instance',
        image: 'vscode:latest',
        workspacePath: '/workspace',
        resources: {
          cpu: { cores: 2 },
          memory: { min: 2048 }
        },
        network: {},
        env: {},
        extensions: []
      };
      
      const instance = await swarmController.createInstance(config);
      
      expect(instance).toBeDefined();
      expect(instance.name).toBe('test-instance');
      expect(instance.providerType).toBe(ProviderType.DOCKER);
      expect(instance.status).toBe(InstanceStatus.RUNNING);
      
      expect(mockProvider.createInstance).toHaveBeenCalledWith(config);
      expect(InstanceRegistry.prototype.registerInstance).toHaveBeenCalledWith(instance);
    });
  });
  
  describe('getInstance', () => {
    beforeEach(async () => {
      await swarmController.initialize();
      
      // Mock registry getInstance
      InstanceRegistry.prototype.getInstance.mockImplementation((instanceId) => {
        if (instanceId === 'non-existent-instance') {
          return null;
        }
        
        return {
          id: instanceId,
          name: 'test-instance',
          providerType: ProviderType.DOCKER,
          providerInstanceId: `docker-instance-${instanceId}`,
          status: InstanceStatus.RUNNING,
          config: {},
          network: {},
          resources: {},
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
    });
    
    it('should get an instance by ID', async () => {
      const instance = await swarmController.getInstance('test-instance');
      
      expect(instance).toBeDefined();
      expect(instance.id).toBe('test-instance');
      expect(instance.providerType).toBe(ProviderType.DOCKER);
      
      expect(InstanceRegistry.prototype.getInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.getInstance).toHaveBeenCalledWith('test-instance');
    });
    
    it('should return null if instance is not found', async () => {
      const instance = await swarmController.getInstance('non-existent-instance');
      
      expect(instance).toBeNull();
      
      expect(InstanceRegistry.prototype.getInstance).toHaveBeenCalledWith('non-existent-instance');
      expect(mockProvider.getInstance).not.toHaveBeenCalled();
    });
  });

  describe('listInstances', () => {
    // Sample test instances with different properties for filtering tests
    const testInstances = [
      {
        id: 'instance-1',
        name: 'dev-instance',
        providerInstanceId: 'docker-instance-1',
        providerType: ProviderType.DOCKER,
        status: InstanceStatus.RUNNING,
        config: {},
        network: {},
        resources: {},
        metadata: { environment: 'development', owner: 'user1' },
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date()
      },
      {
        id: 'instance-2',
        name: 'prod-instance',
        providerInstanceId: 'docker-instance-2',
        providerType: ProviderType.DOCKER,
        status: InstanceStatus.RUNNING,
        config: {},
        network: {},
        resources: {},
        metadata: { environment: 'production', owner: 'user2' },
        createdAt: new Date('2025-02-01T00:00:00Z'),
        updatedAt: new Date()
      },
      {
        id: 'instance-3',
        name: 'test-instance',
        providerInstanceId: 'docker-instance-3',
        providerType: ProviderType.DOCKER,
        status: InstanceStatus.STOPPED,
        config: {},
        network: {},
        resources: {},
        metadata: { environment: 'testing', owner: 'user1' },
        createdAt: new Date('2025-03-01T00:00:00Z'),
        updatedAt: new Date()
      },
      {
        id: 'instance-4',
        name: 'staging-instance',
        providerInstanceId: 'flyio-instance-1',
        providerType: ProviderType.FLYIO,
        status: InstanceStatus.FAILED,
        config: {},
        network: {},
        resources: {},
        metadata: { environment: 'staging', owner: 'user3' },
        createdAt: new Date('2025-04-01T00:00:00Z'),
        updatedAt: new Date()
      }
    ];

    beforeEach(async () => {
      await swarmController.initialize();
      
      // Mock registry listInstances to return our test instances
      InstanceRegistry.prototype.listInstances.mockReturnValue([...testInstances]);
    });

    it('should list all instances when no filter is provided', async () => {
      const instances = await swarmController.listInstances();
      
      expect(instances).toHaveLength(4);
      expect(instances).toEqual(expect.arrayContaining(testInstances));
      expect(InstanceRegistry.prototype.listInstances).toHaveBeenCalled();
    });

    it('should filter instances by status (single value)', async () => {
      const instances = await swarmController.listInstances({ status: InstanceStatus.RUNNING });
      
      expect(instances).toHaveLength(2);
      expect(instances[0].id).toBe('instance-1');
      expect(instances[1].id).toBe('instance-2');
      expect(instances.every(i => i.status === InstanceStatus.RUNNING)).toBe(true);
    });

    it('should filter instances by status (multiple values)', async () => {
      const instances = await swarmController.listInstances({
        status: [InstanceStatus.RUNNING, InstanceStatus.FAILED]
      });
      
      expect(instances).toHaveLength(3);
      expect(instances.some(i => i.id === 'instance-1')).toBe(true);
      expect(instances.some(i => i.id === 'instance-2')).toBe(true);
      expect(instances.some(i => i.id === 'instance-4')).toBe(true);
      expect(instances.every(i =>
        i.status === InstanceStatus.RUNNING || i.status === InstanceStatus.FAILED
      )).toBe(true);
    });

    it('should filter instances by name pattern', async () => {
      const instances = await swarmController.listInstances({ namePattern: 'test' });
      
      expect(instances).toHaveLength(1);
      expect(instances[0].id).toBe('instance-3');
      expect(instances[0].name).toBe('test-instance');
    });

    it('should filter instances by creation date range (createdAfter)', async () => {
      const instances = await swarmController.listInstances({
        createdAfter: new Date('2025-02-15T00:00:00Z')
      });
      
      expect(instances).toHaveLength(2);
      expect(instances[0].id).toBe('instance-3');
      expect(instances[1].id).toBe('instance-4');
    });

    it('should filter instances by creation date range (createdBefore)', async () => {
      const instances = await swarmController.listInstances({
        createdBefore: new Date('2025-02-15T00:00:00Z')
      });
      
      expect(instances).toHaveLength(2);
      expect(instances[0].id).toBe('instance-1');
      expect(instances[1].id).toBe('instance-2');
    });

    it('should filter instances by creation date range (both createdAfter and createdBefore)', async () => {
      const instances = await swarmController.listInstances({
        createdAfter: new Date('2025-01-15T00:00:00Z'),
        createdBefore: new Date('2025-03-15T00:00:00Z')
      });
      
      expect(instances).toHaveLength(2);
      expect(instances[0].id).toBe('instance-2');
      expect(instances[1].id).toBe('instance-3');
    });

    it('should filter instances by tags', async () => {
      const instances = await swarmController.listInstances({
        tags: { environment: 'development', owner: 'user1' }
      });
      
      expect(instances).toHaveLength(1);
      expect(instances[0].id).toBe('instance-1');
    });

    it('should apply pagination (limit)', async () => {
      const instances = await swarmController.listInstances({ limit: 2 });
      
      expect(instances).toHaveLength(2);
      expect(instances[0].id).toBe('instance-1');
      expect(instances[1].id).toBe('instance-2');
    });

    it('should apply pagination (offset)', async () => {
      const instances = await swarmController.listInstances({ offset: 2 });
      
      expect(instances).toHaveLength(2);
      expect(instances[0].id).toBe('instance-3');
      expect(instances[1].id).toBe('instance-4');
    });

    it('should apply pagination (both limit and offset)', async () => {
      const instances = await swarmController.listInstances({ offset: 1, limit: 2 });
      
      expect(instances).toHaveLength(2);
      expect(instances[0].id).toBe('instance-2');
      expect(instances[1].id).toBe('instance-3');
    });

    it('should apply multiple filters together', async () => {
      const instances = await swarmController.listInstances({
        status: InstanceStatus.RUNNING,
        createdAfter: new Date('2025-01-15T00:00:00Z'),
        tags: { owner: 'user2' }
      });
      
      expect(instances).toHaveLength(1);
      expect(instances[0].id).toBe('instance-2');
    });
  });
});