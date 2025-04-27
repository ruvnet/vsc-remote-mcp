/**
 * Providers module
 * Exports all provider components and registers them with the factory
 */
export * from './core/provider.interface';
export * from './core/instance.interface';
export * from './core/provider-types';
export * from './core/provider-factory';
export * from './core/abstract-provider';
export * from './docker';
import './docker';
import { ProviderFactory } from './core/provider-factory';
export { ProviderFactory };
