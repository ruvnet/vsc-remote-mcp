/**
 * Connection Manager for VSCode Remote MCP
 * Handles WebSocket connections, authentication, and message flow
 */

const { ClientStateManager } = require('./client-state-model');
const { MCPAuthManager } = require('./auth-manager');

/**
 * MCP Connection Manager
 * Manages WebSocket connections to MCP servers
 */
class MCPConnectionManager {
  /**
   * Create a new connection manager
   * @param {Object} options - Connection options
   * @param {Function} options.sendMessage - Function to send messages
   * @param {string} options.url - WebSocket URL
   * @param {number} options.tokenRefreshThreshold - Seconds before token expiry to refresh
   * @param {number} options.reconnectDelay - Milliseconds to wait before reconnecting
   * @param {number} options.maxReconnectAttempts - Maximum number of reconnect attempts
   * @param {boolean} options.autoReconnect - Whether to automatically reconnect
   */
  constructor(options = {}) {
    this.sendMessage = options.sendMessage || (() => {});
    this.tokenRefreshThreshold = options.tokenRefreshThreshold || 300;
    this.url = options.url || '';
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.autoReconnect = options.autoReconnect !== false;
    
    this.stateManager = new ClientStateManager();
    this.authManager = new MCPAuthManager();
    this.socket = null;
    this.currentServerId = null;
    this.currentClientId = null;
    this.currentWorkspaceId = null;
    this.tokenRefreshTimers = new Map();
    this.messageHandlers = new Map();
    this.pendingRequests = new Map();
    this.messageQueue = [];
    this.isProcessingQueue = false;
    
    this.setupDefaultMessageHandlers();
  }

  /**
   * Set up default message handlers
   */
  setupDefaultMessageHandlers() {
    // Handle authentication responses
    this.registerMessageHandler('auth', (message) => {
      if (message.payload && message.payload.success) {
        // Authentication successful
        this.stateManager.setConnectionState('Connected');
        
        // Set up token refresh if expiry is provided
        if (message.payload.tokenValidUntil) {
          this.setupTokenRefreshTimer(message.payload.tokenValidUntil);
        }
      } else {
        // Authentication failed
        this.stateManager.setConnectionState('AuthenticationFailed');
        console.error('Authentication failed:', message.payload?.error || 'Unknown error');
      }
    });
    
    // Handle session responses
    this.registerMessageHandler('session', (message) => {
      if (message.payload && message.payload.success) {
        // Session started successfully
        this.stateManager.setSessionState('Active');
      } else {
        // Session failed to start
        this.stateManager.setSessionState('Failed');
        console.error('Session failed:', message.payload?.error || 'Unknown error');
      }
    });
    
    // Handle response messages
    this.registerMessageHandler('response', (message) => {
      this.handleResponse(message);
    });
  }

  /**
   * Register a message handler
   * @param {string} type - Message type
   * @param {Function} handler - Handler function
   */
  registerMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Connect to an MCP server
   * @param {string} serverId - Server ID
   * @param {string} clientId - Client ID
   * @param {string} workspaceId - Workspace ID
   * @param {Array<string>} capabilities - Client capabilities
   * @returns {Promise<boolean>} True if connection was successful
   */
  connect(serverId, clientId, workspaceId, capabilities) {
    this.currentServerId = serverId;
    this.currentClientId = clientId;
    this.currentWorkspaceId = workspaceId;
    
    return new Promise((resolve) => {
      // Get authentication token
      this.authManager.getToken(serverId)
        .then((authToken) => {
          // If no token is available, fail the connection
          if (!authToken) {
            console.error('Authentication failed: No token available');
            resolve(false);
            return;
          }
          
          // Send connection message
          if (typeof this.sendMessage === 'function') {
            this.sendMessage({
              type: 'connection',
              payload: {
                clientId,
                workspaceId,
                capabilities: capabilities || ['terminal', 'editor'],
                authToken
              }
            });
          }
          
          resolve(true);
        })
        .catch((error) => {
          console.error('Authentication failed:', error.message);
          resolve(false);
        });
    });
  }

  /**
   * Disconnect from the MCP server
   * @param {boolean} clearAuth - Whether to clear authentication tokens
   * @returns {Promise<boolean>} True if disconnection was successful
   */
  disconnect(clearAuth = false) {
    return new Promise((resolve) => {
      try {
        // Check if already disconnected
        if (this.stateManager.getConnectionState() === 'Disconnected') {
          resolve(true);
          return;
        }
        
        // Send disconnect message
        if (typeof this.sendMessage === 'function') {
          this.sendMessage({
            type: 'disconnect',
            payload: {
              clientId: this.currentClientId
            }
          });
        }
        
        // Clear token refresh timers
        this.clearTokenRefreshTimers();
        
        // Clear authentication token if requested
        if (clearAuth && this.currentServerId) {
          this.authManager.clearToken(this.currentServerId)
            .then(() => {
              // Update state
              this.stateManager.setConnectionState('Disconnected');
              resolve(true);
            })
            .catch((error) => {
              console.error('Failed to clear auth token:', error.message);
              // Still consider disconnection successful
              this.stateManager.setConnectionState('Disconnected');
              resolve(true);
            });
        } else {
          // Update state
          this.stateManager.setConnectionState('Disconnected');
          resolve(true);
        }
      } catch (error) {
        console.error('Disconnection failed:', error.message);
        resolve(false);
      }
    });
  }

  /**
   * Start a session
   * @param {string} sessionId - Session ID
   * @param {Object} sessionOptions - Session options
   * @returns {Promise<boolean>} True if session was started successfully
   */
  startSession(sessionId, sessionOptions = {}) {
    return new Promise((resolve) => {
      try {
        // Check if connected
        if (this.stateManager.getConnectionState() !== 'Connected') {
          console.error('Cannot start session: Not connected');
          resolve(false);
          return;
        }
        
        // Send session start message
        if (typeof this.sendMessage === 'function') {
          this.sendMessage({
            type: 'session',
            payload: {
              action: 'start',
              sessionId,
              options: sessionOptions
            }
          });
        }
        
        // Update state
        this.stateManager.setSessionState('Starting');
        
        resolve(true);
      } catch (error) {
        console.error('Failed to start session:', error.message);
        resolve(false);
      }
    });
  }

  /**
   * End the current session
   * @returns {Promise<boolean>} True if session was ended successfully
   */
  endSession() {
    return new Promise((resolve) => {
      try {
        // Check if session is active
        if (this.stateManager.getSessionState() !== 'Active') {
          console.error('Cannot end session: No active session');
          resolve(false);
          return;
        }
        
        // Send session end message
        if (typeof this.sendMessage === 'function') {
          this.sendMessage({
            type: 'session',
            payload: {
              action: 'end'
            }
          });
        }
        
        // Update state
        this.stateManager.setSessionState('Ending');
        
        resolve(true);
      } catch (error) {
        console.error('Failed to end session:', error.message);
        resolve(false);
      }
    });
  }

  /**
   * Enable or disable automatic reconnection
   * @param {boolean} enable - Whether to enable reconnection
   */
  enableReconnection(enable) {
    this.autoReconnect = enable;
  }

  /**
   * Set up a timer to refresh the authentication token
   * @param {number} tokenValidUntil - Unix timestamp when token expires
   */
  setupTokenRefreshTimer(tokenValidUntil) {
    // Clear any existing timers
    this.clearTokenRefreshTimers();
    
    // Calculate when to refresh the token
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = tokenValidUntil - now;
    const refreshIn = Math.max(0, expiresIn - this.tokenRefreshThreshold);
    
    // Set up timer
    if (refreshIn > 0) {
      const timerId = setTimeout(() => {
        this.refreshToken();
      }, refreshIn * 1000);
      
      this.tokenRefreshTimers.set('refresh', timerId);
    }
  }

  /**
   * Clear all token refresh timers
   */
  clearTokenRefreshTimers() {
    for (const timerId of this.tokenRefreshTimers.values()) {
      clearTimeout(timerId);
    }
    this.tokenRefreshTimers.clear();
  }

  /**
   * Refresh the authentication token
   * @returns {Promise<boolean>} True if token was refreshed successfully
   */
  refreshToken() {
    return new Promise((resolve) => {
      // Check if connected
      if (this.stateManager.getConnectionState() !== 'Connected') {
        resolve(false);
        return;
      }
      
      // Send token refresh request
      this.sendRequest('auth', {
        action: 'refresh',
        serverId: this.currentServerId
      })
        .then((response) => {
          // Handle response
          if (response && response.success && response.token) {
            // Update token
            this.authManager.setToken(this.currentServerId, response.token)
              .then(() => {
                // Set up new refresh timer if expiry is provided
                if (response.tokenValidUntil) {
                  this.setupTokenRefreshTimer(response.tokenValidUntil);
                }
                
                resolve(true);
              })
              .catch((error) => {
                console.error('Failed to set token:', error.message);
                resolve(false);
              });
          } else {
            resolve(false);
          }
        })
        .catch((error) => {
          console.error('Failed to refresh token:', error.message);
          resolve(false);
        });
    });
  }

  /**
   * Handle an incoming message
   * @param {Object} message - Message object
   */
  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  /**
   * Send a request and wait for a response
   * @param {string} requestType - Request type
   * @param {Object} payload - Request payload
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Response payload
   */
  sendRequest(requestType, payload, timeout = 30000) {
    return new Promise((resolve, reject) => {
      try {
        // Generate a unique request ID
        const requestId = `${requestType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Set up timeout
        const timeoutId = setTimeout(() => {
          // Remove from pending requests
          this.pendingRequests.delete(requestId);
          
          // Reject with timeout error
          reject(new Error(`Request timed out: ${requestType}`));
        }, timeout);
        
        // Store in pending requests
        this.pendingRequests.set(requestId, {
          resolve,
          reject,
          timeoutId
        });
        
        // Send request
        this.sendMessage({
          type: 'request',
          requestId,
          requestType,
          payload
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle a response message
   * @param {Object} response - Response message
   */
  handleResponse(response) {
    // Check if this is a response to a pending request
    const requestId = response.requestId;
    if (requestId && this.pendingRequests.has(requestId)) {
      // Get pending request
      const { resolve, reject, timeoutId } = this.pendingRequests.get(requestId);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Remove from pending requests
      this.pendingRequests.delete(requestId);
      
      // Resolve or reject based on response
      if (response.payload && response.payload.error) {
        reject(new Error(response.payload.error));
      } else {
        resolve(response.payload);
      }
    }
  }

  /**
   * Queue a message to be sent
   * @param {Object} message - Message to send
   */
  queueMessage(message) {
    this.messageQueue.push(message);
    
    // Start processing the queue if not already processing
    if (!this.isProcessingQueue) {
      this.processMessageQueue();
    }
  }

  /**
   * Process the message queue
   * @returns {Promise<void>}
   */
  processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return Promise.resolve();
    }
    
    this.isProcessingQueue = true;
    
    return new Promise((resolve) => {
      const processNext = () => {
        if (this.messageQueue.length === 0) {
          this.isProcessingQueue = false;
          resolve();
          return;
        }
        
        const message = this.messageQueue.shift();
        
        // Send the message
        if (typeof this.sendMessage === 'function') {
          this.sendMessage(message);
        }
        
        // Small delay to prevent flooding
        setTimeout(processNext, 10);
      };
      
      processNext();
    });
  }
}

module.exports = { MCPConnectionManager };