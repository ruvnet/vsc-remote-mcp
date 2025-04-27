"use strict";
/**
 * Instance storage utilities
 * Provides functions for storing and retrieving instance data
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
exports.InstanceStorage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger = __importStar(require("../../utils/logger"));
/**
 * Instance storage class
 */
class InstanceStorage {
    /**
     * Constructor
     * @param storagePath Storage path
     * @param loggerInstance Logger instance
     */
    constructor(storagePath, loggerInstance = logger) {
        this.storagePath = storagePath;
        this.logger = loggerInstance;
        // Create storage directory if it doesn't exist
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }
    }
    /**
     * Save instance to file
     * @param instance Instance
     */
    async saveInstance(instance) {
        const filePath = path.join(this.storagePath, `${instance.id}.json`);
        try {
            fs.writeFileSync(filePath, JSON.stringify(instance, null, 2));
            this.logger.debug(`Instance saved: ${instance.id}`);
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to save instance: ${err.message}`);
            throw new Error(`Failed to save instance: ${err.message}`);
        }
    }
    /**
     * Load instance from file
     * @param instanceId Instance ID
     * @returns Instance or null if not found
     */
    async loadInstance(instanceId) {
        const filePath = path.join(this.storagePath, `${instanceId}.json`);
        if (!fs.existsSync(filePath)) {
            this.logger.debug(`Instance not found: ${instanceId}`);
            return null;
        }
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const instance = JSON.parse(data);
            // Convert date strings to Date objects
            instance.createdAt = new Date(instance.createdAt);
            instance.updatedAt = new Date(instance.updatedAt);
            this.logger.debug(`Instance loaded: ${instanceId}`);
            return instance;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to load instance: ${err.message}`);
            return null;
        }
    }
    /**
     * Delete instance file
     * @param instanceId Instance ID
     * @returns True if successful
     */
    async deleteInstance(instanceId) {
        const filePath = path.join(this.storagePath, `${instanceId}.json`);
        if (!fs.existsSync(filePath)) {
            this.logger.debug(`Instance not found for deletion: ${instanceId}`);
            return false;
        }
        try {
            fs.unlinkSync(filePath);
            this.logger.debug(`Instance deleted: ${instanceId}`);
            return true;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to delete instance: ${err.message}`);
            return false;
        }
    }
    /**
     * List all instance IDs
     * @returns Array of instance IDs
     */
    async listInstanceIds() {
        try {
            const files = fs.readdirSync(this.storagePath);
            const instanceIds = files
                .filter(file => file.endsWith('.json'))
                .map(file => path.basename(file, '.json'));
            return instanceIds;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to list instances: ${err.message}`);
            return [];
        }
    }
    /**
     * Load all instances
     * @returns Array of instances
     */
    async loadAllInstances() {
        const instanceIds = await this.listInstanceIds();
        const instances = [];
        for (const id of instanceIds) {
            const instance = await this.loadInstance(id);
            if (instance) {
                instances.push(instance);
            }
        }
        return instances;
    }
    /**
     * Check if instance exists
     * @param instanceId Instance ID
     * @returns True if instance exists
     */
    async instanceExists(instanceId) {
        const filePath = path.join(this.storagePath, `${instanceId}.json`);
        return fs.existsSync(filePath);
    }
}
exports.InstanceStorage = InstanceStorage;
//# sourceMappingURL=instance-storage.js.map