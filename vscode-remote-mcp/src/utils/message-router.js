/**
 * Message Router for VSCode Remote MCP
 * 
 * This module handles routing of messages to appropriate handlers, including:
 * - Registering message handlers
 * - Routing incoming messages to the correct handler
 * - Managing message flow and responses
 */

const { validateMessage } = require('./message-validator');

/**
 * Message Router class
 */
class MessageRouter {
  /**
   * Create a new MessageRouter instance
   * @param {ConfigManager} configManager - The configuration manager instance
   * @param {AuthManager} authManager - The authentication manager instance
   */
  constructor(configManager, authManager) {
    // References to managers
    this.configManager = configManager;
    this.authManager = authManager;
    
    // Map of message handlers: messageType -> handler function
    this.handlers = new Map();
    
    // Map of authenticated message types: messageType -> boolean
    this.authenticatedTypes = new Map();
    
    // Server configuration
    this.serverConfig = configManager.getSection('server');
  }

  /**
   * Register a message handler
   * @param {string} messageType - The message type to handle
   * @param {Function} handler - The handler function
   * @param {boolean} requiresAuth - Whether this message type requires authentication
   */
  registerHandler(messageType, handler, requiresAuth = false) {
    this.handlers.set(messageType, handler);
    this.authenticatedTypes.set(messageType, requiresAuth);
  }

  /**
   * Process an incoming message
   * @param {Object} message - The message to process
   * @param {Object} client - The client that sent the message
   * @returns {Promise<Object|null>} Response message or null if no response
   */
  async processMessage(message, client) {
    try {
      // Validate message format
      validateMessage(message);
      
      // Log message for debugging
      if (this.serverConfig.logLevel === 'debug') {
        console.log(`Received message: ${JSON.stringify(message)}`);
      }
      
      // Get message type
      const messageType = message.type;
      
      // Check if handler exists
      if (!this.handlers.has(messageType)) {
        return this.createErrorResponse(message, 'Unknown message type', 'UNKNOWN_TYPE');
      }
      
      // Check if authentication is required
      const requiresAuth = this.authenticatedTypes.get(messageType);
      
      if (requiresAuth && this.authManager.isAuthEnabled()) {
        // Get token from message
        const token = message.token;
        
        if (!token) {
          return this.createErrorResponse(message, 'Authentication required', 'AUTH_REQUIRED');
        }
        
        // Validate token
        const tokenInfo = this.authManager.validateToken(token);
        
        if (!tokenInfo) {
          return this.createErrorResponse(message, 'Invalid or expired token', 'INVALID_TOKEN');
        }
        
        // Add token info to client for handler use
        client.tokenInfo = tokenInfo;
      }
      
      // Get handler
      const handler = this.handlers.get(messageType);
      
      // Call handler
      const response = await handler(message, client);
      
      // Return response if provided
      return response;
    } catch (error) {
      // Handle error
      return this.createErrorResponse(message, error.message, 'PROCESSING_ERROR');
    }
  }

  /**
   * Create an error response
   * @param {Object} originalMessage - The original message
   * @param {string} errorMessage - The error message
   * @param {string} errorCode - The error code
   * @returns {Object} Error response message
   */
  createErrorResponse(originalMessage, errorMessage, errorCode = 'ERROR') {
    return {
      type: 'error',
      id: originalMessage ? originalMessage.id : `error-${Date.now()}`,
      timestamp: new Date().toISOString(),
      payload: {
        code: errorCode,
        message: errorMessage,
        relatedTo: originalMessage ? originalMessage.type : 'unknown'
      }
    };
  }

  /**
   * Create a success response
   * @param {Object} originalMessage - The original message
   * @param {Object} payload - The response payload
   * @param {string} responseType - The response type (defaults to originalType + '_ack')
   * @returns {Object} Success response message
   */
  createSuccessResponse(originalMessage, payload, responseType = null) {
    const type = responseType || `${originalMessage.type}_ack`;
    
    return {
      type,
      id: originalMessage.id,
      timestamp: new Date().toISOString(),
      payload
    };
  }

  /**
   * Get all registered message types
   * @returns {Array} Array of registered message types
   */
  getRegisteredMessageTypes() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if a message type requires authentication
   * @param {string} messageType - The message type
   * @returns {boolean} True if authentication is required
   */
  requiresAuthentication(messageType) {
    return this.authenticatedTypes.get(messageType) || false;
  }

  /**
   * Unregister a message handler
   * @param {string} messageType - The message type to unregister
   * @returns {boolean} True if handler was unregistered, false otherwise
   */
  unregisterHandler(messageType) {
    const result = this.handlers.delete(messageType);
    this.authenticatedTypes.delete(messageType);
    return result;
  }

  /**
   * Unregister all message handlers
   */
  unregisterAllHandlers() {
    this.handlers.clear();
    this.authenticatedTypes.clear();
  }
}

module.exports = {
  MessageRouter
};