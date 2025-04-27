"use strict";
/**
 * Fly.io Client for VSCode Remote Swarm
 *
 * This module provides a TypeScript client for interacting with the Fly.io API
 * through the fly-admin package. It handles machine creation/deletion, app management,
 * IP address allocation, and volume management.
 *
 * @module fly-client
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlyClient = exports.VolumeState = exports.MachineState = exports.AppStatus = exports.FlyError = exports.FlyErrorCode = exports.FlyErrorCategory = void 0;
const fly_admin_1 = require("fly-admin");
/**
 * Default logger implementation
 */
class DefaultLogger {
    debug(message, context) {
        console.debug(`[FlyClient] ${message}`, context);
    }
    info(message, context) {
        console.info(`[FlyClient] ${message}`, context);
    }
    warn(message, context) {
        console.warn(`[FlyClient] ${message}`, context);
    }
    error(message, error, context) {
        console.error(`[FlyClient] ${message}`, error, context);
    }
}
/**
 * Error categories for Fly.io client
 */
var FlyErrorCategory;
(function (FlyErrorCategory) {
    FlyErrorCategory["AUTHENTICATION"] = "AUTHENTICATION";
    FlyErrorCategory["RESOURCE"] = "RESOURCE";
    FlyErrorCategory["NETWORK"] = "NETWORK";
    FlyErrorCategory["API"] = "API";
    FlyErrorCategory["RATE_LIMIT"] = "RATE_LIMIT";
    FlyErrorCategory["INTERNAL"] = "INTERNAL";
})(FlyErrorCategory || (exports.FlyErrorCategory = FlyErrorCategory = {}));
/**
 * Error codes for Fly.io client
 */
var FlyErrorCode;
(function (FlyErrorCode) {
    // Authentication errors
    FlyErrorCode["AUTH_INVALID_TOKEN"] = "AUTH_INVALID_TOKEN";
    FlyErrorCode["AUTH_EXPIRED_TOKEN"] = "AUTH_EXPIRED_TOKEN";
    FlyErrorCode["AUTH_INSUFFICIENT_PERMISSIONS"] = "AUTH_INSUFFICIENT_PERMISSIONS";
    // Resource errors
    FlyErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    FlyErrorCode["RESOURCE_ALREADY_EXISTS"] = "RESOURCE_ALREADY_EXISTS";
    FlyErrorCode["RESOURCE_LIMIT_EXCEEDED"] = "RESOURCE_LIMIT_EXCEEDED";
    // Network errors
    FlyErrorCode["NETWORK_CONNECTION_FAILED"] = "NETWORK_CONNECTION_FAILED";
    FlyErrorCode["NETWORK_TIMEOUT"] = "NETWORK_TIMEOUT";
    // API errors
    FlyErrorCode["API_INVALID_REQUEST"] = "API_INVALID_REQUEST";
    FlyErrorCode["API_UNSUPPORTED_OPERATION"] = "API_UNSUPPORTED_OPERATION";
    // Rate limit errors
    FlyErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // Internal errors
    FlyErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(FlyErrorCode || (exports.FlyErrorCode = FlyErrorCode = {}));
/**
 * Custom error class for Fly.io client errors
 */
class FlyError extends Error {
    constructor(options) {
        super(options.message);
        this.name = 'FlyError';
        this.code = options.code;
        this.category = options.category;
        this.retryable = options.retryable;
        this.cause = options.cause;
        this.context = options.context;
    }
}
exports.FlyError = FlyError;
/**
 * App status enum
 */
var AppStatus;
(function (AppStatus) {
    AppStatus["PENDING"] = "pending";
    AppStatus["RUNNING"] = "running";
    AppStatus["STOPPED"] = "stopped";
    AppStatus["ERROR"] = "error";
})(AppStatus || (exports.AppStatus = AppStatus = {}));
/**
 * Machine state enum
 */
var MachineState;
(function (MachineState) {
    MachineState["CREATED"] = "created";
    MachineState["STARTING"] = "starting";
    MachineState["STARTED"] = "started";
    MachineState["STOPPING"] = "stopping";
    MachineState["STOPPED"] = "stopped";
    MachineState["DESTROYING"] = "destroying";
    MachineState["DESTROYED"] = "destroyed";
    MachineState["CRASHED"] = "crashed";
    MachineState["FAILED"] = "failed";
})(MachineState || (exports.MachineState = MachineState = {}));
/**
 * Volume state enum
 */
var VolumeState;
(function (VolumeState) {
    VolumeState["CREATED"] = "created";
    VolumeState["ATTACHING"] = "attaching";
    VolumeState["ATTACHED"] = "attached";
    VolumeState["DETACHING"] = "detaching";
    VolumeState["DETACHED"] = "detached";
    VolumeState["DESTROYING"] = "destroying";
    VolumeState["DESTROYED"] = "destroyed";
})(VolumeState || (exports.VolumeState = VolumeState = {}));
/**
 * Default configuration for the Fly.io client
 */
const DEFAULT_CONFIG = {
    defaultRegion: 'ams',
    regions: ['ams', 'sea', 'sjc', 'ewr', 'ord', 'syd', 'hkg', 'nrt', 'fra'],
    retryOptions: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffFactor: 2
    }
};
/**
 * Generate a random ID for resources
 * @returns Random ID string
 */
function generateId() {
    return Math.random().toString(36).substring(2, 10);
}
/**
 * Map API error to FlyError
 * @param apiError API error
 * @returns Mapped FlyError
 */
function mapApiErrorToFlyError(apiError) {
    // Check for authentication errors
    if (apiError.status === 401) {
        return new FlyError({
            message: 'Invalid or expired API token',
            code: FlyErrorCode.AUTH_INVALID_TOKEN,
            category: FlyErrorCategory.AUTHENTICATION,
            retryable: false,
            cause: apiError
        });
    }
    // Check for resource not found
    if (apiError.status === 404) {
        return new FlyError({
            message: 'Resource not found',
            code: FlyErrorCode.RESOURCE_NOT_FOUND,
            category: FlyErrorCategory.RESOURCE,
            retryable: false,
            cause: apiError
        });
    }
    // Check for rate limiting
    if (apiError.status === 429) {
        return new FlyError({
            message: 'Rate limit exceeded',
            code: FlyErrorCode.RATE_LIMIT_EXCEEDED,
            category: FlyErrorCategory.RATE_LIMIT,
            retryable: true,
            cause: apiError
        });
    }
    // Default to internal error
    return new FlyError({
        message: apiError.message || 'Unknown Fly.io API error',
        code: FlyErrorCode.INTERNAL_ERROR,
        category: FlyErrorCategory.INTERNAL,
        retryable: true,
        cause: apiError
    });
}
/**
 * Retry an operation with exponential backoff
 * @param operation Operation to retry
 * @param options Retry options
 * @returns Operation result
 * @throws Last error encountered
 */
async function retryWithBackoff(operation, options) {
    let retries = 0;
    let lastError = null;
    while (retries <= options.maxRetries) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            // Don't retry if error is not retryable
            if (error instanceof FlyError && !error.retryable) {
                throw error;
            }
            if (retries >= options.maxRetries) {
                break;
            }
            // Calculate delay with exponential backoff
            const delay = Math.min(options.initialDelayMs * Math.pow(options.backoffFactor, retries), options.maxDelayMs);
            // Wait for the calculated delay
            await new Promise(resolve => setTimeout(resolve, delay));
            retries++;
        }
    }
    throw lastError;
}
/**
 * Fly.io client for interacting with the Fly.io API
 */
class FlyClient {
    /**
     * Create a new Fly.io client
     * @param apiToken Fly.io API token
     * @param config Client configuration
     */
    constructor(apiToken, config) {
        this.apiToken = apiToken;
        this.config = this.mergeWithDefaultConfig(config);
        this.logger = this.config.logger || new DefaultLogger();
        this.flyAdmin = (0, fly_admin_1.createClient)(apiToken);
    }
    /**
     * Merge provided configuration with default configuration
     * @param config Partial configuration
     * @returns Complete configuration
     */
    mergeWithDefaultConfig(config) {
        return {
            ...DEFAULT_CONFIG,
            ...config,
            retryOptions: {
                ...DEFAULT_CONFIG.retryOptions,
                ...config?.retryOptions
            }
        };
    }
    /**
     * Execute an operation with retry logic
     * @param operation Operation to execute
     * @returns Operation result
     */
    async executeWithRetry(operation) {
        return retryWithBackoff(operation, this.config.retryOptions);
    }
    /**
     * Validate the API token
     * @returns True if token is valid
     */
    async validateToken() {
        try {
            await this.flyAdmin.App.listApps();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    // App Management Methods
    /**
     * Create a new app
     * @param options App creation options
     * @returns Created app
     */
    async createApp(options) {
        this.logger.info(`Creating app: ${options.name}`, options);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.App.createApp({
                name: options.name,
                organization_id: options.organization || this.config.organization
            }));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to create app: ${options.name}`, flyError);
            throw flyError;
        }
    }
    /**
     * Get app details
     * @param appName App name
     * @returns App details or null if not found
     */
    async getApp(appName) {
        this.logger.info(`Getting app: ${appName}`);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.App.getApp(appName));
        }
        catch (error) {
            if (error.status === 404) {
                return null;
            }
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to get app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * List all apps
     * @returns List of apps
     */
    async listApps() {
        this.logger.info('Listing apps');
        try {
            return await this.executeWithRetry(() => this.flyAdmin.App.listApps());
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error('Failed to list apps', flyError);
            throw flyError;
        }
    }
    /**
     * Delete an app
     * @param appName App name
     */
    async deleteApp(appName) {
        this.logger.info(`Deleting app: ${appName}`);
        try {
            await this.executeWithRetry(() => this.flyAdmin.App.deleteApp(appName));
        }
        catch (error) {
            if (error.status === 404) {
                this.logger.warn(`App not found: ${appName}`);
                return;
            }
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to delete app: ${appName}`, flyError);
            throw flyError;
        }
    }
    // Machine Management Methods
    /**
     * Create a new machine
     * @param options Machine creation options
     * @returns Created machine
     */
    async createMachine(options) {
        this.logger.info(`Creating machine for app: ${options.app_name}`, options);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.Machine.createMachine(options));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to create machine for app: ${options.app_name}`, flyError);
            throw flyError;
        }
    }
    /**
     * Get machine details
     * @param appName App name
     * @param machineId Machine ID
     * @returns Machine details or null if not found
     */
    async getMachine(appName, machineId) {
        this.logger.info(`Getting machine: ${machineId} for app: ${appName}`);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.Machine.getMachine(appName, machineId));
        }
        catch (error) {
            if (error.status === 404) {
                return null;
            }
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to get machine: ${machineId} for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * List all machines for an app
     * @param appName App name
     * @returns List of machines
     */
    async listMachines(appName) {
        this.logger.info(`Listing machines for app: ${appName}`);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.Machine.listMachines(appName));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to list machines for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * Start a machine
     * @param appName App name
     * @param machineId Machine ID
     */
    async startMachine(appName, machineId) {
        this.logger.info(`Starting machine: ${machineId} for app: ${appName}`);
        try {
            await this.executeWithRetry(() => this.flyAdmin.Machine.startMachine(appName, machineId));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to start machine: ${machineId} for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * Stop a machine
     * @param appName App name
     * @param machineId Machine ID
     */
    async stopMachine(appName, machineId) {
        this.logger.info(`Stopping machine: ${machineId} for app: ${appName}`);
        try {
            await this.executeWithRetry(() => this.flyAdmin.Machine.stopMachine(appName, machineId));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to stop machine: ${machineId} for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * Restart a machine
     * @param appName App name
     * @param machineId Machine ID
     */
    async restartMachine(appName, machineId) {
        this.logger.info(`Restarting machine: ${machineId} for app: ${appName}`);
        try {
            await this.executeWithRetry(() => this.flyAdmin.Machine.restartMachine(appName, machineId));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to restart machine: ${machineId} for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * Delete a machine
     * @param appName App name
     * @param machineId Machine ID
     */
    async deleteMachine(appName, machineId) {
        this.logger.info(`Deleting machine: ${machineId} for app: ${appName}`);
        try {
            await this.executeWithRetry(() => this.flyAdmin.Machine.deleteMachine(appName, machineId));
        }
        catch (error) {
            if (error.status === 404) {
                this.logger.warn(`Machine not found: ${machineId} for app: ${appName}`);
                return;
            }
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to delete machine: ${machineId} for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    // IP Address Management Methods
    /**
     * Allocate an IP address
     * @param options IP allocation options
     * @returns Allocated IP address
     */
    async allocateIpAddress(options) {
        this.logger.info(`Allocating ${options.type} IP address for app: ${options.app_name}`);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.Network.allocateIpAddress(options));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to allocate IP address for app: ${options.app_name}`, flyError);
            throw flyError;
        }
    }
    /**
     * Release an IP address
     * @param appName App name
     * @param ipId IP address ID
     */
    async releaseIpAddress(appName, ipId) {
        this.logger.info(`Releasing IP address: ${ipId} for app: ${appName}`);
        try {
            await this.executeWithRetry(() => this.flyAdmin.Network.releaseIpAddress(appName, ipId));
        }
        catch (error) {
            if (error.status === 404) {
                this.logger.warn(`IP address not found: ${ipId} for app: ${appName}`);
                return;
            }
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to release IP address: ${ipId} for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * List IP addresses for an app
     * @param appName App name
     * @returns List of IP addresses
     */
    async listIpAddresses(appName) {
        this.logger.info(`Listing IP addresses for app: ${appName}`);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.Network.listIpAddresses(appName));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to list IP addresses for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    // Volume Management Methods
    /**
     * Create a volume
     * @param options Volume creation options
     * @returns Created volume
     */
    async createVolume(options) {
        this.logger.info(`Creating volume: ${options.name} for app: ${options.app_name}`, options);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.Volume.createVolume(options));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to create volume: ${options.name} for app: ${options.app_name}`, flyError);
            throw flyError;
        }
    }
    /**
     * Get volume details
     * @param appName App name
     * @param volumeId Volume ID
     * @returns Volume details or null if not found
     */
    async getVolume(appName, volumeId) {
        this.logger.info(`Getting volume: ${volumeId} for app: ${appName}`);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.Volume.getVolume(appName, volumeId));
        }
        catch (error) {
            if (error.status === 404) {
                return null;
            }
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to get volume: ${volumeId} for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * List volumes for an app
     * @param appName App name
     * @returns List of volumes
     */
    async listVolumes(appName) {
        this.logger.info(`Listing volumes for app: ${appName}`);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.Volume.listVolumes(appName));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to list volumes for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * Extend a volume
     * @param appName App name
     * @param volumeId Volume ID
     * @param sizeGb New size in GB
     * @returns Updated volume
     */
    async extendVolume(appName, volumeId, sizeGb) {
        this.logger.info(`Extending volume: ${volumeId} for app: ${appName} to ${sizeGb}GB`);
        try {
            return await this.executeWithRetry(() => this.flyAdmin.Volume.extendVolume(appName, volumeId, { size_gb: sizeGb }));
        }
        catch (error) {
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to extend volume: ${volumeId} for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * Delete a volume
     * @param appName App name
     * @param volumeId Volume ID
     */
    async deleteVolume(appName, volumeId) {
        this.logger.info(`Deleting volume: ${volumeId} for app: ${appName}`);
        try {
            await this.executeWithRetry(() => this.flyAdmin.Volume.deleteVolume(appName, volumeId));
        }
        catch (error) {
            if (error.status === 404) {
                this.logger.warn(`Volume not found: ${volumeId} for app: ${appName}`);
                return;
            }
            const flyError = mapApiErrorToFlyError(error);
            this.logger.error(`Failed to delete volume: ${volumeId} for app: ${appName}`, flyError);
            throw flyError;
        }
    }
    /**
     * Create a VSCode instance
     * @param options VSCode instance options
     * @returns Created instance details
     */
    async createVSCodeInstance(options) {
        const name = options.name || `vscode-${generateId()}`;
        const region = options.region || this.config.defaultRegion;
        const cpus = options.cpus || 1;
        const memoryMb = options.memoryMb || 2048;
        const volumeSizeGb = options.volumeSizeGb || 10;
        this.logger.info(`Creating VSCode instance: ${name}`, options);
        // Create app
        const app = await this.createApp({
            name,
            region
        });
        try {
            // Create volume
            const volume = await this.createVolume({
                app_name: app.name,
                name: `${name}-data`,
                size_gb: volumeSizeGb,
                region
            });
            // Create machine
            const machine = await this.createMachine({
                app_name: app.name,
                region,
                config: {
                    image: 'codercom/code-server:latest',
                    guest: {
                        cpus,
                        memory_mb: memoryMb,
                        cpu_kind: cpus > 1 ? 'performance' : 'shared'
                    },
                    env: {
                        PASSWORD: generateId(),
                        ...options.env
                    },
                    services: [
                        {
                            ports: [
                                {
                                    port: 8080,
                                    handlers: ['http']
                                }
                            ],
                            protocol: 'tcp',
                            internal_port: 8080
                        }
                    ],
                    mounts: [
                        {
                            volume: volume.name,
                            path: '/home/coder/project'
                        }
                    ]
                }
            });
            // Allocate IP address
            const ipAddress = await this.allocateIpAddress({
                app_name: app.name,
                type: 'v4'
            });
            return {
                app,
                machine,
                volume,
                ipAddress,
                url: `http://${ipAddress.address}:8080`
            };
        }
        catch (error) {
            // Clean up resources on failure
            this.logger.error(`Failed to create VSCode instance: ${name}`, error);
            await this.deleteApp(app.name).catch(e => this.logger.error(`Failed to clean up app: ${app.name}`, e));
            throw error;
        }
    }
}
exports.FlyClient = FlyClient;
//# sourceMappingURL=client.js.map