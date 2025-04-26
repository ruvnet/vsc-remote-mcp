/**
 * Authentication Flow for VSCode Remote MCP
 * 
 * This module handles the authentication flow for MCP server connections.
 */

const { MCPAuthManager } = require('./auth-manager');
const { ClientStateModel, SessionState } = require('./client-state-model');

/**
 * Authentication Flow Manager class
 */
class AuthenticationFlowManager {
  /**
   * Create a new AuthenticationFlowManager instance
   * @param {Object} options - Authentication flow options
   * @param {Function} options.sendMessage - Function to send messages to the server
   * @param {number} options.tokenRefreshThreshold - Seconds before token expiry to refresh
   */
  constructor(options = {}) {
    this.sendMessage = options.sendMessage || (() => {
      throw new Error('No sendMessage function provided');
    });
    
    this.authManager = new MCPAuthManager();
    this.stateManager = new ClientStateModel();
    
    this.options = {
      tokenRefreshThreshold: options.tokenRefreshThreshold || 300, // 5 minutes
      tokenRefreshInterval: options.tokenRefreshInterval || 60000, // 1 minute
      autoReconnect: options.autoReconnect !== false,
      maxReconnectAttempts: options.maxReconnectAttempts || 5
    };
    
    this.refreshTimer = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Initialize the authentication flow
   * @param {string} serverId - The server ID
   * @param {Object} options - Connection options
   * @param {string} options.token - Authentication token
   * @returns {Promise<Object>} Connection result
   */
  async initialize(serverId, options = {}) {
    this.serverId = serverId;
    
    try {
      // Store the token if provided
      if (options.token) {
        await this.authManager.setToken(serverId, options.token);
      }
      
      // Connect to the server
      await this.stateManager.connect();
      
      // Authenticate
      await this.authenticate();
      
      // Set up token refresh
      this._setupTokenRefresh();
      
      return {
        success: true,
        connectionId: 'connection-id', // This would come from the server in a real implementation
        sessionId: 'session-id' // This would come from the server in a real implementation
      };
    } catch (error) {
      console.error('Authentication flow initialization failed:', error);
      
      // Disconnect on failure
      await this.stateManager.disconnect({
        reason: `Authentication flow initialization failed: ${error.message}`
      });
      
      throw error;
    }
  }

  /**
   * Authenticate with the server
   * @returns {Promise<boolean>} True if authentication was successful
   */
  async authenticate() {
    try {
      // Get the token
      const token = await this.authManager.getToken(this.serverId);
      
      if (!token) {
        throw new Error(`No authentication token available for server: ${this.serverId}`);
      }
      
      // Send authentication request
      const authRequest = {
        type: 'authentication_request',
        id: 'auth-request-id', // This would be a UUID in a real implementation
        timestamp: new Date().toISOString(),
        payload: {
          token,
          clientInfo: {
            name: 'VSCode Remote MCP Client',
            version: '1.0.0'
          }
        }
      };
      
      // Send the authentication request
      await this.sendMessage(authRequest);
      
      // Update state
      await this.stateManager.authenticate();
      
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      
      // Update state
      await this.stateManager.authenticate({ shouldFail: true });
      
      throw error;
    }
  }

  /**
   * Handle token expiration
   * @returns {Promise<boolean>} True if token was refreshed successfully
   */
  async handleTokenExpiration() {
    try {
      // Update state
      await this.stateManager.handleSessionExpiration({
        reason: 'Token expired',
        autoRenew: true
      });
      
      // Refresh the token
      return this.refreshToken();
    } catch (error) {
      console.error('Token expiration handling failed:', error);
      throw error;
    }
  }

  /**
   * Refresh the authentication token
   * @returns {Promise<boolean>} True if token was refreshed successfully
   */
  async refreshToken() {
    try {
      // Generate a new token (in a real implementation, this would come from the server)
      const newToken = this.authManager.generateToken();
      
      // Send token refresh request
      const refreshRequest = {
        type: 'token_refresh_request',
        id: 'refresh-request-id', // This would be a UUID in a real implementation
        timestamp: new Date().toISOString(),
        payload: {
          oldToken: await this.authManager.getToken(this.serverId),
          newToken
        }
      };
      
      // Send the refresh request
      await this.sendMessage(refreshRequest);
      
      // Update the token
      await this.authManager.refreshToken(this.serverId, newToken);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Handle authentication response from the server
   * @param {Object} response - The authentication response
   * @returns {Promise<boolean>} True if authentication was successful
   */
  async handleAuthenticationResponse(response) {
    if (response.payload.status === 'success') {
      // Authentication successful
      return true;
    } else {
      // Authentication failed
      const error = new Error(response.payload.error || 'Authentication failed');
      
      // Update state
      await this.stateManager.authenticate({ shouldFail: true });
      
      throw error;
    }
  }

  /**
   * Handle token refresh response from the server
   * @param {Object} response - The token refresh response
   * @returns {Promise<boolean>} True if token refresh was successful
   */
  async handleTokenRefreshResponse(response) {
    if (response.payload.status === 'success') {
      // Token refresh successful
      if (response.payload.newToken) {
        await this.authManager.refreshToken(this.serverId, response.payload.newToken);
      }
      
      return true;
    } else {
      // Token refresh failed
      const error = new Error(response.payload.error || 'Token refresh failed');
      throw error;
    }
  }

  /**
   * Set up automatic token refresh
   * @private
   */
  _setupTokenRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      try {
        // Check if token is about to expire
        if (this.authManager.isTokenAboutToExpire(this.serverId, this.options.tokenRefreshThreshold)) {
          this.refreshToken().catch(error => {
            console.error('Automatic token refresh failed:', error);
          });
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
      }
    }, this.options.tokenRefreshInterval);
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

module.exports = {
  AuthenticationFlowManager
};