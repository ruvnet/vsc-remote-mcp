"use strict";
/**
 * Docker command utilities
 * Provides functions for executing Docker commands
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
exports.DockerCommandExecutor = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const logger = __importStar(require("../../utils/logger"));
// Promisify exec
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Docker command executor
 */
class DockerCommandExecutor {
    /**
     * Constructor
     * @param loggerInstance Logger instance
     */
    constructor(loggerInstance = logger) {
        this.logger = loggerInstance;
    }
    /**
     * Execute a Docker command
     * @param command Docker command
     * @returns Command output
     */
    async execute(command) {
        this.logger.debug(`Executing Docker command: ${command}`);
        try {
            const result = await execAsync(`docker ${command}`);
            return result;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Docker command failed: ${err.message}`);
            // Return stdout and stderr even if command fails
            return {
                stdout: err.stdout || '',
                stderr: err.stderr || err.message
            };
        }
    }
    /**
     * Check if Docker is available
     * @returns True if Docker is available
     */
    async isDockerAvailable() {
        try {
            await this.execute('version --format "{{.Server.Version}}"');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get Docker version
     * @returns Docker version
     */
    async getDockerVersion() {
        const { stdout } = await this.execute('version --format "{{.Server.Version}}"');
        return stdout.trim();
    }
    /**
     * Check if a Docker network exists
     * @param networkName Network name
     * @returns True if network exists
     */
    async networkExists(networkName) {
        try {
            await this.execute(`network inspect ${networkName}`);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Create a Docker network
     * @param networkName Network name
     * @returns True if network was created
     */
    async createNetwork(networkName) {
        try {
            await this.execute(`network create ${networkName}`);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if a Docker container exists
     * @param containerId Container ID or name
     * @returns True if container exists
     */
    async containerExists(containerId) {
        try {
            await this.execute(`container inspect ${containerId}`);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if a Docker container is running
     * @param containerId Container ID or name
     * @returns True if container is running
     */
    async isContainerRunning(containerId) {
        try {
            const { stdout } = await this.execute(`container inspect -f '{{.State.Running}}' ${containerId}`);
            return stdout.trim() === 'true';
        }
        catch (error) {
            return false;
        }
    }
}
exports.DockerCommandExecutor = DockerCommandExecutor;
//# sourceMappingURL=docker-command.js.map