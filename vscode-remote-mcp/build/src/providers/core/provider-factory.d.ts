/**
 * Provider factory for creating provider instances
 * Implements the factory pattern for provider selection and instantiation
 */
import { Provider, ProviderConstructor } from './provider.interface';
import { ProviderType, ProviderConfig } from './provider-types';
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
export declare class ProviderFactory {
    /**
     * Registered provider constructors
     */
    private static providers;
    /**
     * Logger instance
     */
    private static logger;
    /**
     * Set the logger instance
     * @param loggerInstance Logger instance
     */
    static setLogger(loggerInstance: Logger): void;
    /**
     * Register a provider constructor
     * @param type Provider type
     * @param constructor Provider constructor
     */
    static registerProvider(type: ProviderType, constructor: ProviderConstructor): void;
    /**
     * Create a provider instance
     * @param type Provider type
     * @param config Provider configuration
     * @returns Provider instance
     * @throws Error if provider type is not registered
     */
    static createProvider(type: ProviderType, config: ProviderConfig): Provider;
    /**
     * Get available provider types
     * @returns Array of provider types
     */
    static getAvailableProviders(): ProviderType[];
    /**
     * Check if a provider type is registered
     * @param type Provider type
     * @returns True if provider type is registered
     */
    static isProviderRegistered(type: ProviderType): boolean;
    /**
     * Create a provider instance and initialize it
     * @param type Provider type
     * @param config Provider configuration
     * @returns Initialized provider instance
     */
    static createAndInitializeProvider(type: ProviderType, config: ProviderConfig): Promise<Provider>;
    /**
     * Create a default provider based on environment configuration
     * @param config Provider configuration
     * @returns Provider instance
     */
    static createDefaultProvider(config: ProviderConfig): Provider;
}
export {};
