/**
 * Unit tests for the Swarm Controller
 */

/// <reference types="jest" />

import { SwarmController } from '../../src/swarm/swarm-controller';
import { InstanceRegistry } from '../../src/swarm/instance-registry';
import { HealthMonitor } from '../../src/swarm/health-monitor';
import { MigrationManager, MigrationStatus } from '../../src/swarm/migration-manager';
import { ProviderFactory } from '../../src/providers/core/provider-factory';
import { ProviderType, InstanceStatus } from '../../src/providers/core/provider-types';
import { VSCodeInstance, InstanceConfig } from '../../src/providers/core/instance.interface';
import { Provider } from '../../src/providers/core/provider.interface';
import { SwarmConfig, HealthStatus, MigrationStrategy } from '../../src/swarm/config';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

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
  const mockListInstances = jest.fn().mockReturnValue([]);
  const mockGetInstance = jest.fn();
  const mockGetInstanceCount = jest.fn().mockReturnValue(0);
  
  return {
    InstanceRegistry: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      registerInstance: jest.fn(),
      updateInstance: jest.fn(),
      removeInstance: jest.fn(),
      getInstance: mockGetInstance,
      listInstances: mockListInstances,
      getInstanceCount: mockGetInstanceCount,
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
const mockProvider: Partial<Provider> = {
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
  createInstance: jest.fn().mockImplementation((config: InstanceConfig) => {
    const instance: VSCodeInstance = {
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
  getInstance: jest.fn().mockImplementation((instanceId: string) => {
    if (instanceId === 'non-existent-instance') {
      return Promise.resolve(null);
    }
    
    const instance: VSCodeInstance = {
      id: instanceId,
      name: 'test-instance',
      providerType: ProviderType.DOCKER,
      providerInstanceId: `docker-instance-${instanceId}`,
      status: InstanceStatus.RUNNING,
      config: {} as any,
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
    config: {} as any,
    network: {} as any,
    resources: {} as any,
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
    config: {} as any,
    network: {} as any,
    resources: {} as any,
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
    config: {} as any,
    network: {} as any,
    resources: {} as any,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

// Test configuration
const testConfig: SwarmConfig = {
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
    },
    {
      type: ProviderType.FLYIO,
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
    defaultStrategy: MigrationStrategy.STOP_AND_RECREATE,
    timeoutMs: 300000
  }
};

describe('SwarmController', () => {
  let swarmController: SwarmController;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test directory
    if (!fs.existsSync(testConfig.general.stateDir)) {
      fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
    }
    
    // Mock provider factory
    (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);
    
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
      
      expect(ProviderFactory.createProvider).toHaveBeenCalledTimes(2);
      expect(mockProvider.initialize).toHaveBeenCalledTimes(2);
    });
  
    describe('startInstance', () => {
      let mockGetInstance: jest.Mock;
      
      beforeEach(async () => {
        await swarmController.initialize();
        
        // Get the mock implementation
        mockGetInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstance;
        
        // Mock registry getInstance
        mockGetInstance.mockImplementation((instanceId: string) => {
          if (instanceId === 'non-existent-instance') {
            return null;
          }
          
          return {
            id: instanceId,
            name: 'test-instance',
            providerType: ProviderType.DOCKER,
            status: InstanceStatus.STOPPED,
            config: {} as any,
            network: {} as any,
            resources: {} as any,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });
      });
  
      it('should start an instance successfully', async () => {
        // Get the mock implementation for updateInstance
        const mockUpdateInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.updateInstance;
        
        const instance = await swarmController.startInstance('test-instance');
        
        expect(instance).toBeDefined();
        expect(instance.id).toBe('test-instance');
        expect(instance.status).toBe(InstanceStatus.RUNNING);
        
        expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
        expect(mockProvider.startInstance).toHaveBeenCalledWith('test-instance');
        expect(mockUpdateInstance).toHaveBeenCalledWith(instance);
      });
  
      it('should throw an error if instance does not exist', async () => {
        await expect(swarmController.startInstance('non-existent-instance'))
          .rejects.toThrow('Instance non-existent-instance not found');
        
        expect(mockGetInstance).toHaveBeenCalledWith('non-existent-instance');
        expect(mockProvider.startInstance).not.toHaveBeenCalled();
      });
  
      it('should throw an error if provider is not found', async () => {
        // Create a new swarm controller with only Docker provider
        const localSwarmController = new SwarmController({
          ...testConfig,
          providers: [
            {
              type: ProviderType.DOCKER,
              enabled: true,
              config: {}
            }
          ]
        });
        
        await localSwarmController.initialize();
        
        // Mock an instance with a non-existent provider
        mockGetInstance.mockImplementation((instanceId: string) => {
          return {
            id: instanceId,
            name: 'test-instance',
            providerType: ProviderType.FLYIO, // Different provider than what's available
            status: InstanceStatus.STOPPED,
            config: {} as any,
            network: {} as any,
            resources: {} as any,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });
        
        await expect(localSwarmController.startInstance('test-instance'))
          .rejects.toThrow('Provider flyio not found for instance test-instance');
        
        expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
        expect(mockProvider.startInstance).not.toHaveBeenCalled();
      });
  
      it('should handle provider failures when starting an instance', async () => {
        // Mock provider startInstance to throw an error
        (mockProvider.startInstance as jest.Mock).mockRejectedValueOnce(new Error('Provider failure'));
        
        await expect(swarmController.startInstance('test-instance'))
          .rejects.toThrow('Provider failure');
        
        expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
        expect(mockProvider.startInstance).toHaveBeenCalledWith('test-instance');
      });
    });
  });
  
  describe('createInstance', () => {
    beforeEach(async () => {
      await swarmController.initialize();
    });
    
    it('should create a new instance', async () => {
      // Get the mock implementation
      const mockRegisterInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.registerInstance;
      
      const config: InstanceConfig = {
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
      expect(mockRegisterInstance).toHaveBeenCalledWith(instance);
    });
  });
  
  describe('getInstance', () => {
    let mockGetInstance: jest.Mock;
    
    beforeEach(async () => {
      await swarmController.initialize();
      
      // Get the mock implementation
      mockGetInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstance;
      
      // Mock registry getInstance
      mockGetInstance.mockImplementation((instanceId: string) => {
        if (instanceId === 'non-existent-instance') {
          return null;
        }
        
        return {
          id: instanceId,
          name: 'test-instance',
          providerType: ProviderType.DOCKER,
          status: InstanceStatus.RUNNING,
          config: {} as any,
          network: {} as any,
          resources: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
    });
    
    it('should get an instance by ID', async () => {
      const instance = await swarmController.getInstance('test-instance');
      
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('test-instance');
      expect(instance!.providerType).toBe(ProviderType.DOCKER);
      
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.getInstance).toHaveBeenCalledWith('test-instance');
    });
    
    it('should return null if instance is not found', async () => {
      const instance = await swarmController.getInstance('non-existent-instance');
      
      expect(instance).toBeNull();
      
      expect(mockGetInstance).toHaveBeenCalledWith('non-existent-instance');
      expect(mockProvider.getInstance).not.toHaveBeenCalled();
    });
  });

  describe('stopInstance', () => {
    let mockGetInstance: jest.Mock;
    
    beforeEach(async () => {
      await swarmController.initialize();
      
      // Get the mock implementation
      mockGetInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstance;
      
      // Mock registry getInstance
      mockGetInstance.mockImplementation((instanceId: string) => {
        if (instanceId === 'non-existent-instance') {
          return null;
        }
        
        return {
          id: instanceId,
          name: 'test-instance',
          providerType: ProviderType.DOCKER,
          status: InstanceStatus.RUNNING,
          config: {} as any,
          network: {} as any,
          resources: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
    });
    
    describe('SwarmController - Health Checks', () => {
      let swarmController: SwarmController;
      let mockGetInstance: jest.Mock;
      let mockCheckInstanceHealth: jest.Mock;
      
      beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create test directory
        if (!fs.existsSync(testConfig.general.stateDir)) {
          fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
        }
        
        // Mock provider factory
        (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);
        
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
    
      describe('checkInstanceHealth', () => {
        beforeEach(async () => {
          await swarmController.initialize();
          
          // Get the mock implementations
          mockGetInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstance;
          mockCheckInstanceHealth = (HealthMonitor as jest.MockedClass<typeof HealthMonitor>).mock.results[0].value.checkInstanceHealth;
          
          // Mock registry getInstance
          mockGetInstance.mockImplementation((instanceId: string) => {
            if (instanceId === 'non-existent-instance') {
              return null;
            }
            
            return {
              id: instanceId,
              name: 'test-instance',
              providerType: ProviderType.DOCKER,
              status: InstanceStatus.RUNNING,
              config: {} as any,
              network: {} as any,
              resources: {} as any,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          });
        });
    
        it('should check instance health successfully', async () => {
          // Mock health monitor to return a healthy status
          mockCheckInstanceHealth.mockResolvedValueOnce({
            instanceId: 'test-instance',
            status: HealthStatus.HEALTHY,
            timestamp: new Date(),
            details: { message: 'Instance is healthy', responseTimeMs: 50 }
          });
          
          const health = await swarmController.checkInstanceHealth('test-instance');
          
          expect(health).toBeDefined();
          expect(health.instanceId).toBe('test-instance');
          expect(health.status).toBe(HealthStatus.UNKNOWN); // Initial status before health check completes
          expect(health.details.message).toBe('Health check initiated');
          expect(health.healthHistory).toEqual([]);
          
          expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
          expect(mockCheckInstanceHealth).toHaveBeenCalledWith('test-instance');
        });
    
        it('should throw an error if instance does not exist', async () => {
          await expect(swarmController.checkInstanceHealth('non-existent-instance'))
            .rejects.toThrow('Instance non-existent-instance not found');
          
          expect(mockGetInstance).toHaveBeenCalledWith('non-existent-instance');
          expect(mockCheckInstanceHealth).not.toHaveBeenCalled();
        });
    
        it('should handle health check failures', async () => {
          // Mock health monitor to throw an error
          mockCheckInstanceHealth.mockRejectedValueOnce(new Error('Health check failed'));
          
          // The controller doesn't catch the error, so we expect it to be thrown
          await expect(swarmController.checkInstanceHealth('test-instance'))
            .rejects.toThrow('Health check failed');
          
          expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
          expect(mockCheckInstanceHealth).toHaveBeenCalledWith('test-instance');
        });
      });
    
      describe('createMigrationPlan', () => {
        let mockGetInstance: jest.Mock;
        let mockCreateMigrationPlan: jest.Mock;
        let mockFlyProvider: Partial<Provider>;
        
        beforeEach(async () => {
          // Create a mock Fly.io provider
          mockFlyProvider = {
            type: ProviderType.FLYIO,
            getCapabilities: jest.fn().mockReturnValue({
              supportsLiveResize: false,
              supportsSnapshotting: false,
              supportsMultiRegion: true,
              maxInstancesPerUser: 5,
              maxResourcesPerInstance: {
                cpu: { cores: 2 },
                memory: { min: 512, max: 4096 }
              }
            }),
            initialize: jest.fn().mockResolvedValue(undefined),
            createInstance: jest.fn().mockImplementation((config: InstanceConfig) => {
              const instance: VSCodeInstance = {
                id: `fly-instance-${Date.now()}`,
                name: config.name,
                providerType: ProviderType.FLYIO,
                providerInstanceId: `fly-instance-${Date.now()}`,
                status: InstanceStatus.RUNNING,
                config,
                network: {
                  internalIp: '10.0.0.1',
                  externalIp: 'fly-app.fly.dev',
                  ports: [
                    { internal: 8080, external: 8080, protocol: 'tcp' }
                  ],
                  urls: ['https://fly-app.fly.dev']
                },
                resources: {
                  cpu: { used: 0.1, limit: 1 },
                  memory: { used: 256, limit: 1024 }
                },
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date()
              };
              return Promise.resolve(instance);
            }),
            getInstance: jest.fn().mockImplementation((instanceId: string) => {
              const instance: VSCodeInstance = {
                id: instanceId,
                name: 'fly-test-instance',
                providerType: ProviderType.FLYIO,
                providerInstanceId: `fly-instance-${instanceId}`,
                status: InstanceStatus.RUNNING,
                config: {} as any,
                network: {} as any,
                resources: {} as any,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date()
              };
              return Promise.resolve(instance);
            }),
            startInstance: jest.fn().mockResolvedValue({} as VSCodeInstance),
            stopInstance: jest.fn().mockResolvedValue({} as VSCodeInstance),
            deleteInstance: jest.fn().mockResolvedValue(true),
            updateInstance: jest.fn().mockResolvedValue({} as VSCodeInstance)
          };
          
          // Reset mocks
          jest.clearAllMocks();
          
          // Create test directory
          if (!fs.existsSync(testConfig.general.stateDir)) {
            fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
          }
          
          // Mock provider factory to return both Docker and Fly.io providers
          (ProviderFactory.createProvider as jest.Mock).mockImplementation((type: ProviderType) => {
            if (type === ProviderType.FLYIO) {
              return mockFlyProvider;
            }
            return mockProvider;
          });
          
          // Create swarm controller
          swarmController = new SwarmController(testConfig);
          
          await swarmController.initialize();
          
          // Get the mock implementations
          mockGetInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstance;
          mockCreateMigrationPlan = (MigrationManager as jest.MockedClass<typeof MigrationManager>).mock.results[0].value.createMigrationPlan;
          
          // Mock registry getInstance
          mockGetInstance.mockImplementation((instanceId: string) => {
            if (instanceId === 'non-existent-instance') {
              return null;
            }
            
            return {
              id: instanceId,
              name: 'test-instance',
              providerType: ProviderType.DOCKER,
              status: InstanceStatus.RUNNING,
              config: {
                name: 'test-instance',
                image: 'vscode:latest',
                workspacePath: '/workspace',
                resources: {
                  cpu: { cores: 1 },
                  memory: { min: 1024 }
                },
                network: {},
                env: {},
                extensions: []
              },
              network: {} as any,
              resources: {} as any,
              metadata: {},
              createdAt: new Date(),
              updatedAt: new Date()
            };
          });
        });
    
        it('should create a migration plan successfully', async () => {
          // Mock migration manager to return a plan
          const expectedPlan = {
            id: 'test-migration',
            sourceInstanceId: 'test-instance',
            sourceProviderType: ProviderType.DOCKER,
            targetProviderType: ProviderType.FLYIO,
            strategy: MigrationStrategy.STOP_AND_RECREATE,
            keepSource: false,
            startTarget: true,
            timeoutSeconds: 300,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 300000),
            steps: [],
            currentStepIndex: 0,
            status: 'pending'
          };
          
          mockCreateMigrationPlan.mockResolvedValueOnce(expectedPlan);
          
          const plan = await swarmController.createMigrationPlan(
            'test-instance',
            ProviderType.FLYIO
          );
          
          expect(plan).toBeDefined();
          expect(plan.id).toBe('test-migration');
          expect(plan.sourceInstanceId).toBe('test-instance');
          expect(plan.sourceProviderType).toBe(ProviderType.DOCKER);
          expect(plan.targetProviderType).toBe(ProviderType.FLYIO);
          
          expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
          expect(mockCreateMigrationPlan).toHaveBeenCalledWith(
            'test-instance',
            ProviderType.FLYIO,
            undefined
          );
        });
    
        it('should create a migration plan with custom options', async () => {
          // Mock migration manager to return a plan
          const expectedPlan = {
            id: 'test-migration',
            sourceInstanceId: 'test-instance',
            sourceProviderType: ProviderType.DOCKER,
            targetProviderType: ProviderType.FLYIO,
            strategy: MigrationStrategy.CREATE_THEN_STOP,
            keepSource: true,
            startTarget: false,
            timeoutSeconds: 600,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 600000),
            steps: [],
            currentStepIndex: 0,
            status: 'pending'
          };
          
          mockCreateMigrationPlan.mockResolvedValueOnce(expectedPlan);
          
          const options = {
            strategy: MigrationStrategy.CREATE_THEN_STOP,
            keepSource: true,
            startTarget: false,
            timeoutSeconds: 600
          };
          
          const plan = await swarmController.createMigrationPlan(
            'test-instance',
            ProviderType.FLYIO,
            options
          );
          
          expect(plan).toBeDefined();
          expect(plan.strategy).toBe(MigrationStrategy.CREATE_THEN_STOP);
          expect(plan.keepSource).toBe(true);
          expect(plan.startTarget).toBe(false);
          expect(plan.timeoutSeconds).toBe(600);
          
          expect(mockCreateMigrationPlan).toHaveBeenCalledWith(
            'test-instance',
            ProviderType.FLYIO,
            options
          );
        });
        
        describe('startMigration', () => {
          let mockStartMigration: jest.Mock;
          let mockGetMigrationPlan: jest.Mock;
          
          beforeEach(async () => {
            await swarmController.initialize();
            
            // Get the mock implementations
            mockStartMigration = (MigrationManager as jest.MockedClass<typeof MigrationManager>).mock.results[0].value.startMigration;
            mockGetMigrationPlan = (MigrationManager as jest.MockedClass<typeof MigrationManager>).mock.results[0].value.getMigrationPlan;
            
            // Mock getMigrationPlan to return a valid plan
            mockGetMigrationPlan.mockImplementation((migrationId: string) => {
              if (migrationId === 'non-existent-migration') {
                return null;
              }
              
              return {
                id: migrationId,
                sourceInstanceId: 'test-instance',
                sourceProviderType: ProviderType.DOCKER,
                targetProviderType: ProviderType.FLYIO,
                strategy: MigrationStrategy.STOP_AND_RECREATE,
                keepSource: false,
                startTarget: true,
                timeoutSeconds: 300,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 300000),
                steps: [],
                currentStepIndex: 0,
                status: 'pending'
              };
            });
          });
          
          describe('startMigration', () => {
            let mockStartMigration: jest.Mock;
            let mockGetMigrationPlan: jest.Mock;
            
            beforeEach(async () => {
              await swarmController.initialize();
              
              // Get the mock implementations
              mockStartMigration = (MigrationManager as jest.MockedClass<typeof MigrationManager>).mock.results[0].value.startMigration;
              mockGetMigrationPlan = (MigrationManager as jest.MockedClass<typeof MigrationManager>).mock.results[0].value.getMigrationPlan;
              
              // Mock getMigrationPlan to return a valid plan
              mockGetMigrationPlan.mockImplementation((migrationId: string) => {
                if (migrationId === 'non-existent-migration') {
                  return null;
                }
                
                return {
                  id: migrationId,
                  sourceInstanceId: 'test-instance',
                  sourceProviderType: ProviderType.DOCKER,
                  targetProviderType: ProviderType.FLYIO,
                  strategy: MigrationStrategy.STOP_AND_RECREATE,
                  keepSource: false,
                  startTarget: true,
                  timeoutSeconds: 300,
                  createdAt: new Date(),
                  expiresAt: new Date(Date.now() + 300000),
                  steps: [],
                  currentStepIndex: 0,
                  status: 'pending'
                };
              });
            });
          
            it('should start a migration successfully', async () => {
              // Mock successful migration result
              const expectedResult = {
                plan: {
                  id: 'test-migration',
                  sourceInstanceId: 'test-instance',
                  sourceProviderType: ProviderType.DOCKER,
                  targetProviderType: ProviderType.FLYIO,
                  status: 'completed'
                },
                success: true,
                targetInstance: {
                  id: 'target-instance',
                  name: 'test-instance-migrated',
                  providerType: ProviderType.FLYIO,
                  status: InstanceStatus.RUNNING
                }
              };
              
              mockStartMigration.mockResolvedValueOnce(expectedResult);
              
              const result = await swarmController.startMigration('test-migration');
              
              expect(result).toBeDefined();
              expect(result.success).toBe(true);
              expect(result.plan.id).toBe('test-migration');
              expect(result.plan.status).toBe('completed');
              expect(result.targetInstance).toBeDefined();
              expect(result.targetInstance!.id).toBe('target-instance');
              
              expect(mockStartMigration).toHaveBeenCalledWith('test-migration');
            });
          
            it('should handle non-existent migration plans', async () => {
              // Mock migration manager to throw an error for non-existent plans
              mockStartMigration.mockImplementation((migrationId: string) => {
                if (migrationId === 'non-existent-migration') {
                  throw new Error(`Migration plan ${migrationId} not found`);
                }
                return Promise.resolve({
                  plan: {
                    id: migrationId,
                    status: 'completed'
                  },
                  success: true
                });
              });
              
              await expect(swarmController.startMigration('non-existent-migration'))
                .rejects.toThrow('Migration plan non-existent-migration not found');
              
              expect(mockStartMigration).toHaveBeenCalledWith('non-existent-migration');
            });
          
            it('should handle migration manager failures', async () => {
              // Mock migration manager to throw an error
              mockStartMigration.mockRejectedValueOnce(new Error('Migration manager failure'));
              
              await expect(swarmController.startMigration('test-migration'))
                .rejects.toThrow('Migration manager failure');
              
              expect(mockStartMigration).toHaveBeenCalledWith('test-migration');
            });
          
            it('should handle migration already in progress', async () => {
              // Mock migration manager to throw an error for migrations already in progress
              mockStartMigration.mockImplementation((migrationId: string) => {
                throw new Error(`Migration ${migrationId} is already in progress`);
              });
              
              await expect(swarmController.startMigration('test-migration'))
                .rejects.toThrow('Migration test-migration is already in progress');
              
              expect(mockStartMigration).toHaveBeenCalledWith('test-migration');
            });
          
            it('should handle failed migrations', async () => {
              // Mock failed migration result
              const failedResult = {
                plan: {
                  id: 'test-migration',
                  sourceInstanceId: 'test-instance',
                  sourceProviderType: ProviderType.DOCKER,
                  targetProviderType: ProviderType.FLYIO,
                  status: 'failed',
                  error: 'Failed to execute step create_target: Provider error'
                },
                success: false,
                error: 'Failed to execute step create_target: Provider error'
              };
              
              mockStartMigration.mockResolvedValueOnce(failedResult);
              
              const result = await swarmController.startMigration('test-migration');
              
              expect(result).toBeDefined();
              expect(result.success).toBe(false);
              expect(result.plan.id).toBe('test-migration');
              expect(result.plan.status).toBe('failed');
              expect(result.error).toBe('Failed to execute step create_target: Provider error');
              expect(result.targetInstance).toBeUndefined();
              
              expect(mockStartMigration).toHaveBeenCalledWith('test-migration');
            });
          });
  
          describe('cancelMigration', () => {
            let mockCancelMigration: jest.Mock;
            let mockGetMigrationPlan: jest.Mock;
            
            beforeEach(async () => {
              await swarmController.initialize();
              
              // Get the mock implementations
              mockCancelMigration = (MigrationManager as jest.MockedClass<typeof MigrationManager>).mock.results[0].value.cancelMigration;
              mockGetMigrationPlan = (MigrationManager as jest.MockedClass<typeof MigrationManager>).mock.results[0].value.getMigrationPlan;
              
              // Mock getMigrationPlan to return a valid plan
              mockGetMigrationPlan.mockImplementation((migrationId: string) => {
                if (migrationId === 'non-existent-migration') {
                  return null;
                }
                
                return {
                  id: migrationId,
                  sourceInstanceId: 'test-instance',
                  sourceProviderType: ProviderType.DOCKER,
                  targetProviderType: ProviderType.FLYIO,
                  strategy: MigrationStrategy.STOP_AND_RECREATE,
                  keepSource: false,
                  startTarget: true,
                  timeoutSeconds: 300,
                  createdAt: new Date(),
                  expiresAt: new Date(Date.now() + 300000),
                  steps: [],
                  currentStepIndex: 0,
                  status: 'pending'
                };
              });
            });
          
            it('should cancel a migration successfully', async () => {
              // Mock successful cancellation
              mockCancelMigration.mockResolvedValueOnce(true);
              
              const success = await swarmController.cancelMigration('test-migration');
              
              expect(success).toBe(true);
              expect(mockCancelMigration).toHaveBeenCalledWith('test-migration');
            });
          
            it('should handle non-existent migration plans', async () => {
              // Mock migration manager to throw an error for non-existent plans
              mockCancelMigration.mockImplementation((migrationId: string) => {
                if (migrationId === 'non-existent-migration') {
                  throw new Error(`Migration plan ${migrationId} not found`);
                }
                return Promise.resolve(true);
              });
              
              await expect(swarmController.cancelMigration('non-existent-migration'))
                .rejects.toThrow('Migration plan non-existent-migration not found');
              
              expect(mockCancelMigration).toHaveBeenCalledWith('non-existent-migration');
            });
          
            it('should handle migration manager failures', async () => {
              // Mock migration manager to throw an error
              mockCancelMigration.mockRejectedValueOnce(new Error('Migration manager failure'));
              
              await expect(swarmController.cancelMigration('test-migration'))
                .rejects.toThrow('Migration manager failure');
              
              expect(mockCancelMigration).toHaveBeenCalledWith('test-migration');
            });
          
            it('should handle migration cancellation failures', async () => {
              // Mock failed cancellation (e.g., migration already completed)
              mockCancelMigration.mockImplementation((migrationId: string) => {
                throw new Error(`Migration ${migrationId} cannot be cancelled (status: completed)`);
              });
              
              await expect(swarmController.cancelMigration('test-migration'))
                .rejects.toThrow('Migration test-migration cannot be cancelled (status: completed)');
              
              expect(mockCancelMigration).toHaveBeenCalledWith('test-migration');
            });
          
            it('should return false when migration cancellation fails without throwing', async () => {
              // Mock cancellation returning false
              mockCancelMigration.mockResolvedValueOnce(false);
              
              const success = await swarmController.cancelMigration('test-migration');
              
              expect(success).toBe(false);
              expect(mockCancelMigration).toHaveBeenCalledWith('test-migration');
            });
          });
        
          it('should start a migration successfully', async () => {
            // Mock successful migration result
            const expectedResult = {
              plan: {
                id: 'test-migration',
                sourceInstanceId: 'test-instance',
                sourceProviderType: ProviderType.DOCKER,
                targetProviderType: ProviderType.FLYIO,
                status: 'completed'
              },
              success: true,
              targetInstance: {
                id: 'target-instance',
                name: 'test-instance-migrated',
                providerType: ProviderType.FLYIO,
                status: InstanceStatus.RUNNING
              }
            };
            
            mockStartMigration.mockResolvedValueOnce(expectedResult);
            
            const result = await swarmController.startMigration('test-migration');
            
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.plan.id).toBe('test-migration');
            expect(result.plan.status).toBe('completed');
            expect(result.targetInstance).toBeDefined();
            expect(result.targetInstance!.id).toBe('target-instance');
            
            expect(mockStartMigration).toHaveBeenCalledWith('test-migration');
          });
        
          it('should handle non-existent migration plans', async () => {
            // Mock migration manager to throw an error for non-existent plans
            mockStartMigration.mockImplementation((migrationId: string) => {
              if (migrationId === 'non-existent-migration') {
                throw new Error(`Migration plan ${migrationId} not found`);
              }
              return Promise.resolve({
                plan: {
                  id: migrationId,
                  status: 'completed'
                },
                success: true
              });
            });
            
            await expect(swarmController.startMigration('non-existent-migration'))
              .rejects.toThrow('Migration plan non-existent-migration not found');
            
            expect(mockStartMigration).toHaveBeenCalledWith('non-existent-migration');
          });
        
          it('should handle migration manager failures', async () => {
            // Mock migration manager to throw an error
            mockStartMigration.mockRejectedValueOnce(new Error('Migration manager failure'));
            
            await expect(swarmController.startMigration('test-migration'))
              .rejects.toThrow('Migration manager failure');
            
            expect(mockStartMigration).toHaveBeenCalledWith('test-migration');
          });
        
          it('should handle migration already in progress', async () => {
            // Mock migration manager to throw an error for migrations already in progress
            mockStartMigration.mockImplementation((migrationId: string) => {
              throw new Error(`Migration ${migrationId} is already in progress`);
            });
            
            await expect(swarmController.startMigration('test-migration'))
              .rejects.toThrow('Migration test-migration is already in progress');
            
            expect(mockStartMigration).toHaveBeenCalledWith('test-migration');
          });
          
          describe('getSwarmStatus', () => {
            let swarmController: SwarmController;
            let mockGetInstanceCount: jest.Mock;
            
            beforeEach(async () => {
              // Reset mocks
              jest.clearAllMocks();
              
              // Create test directory
              if (!fs.existsSync(testConfig.general.stateDir)) {
                fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
              }
              
              // Mock provider factory
              (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);
              
              // Create swarm controller
              swarmController = new SwarmController(testConfig);
              
              // Get the mock implementation for getInstanceCount
              mockGetInstanceCount = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstanceCount;
              
              // Mock instance counts
              mockGetInstanceCount.mockImplementation((providerType?: ProviderType) => {
                if (providerType === ProviderType.DOCKER) {
                  return 3;
                } else if (providerType === ProviderType.FLYIO) {
                  return 2;
                }
                return 5; // Total instances
              });
              
              await swarmController.initialize();
            });
            
            afterEach(() => {
              // Clean up
              swarmController.dispose();
              
              // Remove test directory
              if (fs.existsSync(testConfig.general.stateDir)) {
                fs.rmSync(testConfig.general.stateDir, { recursive: true, force: true });
              }
            });
          
            it('should return swarm status with instance counts and provider statistics', () => {
              const status = swarmController.getSwarmStatus();
              
              expect(status).toBeDefined();
              expect(status.initialized).toBe(true);
              expect(status.totalInstances).toBe(5);
              expect(status.healthMonitorEnabled).toBe(true);
              expect(status.migrationEnabled).toBe(true);
              
              // Check providers array
              expect(status.providers).toHaveLength(Object.values(ProviderType).length);
              
              // Check Docker provider status
              const dockerProvider = status.providers.find(p => p.type === ProviderType.DOCKER);
              expect(dockerProvider).toBeDefined();
              expect(dockerProvider!.enabled).toBe(true);
              expect(dockerProvider!.instanceCount).toBe(3);
              
              // Check Fly.io provider status
              const flyProvider = status.providers.find(p => p.type === ProviderType.FLYIO);
              expect(flyProvider).toBeDefined();
              expect(flyProvider!.enabled).toBe(true);
              expect(flyProvider!.instanceCount).toBe(2);
              
              // Verify getInstanceCount was called correctly
              expect(mockGetInstanceCount).toHaveBeenCalledWith(); // For total count
              expect(mockGetInstanceCount).toHaveBeenCalledWith(ProviderType.DOCKER);
              expect(mockGetInstanceCount).toHaveBeenCalledWith(ProviderType.FLYIO);
            });
          
            it('should show disabled providers in status', async () => {
              // Reset mocks
              jest.clearAllMocks();
              
              // Create a new swarm controller with only Docker provider
              const localSwarmController = new SwarmController({
                ...testConfig,
                providers: [
                  {
                    type: ProviderType.DOCKER,
                    enabled: true,
                    config: {}
                  }
                ]
              });
              
              await localSwarmController.initialize();
              
              const status = localSwarmController.getSwarmStatus();
              
              // Check providers array still includes all provider types
              expect(status.providers).toHaveLength(Object.values(ProviderType).length);
              
              // Check Docker provider is enabled
              const dockerProvider = status.providers.find(p => p.type === ProviderType.DOCKER);
              expect(dockerProvider).toBeDefined();
              expect(dockerProvider!.enabled).toBe(true);
              
              // Check Fly.io provider is disabled
              const flyProvider = status.providers.find(p => p.type === ProviderType.FLYIO);
              expect(flyProvider).toBeDefined();
              expect(flyProvider!.enabled).toBe(false);
              
              // We don't test the exact instance count since that depends on the mock implementation
              // Just verify that the instance count is included in the status
              expect(dockerProvider!.instanceCount).toBeDefined();
              expect(flyProvider!.instanceCount).toBeDefined();
              
              localSwarmController.dispose();
            });
          
            it('should throw an error if controller is not initialized', () => {
              // Create a new swarm controller without initializing it
              const uninitializedController = new SwarmController(testConfig);
              
              // Try to get status without initializing
              expect(() => {
                uninitializedController.getSwarmStatus();
              }).toThrow('Swarm controller not initialized');
            });
          
            it('should reflect health monitor and migration settings from config', async () => {
              // Create a new swarm controller with health monitor and migration disabled
              const localSwarmController = new SwarmController({
                ...testConfig,
                healthMonitor: {
                  ...testConfig.healthMonitor,
                  enabled: false
                },
                migration: {
                  ...testConfig.migration,
                  enabled: false
                }
              });
              
              await localSwarmController.initialize();
              
              const status = localSwarmController.getSwarmStatus();
              
              expect(status.healthMonitorEnabled).toBe(false);
              expect(status.migrationEnabled).toBe(false);
              
              localSwarmController.dispose();
            });
          });
        
          it('should handle failed migrations', async () => {
            // Mock failed migration result
            const failedResult = {
              plan: {
                id: 'test-migration',
                sourceInstanceId: 'test-instance',
                sourceProviderType: ProviderType.DOCKER,
                targetProviderType: ProviderType.FLYIO,
                status: 'failed',
                error: 'Failed to execute step create_target: Provider error'
              },
              success: false,
              error: 'Failed to execute step create_target: Provider error'
            };
            
            mockStartMigration.mockResolvedValueOnce(failedResult);
            
            const result = await swarmController.startMigration('test-migration');
            
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.plan.id).toBe('test-migration');
            expect(result.plan.status).toBe('failed');
            expect(result.error).toBe('Failed to execute step create_target: Provider error');
            expect(result.targetInstance).toBeUndefined();
            
            expect(mockStartMigration).toHaveBeenCalledWith('test-migration');
          });
        });
    
        it('should throw an error if source instance does not exist', async () => {
          await expect(swarmController.createMigrationPlan(
            'non-existent-instance',
            ProviderType.FLYIO
          )).rejects.toThrow('Source instance non-existent-instance not found');
          
          expect(mockGetInstance).toHaveBeenCalledWith('non-existent-instance');
          expect(mockCreateMigrationPlan).not.toHaveBeenCalled();
        });
    
        it('should throw an error if target provider is not found', async () => {
          // Create a new swarm controller with only Docker provider
          const localSwarmController = new SwarmController({
            ...testConfig,
            providers: [
              {
                type: ProviderType.DOCKER,
                enabled: true,
                config: {}
              }
            ]
          });
          
          await localSwarmController.initialize();
          
          await expect(localSwarmController.createMigrationPlan(
            'test-instance',
            ProviderType.FLYIO
          )).rejects.toThrow('Target provider flyio not found or not initialized');
          
          expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
          expect(mockCreateMigrationPlan).not.toHaveBeenCalled();
        });
    
        it('should handle migration manager failures', async () => {
          // Mock migration manager to throw an error
          mockCreateMigrationPlan.mockRejectedValueOnce(new Error('Migration manager failure'));
          
          await expect(swarmController.createMigrationPlan(
            'test-instance',
            ProviderType.FLYIO
          )).rejects.toThrow('Migration manager failure');
          
          expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
          expect(mockCreateMigrationPlan).toHaveBeenCalledWith(
            'test-instance',
            ProviderType.FLYIO,
            undefined
          );
        });
      });
    });
    
    describe('SwarmController - Recovery', () => {
      let swarmController: SwarmController;
      let mockGetInstance: jest.Mock;
      let mockRecoverInstance: jest.Mock;
      
      beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create test directory
        if (!fs.existsSync(testConfig.general.stateDir)) {
          fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
        }
        
        // Mock provider factory to return appropriate provider based on type
        (ProviderFactory.createProvider as jest.Mock).mockImplementation((type: ProviderType) => {
          if (type === ProviderType.FLYIO) {
            return {
              type: ProviderType.FLYIO,
              getCapabilities: jest.fn().mockReturnValue({
                supportsLiveResize: false,
                supportsSnapshotting: false,
                supportsMultiRegion: true,
                maxInstancesPerUser: 5,
                maxResourcesPerInstance: {
                  cpu: { cores: 2 },
                  memory: { min: 512, max: 4096 }
                }
              }),
              initialize: jest.fn().mockResolvedValue(undefined),
              createInstance: jest.fn().mockResolvedValue({
                id: 'fly-test-instance',
                name: 'fly-test-instance',
                providerType: ProviderType.FLYIO,
                status: InstanceStatus.RUNNING,
                config: {} as any,
                network: {} as any,
                resources: {} as any,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date()
              }),
              getInstance: jest.fn().mockResolvedValue({
                id: 'fly-test-instance',
                name: 'fly-test-instance',
                providerType: ProviderType.FLYIO,
                status: InstanceStatus.RUNNING,
                config: {} as any,
                network: {} as any,
                resources: {} as any,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date()
              }),
              startInstance: jest.fn().mockResolvedValue({} as VSCodeInstance),
              stopInstance: jest.fn().mockResolvedValue({} as VSCodeInstance),
              deleteInstance: jest.fn().mockResolvedValue(true),
              updateInstance: jest.fn().mockResolvedValue({} as VSCodeInstance)
            };
          }
          return mockProvider;
        });
        
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
    
      describe('recoverInstance', () => {
        beforeEach(async () => {
          await swarmController.initialize();
          
          // Get the mock implementations
          mockGetInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstance;
          mockRecoverInstance = (HealthMonitor as jest.MockedClass<typeof HealthMonitor>).mock.results[0].value.recoverInstance;
          
          // Mock registry getInstance
          mockGetInstance.mockImplementation((instanceId: string) => {
            if (instanceId === 'non-existent-instance') {
              return null;
            }
            
            return {
              id: instanceId,
              name: 'test-instance',
              providerType: ProviderType.DOCKER,
              status: InstanceStatus.RUNNING,
              config: {} as any,
              network: {} as any,
              resources: {} as any,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          });
        });
    
        it('should recover an instance successfully', async () => {
          // Mock health monitor to return success
          mockRecoverInstance.mockResolvedValueOnce(true);
          
          const success = await swarmController.recoverInstance('test-instance');
          
          expect(success).toBe(true);
          expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
          expect(mockRecoverInstance).not.toHaveBeenCalled(); // Direct provider calls are made
          expect(mockProvider.stopInstance).toHaveBeenCalledWith('test-instance');
          expect(mockProvider.startInstance).toHaveBeenCalledWith('test-instance');
        });
    
        it('should throw an error if instance does not exist', async () => {
          await expect(swarmController.recoverInstance('non-existent-instance'))
            .rejects.toThrow('Instance non-existent-instance not found');
          
          expect(mockGetInstance).toHaveBeenCalledWith('non-existent-instance');
          expect(mockRecoverInstance).not.toHaveBeenCalled();
          expect(mockProvider.stopInstance).not.toHaveBeenCalled();
          expect(mockProvider.startInstance).not.toHaveBeenCalled();
        });
    
        it('should throw an error if provider is not found', async () => {
          // Create a new swarm controller with only Docker provider
          const localSwarmController = new SwarmController({
            ...testConfig,
            providers: [
              {
                type: ProviderType.DOCKER,
                enabled: true,
                config: {}
              }
            ]
          });
          
          await localSwarmController.initialize();
          
          // Mock an instance with a non-existent provider
          mockGetInstance.mockImplementation((instanceId: string) => {
            return {
              id: instanceId,
              name: 'test-instance',
              providerType: ProviderType.FLYIO, // Different provider than what's available
              status: InstanceStatus.RUNNING,
              config: {} as any,
              network: {} as any,
              resources: {} as any,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          });
          
          await expect(localSwarmController.recoverInstance('test-instance'))
            .rejects.toThrow('Provider flyio not found for instance test-instance');
          
          expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
          expect(mockRecoverInstance).not.toHaveBeenCalled();
          expect(mockProvider.stopInstance).not.toHaveBeenCalled();
          expect(mockProvider.startInstance).not.toHaveBeenCalled();
        });
    
        it('should handle recovery failures', async () => {
          // Mock provider stopInstance to throw an error
          (mockProvider.stopInstance as jest.Mock).mockRejectedValueOnce(new Error('Provider failure'));
          
          const success = await swarmController.recoverInstance('test-instance');
          
          expect(success).toBe(false);
          expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
          expect(mockProvider.stopInstance).toHaveBeenCalledWith('test-instance');
          expect(mockProvider.startInstance).not.toHaveBeenCalled();
        });
      });
    });

    it('should stop an instance successfully', async () => {
      // Get the mock implementation for updateInstance
      const mockUpdateInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.updateInstance;
      
      const instance = await swarmController.stopInstance('test-instance');
      
      expect(instance).toBeDefined();
      expect(instance.id).toBe('test-instance');
      expect(instance.status).toBe(InstanceStatus.STOPPED);
      
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.stopInstance).toHaveBeenCalledWith('test-instance', undefined);
      expect(mockUpdateInstance).toHaveBeenCalledWith(instance);
    });

    it('should stop an instance with force option', async () => {
      const instance = await swarmController.stopInstance('test-instance', true);
      
      expect(instance).toBeDefined();
      expect(instance.status).toBe(InstanceStatus.STOPPED);
      
      expect(mockProvider.stopInstance).toHaveBeenCalledWith('test-instance', true);
    });

    it('should throw an error if instance does not exist', async () => {
      await expect(swarmController.stopInstance('non-existent-instance'))
        .rejects.toThrow('Instance non-existent-instance not found');
      
      expect(mockGetInstance).toHaveBeenCalledWith('non-existent-instance');
      expect(mockProvider.stopInstance).not.toHaveBeenCalled();
    });

    it('should throw an error if provider is not found', async () => {
      // Create a new swarm controller with only Docker provider
      const localSwarmController = new SwarmController({
        ...testConfig,
        providers: [
          {
            type: ProviderType.DOCKER,
            enabled: true,
            config: {}
          }
        ]
      });
      
      await localSwarmController.initialize();
      
      // Mock an instance with a non-existent provider
      mockGetInstance.mockImplementation((instanceId: string) => {
        return {
          id: instanceId,
          name: 'test-instance',
          providerType: ProviderType.FLYIO, // Different provider than what's available
          status: InstanceStatus.RUNNING,
          config: {} as any,
          network: {} as any,
          resources: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
      
      await expect(localSwarmController.stopInstance('test-instance'))
        .rejects.toThrow('Provider flyio not found for instance test-instance');
      
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.stopInstance).not.toHaveBeenCalled();
    });

    it('should handle provider failures when stopping an instance', async () => {
      // Mock provider stopInstance to throw an error
      (mockProvider.stopInstance as jest.Mock).mockRejectedValueOnce(new Error('Provider failure'));
      
      await expect(swarmController.stopInstance('test-instance'))
        .rejects.toThrow('Provider failure');
      
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.stopInstance).toHaveBeenCalledWith('test-instance', undefined);
    });
  });

  describe('listInstances', () => {
    // Sample test instances with different properties for filtering tests
    const testInstances: VSCodeInstance[] = [
      {
        id: 'instance-1',
        name: 'dev-instance',
        providerInstanceId: 'docker-instance-1',
        providerType: ProviderType.DOCKER,
        status: InstanceStatus.RUNNING,
        config: {} as any,
        network: {} as any,
        resources: {} as any,
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
        config: {} as any,
        network: {} as any,
        resources: {} as any,
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
        config: {} as any,
        network: {} as any,
        resources: {} as any,
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
        config: {} as any,
        network: {} as any,
        resources: {} as any,
        metadata: { environment: 'staging', owner: 'user3' },
        createdAt: new Date('2025-04-01T00:00:00Z'),
        updatedAt: new Date()
      }
    ];

    let mockListInstances: jest.Mock;
    
    beforeEach(async () => {
      await swarmController.initialize();
      
      // Get the mock implementation
      mockListInstances = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.listInstances;
      
      // Mock registry listInstances to return our test instances
      mockListInstances.mockReturnValue([...testInstances]);
    });

    it('should list all instances when no filter is provided', async () => {
      const instances = await swarmController.listInstances();
      
      expect(instances).toHaveLength(4);
      expect(instances).toEqual(expect.arrayContaining(testInstances));
      expect(mockListInstances).toHaveBeenCalled();
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

  describe('deleteInstance', () => {
    let mockGetInstance: jest.Mock;
    let mockRemoveInstance: jest.Mock;
    
    beforeEach(async () => {
      await swarmController.initialize();
      
      // Get the mock implementations
      mockGetInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstance;
      mockRemoveInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.removeInstance;
      
      // Mock registry getInstance
      mockGetInstance.mockImplementation((instanceId: string) => {
        if (instanceId === 'non-existent-instance') {
          return null;
        }
        
        return {
          id: instanceId,
          name: 'test-instance',
          providerType: ProviderType.DOCKER,
          status: InstanceStatus.RUNNING,
          config: {} as any,
          network: {} as any,
          resources: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
    });

    it('should delete an instance successfully', async () => {
      const success = await swarmController.deleteInstance('test-instance');
      
      expect(success).toBe(true);
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.deleteInstance).toHaveBeenCalledWith('test-instance');
      expect(mockRemoveInstance).toHaveBeenCalledWith('test-instance');
    });

    it('should throw an error if instance does not exist', async () => {
      await expect(swarmController.deleteInstance('non-existent-instance'))
        .rejects.toThrow('Instance non-existent-instance not found');
      
      expect(mockGetInstance).toHaveBeenCalledWith('non-existent-instance');
      expect(mockProvider.deleteInstance).not.toHaveBeenCalled();
      expect(mockRemoveInstance).not.toHaveBeenCalled();
    });

    it('should throw an error if provider is not found', async () => {
      // Create a new swarm controller with only Docker provider
      const localSwarmController = new SwarmController({
        ...testConfig,
        providers: [
          {
            type: ProviderType.DOCKER,
            enabled: true,
            config: {}
          }
        ]
      });
      
      await localSwarmController.initialize();
      
      // Mock an instance with a non-existent provider
      mockGetInstance.mockImplementation((instanceId: string) => {
        return {
          id: instanceId,
          name: 'test-instance',
          providerType: ProviderType.FLYIO, // Different provider than what's available
          status: InstanceStatus.RUNNING,
          config: {} as any,
          network: {} as any,
          resources: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
      
      await expect(localSwarmController.deleteInstance('test-instance'))
        .rejects.toThrow('Provider flyio not found for instance test-instance');
      
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.deleteInstance).not.toHaveBeenCalled();
      expect(mockRemoveInstance).not.toHaveBeenCalled();
    });

    it('should not remove instance from registry if provider deletion fails', async () => {
      // Mock provider deleteInstance to return false (deletion failed)
      (mockProvider.deleteInstance as jest.Mock).mockResolvedValueOnce(false);
      
      const success = await swarmController.deleteInstance('test-instance');
      
      expect(success).toBe(false);
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.deleteInstance).toHaveBeenCalledWith('test-instance');
      expect(mockRemoveInstance).not.toHaveBeenCalled();
    });

    it('should handle provider failures when deleting an instance', async () => {
      // Mock provider deleteInstance to throw an error
      (mockProvider.deleteInstance as jest.Mock).mockRejectedValueOnce(new Error('Provider failure'));
      
      await expect(swarmController.deleteInstance('test-instance'))
        .rejects.toThrow('Provider failure');
      
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.deleteInstance).toHaveBeenCalledWith('test-instance');
      expect(mockRemoveInstance).not.toHaveBeenCalled();
    });
  });

  describe('updateInstance', () => {
    let mockGetInstance: jest.Mock;
    
    beforeEach(async () => {
      await swarmController.initialize();
      
      // Get the mock implementation
      mockGetInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstance;
      
      // Mock registry getInstance
      mockGetInstance.mockImplementation((instanceId: string) => {
        if (instanceId === 'non-existent-instance') {
          return null;
        }
        
        return {
          id: instanceId,
          name: 'test-instance',
          providerType: ProviderType.DOCKER,
          status: InstanceStatus.RUNNING,
          config: {
            name: 'test-instance',
            image: 'vscode:latest',
            workspacePath: '/workspace',
            resources: {
              cpu: { cores: 1 },
              memory: { min: 1024 }
            },
            network: {},
            env: {},
            extensions: []
          },
          network: {} as any,
          resources: {} as any,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
    });

    it('should update an instance successfully', async () => {
      // Get the mock implementation for updateInstance
      const mockUpdateInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.updateInstance;
      
      // Mock provider updateInstance to return an updated instance
      (mockProvider.updateInstance as jest.Mock).mockImplementation((instanceId: string, config: Partial<InstanceConfig>) => {
        return Promise.resolve({
          id: instanceId,
          name: config.name || 'test-instance',
          providerType: ProviderType.DOCKER,
          status: InstanceStatus.RUNNING,
          config: {
            name: config.name || 'test-instance',
            image: 'vscode:latest',
            workspacePath: '/workspace',
            resources: config.resources || {
              cpu: { cores: 1 },
              memory: { min: 1024 }
            },
            network: config.network || {},
            env: config.env || {},
            extensions: config.extensions || []
          },
          network: {} as any,
          resources: {} as any,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
      
      const updateConfig: Partial<InstanceConfig> = {
        name: 'updated-instance',
        resources: {
          cpu: { cores: 2 },
          memory: { min: 2048 }
        }
      };
      
      const instance = await swarmController.updateInstance('test-instance', updateConfig);
      
      expect(instance).toBeDefined();
      expect(instance.id).toBe('test-instance');
      expect(instance.name).toBe('updated-instance');
      expect(instance.config.resources.cpu.cores).toBe(2);
      expect(instance.config.resources.memory.min).toBe(2048);
      
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.updateInstance).toHaveBeenCalledWith('test-instance', updateConfig);
      expect(mockUpdateInstance).toHaveBeenCalledWith(instance);
    });

    it('should throw an error if instance does not exist', async () => {
      const updateConfig: Partial<InstanceConfig> = {
        name: 'updated-instance'
      };
      
      await expect(swarmController.updateInstance('non-existent-instance', updateConfig))
        .rejects.toThrow('Instance non-existent-instance not found');
      
      expect(mockGetInstance).toHaveBeenCalledWith('non-existent-instance');
      expect(mockProvider.updateInstance).not.toHaveBeenCalled();
    });

    it('should throw an error if provider is not found', async () => {
      // Create a new swarm controller with only Docker provider
      const localSwarmController = new SwarmController({
        ...testConfig,
        providers: [
          {
            type: ProviderType.DOCKER,
            enabled: true,
            config: {}
          }
        ]
      });
      
      await localSwarmController.initialize();
      
      // Mock an instance with a non-existent provider
      mockGetInstance.mockImplementation((instanceId: string) => {
        return {
          id: instanceId,
          name: 'test-instance',
          providerType: ProviderType.FLYIO, // Different provider than what's available
          status: InstanceStatus.RUNNING,
          config: {} as any,
          network: {} as any,
          resources: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
      
      const updateConfig: Partial<InstanceConfig> = {
        name: 'updated-instance'
      };
      
      await expect(localSwarmController.updateInstance('test-instance', updateConfig))
        .rejects.toThrow('Provider flyio not found for instance test-instance');
      
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.updateInstance).not.toHaveBeenCalled();
    });

    it('should handle provider failures when updating an instance', async () => {
      // Mock provider updateInstance to throw an error
      (mockProvider.updateInstance as jest.Mock).mockRejectedValueOnce(new Error('Provider failure'));
      
      const updateConfig: Partial<InstanceConfig> = {
        name: 'updated-instance'
      };
      
      await expect(swarmController.updateInstance('test-instance', updateConfig))
        .rejects.toThrow('Provider failure');
      
      expect(mockGetInstance).toHaveBeenCalledWith('test-instance');
      expect(mockProvider.updateInstance).toHaveBeenCalledWith('test-instance', updateConfig);
    });
  });
});

describe('getMigrationPlan', () => {
  let swarmController: SwarmController;
  let mockGetMigrationPlan: jest.Mock;
  
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test directory
    if (!fs.existsSync(testConfig.general.stateDir)) {
      fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
    }
    
    // Mock provider factory
    (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);
    
    // Create swarm controller
    swarmController = new SwarmController(testConfig);
    
    await swarmController.initialize();
    
    // Get the mock implementation
    mockGetMigrationPlan = (MigrationManager as jest.MockedClass<typeof MigrationManager>).mock.results[0].value.getMigrationPlan;
    
    // Mock getMigrationPlan to return a plan for valid IDs and null for invalid IDs
    mockGetMigrationPlan.mockImplementation((migrationId: string) => {
      if (migrationId === 'non-existent-migration') {
        return null;
      }
      
      return {
        id: migrationId,
        sourceInstanceId: 'test-instance',
        sourceProviderType: ProviderType.DOCKER,
        targetProviderType: ProviderType.FLYIO,
        strategy: MigrationStrategy.STOP_AND_RECREATE,
        keepSource: false,
        startTarget: true,
        timeoutSeconds: 300,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        steps: [],
        currentStepIndex: 0,
        status: 'pending'
      };
    });
  });

  it('should get a migration plan by ID', () => {
    const plan = swarmController.getMigrationPlan('test-migration');
    
    expect(plan).toBeDefined();
    expect(plan!.id).toBe('test-migration');
    expect(plan!.sourceInstanceId).toBe('test-instance');
    expect(plan!.sourceProviderType).toBe(ProviderType.DOCKER);
    expect(plan!.targetProviderType).toBe(ProviderType.FLYIO);
    
    expect(mockGetMigrationPlan).toHaveBeenCalledWith('test-migration');
  });

  it('should return null for non-existent migration plans', () => {
    const plan = swarmController.getMigrationPlan('non-existent-migration');
    
    expect(plan).toBeNull();
    expect(mockGetMigrationPlan).toHaveBeenCalledWith('non-existent-migration');
  });
});

describe('listMigrationPlans', () => {
  let swarmController: SwarmController;
  let mockListMigrationPlans: jest.Mock;
  
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test directory
    if (!fs.existsSync(testConfig.general.stateDir)) {
      fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
    }
    
    // Mock provider factory
    (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);
    
    // Create swarm controller
    swarmController = new SwarmController(testConfig);
    
    await swarmController.initialize();
    
    // Get the mock implementation
    mockListMigrationPlans = (MigrationManager as jest.MockedClass<typeof MigrationManager>).mock.results[0].value.listMigrationPlans;
  });

  it('should list all migration plans when no status filter is provided', () => {
    // Mock migration plans
    const mockPlans = [
      {
        id: 'migration-1',
        sourceInstanceId: 'instance-1',
        sourceProviderType: ProviderType.DOCKER,
        targetProviderType: ProviderType.FLYIO,
        strategy: MigrationStrategy.STOP_AND_RECREATE,
        keepSource: false,
        startTarget: true,
        timeoutSeconds: 300,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        steps: [],
        currentStepIndex: 0,
        status: 'completed'
      },
      {
        id: 'migration-2',
        sourceInstanceId: 'instance-2',
        sourceProviderType: ProviderType.DOCKER,
        targetProviderType: ProviderType.FLYIO,
        strategy: MigrationStrategy.CREATE_THEN_STOP,
        keepSource: true,
        startTarget: false,
        timeoutSeconds: 600,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 600000),
        steps: [],
        currentStepIndex: 0,
        status: 'pending'
      }
    ];
    
    mockListMigrationPlans.mockReturnValueOnce(mockPlans);
    
    const plans = swarmController.listMigrationPlans();
    
    expect(plans).toHaveLength(2);
    expect(plans[0].id).toBe('migration-1');
    expect(plans[1].id).toBe('migration-2');
    expect(mockListMigrationPlans).toHaveBeenCalledWith(undefined);
  });

  it('should filter migration plans by status', () => {
    // Mock migration plans filtered by status
    const mockPlans = [
      {
        id: 'migration-1',
        sourceInstanceId: 'instance-1',
        sourceProviderType: ProviderType.DOCKER,
        targetProviderType: ProviderType.FLYIO,
        strategy: MigrationStrategy.STOP_AND_RECREATE,
        keepSource: false,
        startTarget: true,
        timeoutSeconds: 300,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        steps: [],
        currentStepIndex: 0,
        status: 'completed'
      }
    ];
    
    mockListMigrationPlans.mockReturnValueOnce(mockPlans);
    
    // Use type assertion to bypass type checking in test environment
    const plans = swarmController.listMigrationPlans('completed' as any);
    
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe('migration-1');
    expect(plans[0].status).toBe('completed');
    expect(mockListMigrationPlans).toHaveBeenCalledWith('completed');
  });

  it('should return an empty array when no migration plans exist', () => {
    mockListMigrationPlans.mockReturnValueOnce([]);
    
    const plans = swarmController.listMigrationPlans();
    
    expect(plans).toHaveLength(0);
    expect(plans).toEqual([]);
    expect(mockListMigrationPlans).toHaveBeenCalledWith(undefined);
  });
});

describe('getProviderCapabilities', () => {
  let swarmController: SwarmController;
  let mockFlyProvider: Partial<Provider>;
  
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test directory
    if (!fs.existsSync(testConfig.general.stateDir)) {
      fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
    }
    
    // Create a mock Fly.io provider
    mockFlyProvider = {
      type: ProviderType.FLYIO,
      getCapabilities: jest.fn().mockReturnValue({
        supportsLiveResize: false,
        supportsSnapshotting: false,
        supportsMultiRegion: true,
        supportedRegions: ['ams', 'cdg', 'dfw', 'fra', 'lhr', 'sjc'],
        maxInstancesPerUser: 5,
        maxResourcesPerInstance: {
          cpu: { cores: 2 },
          memory: { min: 512, max: 4096 }
        }
      }),
      initialize: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock provider factory to return both Docker and Fly.io providers
    (ProviderFactory.createProvider as jest.Mock).mockImplementation((type: ProviderType) => {
      if (type === ProviderType.FLYIO) {
        return mockFlyProvider;
      }
      return mockProvider;
    });
    
    // Create swarm controller
    swarmController = new SwarmController(testConfig);
    
    await swarmController.initialize();
  });
  
  afterEach(() => {
    // Clean up
    swarmController.dispose();
    
    // Remove test directory
    if (fs.existsSync(testConfig.general.stateDir)) {
      fs.rmSync(testConfig.general.stateDir, { recursive: true, force: true });
    }
  });

  it('should get capabilities for a valid provider type', () => {
    const dockerCapabilities = swarmController.getProviderCapabilities(ProviderType.DOCKER);
    
    expect(dockerCapabilities).toBeDefined();
    expect(dockerCapabilities).not.toBeNull();
    expect(dockerCapabilities!.supportsLiveResize).toBe(true);
    expect(dockerCapabilities!.supportsSnapshotting).toBe(true);
    expect(dockerCapabilities!.supportsMultiRegion).toBe(false);
    expect(dockerCapabilities!.maxInstancesPerUser).toBe(10);
    expect(dockerCapabilities!.maxResourcesPerInstance.cpu.cores).toBe(4);
    expect(dockerCapabilities!.maxResourcesPerInstance.memory.min).toBe(1024);
    expect(dockerCapabilities!.maxResourcesPerInstance.memory.max).toBe(8192);
    
    expect(mockProvider.getCapabilities).toHaveBeenCalled();
  });
  
  it('should get capabilities for a different provider type', () => {
    const flyCapabilities = swarmController.getProviderCapabilities(ProviderType.FLYIO);
    
    expect(flyCapabilities).toBeDefined();
    expect(flyCapabilities).not.toBeNull();
    expect(flyCapabilities!.supportsLiveResize).toBe(false);
    expect(flyCapabilities!.supportsSnapshotting).toBe(false);
    expect(flyCapabilities!.supportsMultiRegion).toBe(true);
    expect(flyCapabilities!.supportedRegions).toEqual(['ams', 'cdg', 'dfw', 'fra', 'lhr', 'sjc']);
    expect(flyCapabilities!.maxInstancesPerUser).toBe(5);
    expect(flyCapabilities!.maxResourcesPerInstance.cpu.cores).toBe(2);
    expect(flyCapabilities!.maxResourcesPerInstance.memory.min).toBe(512);
    expect(flyCapabilities!.maxResourcesPerInstance.memory.max).toBe(4096);
    
    expect(mockFlyProvider.getCapabilities).toHaveBeenCalled();
  });
  
  it('should return null for an invalid provider type', async () => {
    // Create a new swarm controller with only Docker provider
    const localSwarmController = new SwarmController({
      ...testConfig,
      providers: [
        {
          type: ProviderType.DOCKER,
          enabled: true,
          config: {}
        }
      ]
    });
    
    // Initialize the controller - must await this!
    await localSwarmController.initialize();
    
    // Try to get capabilities for a non-existent provider
    const capabilities = localSwarmController.getProviderCapabilities(ProviderType.FLYIO);
    
    expect(capabilities).toBeNull();
  });
  it('should throw an error if controller is not initialized', () => {
    // Create a new swarm controller without initializing it
    const uninitializedController = new SwarmController(testConfig);
    
    // Try to get capabilities without initializing
    expect(() => {
      uninitializedController.getProviderCapabilities(ProviderType.DOCKER);
    }).toThrow('Swarm controller not initialized');
  });
  
  it('should retrieve capabilities from multiple providers', async () => {
    // Create a swarm controller with multiple providers
    const multiProviderController = new SwarmController({
      ...testConfig,
      providers: [
        {
          type: ProviderType.DOCKER,
          enabled: true,
          config: {}
        },
        {
          type: ProviderType.FLYIO,
          enabled: true,
          config: {}
        }
      ]
    });
    
    // Initialize the controller
    await multiProviderController.initialize();
    
    // Get capabilities for Docker provider
    const dockerCapabilities = multiProviderController.getProviderCapabilities(ProviderType.DOCKER);
    
    // Get capabilities for FlyIO provider
    const flyioCapabilities = multiProviderController.getProviderCapabilities(ProviderType.FLYIO);
    
    // Both providers should return capabilities
    expect(dockerCapabilities).not.toBeNull();
    expect(flyioCapabilities).not.toBeNull();
    
    // Capabilities should be different for different providers
    expect(dockerCapabilities).not.toEqual(flyioCapabilities);
  });
  
  it('should handle disabled providers when retrieving capabilities', async () => {
    // Create a swarm controller with a disabled provider
    const controllerWithDisabledProvider = new SwarmController({
      ...testConfig,
      providers: [
        {
          type: ProviderType.DOCKER,
          enabled: true,
          config: {}
        },
        {
          type: ProviderType.FLYIO,
          enabled: false, // Disabled provider
          config: {}
        }
      ]
    });
    
    // Initialize the controller
    await controllerWithDisabledProvider.initialize();
    
    // Get capabilities for Docker provider (enabled)
    const dockerCapabilities = controllerWithDisabledProvider.getProviderCapabilities(ProviderType.DOCKER);
    
    // Get capabilities for FlyIO provider (disabled)
    const flyioCapabilities = controllerWithDisabledProvider.getProviderCapabilities(ProviderType.FLYIO);
    
    // Docker provider should return capabilities
    expect(dockerCapabilities).not.toBeNull();
    
    // FlyIO provider should return null since it's disabled
    expect(flyioCapabilities).toBeNull();
  });
});

describe('dispose', () => {
  it('should dispose all resources properly', async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new swarm controller
    const swarmController = new SwarmController(testConfig);
    
    // Initialize the controller
    await swarmController.initialize();
    
    // Call dispose method
    await swarmController.dispose();
    
    // Verify that the controller is no longer initialized
    expect(() => {
      swarmController.getSwarmStatus();
    }).toThrow('Swarm controller not initialized');
  });
  
  it('should handle errors during dispose gracefully', async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new swarm controller
    const swarmController = new SwarmController(testConfig);
    
    // Initialize the controller
    await swarmController.initialize();
    
    // Mock console.error to verify it's called
    const originalConsoleError = console.error;
    const mockConsoleError = jest.fn();
    console.error = mockConsoleError;
    
    // Force an error during dispose by making healthMonitor.dispose throw
    const healthMonitor = (swarmController as any).healthMonitor;
    const originalDispose = healthMonitor.dispose;
    
    // Replace with a function that throws
    healthMonitor.dispose = function() {
      throw new Error('Failed to dispose health monitor');
    };
    
    // Call dispose method - it should not throw
    await expect(swarmController.dispose()).resolves.not.toThrow();
    
    // Verify that the controller is no longer initialized despite the error
    expect(() => {
      swarmController.getSwarmStatus();
    }).toThrow('Swarm controller not initialized');
    
    // Verify that the error was logged
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error disposing health monitor:',
      expect.objectContaining({
        message: 'Failed to dispose health monitor'
      })
    );
    
    // Restore original methods
    console.error = originalConsoleError;
    healthMonitor.dispose = originalDispose;
  });
});