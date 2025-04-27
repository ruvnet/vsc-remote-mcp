"use strict";
/**
 * Authentication Manager for VSCode Remote MCP
 *
 * This module manages authentication tokens for MCP servers.
 * It handles token storage, retrieval, validation, and refresh.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPAuthManager = void 0;
const env_1 = __importDefault(require("../config/env"));
const logger = __importStar(require("./logger"));
/**
 * MCP Authentication Manager class
 */
class MCPAuthManager {
    /**
     * Create a new MCPAuthManager instance
     * @param storage - Optional storage implementation
     */
    constructor(storage) {
        this.tokens = new Map();
        this.tokenStorage = storage || this.createDefaultStorage();
        this.loadTokens();
    }
    /**
     * Create default token storage
     * @returns Default storage implementation
     */
    createDefaultStorage() {
        // In-memory storage implementation
        const memoryStorage = {};
        return {
            getItem(key) {
                return memoryStorage[key] || null;
            },
            setItem(key, value) {
                memoryStorage[key] = value;
            },
            removeItem(key) {
                delete memoryStorage[key];
            }
        };
    }
    /**
     * Load tokens from storage
     */
    loadTokens() {
        try {
            const tokensJson = this.tokenStorage.getItem('mcp_tokens');
            if (tokensJson) {
                const tokenData = JSON.parse(tokensJson);
                // Convert stored data to Map
                for (const [serverId, info] of Object.entries(tokenData)) {
                    const tokenInfo = info;
                    // Convert expiration string to Date if it exists
                    if (tokenInfo.expiresAt) {
                        tokenInfo.expiresAt = new Date(tokenInfo.expiresAt);
                    }
                    this.tokens.set(serverId, tokenInfo);
                }
            }
        }
        catch (error) {
            logger.error('Failed to load tokens from storage', { error });
        }
    }
    /**
     * Save tokens to storage
     */
    saveTokens() {
        try {
            // Convert Map to object for storage
            const tokenData = {};
            for (const [serverId, info] of this.tokens.entries()) {
                tokenData[serverId] = info;
            }
            this.tokenStorage.setItem('mcp_tokens', JSON.stringify(tokenData));
        }
        catch (error) {
            logger.error('Failed to save tokens to storage', { error });
        }
    }
    /**
     * Set a token for a server
     * @param serverId - Server ID
     * @param token - Authentication token
     * @param expiresAt - Optional expiration date
     * @param refreshToken - Optional refresh token
     */
    setToken(serverId, token, expiresAt, refreshToken) {
        this.tokens.set(serverId, {
            token,
            expiresAt: expiresAt || null,
            refreshToken
        });
        this.saveTokens();
    }
    /**
     * Get a token for a server
     * @param serverId - Server ID
     * @returns Token or null if not found or expired
     */
    async getToken(serverId) {
        // Check if token exists in map
        if (this.tokens.has(serverId)) {
            const tokenInfo = this.tokens.get(serverId);
            // Check if token is expired
            if (this.isTokenExpired(serverId)) {
                // Try to refresh the token if refresh token exists
                if (tokenInfo.refreshToken) {
                    try {
                        const newToken = await this.refreshToken(serverId, tokenInfo.refreshToken);
                        if (newToken) {
                            return newToken;
                        }
                    }
                    catch (error) {
                        logger.error('Failed to refresh token', { serverId, error });
                    }
                }
                // Remove expired token
                this.tokens.delete(serverId);
                this.saveTokens();
                return null;
            }
            return tokenInfo.token;
        }
        // If server matches default server name, return default token
        if (env_1.default.auth.enabled && serverId === env_1.default.server.name) {
            return env_1.default.auth.token;
        }
        return null;
    }
    /**
     * Check if a token is expired
     * @param serverId - Server ID
     * @returns True if token is expired
     */
    isTokenExpired(serverId) {
        if (!this.tokens.has(serverId)) {
            return false;
        }
        const tokenInfo = this.tokens.get(serverId);
        // If no expiration, token is not expired
        if (!tokenInfo.expiresAt) {
            return false;
        }
        // Check if current time is past expiration
        return new Date() > tokenInfo.expiresAt;
    }
    /**
     * Refresh a token
     * @param serverId - Server ID
     * @param refreshToken - Refresh token
     * @returns New token or null if refresh failed
     */
    async refreshToken(serverId, refreshToken) {
        // This would typically call an API to refresh the token
        // For now, just return null to indicate refresh failed
        logger.debug('Token refresh not implemented', { serverId });
        return null;
    }
    /**
     * Set a refreshed token
     * @param serverId - Server ID
     * @param token - New token
     * @param expiresAt - Optional expiration date
     */
    setRefreshedToken(serverId, token, expiresAt = null) {
        // Get existing token info
        const tokenInfo = this.tokens.get(serverId);
        if (tokenInfo) {
            // Update token and expiration
            tokenInfo.token = token;
            tokenInfo.expiresAt = expiresAt;
            this.saveTokens();
        }
        else {
            // Set new token
            this.setToken(serverId, token, expiresAt);
        }
    }
    /**
     * Clear a token
     * @param serverId - Server ID
     */
    async clearToken(serverId) {
        if (this.tokens.has(serverId)) {
            this.tokens.delete(serverId);
            this.saveTokens();
        }
    }
    /**
     * Clear all tokens
     */
    async clearAllTokens() {
        this.tokens.clear();
        this.saveTokens();
    }
    /**
     * Validate a token
     * @param serverId - Server ID
     * @param token - Token to validate
     * @returns True if token is valid
     */
    validateToken(serverId, token) {
        // Get stored token
        const storedToken = this.tokens.get(serverId)?.token;
        // If no stored token, check against default token
        if (!storedToken && env_1.default.auth.enabled && serverId === env_1.default.server.name) {
            return token === env_1.default.auth.token;
        }
        // Compare tokens
        return token === storedToken;
    }
}
exports.MCPAuthManager = MCPAuthManager;
exports.default = MCPAuthManager;
//# sourceMappingURL=auth-manager.js.map