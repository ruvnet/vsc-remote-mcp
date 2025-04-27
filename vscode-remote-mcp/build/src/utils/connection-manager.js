"use strict";
/**
 * Connection Manager for VSCode Remote MCP
 *
 * This module manages WebSocket connections to MCP servers.
 * It handles authentication, reconnection, and message routing.
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
exports.MCPConnectionManager = void 0;
const auth_manager_1 = require("./auth-manager");
const client_state_model_1 = require("./client-state-model");
const logger = __importStar(require("./logger"));
/**
 * Simple error handler for connection manager
 */
class MCPErrorHandler {
    /**
     * Handle an error
     * @param message - Error message
     * @param details - Error details
     */
    handleError(message, details) {
        logger.error(message, details);
    }
}
/**
 * MCP Connection Manager class
 */
class MCPConnectionManager {
    /**
     * Create a new MCPConnectionManager instance
     * @param options - Connection options
     */
    constructor(options = {}) {
        this.url = options.url || 'http://localhost:3001'; // Default URL
        this.sendMessage = options.sendMessage || this.defaultSendMessage.bind(this);
        this.tokenRefreshThreshold = options.tokenRefreshThreshold || 300; // 5 minutes
        this.reconnectDelay = options.reconnectDelay || 1000; // 1 second
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
        this.autoReconnect = options.autoReconnect !== false;
        this.stateManager = new client_state_model_1.ClientStateManager();
        this.authManager = new auth_manager_1.MCPAuthManager();
        this.errorHandler = new MCPErrorHandler();
        this.socket = null;
        this.currentServerId = null;
        this.currentClientId = null;
        this.currentWorkspaceId = null;
        this.tokenRefreshTimers = new Map();
        this.messageHandlers = new Map();
        this.pendingRequests = new Map();
        this.messageQueue = [];
        this.isProcessingQueue = false;
        this.reconnectAttempts = 0;
        this.setupDefaultMessageHandlers();
    }
    /**
     * Default message sending implementation
     * @param message - Message to send
     */
    defaultSendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
        else {
            this.queueMessage(message);
        }
    }
    /**
     * Set up default message handlers
     */
    setupDefaultMessageHandlers() {
        // Handle authentication responses
        this.registerMessageHandler('auth', (message) => {
            if (message.payload?.success) {
                // Update connection state
                this.stateManager.notifyListeners('connection', {
                    state: 'Connected',
                    serverId: this.currentServerId,
                    clientId: this.currentClientId
                });
                // Set up token refresh if expiration is provided
                if (message.payload.tokenValidUntil) {
                    this.setupTokenRefreshTimer(message.payload.tokenValidUntil);
                }
            }
            else {
                // Authentication failed
                this.errorHandler.handleError('Authentication failed', {
                    serverId: this.currentServerId,
                    clientId: this.currentClientId,
                    details: message.payload?.error || 'Unknown error'
                });
                // Update connection state
                this.stateManager.notifyListeners('connection', {
                    state: 'AuthenticationFailed',
                    serverId: this.currentServerId,
                    clientId: this.currentClientId,
                    error: message.payload?.error || 'Authentication failed'
                });
            }
        });
        // Handle token refresh responses
        this.registerMessageHandler('tokenRefresh', (message) => {
            if (message.payload?.success && message.payload?.token && this.currentServerId) {
                // Store the new token
                this.authManager.setRefreshedToken(this.currentServerId, message.payload.token, message.payload.tokenValidUntil ? new Date(message.payload.tokenValidUntil) : null);
                // Set up token refresh if expiration is provided
                if (message.payload.tokenValidUntil) {
                    this.setupTokenRefreshTimer(message.payload.tokenValidUntil);
                }
            }
            else {
                // Token refresh failed
                this.errorHandler.handleError('Token refresh failed', {
                    serverId: this.currentServerId,
                    clientId: this.currentClientId,
                    details: message.payload?.error || 'Unknown error'
                });
            }
        });
        // Handle response messages
        this.registerMessageHandler('response', (message) => {
            this.handleResponse(message);
        });
    }
    /**
     * Register a message handler
     * @param type - Message type
     * @param handler - Message handler function
     */
    registerMessageHandler(type, handler) {
        this.messageHandlers.set(type, handler);
    }
    /**
     * Connect to an MCP server
     * @param serverId - Server ID
     * @param clientId - Client ID
     * @param workspaceId - Workspace ID
     * @param capabilities - Client capabilities
     * @returns True if connection was successful
     */
    async connect(serverId, clientId, workspaceId, capabilities) {
        this.currentServerId = serverId;
        this.currentClientId = clientId;
        this.currentWorkspaceId = workspaceId;
        try {
            // Get authentication token
            const authToken = await this.authManager.getToken(serverId);
            // If no token is available, fail the connection
            if (!authToken) {
                console.error('Authentication failed: No token available');
                return false;
            }
            // Send connection message
            this.sendMessage({
                type: 'connection',
                payload: {
                    clientId,
                    workspaceId,
                    capabilities: capabilities || ['terminal', 'editor'],
                    authToken
                }
            });
            return true;
        }
        catch (error) {
            console.error('Authentication failed:', error.message);
            return false;
        }
    }
    /**
     * Disconnect from the MCP server
     * @param clearAuth - Whether to clear authentication
     * @returns True if disconnection was successful
     */
    async disconnect(clearAuth = false) {
        // Close WebSocket connection
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        // Clear token refresh timers
        this.clearTokenRefreshTimers();
        // Clear authentication if requested
        if (clearAuth && this.currentServerId) {
            await this.authManager.clearToken(this.currentServerId);
        }
        // Update connection state
        this.stateManager.notifyListeners('connection', {
            state: 'Disconnected',
            serverId: this.currentServerId,
            clientId: this.currentClientId
        });
        // Reset current connection info
        this.currentServerId = null;
        this.currentClientId = null;
        this.currentWorkspaceId = null;
        return true;
    }
    /**
     * Start a session
     * @param sessionId - Session ID
     * @param sessionOptions - Session options
     * @returns True if session was started successfully
     */
    async startSession(sessionId, sessionOptions = {}) {
        if (!this.currentServerId || !this.currentClientId) {
            console.error('Cannot start session: Not connected');
            return false;
        }
        try {
            // Send session start message
            const response = await this.sendRequest('sessionStart', {
                sessionId,
                ...sessionOptions
            });
            if (response.success) {
                // Update session state
                this.stateManager.notifyListeners('session', {
                    state: 'Active',
                    sessionId,
                    options: sessionOptions
                });
                return true;
            }
            else {
                console.error('Failed to start session:', response.error || 'Unknown error');
                return false;
            }
        }
        catch (error) {
            console.error('Error starting session:', error.message);
            return false;
        }
    }
    /**
     * End a session
     * @returns True if session was ended successfully
     */
    async endSession() {
        if (!this.currentServerId || !this.currentClientId) {
            console.error('Cannot end session: Not connected');
            return false;
        }
        try {
            // Send session end message
            const response = await this.sendRequest('sessionEnd', {});
            if (response.success) {
                // Update session state
                this.stateManager.notifyListeners('session', {
                    state: 'Inactive'
                });
                return true;
            }
            else {
                console.error('Failed to end session:', response.error || 'Unknown error');
                return false;
            }
        }
        catch (error) {
            console.error('Error ending session:', error.message);
            return false;
        }
    }
    /**
     * Enable or disable automatic reconnection
     * @param enable - Whether to enable reconnection
     */
    enableReconnection(enable) {
        this.autoReconnect = enable;
    }
    /**
     * Set up token refresh timer
     * @param tokenValidUntil - Token expiration timestamp
     */
    setupTokenRefreshTimer(tokenValidUntil) {
        if (!this.currentServerId) {
            return;
        }
        // Clear existing timer
        if (this.tokenRefreshTimers.has(this.currentServerId)) {
            clearTimeout(this.tokenRefreshTimers.get(this.currentServerId));
            this.tokenRefreshTimers.delete(this.currentServerId);
        }
        // Calculate time until refresh
        const expirationTime = new Date(tokenValidUntil).getTime();
        const now = Date.now();
        const timeUntilExpiration = expirationTime - now;
        const timeUntilRefresh = timeUntilExpiration - (this.tokenRefreshThreshold * 1000);
        // Set up timer if refresh is needed in the future
        if (timeUntilRefresh > 0) {
            const timer = setTimeout(() => {
                this.refreshToken();
            }, timeUntilRefresh);
            this.tokenRefreshTimers.set(this.currentServerId, timer);
        }
        else {
            // Token is already close to expiration, refresh immediately
            this.refreshToken();
        }
    }
    /**
     * Clear all token refresh timers
     */
    clearTokenRefreshTimers() {
        for (const timer of this.tokenRefreshTimers.values()) {
            clearTimeout(timer);
        }
        this.tokenRefreshTimers.clear();
    }
    /**
     * Refresh authentication token
     * @returns True if token was refreshed successfully
     */
    async refreshToken() {
        if (!this.currentServerId || !this.currentClientId) {
            return false;
        }
        try {
            // Send token refresh request
            const response = await this.sendRequest('tokenRefresh', {
                serverId: this.currentServerId,
                clientId: this.currentClientId
            });
            return response.success === true;
        }
        catch (error) {
            console.error('Error refreshing token:', error.message);
            return false;
        }
    }
    /**
     * Handle incoming message
     * @param message - Message to handle
     */
    handleMessage(message) {
        // Find handler for message type
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        }
        else {
            console.warn('No handler for message type:', message.type);
        }
    }
    /**
     * Send a request and wait for response
     * @param requestType - Request type
     * @param payload - Request payload
     * @param timeout - Request timeout in milliseconds
     * @returns Response payload
     */
    async sendRequest(requestType, payload, timeout = 30000) {
        return new Promise((resolve, reject) => {
            // Generate request ID
            const requestId = `${requestType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            // Set up timeout
            const timeoutId = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error(`Request timed out after ${timeout}ms: ${requestType}`));
                }
            }, timeout);
            // Store pending request
            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                timeout: timeoutId
            });
            // Send request
            this.sendMessage({
                type: 'request',
                requestId,
                requestType,
                payload
            });
        });
    }
    /**
     * Handle response message
     * @param response - Response message
     */
    handleResponse(response) {
        const requestId = response.requestId;
        if (requestId && this.pendingRequests.has(requestId)) {
            const { resolve, timeout } = this.pendingRequests.get(requestId);
            // Clear timeout
            clearTimeout(timeout);
            // Remove from pending requests
            this.pendingRequests.delete(requestId);
            // Resolve promise
            resolve(response.payload);
        }
    }
    /**
     * Queue a message for sending
     * @param message - Message to queue
     */
    queueMessage(message) {
        this.messageQueue.push(message);
        // Start processing queue if not already processing
        if (!this.isProcessingQueue) {
            this.processMessageQueue();
        }
    }
    /**
     * Process message queue
     */
    async processMessageQueue() {
        if (this.isProcessingQueue || this.messageQueue.length === 0) {
            return;
        }
        this.isProcessingQueue = true;
        try {
            while (this.messageQueue.length > 0) {
                // Check if socket is connected
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    const message = this.messageQueue.shift();
                    this.socket.send(JSON.stringify(message));
                }
                else {
                    // Socket not connected, try to reconnect
                    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        // Wait for reconnect delay
                        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
                        // Try to reconnect
                        // This is a simplified version, actual implementation would need to recreate the WebSocket
                        if (this.currentServerId && this.currentClientId && this.currentWorkspaceId) {
                            await this.connect(this.currentServerId, this.currentClientId, this.currentWorkspaceId);
                        }
                        else {
                            // Cannot reconnect without connection info
                            break;
                        }
                    }
                    else {
                        // Cannot reconnect, clear queue
                        this.messageQueue = [];
                        break;
                    }
                }
            }
        }
        finally {
            this.isProcessingQueue = false;
        }
    }
}
exports.MCPConnectionManager = MCPConnectionManager;
exports.default = MCPConnectionManager;
//# sourceMappingURL=connection-manager.js.map