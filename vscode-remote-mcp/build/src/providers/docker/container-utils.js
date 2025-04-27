"use strict";
/**
 * Docker container utilities
 * Provides functions for managing Docker containers
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
exports.ContainerUtils = void 0;
const provider_types_1 = require("../core/provider-types");
const logger = __importStar(require("../../utils/logger"));
/**
 * Container utilities class
 */
class ContainerUtils {
    /**
     * Constructor
     * @param config Docker provider configuration
     * @param dockerExecutor Docker command executor
     * @param loggerInstance Logger instance
     */
    constructor(config, dockerExecutor, loggerInstance = logger) {
        this.config = config;
        this.dockerExecutor = dockerExecutor;
        this.logger = loggerInstance;
    }
    /**
     * Create a Docker container
     * @param name Container name
     * @param instanceConfig Instance configuration
     * @returns Container ID
     */
    async createContainer(name, instanceConfig) {
        this.logger.info(`Creating Docker container: ${name}`);
        // Build Docker run command
        let command = 'create';
        // Add container name
        command += ` --name ${name}`;
        // Add network
        command += ` --network ${this.config.networkName}`;
        // Add resource limits
        command += ` --cpus ${instanceConfig.resources.cpu.cores}`;
        command += ` --memory ${instanceConfig.resources.memory.min}m`;
        // Add port mappings
        if (instanceConfig.network.port) {
            command += ` -p ${instanceConfig.network.port}:8080`;
        }
        // Add volume mount
        command += ` -v ${instanceConfig.workspacePath}:/home/coder/project`;
        // Add environment variables
        if (instanceConfig.env) {
            for (const [key, value] of Object.entries(instanceConfig.env)) {
                command += ` -e ${key}=${value}`;
            }
        }
        // Add password if provided
        if (instanceConfig.auth && instanceConfig.auth.type === 'password' && instanceConfig.auth.credentials) {
            command += ` -e PASSWORD=${instanceConfig.auth.credentials}`;
        }
        // Add image
        command += ` ${this.config.imageRepository}:${this.config.imageTag}`;
        // Execute command
        const { stdout } = await this.dockerExecutor.execute(command);
        // Return container ID
        return stdout.trim();
    }
    /**
     * Start a Docker container
     * @param containerId Container ID
     * @returns True if successful
     */
    async startContainer(containerId) {
        this.logger.info(`Starting Docker container: ${containerId}`);
        try {
            await this.dockerExecutor.execute(`start ${containerId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to start container: ${containerId}`);
            return false;
        }
    }
    /**
     * Stop a Docker container
     * @param containerId Container ID
     * @param force Force stop if true
     * @returns True if successful
     */
    async stopContainer(containerId, force = false) {
        this.logger.info(`Stopping Docker container: ${containerId}`);
        try {
            if (force) {
                await this.dockerExecutor.execute(`kill ${containerId}`);
            }
            else {
                await this.dockerExecutor.execute(`stop ${containerId}`);
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to stop container: ${containerId}`);
            return false;
        }
    }
    /**
     * Remove a Docker container
     * @param containerId Container ID
     * @returns True if successful
     */
    async removeContainer(containerId) {
        this.logger.info(`Removing Docker container: ${containerId}`);
        try {
            await this.dockerExecutor.execute(`rm -f ${containerId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to remove container: ${containerId}`);
            return false;
        }
    }
    /**
     * Get Docker container info
     * @param containerId Container ID
     * @returns Container info
     */
    async getContainerInfo(containerId) {
        this.logger.info(`Getting Docker container info: ${containerId}`);
        // Get container info
        const { stdout: inspectOutput } = await this.dockerExecutor.execute(`inspect ${containerId}`);
        const inspectData = JSON.parse(inspectOutput)[0];
        // Get container stats
        const { stdout: statsOutput } = await this.dockerExecutor.execute(`stats ${containerId} --no-stream --format "{{.CPUPerc}},{{.MemUsage}}"`);
        const [cpuPerc, memUsage] = statsOutput.split(',');
        // Parse CPU percentage
        const cpuUsage = parseFloat(cpuPerc.replace('%', '')) / 100;
        // Parse memory usage
        const memMatch = memUsage.match(/([0-9.]+)([A-Za-z]+)/);
        let memoryUsage = 0;
        if (memMatch) {
            const value = parseFloat(memMatch[1]);
            const unit = memMatch[2].toLowerCase();
            switch (unit) {
                case 'b':
                    memoryUsage = value / (1024 * 1024);
                    break;
                case 'kb':
                case 'kib':
                    memoryUsage = value / 1024;
                    break;
                case 'mb':
                case 'mib':
                    memoryUsage = value;
                    break;
                case 'gb':
                case 'gib':
                    memoryUsage = value * 1024;
                    break;
            }
        }
        // Parse ports
        const ports = [];
        if (inspectData.NetworkSettings && inspectData.NetworkSettings.Ports) {
            for (const [key, value] of Object.entries(inspectData.NetworkSettings.Ports)) {
                if (value && Array.isArray(value)) {
                    const [internalPort, protocol] = key.split('/');
                    for (const binding of value) {
                        ports.push({
                            internal: parseInt(internalPort, 10),
                            external: parseInt(binding.HostPort, 10),
                            protocol
                        });
                    }
                }
            }
        }
        return {
            id: inspectData.Id,
            name: inspectData.Name.replace(/^\//, ''),
            state: inspectData.State.Status,
            networkSettings: {
                ipAddress: inspectData.NetworkSettings.Networks[this.config.networkName]?.IPAddress || '',
                ports
            },
            stats: {
                cpuUsage,
                memoryUsage
            }
        };
    }
    /**
     * Map Docker container status to instance status
     * @param containerStatus Container status
     * @returns Instance status
     */
    mapContainerStatusToInstanceStatus(containerStatus) {
        switch (containerStatus) {
            case 'running':
                return provider_types_1.InstanceStatus.RUNNING;
            case 'exited':
            case 'created':
                return provider_types_1.InstanceStatus.STOPPED;
            case 'paused':
                return provider_types_1.InstanceStatus.STOPPED;
            case 'restarting':
                return provider_types_1.InstanceStatus.CREATING;
            case 'removing':
                return provider_types_1.InstanceStatus.DELETED;
            case 'dead':
                return provider_types_1.InstanceStatus.FAILED;
            default:
                return provider_types_1.InstanceStatus.FAILED;
        }
    }
    /**
     * Execute a command in a container
     * @param containerId Container ID
     * @param command Command to execute
     * @returns Command output
     */
    async executeCommand(containerId, command) {
        this.logger.info(`Executing command in container: ${containerId}`);
        try {
            const { stdout, stderr } = await this.dockerExecutor.execute(`exec ${containerId} ${command}`);
            return {
                stdout,
                stderr,
                exitCode: 0
            };
        }
        catch (error) {
            const err = error;
            return {
                stdout: err.stdout || '',
                stderr: err.stderr || err.message,
                exitCode: 1
            };
        }
    }
    /**
     * Get container logs
     * @param containerId Container ID
     * @param options Log options
     * @returns Container logs
     */
    async getContainerLogs(containerId, options) {
        this.logger.info(`Getting container logs: ${containerId}`);
        // Build Docker logs command
        let command = `logs ${containerId}`;
        if (options) {
            if (options.lines) {
                command += ` --tail ${options.lines}`;
            }
            if (options.since) {
                command += ` --since ${Math.floor(options.since.getTime() / 1000)}`;
            }
            if (options.follow) {
                command += ' --follow';
            }
        }
        // Execute command
        const { stdout } = await this.dockerExecutor.execute(command);
        return stdout;
    }
}
exports.ContainerUtils = ContainerUtils;
//# sourceMappingURL=container-utils.js.map