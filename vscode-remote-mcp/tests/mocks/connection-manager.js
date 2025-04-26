/**
 * Mock Connection Manager for VSCode Remote MCP
 */

class MCPConnectionManager {
  constructor(options = {}) {
    this.sendMessage = options.sendMessage || (() => {});
    this.tokenRefreshThreshold = options.tokenRefreshThreshold || 300;
    this.url = options.url || '';
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.autoReconnect = options.autoReconnect !== false;
    
    this.stateManager = {
      notifyListeners: jest.fn(),
      getConnectionState: jest.fn().mockReturnValue('Disconnected')
    };
    this.authManager = {
      getToken: jest.fn().mockResolvedValue('mock-token'),
      clearToken: jest.fn()
    };
    this.socket = null;
    this.currentServerId = null;
    this.currentClientId = null;
    this.currentWorkspaceId = null;
    this.tokenRefreshTimers = new Map();
    this.messageHandlers = new Map();
    this.pendingRequests = new Map();
    this.messageQueue = [];
    this.isProcessingQueue = false;
  }

  setupDefaultMessageHandlers() {
    // Mock implementation
  }

  registerMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

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
      
      return true;
    } catch (error) {
      console.error('Authentication failed:', error.message);
      return false;
    }
  }

  async disconnect(clearAuth = false) {
    if (clearAuth) {
      await this.authManager.clearToken(this.currentServerId);
    }
    return true;
  }

  async startSession(sessionId, sessionOptions = {}) {
    return true;
  }

  async endSession() {
    return true;
  }

  enableReconnection(enable) {
    this.autoReconnect = enable;
  }

  setupTokenRefreshTimer(tokenValidUntil) {
    // Mock implementation
  }

  clearTokenRefreshTimers() {
    this.tokenRefreshTimers.clear();
  }

  async refreshToken() {
    return true;
  }

  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  async sendRequest(requestType, payload, timeout = 30000) {
    return { success: true };
  }

  handleResponse(response) {
    // Mock implementation
  }

  queueMessage(message) {
    this.messageQueue.push(message);
  }

  async processMessageQueue() {
    // Mock implementation
  }
}

// Create a mock ConnectionManager for testing
const ConnectionManager = jest.fn().mockImplementation(() => ({
  getClient: jest.fn(),
  getAllClients: jest.fn(),
  reconnect: jest.fn(),
  disconnect: jest.fn()
}));

module.exports = {
  MCPConnectionManager,
  ConnectionManager
};