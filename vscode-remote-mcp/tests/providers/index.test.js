/**
 * Provider module tests
 * This file runs all provider-related tests
 */

// Import all provider tests
require('./provider-factory.test');
require('./abstract-provider.test');
require('./docker-provider.test');

describe('Provider Module', () => {
  it('should export all provider components', () => {
    // Import the providers module
    const providers = require('../../src/providers');
    
    // Verify core exports
    expect(providers.Provider).toBeDefined();
    expect(providers.AbstractProvider).toBeDefined();
    expect(providers.ProviderFactory).toBeDefined();
    expect(providers.ProviderType).toBeDefined();
    expect(providers.InstanceStatus).toBeDefined();
    
    // Verify Docker provider exports
    expect(providers.DockerProvider).toBeDefined();
    
    // Verify factory registration
    expect(providers.ProviderFactory.isProviderRegistered(providers.ProviderType.DOCKER)).toBe(true);
  });
});