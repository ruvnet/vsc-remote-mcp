/**
 * Provider factory tests
 */

// Mock providers
const mockDockerProvider = {
  initialize: jest.fn(),
  getCapabilities: jest.fn()
};

const mockFlyProvider = {
  initialize: jest.fn(),
  getCapabilities: jest.fn()
};

// Mock provider classes
class MockDockerProvider {
  constructor(config) {
    this.config = config;
    return mockDockerProvider;
  }
}

class MockFlyProvider {
  constructor(config) {
    this.config = config;
    return mockFlyProvider;
  }
}

// Mock provider types
const ProviderType = {
  DOCKER: 'docker',
  FLY: 'fly'
};

// Mock modules
jest.mock('../../src/providers/docker/docker-provider', () => ({
  DockerProvider: MockDockerProvider
}));

jest.mock('../../src/providers/fly/fly-provider', () => ({
  FlyProvider: MockFlyProvider
}));

jest.mock('../../src/providers/core/provider-types', () => ({
  ProviderType
}));

// Import after mocking
const { ProviderFactory } = require('../../src/providers/core/provider-factory');

describe('ProviderFactory', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset factory
    ProviderFactory.reset();
  });
  
  describe('registerProvider', () => {
    it('should register a provider', () => {
      // Execute
      ProviderFactory.registerProvider(ProviderType.DOCKER, MockDockerProvider);
      
      // Verify
      expect(ProviderFactory.getProviderClass(ProviderType.DOCKER)).toBe(MockDockerProvider);
    });
    
    it('should throw an error if provider type is invalid', () => {
      // Execute & Verify
      expect(() => ProviderFactory.registerProvider('invalid', MockDockerProvider)).toThrow('Invalid provider type: invalid');
    });
    
    it('should throw an error if provider class is not a constructor', () => {
      // Execute & Verify
      expect(() => ProviderFactory.registerProvider(ProviderType.DOCKER, {})).toThrow('Provider class must be a constructor');
    });
  });
  
  describe('getProviderClass', () => {
    it('should get a registered provider class', () => {
      // Setup
      ProviderFactory.registerProvider(ProviderType.DOCKER, MockDockerProvider);
      
      // Execute
      const providerClass = ProviderFactory.getProviderClass(ProviderType.DOCKER);
      
      // Verify
      expect(providerClass).toBe(MockDockerProvider);
    });
    
    it('should throw an error if provider type is not registered', () => {
      // Execute & Verify
      expect(() => ProviderFactory.getProviderClass(ProviderType.FLY)).toThrow('Provider not registered for type: fly');
    });
  });
  
  describe('createProvider', () => {
    it('should create a provider instance', () => {
      // Setup
      ProviderFactory.registerProvider(ProviderType.DOCKER, MockDockerProvider);
      const config = {
        type: ProviderType.DOCKER,
        name: 'docker',
        region: 'local',
        specific: {
          socketPath: '/var/run/docker.sock'
        }
      };
      
      // Execute
      const provider = ProviderFactory.createProvider(config);
      
      // Verify
      expect(provider).toBe(mockDockerProvider);
    });
    
    it('should throw an error if provider type is not registered', () => {
      // Setup
      const config = {
        type: ProviderType.FLY,
        name: 'fly',
        region: 'local'
      };
      
      // Execute & Verify
      expect(() => ProviderFactory.createProvider(config)).toThrow('Provider not registered for type: fly');
    });
    
    it('should throw an error if config is invalid', () => {
      // Setup
      ProviderFactory.registerProvider(ProviderType.DOCKER, MockDockerProvider);
      
      // Execute & Verify
      expect(() => ProviderFactory.createProvider({})).toThrow('Invalid provider config: missing type');
      expect(() => ProviderFactory.createProvider({ type: ProviderType.DOCKER })).toThrow('Invalid provider config: missing name');
      expect(() => ProviderFactory.createProvider({ type: ProviderType.DOCKER, name: 'docker' })).toThrow('Invalid provider config: missing region');
    });
  });
  
  describe('getProviderTypes', () => {
    it('should get all registered provider types', () => {
      // Setup
      ProviderFactory.registerProvider(ProviderType.DOCKER, MockDockerProvider);
      ProviderFactory.registerProvider(ProviderType.FLY, MockFlyProvider);
      
      // Execute
      const types = ProviderFactory.getProviderTypes();
      
      // Verify
      expect(types).toEqual([ProviderType.DOCKER, ProviderType.FLY]);
    });
    
    it('should return an empty array if no providers are registered', () => {
      // Execute
      const types = ProviderFactory.getProviderTypes();
      
      // Verify
      expect(types).toEqual([]);
    });
  });
  
  describe('isProviderRegistered', () => {
    it('should check if a provider is registered', () => {
      // Setup
      ProviderFactory.registerProvider(ProviderType.DOCKER, MockDockerProvider);
      
      // Execute & Verify
      expect(ProviderFactory.isProviderRegistered(ProviderType.DOCKER)).toBe(true);
      expect(ProviderFactory.isProviderRegistered(ProviderType.FLY)).toBe(false);
    });
  });
});