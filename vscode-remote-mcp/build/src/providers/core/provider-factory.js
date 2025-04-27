"use strict";
/**
 * Provider factory for creating provider instances
 * Implements the factory pattern for provider selection and instantiation
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
exports.ProviderFactory = void 0;
const provider_types_1 = require("./provider-types");
const logger = __importStar(require("../../utils/logger"));
/**
 * Provider factory class
 */
class ProviderFactory {
    /**
     * Set the logger instance
     * @param loggerInstance Logger instance
     */
    static setLogger(loggerInstance) {
        ProviderFactory.logger = loggerInstance;
    }
    /**
     * Register a provider constructor
     * @param type Provider type
     * @param constructor Provider constructor
     */
    static registerProvider(type, constructor) {
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
    static createProvider(type, config) {
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
        }
        catch (error) {
            const err = error;
            ProviderFactory.logger.error(`Failed to create provider: ${err.message}`, err);
            throw error;
        }
    }
    /**
     * Get available provider types
     * @returns Array of provider types
     */
    static getAvailableProviders() {
        return Array.from(ProviderFactory.providers.keys());
    }
    /**
     * Check if a provider type is registered
     * @param type Provider type
     * @returns True if provider type is registered
     */
    static isProviderRegistered(type) {
        return ProviderFactory.providers.has(type);
    }
    /**
     * Create a provider instance and initialize it
     * @param type Provider type
     * @param config Provider configuration
     * @returns Initialized provider instance
     */
    static async createAndInitializeProvider(type, config) {
        const provider = ProviderFactory.createProvider(type, config);
        try {
            await provider.initialize();
            return provider;
        }
        catch (error) {
            const err = error;
            ProviderFactory.logger.error(`Failed to initialize provider: ${err.message}`, err);
            throw error;
        }
    }
    /**
     * Create a default provider based on environment configuration
     * @param config Provider configuration
     * @returns Provider instance
     */
    static createDefaultProvider(config) {
        // Default to Docker provider if available
        if (ProviderFactory.isProviderRegistered(provider_types_1.ProviderType.DOCKER)) {
            return ProviderFactory.createProvider(provider_types_1.ProviderType.DOCKER, config);
        }
        // Otherwise, use the first available provider
        const availableProviders = ProviderFactory.getAvailableProviders();
        if (availableProviders.length === 0) {
            throw new Error('No providers registered');
        }
        return ProviderFactory.createProvider(availableProviders[0], config);
    }
}
exports.ProviderFactory = ProviderFactory;
/**
 * Registered provider constructors
 */
ProviderFactory.providers = new Map();
/**
 * Logger instance
 */
ProviderFactory.logger = logger;
//# sourceMappingURL=provider-factory.js.map