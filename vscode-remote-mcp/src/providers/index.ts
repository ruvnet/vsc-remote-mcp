/**
 * Providers module
 * Exports all provider components and registers them with the factory
 */

// Export core provider interfaces and types
export * from './core/provider.interface';
export * from './core/instance.interface';
export * from './core/provider-types';
export * from './core/provider-factory';
export * from './core/abstract-provider';

// Export Docker provider
export * from './docker';

// Import and register all providers
import './docker';

// Export provider factory for convenience
import { ProviderFactory } from './core/provider-factory';
export { ProviderFactory };