/**
 * Additional tests for SwarmController to improve coverage
 * Focuses on error handling paths that aren't covered by the main test suite
 */

/// <reference types="jest" />

import { SwarmController } from '../../src/swarm/swarm-controller';
import { InstanceRegistry } from '../../src/swarm/instance-registry';
import { HealthMonitor } from '../../src/swarm/health-monitor';
import { MigrationManager } from '../../src/swarm/migration-manager';
import { ProviderFactory } from '../../src/providers/core/provider-factory';
import { ProviderType, InstanceStatus } from '../../src/providers/core/provider-types';
import { VSCodeInstance } from '../../src/providers/core/instance.interface';
import { Provider } from '../../src/providers/core/provider.interface';
import { SwarmConfig, MigrationStrategy } from '../../src/swarm/config';
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

// Create mock implementations
const mockRegistryInstance = {
  initialize: jest.fn().mockResolvedValue(undefined),
  registerInstance: jest.fn(),
  updateInstance: jest.fn(),
  removeInstance: jest.fn(),
  getInstance: jest.fn(),
  listInstances: jest.fn().mockReturnValue([]),
  getInstanceCount: jest.fn().mockReturnValue(0),
  dispose: jest.fn()
};

const mockHealthMonitorInstance = {
  initialize: jest.fn().mockResolvedValue(undefined),
  checkInstanceHealth: jest.fn(),
  recoverInstance: jest.fn(),
  dispose: jest.fn()
};

const mockMigrationManagerInstance = {
  initialize: jest.fn().mockResolvedValue(undefined),
  createMigrationPlan: jest.fn(),
  startMigration: jest.fn(),
  cancelMigration: jest.fn(),
  getMigrationPlan: jest.fn(),
  listMigrationPlans: jest.fn(),
  dispose: jest.fn()
};

// Mock the instance registry
jest.mock('../../src/swarm/instance-registry', () => {
  return {
    InstanceRegistry: jest.fn().mockImplementation(() => mockRegistryInstance)
  };
});

// Mock the health monitor
jest.mock('../../src/swarm/health-monitor', () => {
  return {
    HealthMonitor: jest.fn().mockImplementation(() => mockHealthMonitorInstance)
  };
});

// Mock the migration manager
jest.mock('../../src/swarm/migration-manager', () => {
  return {
    MigrationManager: jest.fn().mockImplementation(() => mockMigrationManagerInstance)
  };
});

// Test configuration
const testConfig: SwarmConfig = {
  general: {
    stateDir: path.join(os.tmpdir(), 'vscode-remote-swarm-test-coverage'),
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

describe('SwarmController - Coverage Improvements', () => {
  let swarmController: SwarmController;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test directory
    if (!fs.existsSync(testConfig.general.stateDir)) {
      fs.mkdirSync(testConfig.general.stateDir, { recursive: true });
    }
  });
  
  afterEach(() => {
    // Clean up
    if (swarmController) {
      swarmController.dispose();
    }
    
    // Remove test directory
    if (fs.existsSync(testConfig.general.stateDir)) {
      fs.rmSync(testConfig.general.stateDir, { recursive: true, force: true });
    }
  });
  
  describe('initialize error handling', () => {
    it('should handle errors during initialization', async () => {
      // Mock registry to throw an error
      mockRegistryInstance.initialize.mockRejectedValueOnce(new Error('Registry initialization failed'));
      
      swarmController = new SwarmController(testConfig);
      
      await expect(swarmController.initialize()).rejects.toThrow('Registry initialization failed');
    });
  });
  
  describe('provider initialization error handling', () => {
    it('should handle Docker provider initialization errors', async () => {
      // Mock provider factory to throw an error for Docker
      (ProviderFactory.createProvider as jest.Mock).mockImplementation((type: ProviderType) => {
        if (type === ProviderType.DOCKER) {
          throw new Error('Docker provider creation failed');
        }
        
        return {
          type: ProviderType.FLYIO,
          initialize: jest.fn().mockResolvedValue(undefined),
          getCapabilities: jest.fn()
        };
      });
      
      swarmController = new SwarmController(testConfig);
      
      // This should not throw since we catch provider initialization errors
      await swarmController.initialize();
      
      // Verify only Fly.io provider was initialized
      expect(swarmController['providers'].has(ProviderType.DOCKER)).toBe(false);
      expect(swarmController['providers'].has(ProviderType.FLYIO)).toBe(true);
    });
    
    it('should handle Fly.io provider initialization errors', async () => {
      // Mock provider factory to throw an error for Fly.io
      (ProviderFactory.createProvider as jest.Mock).mockImplementation((type: ProviderType) => {
        if (type === ProviderType.FLYIO) {
          throw new Error('Fly.io provider creation failed');
        }
        
        return {
          type: ProviderType.DOCKER,
          initialize: jest.fn().mockResolvedValue(undefined),
          getCapabilities: jest.fn()
        };
      });
      
      swarmController = new SwarmController(testConfig);
      
      // This should not throw since we catch provider initialization errors
      await swarmController.initialize();
      
      // Verify only Docker provider was initialized
      expect(swarmController['providers'].has(ProviderType.DOCKER)).toBe(true);
      expect(swarmController['providers'].has(ProviderType.FLYIO)).toBe(false);
    });
    
    it('should handle errors during provider initialization', async () => {
      // Mock provider factory to return a provider that throws during initialization
      const mockProvider = {
        type: ProviderType.DOCKER,
        initialize: jest.fn().mockRejectedValueOnce(new Error('Provider initialization failed')),
        getCapabilities: jest.fn()
      };
      
      // Clear previous mocks and set up new behavior
      (ProviderFactory.createProvider as jest.Mock).mockReset();
      (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);
      
      // Create a new controller with only Docker provider enabled
      const dockerOnlyConfig = {
        ...testConfig,
        providers: [
          {
            type: ProviderType.DOCKER,
            enabled: true,
            config: {}
          }
        ]
      };
      
      swarmController = new SwarmController(dockerOnlyConfig);
      
      // This should not throw since we catch provider initialization errors
      await swarmController.initialize();
      
      // Verify provider initialization was attempted
      expect(mockProvider.initialize).toHaveBeenCalled();
      
      // Verify no providers were added
      expect(swarmController['providers'].size).toBe(0);
    });
  });
  
  describe('getInstance error handling', () => {
    let mockGetInstance: jest.Mock;
    
    beforeEach(async () => {
      // Create a mock provider
      const mockProvider: Partial<Provider> = {
        type: ProviderType.DOCKER,
        initialize: jest.fn().mockResolvedValue(undefined),
        getInstance: jest.fn(),
        getCapabilities: jest.fn()
      };
      
      (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);
      
      swarmController = new SwarmController(testConfig);
      await swarmController.initialize();
      
      // Get the mock implementation
      mockGetInstance = (InstanceRegistry as jest.MockedClass<typeof InstanceRegistry>).mock.results[0].value.getInstance;
    });
    
    it('should handle missing provider gracefully', async () => {
      // Mock an instance with a provider type that doesn't exist in the controller
      mockGetInstance.mockReturnValueOnce({
        id: 'test-instance',
        name: 'test-instance',
        providerType: ProviderType.FLYIO, // We'll ensure this provider doesn't exist
        status: InstanceStatus.RUNNING
      });
      
      // Remove the Fly.io provider
      swarmController['providers'].delete(ProviderType.FLYIO);
      
      // This should not throw
      const instance = await swarmController.getInstance('test-instance');
      
      // Should return the instance from registry without provider updates
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('test-instance');
      expect(instance!.providerType).toBe(ProviderType.FLYIO);
    });
    
    it('should handle provider errors when getting instance', async () => {
      // Mock an instance
      mockGetInstance.mockReturnValueOnce({
        id: 'test-instance',
        name: 'test-instance',
        providerType: ProviderType.DOCKER,
        status: InstanceStatus.RUNNING
      });
      
      // Mock provider to throw an error
      const mockProvider = swarmController['providers'].get(ProviderType.DOCKER);
      (mockProvider!.getInstance as jest.Mock).mockRejectedValueOnce(new Error('Provider error'));
      
      // This should not throw
      const instance = await swarmController.getInstance('test-instance');
      
      // Should return the instance from registry without provider updates
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('test-instance');
    });
  });
  
  describe('dispose error handling', () => {
    it('should handle errors during disposal of components', async () => {
      // Set up mocks to throw during disposal
      mockHealthMonitorInstance.dispose.mockImplementationOnce(() => {
        throw new Error('Health monitor disposal error');
      });
      
      mockMigrationManagerInstance.dispose.mockImplementationOnce(() => {
        throw new Error('Migration manager disposal error');
      });
      
      mockRegistryInstance.dispose.mockImplementationOnce(() => {
        throw new Error('Registry disposal error');
      });
      
      swarmController = new SwarmController(testConfig);
      await swarmController.initialize();
      
      // This should not throw despite all components throwing during disposal
      await swarmController.dispose();
      
      // Verify all dispose methods were called
      expect(mockHealthMonitorInstance.dispose).toHaveBeenCalled();
      expect(mockMigrationManagerInstance.dispose).toHaveBeenCalled();
      expect(mockRegistryInstance.dispose).toHaveBeenCalled();
      
      // Verify controller is marked as not initialized
      expect(swarmController['initialized']).toBe(false);
    });
  });
});