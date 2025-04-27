"use strict";
/**
 * Abstract provider implementation with common functionality
 * Provides a base implementation that can be shared across provider implementations
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
exports.AbstractProvider = void 0;
const provider_types_1 = require("./provider-types");
const logger = __importStar(require("../../utils/logger"));
/**
 * Abstract provider implementation
 */
class AbstractProvider {
    /**
     * Constructor
     * @param type Provider type
     * @param config Provider configuration
     * @param loggerInstance Logger instance
     */
    constructor(type, config, loggerInstance) {
        this.type = type;
        this.config = config;
        this.logger = loggerInstance || logger;
    }
    /**
     * Initialize the provider
     */
    async initialize() {
        this.logger.info(`Initializing ${this.type} provider`);
    }
    /**
     * Generate a unique instance ID
     * @returns Unique ID
     */
    generateInstanceId() {
        return `${this.config.common.instanceNamePrefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    }
    /**
     * Validate instance configuration
     * @param config Instance configuration
     * @throws Error if configuration is invalid
     */
    validateInstanceConfig(config) {
        if (!config.name) {
            throw new Error('Instance name is required');
        }
        if (!config.image) {
            throw new Error('Instance image is required');
        }
        if (!config.workspacePath) {
            throw new Error('Workspace path is required');
        }
        // Validate resource configuration
        if (!config.resources) {
            throw new Error('Resource configuration is required');
        }
        if (!config.resources.cpu || !config.resources.cpu.cores) {
            throw new Error('CPU cores configuration is required');
        }
        if (!config.resources.memory || !config.resources.memory.min) {
            throw new Error('Memory configuration is required');
        }
    }
    /**
     * Create a base instance object
     * @param id Instance ID
     * @param name Instance name
     * @param providerInstanceId Provider-specific instance ID
     * @param config Instance configuration
     * @returns Base instance object
     */
    createBaseInstance(id, name, providerInstanceId, config) {
        return {
            id,
            name,
            providerInstanceId,
            providerType: this.type,
            status: provider_types_1.InstanceStatus.CREATING,
            config,
            resources: {
                cpu: {
                    used: 0,
                    limit: config.resources.cpu.limit || config.resources.cpu.cores * 1000
                },
                memory: {
                    used: 0,
                    limit: config.resources.memory.max || config.resources.memory.min
                },
                storage: config.resources.storage ? {
                    used: 0,
                    limit: config.resources.storage.size
                } : undefined
            },
            network: {
                internalIp: '',
                externalIp: 'localhost',
                ports: [],
                urls: []
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {}
        };
    }
}
exports.AbstractProvider = AbstractProvider;
//# sourceMappingURL=abstract-provider.js.map