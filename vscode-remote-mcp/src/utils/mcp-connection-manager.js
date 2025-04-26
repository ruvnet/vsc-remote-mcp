/**
 * MCP Connection Manager for VSCode Remote MCP
 * 
 * This module manages connections to MCP servers.
 */

const { MCPAuthManager } = require('./auth-manager');
const { createAuthError, createConnectionError } = require('./error-handler');

/**
 * MCP Connection Manager class
 */
class MCPConnectionManager {
  /**
   * Create a new MCPConnectionManager instance
   * @param {Object} options - Connection options
   */
  constructor(options = {}) {
    this.options = {
      reconnectDelay: 5000, // 5 seconds
      maxReconnectAttempts: 5,
      ...options
    };
    
    this.connections = new Map();
    this.pendingRequests = new Map();
    this.authManager = new MCPAuthManager();
    this.messageHandlers = new Map();
    this.refreshTimers = new Map();
    this.reconnectAttempts = new Map();
    this.isConnecting = new Map();
  }

  /**
   * Register a message handler
   * @param {string} messageType - The message type
   * @param {Function} handler - The handler function
   * @returns {void}
   */
  registerMessageHandler(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Connect to a server
   * @param {string} serverId - The server ID
   * @param {string} url - The server URL
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} Connection response
   */
  async connect(serverId, url, token) {
    // Check if already connecting
    if (this.isConnecting.get(serverId)) {
      throw new Error(`Already connecting to server: ${serverId}`);
    }
    
    // Set connecting flag
    this.isConnecting.set(serverId, true);
    
    try {
      // Store token
      await this.authManager.setToken(serverId, token);
      
      // Create connection message
      const connectionMessage = {
        type: 'connection',
        id: `conn-${Date.now()}`,
        payload: {
          authToken: await this.authManager.getTokenHash(serverId),
          clientInfo: {
            name: 'VSCode Remote MCP',
            version: '1.0.0',
            platform: process.platform
          }
        }
      };
      
      // Send connection message
      const response = await this.sendMessage(serverId, connectionMessage);
      
      // Check response
      if (response.type === 'error') {
        throw new Error(response.payload.message || 'Connection failed');
      }
      
      // Store connection
      this.connections.set(serverId, {
        url,
        connected: true,
        lastActivity: Date.now()
      });
      
      // Reset reconnect attempts
      this.reconnectAttempts.set(serverId, 0);
      
      // Clear connecting flag
      this.isConnecting.set(serverId, false);
      
      return response;
    } catch (error) {
      // Clear connecting flag
      this.isConnecting.set(serverId, false);
      
      // Remove token
      await this.authManager.removeToken(serverId);
      
      throw error;
    }
  }

  /**
   * Disconnect from a server
   * @param {string} serverId - The server ID
   * @returns {Promise<void>}
   */
  async disconnect(serverId) {
    // Check if connected
    if (!this.connections.has(serverId)) {
      return;
    }
    
    // Send disconnect message
    try {
      const disconnectMessage = {
        type: 'disconnect',
        id: `disc-${Date.now()}`,
        payload: {}
      };
      
      await this.sendMessage(serverId, disconnectMessage);
    } catch (error) {
      console.error(`Error sending disconnect message to server ${serverId}:`, error);
    }
    
    // Clear refresh timer
    this._clearRefreshTimer(serverId);
    
    // Remove token
    await this.authManager.removeToken(serverId);
    
    // Remove connection
    this.connections.delete(serverId);
  }

  /**
   * Send a message to a server
   * @param {string} serverId - The server ID
   * @param {Object} message - The message
   * @returns {Promise<Object>} Response message
   */
  async sendMessage(serverId, message) {
    // Check if connected
    if (!this.connections.has(serverId) && message.type !== 'connection') {
      throw new Error(`Not connected to server: ${serverId}`);
    }
    
    // Create a promise for the response
    const responsePromise = new Promise((resolve, reject) => {
      // Store the promise callbacks
      this.pendingRequests.set(message.id, {
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      // Set timeout to reject the promise if no response is received
      setTimeout(() => {
        if (this.pendingRequests.has(message.id)) {
          const { reject } = this.pendingRequests.get(message.id);
          reject(new Error(`Request timed out: ${message.id}`));
          this.pendingRequests.delete(message.id);
        }
      }, 30000); // 30 seconds
    });
    
    // Send the message
    try {
      // Mock sending the message (in a real implementation, this would use WebSockets)
      console.log(`Sending message to server ${serverId}:`, message);
      
      // Update last activity
      if (this.connections.has(serverId)) {
        const connection = this.connections.get(serverId);
        connection.lastActivity = Date.now();
        this.connections.set(serverId, connection);
      }
      
      // Return the response promise
      return responsePromise;
    } catch (error) {
      // Remove the pending request
      this.pendingRequests.delete(message.id);
      
      throw error;
    }
  }

  /**
   * Handle a message from a server
   * @param {string} serverId - The server ID
   * @param {Object} message - The message
   * @returns {void}
   */
  handleMessage(serverId, message) {
    // Check if message is a response to a pending request
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve } = this.pendingRequests.get(message.id);
      resolve(message);
      this.pendingRequests.delete(message.id);
      return;
    }
    
    // Check if there's a handler for this message type
    if (message.type && this.messageHandlers.has(message.type)) {
      const handler = this.messageHandlers.get(message.type);
      handler(serverId, message);
      return;
    }
    
    // Handle specific message types
    switch (message.type) {
      case 'token_expired':
        this._handleTokenExpired(serverId, message);
        break;
      case 'token_refresh':
        this._handleTokenRefresh(serverId, message);
        break;
      default:
        console.warn(`Unhandled message type: ${message.type}`);
    }
  }

  /**
   * Handle token expired message
   * @param {string} serverId - The server ID
   * @param {Object} message - The message
   * @private
   */
  async _handleTokenExpired(serverId, message) {
    console.log(`Token expired for server ${serverId}`);
    
    // Remove token
    await this.authManager.removeToken(serverId);
    
    // Trigger token refresh
    if (this.options.onTokenExpired) {
      this.options.onTokenExpired(serverId, message);
    }
  }

  /**
   * Handle token refresh message
   * @param {string} serverId - The server ID
   * @param {Object} message - The message
   * @private
   */
  async _handleTokenRefresh(serverId, message) {
    console.log(`Token refresh for server ${serverId}`);
    
    // Check if refresh was successful
    if (message.payload && message.payload.success) {
      // Update token if provided
      if (message.payload.newToken) {
        await this.authManager.setRefreshedToken(
          serverId,
          message.payload.newToken,
          message.payload.expiresAt ? new Date(message.payload.expiresAt) : null
        );
      }
      
      // Trigger token refresh success
      if (this.options.onTokenRefreshSuccess) {
        this.options.onTokenRefreshSuccess(serverId, message);
      }
    } else {
      // Trigger token refresh failure
      if (this.options.onTokenRefreshFailure) {
        this.options.onTokenRefreshFailure(serverId, message);
      }
    }
  }

  /**
   * Set up token refresh timer
   * @param {string} serverId - The server ID
   * @param {Date} expiresAt - Token expiration date
   * @private
   */
  _setupRefreshTimer(serverId, expiresAt) {
    // Clear existing timer
    this._clearRefreshTimer(serverId);
    
    // Calculate time until refresh
    const now = Date.now();
    const expiresTime = expiresAt.getTime();
    const refreshTime = expiresTime - (5 * 60 * 1000); // 5 minutes before expiry
    
    // If already past refresh time, don't set timer
    if (refreshTime <= now) {
      return;
    }
    
    // Set timer
    const delay = refreshTime - now;
    const timer = setTimeout(() => {
      this.refreshToken(serverId);
    }, delay);
    
    // Store timer
    this.refreshTimers.set(serverId, timer);
  }

  /**
   * Clear token refresh timer
   * @param {string} serverId - The server ID
   * @private
   */
  _clearRefreshTimer(serverId) {
    const timer = this.refreshTimers.get(serverId);
    
    if (timer) {
      clearTimeout(timer);
      this.refreshTimers.delete(serverId);
    }
  }

  /**
   * Refresh token for a server
   * @param {string} serverId - The server ID
   * @returns {Promise<Object>} Refresh response
   */
  async refreshToken(serverId) {
    // Check if connected
    if (!this.connections.has(serverId)) {
      throw new Error(`Not connected to server: ${serverId}`);
    }
    
    // Send refresh message
    const refreshMessage = {
      type: 'token_refresh',
      id: `refresh-${Date.now()}`,
      payload: {
        tokenHash: await this.authManager.getTokenHash(serverId)
      }
    };
    
    return this.sendMessage(serverId, refreshMessage);
  }
}

module.exports = {
  MCPConnectionManager
};