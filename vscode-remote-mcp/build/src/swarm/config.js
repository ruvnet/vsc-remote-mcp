"use strict";
/**
 * Configuration for VSCode Remote Swarm
 * Defines configuration options for the swarm controller
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
exports.defaultSwarmConfig = exports.MigrationStrategy = exports.HealthStatus = void 0;
const provider_types_1 = require("../providers/core/provider-types");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Health status enum
 */
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["UNHEALTHY"] = "unhealthy";
    HealthStatus["DEGRADED"] = "degraded";
    HealthStatus["RECOVERING"] = "recovering";
    HealthStatus["UNKNOWN"] = "unknown";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
/**
 * Migration strategy enum
 */
var MigrationStrategy;
(function (MigrationStrategy) {
    /**
     * Stop source instance, then create target instance
     */
    MigrationStrategy["STOP_AND_RECREATE"] = "stop_and_recreate";
    /**
     * Create target instance, then stop source instance
     */
    MigrationStrategy["CREATE_THEN_STOP"] = "create_then_stop";
})(MigrationStrategy || (exports.MigrationStrategy = MigrationStrategy = {}));
/**
 * Default swarm configuration
 */
exports.defaultSwarmConfig = {
    general: {
        stateDir: path.join(os.homedir(), '.vscode-remote-swarm'),
        defaultProviderType: provider_types_1.ProviderType.DOCKER,
        loadStateOnStartup: true,
        autoSaveIntervalMs: 60000 // 1 minute
    },
    providers: [
        {
            type: provider_types_1.ProviderType.DOCKER,
            enabled: true,
            config: {}
        },
        {
            type: provider_types_1.ProviderType.FLYIO,
            enabled: false,
            config: {}
        }
    ],
    healthMonitor: {
        enabled: true,
        checkIntervalMs: 60000, // 1 minute
        autoRecover: true,
        maxRecoveryAttempts: 3,
        historySize: 10,
        recoveryActions: {
            restart: true,
            recreate: false,
            migrate: false
        }
    },
    migration: {
        enabled: true,
        defaultStrategy: MigrationStrategy.STOP_AND_RECREATE,
        timeoutMs: 300000 // 5 minutes
    }
};
//# sourceMappingURL=config.js.map