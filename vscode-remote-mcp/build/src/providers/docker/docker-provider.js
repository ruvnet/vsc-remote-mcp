"use strict";
/**
 * Docker provider implementation
 * Implements the Provider interface for Docker-based VSCode instances
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
exports.DockerProvider = void 0;
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const abstract_provider_1 = require("../core/abstract-provider");
const provider_types_1 = require("../core/provider-types");
const docker_command_1 = require("./docker-command");
const container_utils_1 = require("./container-utils");
const instance_storage_1 = require("./instance-storage");
const log_parser_1 = require("./log-parser");
const loggerModule = __importStar(require("../../utils/logger"));
/**
 * Docker provider implementation
 */
class DockerProvider extends abstract_provider_1.AbstractProvider {
    /**
     * Constructor
     * @param config Provider configuration
     */
    constructor(config) {
        super(provider_types_1.ProviderType.DOCKER, config);
        // Set Docker-specific configuration
        this.dockerConfig = {
            socketPath: config.specific.socketPath || '/var/run/docker.sock',
            apiVersion: config.specific.apiVersion || '1.41',
            networkName: config.specific.networkName || 'vscode-remote-network',
            volumeDriver: config.specific.volumeDriver || 'local',
            imageRepository: config.specific.imageRepository || 'codercom/code-server',
            imageTag: config.specific.imageTag || 'latest'
        };
        // Initialize utilities
        this.dockerExecutor = new docker_command_1.DockerCommandExecutor(loggerModule);
        this.containerUtils = new container_utils_1.ContainerUtils(this.dockerConfig, this.dockerExecutor, loggerModule);
        this.instanceStorage = new instance_storage_1.InstanceStorage(path.join(process.cwd(), 'vscode-instances'), loggerModule);
        this.logParser = new log_parser_1.DockerLogParser();
    }
    /**
     * Initialize the provider
     */
    async initialize() {
        await super.initialize();
        // Check Docker connection
        try {
            const isAvailable = await this.dockerExecutor.isDockerAvailable();
            if (!isAvailable) {
                throw new Error('Docker is not available');
            }
            this.logger.info('Docker connection successful');
        }
        catch (error) {
            const err = error;
            this.logger.error(`Docker connection failed: ${err.message}`);
            throw new Error(`Failed to connect to Docker: ${err.message}`);
        }
        // Create Docker network if it doesn't exist
        const networkExists = await this.dockerExecutor.networkExists(this.dockerConfig.networkName);
        if (!networkExists) {
            this.logger.info(`Creating Docker network: ${this.dockerConfig.networkName}`);
            await this.dockerExecutor.createNetwork(this.dockerConfig.networkName);
        }
    }
    /**
     * Get provider capabilities
     */
    getCapabilities() {
        return {
            supportsLiveResize: false,
            supportsSnapshotting: false,
            supportsMultiRegion: false,
            maxInstancesPerUser: 10,
            maxResourcesPerInstance: {
                cpu: {
                    cores: 4
                },
                memory: {
                    min: 512,
                    max: 8192
                },
                storage: {
                    size: 10,
                    persistent: true
                }
            }
        };
    }
    /**
     * Create a new VSCode instance
     * @param config Instance configuration
     * @returns Created instance
     */
    async createInstance(config) {
        this.logger.info(`Creating Docker instance: ${config.name}`);
        // Validate configuration
        this.validateInstanceConfig(config);
        // Generate instance ID
        const instanceId = this.generateInstanceId();
        // Create base instance
        const instance = this.createBaseInstance(instanceId, config.name, instanceId, // Use instance ID as provider instance ID for now
        config);
        try {
            // Create container
            const containerId = await this.containerUtils.createContainer(instance.name, config);
            // Update instance metadata
            instance.metadata = {
                containerId,
                imageId: `${this.dockerConfig.imageRepository}:${this.dockerConfig.imageTag}`
            };
            // Start container
            await this.containerUtils.startContainer(containerId);
            // Get container info
            const containerInfo = await this.containerUtils.getContainerInfo(containerId);
            // Update instance with container info
            instance.status = provider_types_1.InstanceStatus.RUNNING;
            instance.network.internalIp = containerInfo.networkSettings.ipAddress;
            instance.network.ports = containerInfo.networkSettings.ports.map(port => ({
                internal: port.internal,
                external: port.external,
                protocol: port.protocol
            }));
            // Generate access URLs
            instance.network.urls = this.generateAccessUrls(instance);
            // Save instance
            await this.instanceStorage.saveInstance(instance);
            return instance;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to create Docker instance: ${err.message}`);
            // Update instance status
            instance.status = provider_types_1.InstanceStatus.FAILED;
            instance.metadata = {
                ...instance.metadata,
                error: err.message
            };
            // Save instance
            await this.instanceStorage.saveInstance(instance);
            throw new Error(`Failed to create Docker instance: ${err.message}`);
        }
    }
    /**
     * Get an instance by ID
     * @param instanceId Instance ID
     * @returns Instance or null if not found
     */
    async getInstance(instanceId) {
        this.logger.info(`Getting Docker instance: ${instanceId}`);
        try {
            // Load instance from file
            const instance = await this.instanceStorage.loadInstance(instanceId);
            if (!instance) {
                return null;
            }
            // Get container info if instance is not deleted
            if (instance.status !== provider_types_1.InstanceStatus.DELETED) {
                const metadata = instance.metadata;
                try {
                    const containerInfo = await this.containerUtils.getContainerInfo(metadata.containerId);
                    // Update instance status based on container status
                    instance.status = this.containerUtils.mapContainerStatusToInstanceStatus(containerInfo.state);
                    // Update instance network info
                    instance.network.internalIp = containerInfo.networkSettings.ipAddress;
                    instance.network.ports = containerInfo.networkSettings.ports.map(port => ({
                        internal: port.internal,
                        external: port.external,
                        protocol: port.protocol
                    }));
                    // Update instance resource usage
                    instance.resources.cpu.used = containerInfo.stats.cpuUsage;
                    instance.resources.memory.used = containerInfo.stats.memoryUsage;
                    // Update instance
                    instance.updatedAt = new Date();
                    // Save instance
                    await this.instanceStorage.saveInstance(instance);
                }
                catch (error) {
                    // Container might not exist anymore
                    if (instance.status !== provider_types_1.InstanceStatus.DELETED) {
                        instance.status = provider_types_1.InstanceStatus.FAILED;
                        await this.instanceStorage.saveInstance(instance);
                    }
                }
            }
            return instance;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to get Docker instance: ${err.message}`);
            return null;
        }
    }
    /**
     * List all instances
     * @param filter Optional filter criteria
     * @returns Array of instances
     */
    async listInstances(filter) {
        this.logger.info('Listing Docker instances');
        try {
            // Load all instances
            const instances = await this.instanceStorage.loadAllInstances();
            // Update instance status
            for (const instance of instances) {
                if (instance.status !== provider_types_1.InstanceStatus.DELETED) {
                    await this.getInstance(instance.id);
                }
            }
            // Apply filters if provided
            if (filter) {
                return this.filterInstances(instances, filter);
            }
            return instances;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to list Docker instances: ${err.message}`);
            return [];
        }
    }
    /**
     * Start an instance
     * @param instanceId Instance ID
     * @returns Updated instance
     */
    async startInstance(instanceId) {
        this.logger.info(`Starting Docker instance: ${instanceId}`);
        // Get instance
        const instance = await this.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Instance not found: ${instanceId}`);
        }
        // Check if instance is already running
        if (instance.status === provider_types_1.InstanceStatus.RUNNING) {
            return instance;
        }
        try {
            // Get container ID
            const metadata = instance.metadata;
            // Start container
            await this.containerUtils.startContainer(metadata.containerId);
            // Update instance status
            instance.status = provider_types_1.InstanceStatus.RUNNING;
            instance.updatedAt = new Date();
            // Get container info
            const containerInfo = await this.containerUtils.getContainerInfo(metadata.containerId);
            // Update instance network info
            instance.network.internalIp = containerInfo.networkSettings.ipAddress;
            instance.network.ports = containerInfo.networkSettings.ports.map(port => ({
                internal: port.internal,
                external: port.external,
                protocol: port.protocol
            }));
            // Generate access URLs
            instance.network.urls = this.generateAccessUrls(instance);
            // Save instance
            await this.instanceStorage.saveInstance(instance);
            return instance;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to start Docker instance: ${err.message}`);
            // Update instance status
            instance.status = provider_types_1.InstanceStatus.FAILED;
            instance.metadata = {
                ...instance.metadata,
                error: err.message
            };
            // Save instance
            await this.instanceStorage.saveInstance(instance);
            throw new Error(`Failed to start Docker instance: ${err.message}`);
        }
    }
    /**
     * Stop an instance
     * @param instanceId Instance ID
     * @param force Force stop if true
     * @returns Updated instance
     */
    async stopInstance(instanceId, force) {
        this.logger.info(`Stopping Docker instance: ${instanceId}`);
        // Get instance
        const instance = await this.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Instance not found: ${instanceId}`);
        }
        // Check if instance is already stopped
        if (instance.status === provider_types_1.InstanceStatus.STOPPED) {
            return instance;
        }
        try {
            // Get container ID
            const metadata = instance.metadata;
            // Stop container
            await this.containerUtils.stopContainer(metadata.containerId, force);
            // Update instance status
            instance.status = provider_types_1.InstanceStatus.STOPPED;
            instance.updatedAt = new Date();
            // Save instance
            await this.instanceStorage.saveInstance(instance);
            return instance;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to stop Docker instance: ${err.message}`);
            // Update instance status if forced
            if (force) {
                instance.status = provider_types_1.InstanceStatus.STOPPED;
                instance.updatedAt = new Date();
                await this.instanceStorage.saveInstance(instance);
                return instance;
            }
            throw new Error(`Failed to stop Docker instance: ${err.message}`);
        }
    }
    /**
     * Delete an instance
     * @param instanceId Instance ID
     * @returns True if successful
     */
    async deleteInstance(instanceId) {
        this.logger.info(`Deleting Docker instance: ${instanceId}`);
        // Get instance
        const instance = await this.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Instance not found: ${instanceId}`);
        }
        try {
            // Get container ID
            const metadata = instance.metadata;
            // Stop container if running
            if (instance.status === provider_types_1.InstanceStatus.RUNNING) {
                await this.containerUtils.stopContainer(metadata.containerId, true);
            }
            // Remove container
            await this.containerUtils.removeContainer(metadata.containerId);
            // Update instance status
            instance.status = provider_types_1.InstanceStatus.DELETED;
            instance.updatedAt = new Date();
            // Save instance
            await this.instanceStorage.saveInstance(instance);
            return true;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to delete Docker instance: ${err.message}`);
            // Update instance status
            instance.status = provider_types_1.InstanceStatus.FAILED;
            instance.metadata = {
                ...instance.metadata,
                error: err.message
            };
            // Save instance
            await this.instanceStorage.saveInstance(instance);
            throw new Error(`Failed to delete Docker instance: ${err.message}`);
        }
    }
    /**
     * Update instance configuration
     * @param instanceId Instance ID
     * @param config Updated configuration
     * @returns Updated instance
     */
    async updateInstance(instanceId, config) {
        this.logger.info(`Updating Docker instance: ${instanceId}`);
        // Get instance
        const instance = await this.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Instance not found: ${instanceId}`);
        }
        // Check if instance is running
        const wasRunning = instance.status === provider_types_1.InstanceStatus.RUNNING;
        try {
            // Stop instance if running
            if (wasRunning) {
                await this.stopInstance(instanceId);
            }
            // Update instance configuration
            instance.config = {
                ...instance.config,
                ...config
            };
            // Get container ID
            const metadata = instance.metadata;
            // Remove old container
            await this.containerUtils.removeContainer(metadata.containerId);
            // Create new container
            const containerId = await this.containerUtils.createContainer(instance.name, instance.config);
            // Update instance metadata
            instance.metadata = {
                ...instance.metadata,
                containerId
            };
            // Start container if it was running before
            if (wasRunning) {
                await this.containerUtils.startContainer(containerId);
                // Get container info
                const containerInfo = await this.containerUtils.getContainerInfo(containerId);
                // Update instance status
                instance.status = provider_types_1.InstanceStatus.RUNNING;
                // Update instance network info
                instance.network.internalIp = containerInfo.networkSettings.ipAddress;
                instance.network.ports = containerInfo.networkSettings.ports.map(port => ({
                    internal: port.internal,
                    external: port.external,
                    protocol: port.protocol
                }));
                // Generate access URLs
                instance.network.urls = this.generateAccessUrls(instance);
            }
            else {
                instance.status = provider_types_1.InstanceStatus.STOPPED;
            }
            // Update timestamp
            instance.updatedAt = new Date();
            // Save instance
            await this.instanceStorage.saveInstance(instance);
            return instance;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to update Docker instance: ${err.message}`);
            // Update instance status
            instance.status = provider_types_1.InstanceStatus.FAILED;
            instance.metadata = {
                ...instance.metadata,
                error: err.message
            };
            // Save instance
            await this.instanceStorage.saveInstance(instance);
            throw new Error(`Failed to update Docker instance: ${err.message}`);
        }
    }
    /**
     * Get instance logs
     * @param instanceId Instance ID
     * @param options Log options
     * @returns Instance logs
     */
    async getInstanceLogs(instanceId, options) {
        this.logger.info(`Getting Docker instance logs: ${instanceId}`);
        // Get instance
        const instance = await this.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Instance not found: ${instanceId}`);
        }
        try {
            // Get container ID
            const metadata = instance.metadata;
            // Get container logs
            const logs = await this.containerUtils.getContainerLogs(metadata.containerId, {
                lines: options?.lines,
                since: options?.since,
                follow: options?.follow
            });
            // Parse logs
            const entries = this.logParser.parseDockerLogs(logs, options?.pattern);
            // Format logs
            return this.logParser.formatInstanceLogs(instanceId, entries, entries.length === (options?.lines || 100));
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to get Docker instance logs: ${err.message}`);
            throw new Error(`Failed to get Docker instance logs: ${err.message}`);
        }
    }
    /**
     * Execute a command in an instance
     * @param instanceId Instance ID
     * @param command Command to execute
     * @returns Command result
     */
    async executeCommand(instanceId, command) {
        this.logger.info(`Executing command in Docker instance: ${instanceId}`);
        // Get instance
        const instance = await this.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Instance not found: ${instanceId}`);
        }
        // Check if instance is running
        if (instance.status !== provider_types_1.InstanceStatus.RUNNING) {
            throw new Error(`Instance is not running: ${instanceId}`);
        }
        try {
            // Get container ID
            const metadata = instance.metadata;
            // Execute command
            const result = await this.containerUtils.executeCommand(metadata.containerId, command);
            return {
                exitCode: result.exitCode,
                stdout: result.stdout,
                stderr: result.stderr,
                error: result.exitCode !== 0 ? 'Command failed' : undefined
            };
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to execute command in Docker instance: ${err.message}`);
            return {
                exitCode: 1,
                stdout: '',
                stderr: '',
                error: err.message
            };
        }
    }
    /**
     * Filter instances based on criteria
     * @param instances Instances to filter
     * @param filter Filter criteria
     * @returns Filtered instances
     */
    filterInstances(instances, filter) {
        let filtered = [...instances];
        // Filter by status
        if (filter.status) {
            const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
            filtered = filtered.filter(instance => statuses.includes(instance.status));
        }
        // Filter by name pattern
        if (filter.namePattern) {
            const regex = new RegExp(filter.namePattern);
            filtered = filtered.filter(instance => regex.test(instance.name));
        }
        // Filter by creation date
        if (filter.createdAfter) {
            filtered = filtered.filter(instance => instance.createdAt >= filter.createdAfter);
        }
        if (filter.createdBefore) {
            filtered = filtered.filter(instance => instance.createdAt <= filter.createdBefore);
        }
        // Filter by tags
        if (filter.tags) {
            filtered = filtered.filter(instance => {
                for (const [key, value] of Object.entries(filter.tags || {})) {
                    if (instance.metadata[key] !== value) {
                        return false;
                    }
                }
                return true;
            });
        }
        // Apply limit and offset
        if (filter.offset) {
            filtered = filtered.slice(filter.offset);
        }
        if (filter.limit) {
            filtered = filtered.slice(0, filter.limit);
        }
        return filtered;
    }
    /**
     * Generate access URLs for an instance
     * @param instance Instance
     * @returns Access URLs
     */
    generateAccessUrls(instance) {
        const urls = [];
        // Find HTTP port
        const httpPort = instance.network.ports.find(port => port.internal === 8080);
        if (httpPort) {
            urls.push(`http://localhost:${httpPort.external}`);
            // Add hostname URL if not localhost
            if (instance.network.externalIp !== 'localhost' && instance.network.externalIp !== '127.0.0.1') {
                urls.push(`http://${instance.network.externalIp}:${httpPort.external}`);
            }
        }
        return urls;
    }
    /**
     * Generate a unique instance ID
     * @returns Instance ID
     */
    generateInstanceId() {
        const hash = crypto.createHash('sha1');
        hash.update(`${Date.now()}-${Math.random()}`);
        return `vscode-${hash.digest('hex').substring(0, 8)}`;
    }
}
exports.DockerProvider = DockerProvider;
//# sourceMappingURL=docker-provider.js.map