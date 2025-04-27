/**
 * Provider factory for creating provider instances
 * Implements the factory pattern for provider selection and instantiation
 */

import { Provider, ProviderConstructor } from './provider.interface';
import { ProviderType, ProviderConfig } from './provider-types';
import * as logger from '../../utils/logger';

/**
 * Logger interface
 */
interface Logger {
  info(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
}

/**
 * Provider factory class
 */
export class ProviderFactory {
  /**
   * Registered provider constructors
   */
  private static providers: Map<ProviderType, ProviderConstructor> = new Map();
  
  /**
   * Logger instance
   */
  private static logger: Logger = logger;
  
  /**
   * Set the logger instance
   * @param loggerInstance Logger instance
   */
  public static setLogger(loggerInstance: Logger): void {
    ProviderFactory.logger = loggerInstance;
  }
  
  /**
   * Register a provider constructor
   * @param type Provider type
   * @param constructor Provider constructor
   */
  public static registerProvider(type: ProviderType, constructor: ProviderConstructor): void {
    ProviderFactory.logger.info(`Registering provider: ${type}`);
    ProviderFactory.providers.set(type, constructor);
  }
  
  /**
   * Create a provider instance
   * @param type Provider type
   * @param config Provider configuration
   * @returns Provider instance
   * @throws Error if provider type is not registered
   */
  public static createProvider(type: ProviderType, config: ProviderConfig): Provider {
    ProviderFactory.logger.info(`Creating provider: ${type}`);
    
    const constructor = ProviderFactory.providers.get(type);
    
    if (!constructor) {
      const error = `Provider type not registered: ${type}`;
      ProviderFactory.logger.error(error);
      throw new Error(error);
    }
    
    try {
      const provider = new constructor(config);
      return provider;
    } catch (error) {
      const err = error as Error;
      ProviderFactory.logger.error(`Failed to create provider: ${err.message}`, err);
      throw error;
    }
  }
  
  /**
   * Get available provider types
   * @returns Array of provider types
   */
  public static getAvailableProviders(): ProviderType[] {
    return Array.from(ProviderFactory.providers.keys());
  }
  
  /**
   * Check if a provider type is registered
   * @param type Provider type
   * @returns True if provider type is registered
   */
  public static isProviderRegistered(type: ProviderType): boolean {
    return ProviderFactory.providers.has(type);
  }
  
  /**
   * Create a provider instance and initialize it
   * @param type Provider type
   * @param config Provider configuration
   * @returns Initialized provider instance
   */
  public static async createAndInitializeProvider(type: ProviderType, config: ProviderConfig): Promise<Provider> {
    const provider = ProviderFactory.createProvider(type, config);
    
    try {
      await provider.initialize();
      return provider;
    } catch (error) {
      const err = error as Error;
      ProviderFactory.logger.error(`Failed to initialize provider: ${err.message}`, err);
      throw error;
    }
  }
  
  /**
   * Create a default provider based on environment configuration
   * @param config Provider configuration
   * @returns Provider instance
   */
  public static createDefaultProvider(config: ProviderConfig): Provider {
    // Default to Docker provider if available
    if (ProviderFactory.isProviderRegistered(ProviderType.DOCKER)) {
      return ProviderFactory.createProvider(ProviderType.DOCKER, config);
    }
    
    // Otherwise, use the first available provider
    const availableProviders = ProviderFactory.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No providers registered');
    }
    
    return ProviderFactory.createProvider(availableProviders[0], config);
  }
}