"use strict";
/**
 * Additional tests for SwarmController to improve coverage
 * Focuses on error handling paths that aren't covered by the main test suite
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="jest" />
const swarm_controller_1 = require("../../src/swarm/swarm-controller");
const instance_registry_1 = require("../../src/swarm/instance-registry");
const provider_factory_1 = require("../../src/providers/core/provider-factory");
const provider_types_1 = require("../../src/providers/core/provider-types");
const config_1 = require("../../src/swarm/config");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
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
const testConfig = {
    general: {
        stateDir: path.join(os.tmpdir(), 'vscode-remote-swarm-test-coverage'),
        defaultProviderType: provider_types_1.ProviderType.DOCKER,
        loadStateOnStartup: false,
        autoSaveIntervalMs: 0
    },
    providers: [
        {
            type: provider_types_1.ProviderType.DOCKER,
            enabled: true,
            config: {}
        },
        {
            type: provider_types_1.ProviderType.FLYIO,
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
        defaultStrategy: config_1.MigrationStrategy.STOP_AND_RECREATE,
        timeoutMs: 300000
    }
};
describe('SwarmController - Coverage Improvements', () => {
    let swarmController;
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
            swarmController = new swarm_controller_1.SwarmController(testConfig);
            await expect(swarmController.initialize()).rejects.toThrow('Registry initialization failed');
        });
    });
    describe('provider initialization error handling', () => {
        it('should handle Docker provider initialization errors', async () => {
            // Mock provider factory to throw an error for Docker
            provider_factory_1.ProviderFactory.createProvider.mockImplementation((type) => {
                if (type === provider_types_1.ProviderType.DOCKER) {
                    throw new Error('Docker provider creation failed');
                }
                return {
                    type: provider_types_1.ProviderType.FLYIO,
                    initialize: jest.fn().mockResolvedValue(undefined),
                    getCapabilities: jest.fn()
                };
            });
            swarmController = new swarm_controller_1.SwarmController(testConfig);
            // This should not throw since we catch provider initialization errors
            await swarmController.initialize();
            // Verify only Fly.io provider was initialized
            expect(swarmController['providers'].has(provider_types_1.ProviderType.DOCKER)).toBe(false);
            expect(swarmController['providers'].has(provider_types_1.ProviderType.FLYIO)).toBe(true);
        });
        it('should handle Fly.io provider initialization errors', async () => {
            // Mock provider factory to throw an error for Fly.io
            provider_factory_1.ProviderFactory.createProvider.mockImplementation((type) => {
                if (type === provider_types_1.ProviderType.FLYIO) {
                    throw new Error('Fly.io provider creation failed');
                }
                return {
                    type: provider_types_1.ProviderType.DOCKER,
                    initialize: jest.fn().mockResolvedValue(undefined),
                    getCapabilities: jest.fn()
                };
            });
            swarmController = new swarm_controller_1.SwarmController(testConfig);
            // This should not throw since we catch provider initialization errors
            await swarmController.initialize();
            // Verify only Docker provider was initialized
            expect(swarmController['providers'].has(provider_types_1.ProviderType.DOCKER)).toBe(true);
            expect(swarmController['providers'].has(provider_types_1.ProviderType.FLYIO)).toBe(false);
        });
        it('should handle errors during provider initialization', async () => {
            // Mock provider factory to return a provider that throws during initialization
            const mockProvider = {
                type: provider_types_1.ProviderType.DOCKER,
                initialize: jest.fn().mockRejectedValueOnce(new Error('Provider initialization failed')),
                getCapabilities: jest.fn()
            };
            // Clear previous mocks and set up new behavior
            provider_factory_1.ProviderFactory.createProvider.mockReset();
            provider_factory_1.ProviderFactory.createProvider.mockReturnValue(mockProvider);
            // Create a new controller with only Docker provider enabled
            const dockerOnlyConfig = {
                ...testConfig,
                providers: [
                    {
                        type: provider_types_1.ProviderType.DOCKER,
                        enabled: true,
                        config: {}
                    }
                ]
            };
            swarmController = new swarm_controller_1.SwarmController(dockerOnlyConfig);
            // This should not throw since we catch provider initialization errors
            await swarmController.initialize();
            // Verify provider initialization was attempted
            expect(mockProvider.initialize).toHaveBeenCalled();
            // Verify no providers were added
            expect(swarmController['providers'].size).toBe(0);
        });
    });
    describe('getInstance error handling', () => {
        let mockGetInstance;
        beforeEach(async () => {
            // Create a mock provider
            const mockProvider = {
                type: provider_types_1.ProviderType.DOCKER,
                initialize: jest.fn().mockResolvedValue(undefined),
                getInstance: jest.fn(),
                getCapabilities: jest.fn()
            };
            provider_factory_1.ProviderFactory.createProvider.mockReturnValue(mockProvider);
            swarmController = new swarm_controller_1.SwarmController(testConfig);
            await swarmController.initialize();
            // Get the mock implementation
            mockGetInstance = instance_registry_1.InstanceRegistry.mock.results[0].value.getInstance;
        });
        it('should handle missing provider gracefully', async () => {
            // Mock an instance with a provider type that doesn't exist in the controller
            mockGetInstance.mockReturnValueOnce({
                id: 'test-instance',
                name: 'test-instance',
                providerType: provider_types_1.ProviderType.FLYIO, // We'll ensure this provider doesn't exist
                status: provider_types_1.InstanceStatus.RUNNING
            });
            // Remove the Fly.io provider
            swarmController['providers'].delete(provider_types_1.ProviderType.FLYIO);
            // This should not throw
            const instance = await swarmController.getInstance('test-instance');
            // Should return the instance from registry without provider updates
            expect(instance).toBeDefined();
            expect(instance.id).toBe('test-instance');
            expect(instance.providerType).toBe(provider_types_1.ProviderType.FLYIO);
        });
        it('should handle provider errors when getting instance', async () => {
            // Mock an instance
            mockGetInstance.mockReturnValueOnce({
                id: 'test-instance',
                name: 'test-instance',
                providerType: provider_types_1.ProviderType.DOCKER,
                status: provider_types_1.InstanceStatus.RUNNING
            });
            // Mock provider to throw an error
            const mockProvider = swarmController['providers'].get(provider_types_1.ProviderType.DOCKER);
            mockProvider.getInstance.mockRejectedValueOnce(new Error('Provider error'));
            // This should not throw
            const instance = await swarmController.getInstance('test-instance');
            // Should return the instance from registry without provider updates
            expect(instance).toBeDefined();
            expect(instance.id).toBe('test-instance');
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
            swarmController = new swarm_controller_1.SwarmController(testConfig);
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
//# sourceMappingURL=swarm-controller-coverage.test.js.map