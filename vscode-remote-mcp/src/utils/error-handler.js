/**
 * Error handling utilities for the MCP server
 * 
 * This module provides a comprehensive error handling system for the VSCode Remote MCP,
 * including error codes, categories, descriptive messages, logging, and recovery strategies.
 * 
 * @module error-handler
 */

/**
 * Error code categories for better organization and handling
 * @enum {Object}
 */
const ErrorCategory = {
  PROTOCOL: 'PROTOCOL',
  AUTHENTICATION: 'AUTH',
  SESSION: 'SESSION',
  RESOURCE: 'RESOURCE',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT'
};

/**
 * Error codes organized by category
 * @enum {Object}
 */
const ErrorCode = {
  // Protocol errors
  INVALID_MESSAGE_FORMAT: { category: ErrorCategory.PROTOCOL, retryable: true },
  UNKNOWN_MESSAGE_TYPE: { category: ErrorCategory.PROTOCOL, retryable: true },
  MISSING_REQUIRED_FIELD: { category: ErrorCategory.PROTOCOL, retryable: true },
  INVALID_FIELD_VALUE: { category: ErrorCategory.PROTOCOL, retryable: true },
  
  // Authentication errors
  AUTH_FAILED: { category: ErrorCategory.AUTHENTICATION, retryable: false },
  AUTH_EXPIRED: { category: ErrorCategory.AUTHENTICATION, retryable: false },
  AUTH_REQUIRED: { category: ErrorCategory.AUTHENTICATION, retryable: false },
  AUTH_INSUFFICIENT_PERMISSIONS: { category: ErrorCategory.AUTHENTICATION, retryable: false },
  
  // Session errors
  SESSION_NOT_FOUND: { category: ErrorCategory.SESSION, retryable: true },
  SESSION_ALREADY_EXISTS: { category: ErrorCategory.SESSION, retryable: false },
  SESSION_JOIN_REJECTED: { category: ErrorCategory.SESSION, retryable: false },
  SESSION_FULL: { category: ErrorCategory.SESSION, retryable: false },
  
  // Resource errors
  RESOURCE_NOT_FOUND: { category: ErrorCategory.RESOURCE, retryable: true },
  RESOURCE_LOCKED: { category: ErrorCategory.RESOURCE, retryable: true },
  RESOURCE_LIMIT_EXCEEDED: { category: ErrorCategory.RESOURCE, retryable: false },
  RESOURCE_CONFLICT: { category: ErrorCategory.RESOURCE, retryable: false },
  
  // Server errors
  SERVER_ERROR: { category: ErrorCategory.SERVER, retryable: true },
  SERVER_OVERLOADED: { category: ErrorCategory.SERVER, retryable: true },
  SERVER_MAINTENANCE: { category: ErrorCategory.SERVER, retryable: false },
  SERVER_SHUTTING_DOWN: { category: ErrorCategory.SERVER, retryable: false },
  
  // Client errors
  CLIENT_TIMEOUT: { category: ErrorCategory.CLIENT, retryable: true },
  CLIENT_DISCONNECTED: { category: ErrorCategory.CLIENT, retryable: true },
  CLIENT_RATE_LIMITED: { category: ErrorCategory.CLIENT, retryable: true },
  CLIENT_VERSION_UNSUPPORTED: { category: ErrorCategory.CLIENT, retryable: false },
  
  // Test error
  TEST_ERROR: { category: ErrorCategory.CLIENT, retryable: true }
};

/**
 * Default recovery actions for specific error codes
 * @enum {Object}
 */
const DefaultRecoveryActions = {
  INVALID_MESSAGE_FORMAT: 'Resend with correct format',
  UNKNOWN_MESSAGE_TYPE: 'Check message type spelling',
  MISSING_REQUIRED_FIELD: 'Resend with all required fields',
  INVALID_FIELD_VALUE: 'Resend with valid field value',
  AUTH_FAILED: 'Check credentials and try again',
  AUTH_EXPIRED: 'Refresh token and reconnect',
  AUTH_REQUIRED: 'Provide authentication token',
  AUTH_INSUFFICIENT_PERMISSIONS: 'Request token with appropriate permissions',
  SESSION_NOT_FOUND: 'Check session ID or create new session',
  SESSION_ALREADY_EXISTS: 'Use a different session ID',
  SESSION_JOIN_REJECTED: 'Request permission to join session',
  SESSION_FULL: 'Wait for a participant to leave or join another session',
  RESOURCE_NOT_FOUND: 'Check resource identifier',
  RESOURCE_LOCKED: 'Wait and retry later',
  RESOURCE_LIMIT_EXCEEDED: 'Free up resources or reduce scope',
  RESOURCE_CONFLICT: 'Refresh document and reapply changes',
  SERVER_ERROR: 'Retry operation',
  SERVER_OVERLOADED: 'Wait and retry with backoff',
  SERVER_MAINTENANCE: 'Reconnect later',
  SERVER_SHUTTING_DOWN: 'Reconnect when server is available',
  CLIENT_TIMEOUT: 'Check network connection and retry',
  CLIENT_DISCONNECTED: 'Reconnect to the server',
  CLIENT_RATE_LIMITED: 'Reduce request frequency and retry later',
  CLIENT_VERSION_UNSUPPORTED: 'Update client to a supported version',
  TEST_ERROR: 'This is a test error recovery action'
};

/**
 * Create a standardized error message
 * @param {string} code - Error code from the ErrorCode enum
 * @param {string} message - Error message
 * @param {string|null} [id] - Optional message ID
 * @param {string|null} [relatedTo] - Optional related message ID
 * @param {boolean} [fatal=false] - Whether this is a fatal error
 * @param {Object|null} [details] - Optional additional error details
 * @param {string} [recoveryAction] - Optional recovery action suggestion
 * @returns {Object} Formatted error message
 * @throws {Error} If parameters are invalid
 */
function createErrorMessage(code, message, id, relatedTo, fatal = false, details, recoveryAction) {
  if (typeof code !== 'string' || code.trim() === '') {
    throw new Error('Error code must be a non-empty string');
  }
  
  if (typeof message !== 'string' || message.trim() === '') {
    throw new Error('Error message must be a non-empty string');
  }
  
  const errorMessage = {
    type: 'error',
    payload: {
      code,
      message,
      fatal: !!fatal // Ensure boolean
    }
  };
  
  // Add optional fields if provided
  if (id !== undefined && id !== null) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('Message ID must be a non-empty string when provided');
    }
    errorMessage.id = id;
  }
  
  if (relatedTo !== undefined && relatedTo !== null) {
    if (typeof relatedTo !== 'string' || relatedTo.trim() === '') {
      throw new Error('Related message ID must be a non-empty string when provided');
    }
    errorMessage.payload.relatedTo = relatedTo;
  }
  
  if (details !== undefined && details !== null) {
    if (typeof details !== 'object') {
      throw new Error('Error details must be an object when provided');
    }
    errorMessage.payload.details = details;
  }
  
  if (recoveryAction !== undefined) {
    if (typeof recoveryAction !== 'string' || recoveryAction.trim() === '') {
      throw new Error('Recovery action must be a non-empty string when provided');
    }
    errorMessage.payload.recoveryAction = recoveryAction;
  }
  
  // Add category information
  if (ErrorCode[code] && ErrorCode[code].category) {
    errorMessage.payload.category = ErrorCode[code].category;
  }
  
  return errorMessage;
}

/**
 * Validate an error message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid, throws an error otherwise
 * @throws {Error} If the message is invalid
 */
function validateErrorMessage(message) {
  // Check if message is an object
  if (typeof message !== 'object' || message === null) {
    throw new Error('Error message must be an object');
  }
  
  // Check message type
  if (message.type !== 'error') {
    throw new Error('Error message must have type "error"');
  }
  
  // Check payload
  if (!message.payload || typeof message.payload !== 'object') {
    throw new Error('Error message must contain a payload object');
  }
  
  // Check required payload fields
  if (!message.payload.code) {
    throw new Error('Error payload must contain a code');
  }
  
  if (typeof message.payload.code !== 'string') {
    throw new Error('Error code must be a string');
  }
  
  if (!message.payload.message) {
    throw new Error('Error payload must contain a message');
  }
  
  if (typeof message.payload.message !== 'string') {
    throw new Error('Error message must be a string');
  }
  
  // Check optional fields
  if (message.id !== undefined && (typeof message.id !== 'string' || message.id.trim() === '')) {
    throw new Error('Message ID must be a non-empty string when provided');
  }
  
  // Validate category if present
  if (message.payload.category && !Object.values(ErrorCategory).includes(message.payload.category)) {
    throw new Error('Error category must be a valid category');
  }
  
  return true;
}

/**
 * Check if an error is fatal
 * @param {Object} error - The error message
 * @returns {boolean} True if the error is fatal
 */
function isFatalError(error) {
  // Handle null or undefined input
  if (!error) {
    return false;
  }
  return error && error.payload && error.payload.fatal === true;
}

/**
 * Get the category of an error
 * @param {Object} error - The error message
 * @returns {string|null} The error category or null if not categorized
 */
function getErrorCategory(error) {
  return error && error.payload && error.payload.category || null;
}

/**
 * Check if an error is retryable
 * @param {Object} error - The error message
 * @returns {boolean} True if the error can be retried
 */
function isRetryableError(error) {
  // Fatal errors are not retryable
  if (isFatalError(error)) {
    return false;
  }
  
  // Check if we have retryable information in the ErrorCode mapping
  if (error && error.payload && error.payload.code && ErrorCode[error.payload.code]) {
    return ErrorCode[error.payload.code].retryable;
  }
  
  // Default to non-retryable for unknown errors
  return false;
}

/**
 * Get the recovery action from an error
 * @param {Object} error - The error message
 * @param {boolean} [includeDefaults=false] - Whether to include default recovery actions
 * @returns {string|null} The recovery action or null if none
 */
function getRecoveryAction(error, includeDefaults = false) {
  // First check if the error has a recovery action
  if (error && error.payload && error.payload.recoveryAction) {
    return error.payload.recoveryAction;
  }
  
  // If includeDefaults is true, check if we have a default recovery action for this code
  if (includeDefaults && error && error.payload && error.payload.code && DefaultRecoveryActions[error.payload.code]) {
    return DefaultRecoveryActions[error.payload.code];
  }
  
  return null;
}

/**
 * Handle an error with appropriate strategy
 * @param {Object} error - The error message
 * @param {Object} handlers - Error handling functions
 * @param {Function} handlers.disconnectAndNotifyUser - Handler for fatal errors
 * @param {Function} handlers.logWarningAndContinue - Handler for non-fatal errors
 * @param {Function} handlers.implementRecoveryAction - Handler for errors with recovery actions
 */
/**
 * Handle an error with appropriate strategy
 * @param {Error} error - The error object
 * @param {Object|string} options - Either a clientId string or an options object with handlers
 * @param {Object} [connectionManager] - Connection manager instance (when first param is clientId)
 * @param {Object} [clientStateModel] - Client state model instance (when first param is clientId)
 * @returns {Promise<void>}
 */
async function handleError(error, options, connectionManager, clientStateModel) {
  const logger = require('./logger');
  
  // Check if we're using the test interface or the production interface
  if (typeof options === 'object' && options !== null && !connectionManager) {
    // Test interface with handlers
    const { disconnectAndNotifyUser, logWarningAndContinue, implementRecoveryAction } = options;
    
    // Determine which handler to use based on error properties
    if (error.payload && error.payload.fatal) {
      disconnectAndNotifyUser(error);
    } else if (error.payload && error.payload.recoveryAction) {
      logWarningAndContinue(error);
      implementRecoveryAction(error.payload.recoveryAction, error);
    } else {
      logWarningAndContinue(error);
    }
    
    return;
  }
  
  // Production interface
  const clientId = options;
  
  // Log the error
  logger.error(error.message || 'An error occurred', {
    clientId,
    errorCode: error.code || 'INTERNAL_ERROR',
    statusCode: error.statusCode
  });
  
  // Get client
  if (!connectionManager) {
    logger.error('Connection manager not provided', { clientId });
    return;
  }
  
  const client = connectionManager.getClient(clientId);
  if (!client) {
    logger.error('Client not found', { clientId });
    return;
  }
  
  // Create error payload
  const errorPayload = {
    code: error.code || 'INTERNAL_ERROR'
  };
  
  // Set appropriate message based on error type
  if (error.code === 'AUTH_ERROR') {
    errorPayload.message = 'Authentication failed';
  } else if (error.statusCode === 404) {
    errorPayload.message = 'Not found';
  } else {
    errorPayload.message = 'An error occurred';
  }
  
  // Add status code if present
  if (error.statusCode) {
    errorPayload.statusCode = error.statusCode;
  }
  
  // Send error to client
  await client.send({
    type: 'error',
    payload: errorPayload
  });
}

/**
 * Handle network-related errors
 * @param {Error} error - The error object
 * @param {Object|string} options - Either a clientId string or an options object with handlers
 * @param {Object} [connectionManager] - Connection manager instance (when first param is clientId)
 * @param {Object} [clientStateModel] - Client state model instance (when first param is clientId)
 * @returns {Promise<void>}
 */
async function handleNetworkError(error, options, connectionManager, clientStateModel) {
  const logger = require('./logger');
  
  // Check if we're using the test interface or the production interface
  if (typeof options === 'object' && options !== null && !connectionManager) {
    // Test interface with handlers
    const { disconnectAndNotifyUser, logWarningAndContinue, implementRecoveryAction } = options;
    
    // For network errors, we typically try to reconnect
    if (error.code === 'ECONNREFUSED' || (error.payload && error.payload.reconnectAttempts >= 5)) {
      // Too many reconnect attempts or connection refused - disconnect
      disconnectAndNotifyUser(error);
    } else if (error.code === 'ECONNRESET') {
      // Connection reset - try to reconnect
      logWarningAndContinue(error);
      implementRecoveryAction('reconnect', error);
    } else {
      // Default - log and try to reconnect
      logWarningAndContinue(error);
      implementRecoveryAction('reconnect', error);
    }
    
    return;
  }
  
  // Production interface
  const clientId = options;
  
  if (!connectionManager || !clientStateModel) {
    logger.error('Missing required dependencies for network error handling', { clientId });
    return;
  }
  
  // Get client state
  const clientState = clientStateModel.getClientState(clientId);
  const reconnectAttempts = clientState?.connectionState?.reconnectAttempts || 0;
  
  // Handle temporary network errors
  if (error.code === 'ECONNRESET') {
    logger.warn(error.message || 'Connection reset', { clientId });
    await connectionManager.reconnect(clientId);
    return;
  }
  
  // Handle permanent network errors or too many reconnect attempts
  if (error.code === 'ECONNREFUSED' || reconnectAttempts >= 5) {
    logger.error(error.message || 'Connection refused', {
      clientId,
      reconnectAttempts
    });
    await connectionManager.disconnect(clientId);
    return;
  }
  
  // Default handling
  logger.error(error.message || 'Network error', { clientId });
  await connectionManager.reconnect(clientId);
}

/**
 * Handle authentication-related errors
 * @param {Error} error - The error object
 * @param {Object|string} options - Either a clientId string or an options object with handlers
 * @param {Object} [connectionManager] - Connection manager instance (when first param is clientId)
 * @param {Object} [clientStateModel] - Client state model instance (when first param is clientId)
 * @returns {Promise<void>}
 */
async function handleAuthError(error, options, connectionManager, clientStateModel) {
  const logger = require('./logger');
  
  // Check if we're using the test interface or the production interface
  if (typeof options === 'object' && options !== null && !connectionManager) {
    // Test interface with handlers
    const { disconnectAndNotifyUser, logWarningAndContinue, implementRecoveryAction } = options;
    
    // Auth errors are typically fatal
    disconnectAndNotifyUser(error);
    return;
  }
  
  // Production interface
  const clientId = options;
  
  if (!connectionManager) {
    logger.error('Connection manager not provided for auth error handling', { clientId });
    return;
  }
  
  // Get client
  const client = connectionManager.getClient(clientId);
  if (!client) {
    logger.error('Client not found', { clientId });
    return;
  }
  
  // Create auth error payload
  const errorPayload = {
    message: error.message || 'Authentication error',
    code: error.code || 'AUTH_ERROR'
  };
  
  // Add reauthentication flag for expired tokens
  if (error.code === 'TOKEN_EXPIRED') {
    errorPayload.requiresReauthentication = true;
  }
  
  // Update client state
  await clientStateModel.updateSessionState(clientId, { isAuthenticated: false });
  
  // Send auth error to client
  await client.send({
    type: 'auth_error',
    payload: errorPayload
  });
}

/**
 * Handle request-related errors
 * @param {Error} error - The error object
 * @param {string} clientId - The client ID
 * @param {string} requestId - The request ID
 * @param {Object} connectionManager - Connection manager instance
 * @param {Object} clientStateModel - Client state model instance
 * @returns {Promise<void>}
 */
async function handleRequestError(error, clientId, requestId, connectionManager, clientStateModel) {
  const logger = require('./logger');
  
  // Get client
  const client = connectionManager.getClient(clientId);
  if (!client) {
    logger.error('Client not found', { clientId, requestId });
    return;
  }
  
  // Create request error payload
  const errorPayload = {
    message: error.message || 'Request error',
    code: error.code || 'REQUEST_ERROR',
    requestId
  };
  
  // Add retryable flag for timeout errors
  if (error.code === 'REQUEST_TIMEOUT') {
    errorPayload.retryable = true;
  }
  
  // Send error to client
  await client.send({
    type: 'error',
    payload: errorPayload
  });
}

/**
 * Handle server-related errors
 * @param {Error} error - The error object
 * @param {Object} connectionManager - Connection manager instance
 * @returns {Promise<void>}
 */
async function handleServerError(error, connectionManager) {
  const logger = require('./logger');
  
  // Log server error
  logger.error(error.message || 'Server error', {
    code: error.code || 'INTERNAL_SERVER_ERROR'
  });
  
  // Create server error payload
  const errorPayload = {
    message: error.code === 'MAINTENANCE'
      ? error.message
      : 'Internal server error',
    code: error.code || 'INTERNAL_SERVER_ERROR'
  };
  
  // Add maintenance info if present
  if (error.code === 'MAINTENANCE') {
    errorPayload.plannedMaintenance = error.plannedMaintenance || false;
    errorPayload.estimatedDowntime = error.estimatedDowntime || 0;
  }
  
  // Notify all clients
  const clients = connectionManager.getAllClients();
  for (const client of clients.values()) {
    await client.send({
      type: 'server_error',
      payload: errorPayload
    });
  }
}

/**
 * Handle client disconnection
 * @param {string} clientId - The client ID
 * @param {string} reason - Reason for disconnection
 * @param {Object} connectionManager - Connection manager instance
 * @param {Object} clientStateModel - Client state model instance
 * @param {boolean} [serverInitiated=false] - Whether the disconnection was initiated by the server
 * @returns {Promise<void>}
 */
async function handleDisconnection(clientId, reason, connectionManager, clientStateModel, serverInitiated = false) {
  const logger = require('./logger');
  
  // Update connection state
  await clientStateModel.updateConnectionState(clientId, { isConnected: false });
  
  // If server initiated, clear session state
  if (serverInitiated) {
    await clientStateModel.updateSessionState(clientId, {
      isAuthenticated: false,
      sessionId: null
    });
    
    // Log server-initiated disconnection
    logger.info('Server disconnected client', { clientId, reason });
  } else {
    // Log client disconnection
    logger.info('Client disconnected', { clientId, reason });
  }
}

/**
 * Retry an operation with exponential backoff
 * @param {Function} operation - The operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelayMs - Initial delay in milliseconds
 * @returns {Promise<any>} The operation result
 * @throws {Object} The last error encountered
 */
async function retryWithBackoff(operation, maxRetries, initialDelayMs) {
  let retries = 0;
  let lastError;
  
  while (retries <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry fatal errors
      if (error.payload && error.payload.fatal) {
        break;
      }
      
      // Don't retry non-retryable errors
      if (error.payload && error.payload.code && !isRetryableError(error)) {
        break;
      }
      
      if (retries >= maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelayMs * Math.pow(2, retries);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      retries++;
    }
  }
  
  throw lastError;
}

/**
 * Log an error with optional context
 * @param {Object} error - The error message
 * @param {Object} [context={}] - Additional context information
 * @param {Object} [loggingService] - Optional external logging service
 */
function logError(error, context = {}, loggingService) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    errorCode: error.payload.code,
    message: error.payload.message,
    fatal: !!error.payload.fatal,
    context
  };
  
  if (error.payload.category) {
    logEntry.category = error.payload.category;
  }
  
  if (error.payload.details) {
    logEntry.details = error.payload.details;
  }
  
  // Log to console
  console.error('ERROR:', JSON.stringify(logEntry));
  
  // Log to external service if provided
  if (loggingService && typeof loggingService.logError === 'function') {
    loggingService.logError(logEntry);
  }
}

/**
 * Create an error tracker to monitor error patterns
 * @param {Object} options - Configuration options
 * @param {number} options.errorThreshold - Number of errors before triggering alert
 * @param {number} options.timeWindowMs - Time window for error tracking in milliseconds
 * @returns {Object} Error tracker instance
 */
function createErrorTracker(options = {}) {
  const errorThreshold = options.errorThreshold || 5;
  const timeWindowMs = options.timeWindowMs || 60000; // 1 minute default
  const errorHistory = [];
  const errorCounts = {};
  
  return {
    /**
     * Track an error occurrence
     * @param {Object} error - The error message
     * @returns {boolean} True if error threshold was exceeded
     */
    trackError(error) {
      const now = Date.now();
      const code = error.payload.code;
      
      // Add error to history
      errorHistory.push({
        code,
        timestamp: now
      });
      
      // Remove errors outside the time window
      const cutoff = now - timeWindowMs;
      while (errorHistory.length > 0 && errorHistory[0].timestamp < cutoff) {
        const removed = errorHistory.shift();
        errorCounts[removed.code] = (errorCounts[removed.code] || 1) - 1;
        if (errorCounts[removed.code] <= 0) {
          delete errorCounts[removed.code];
        }
      }
      
      // Update error counts
      errorCounts[code] = (errorCounts[code] || 0) + 1;
      
      // Check if threshold exceeded
      return errorCounts[code] >= errorThreshold;
    },
    
    /**
     * Get current error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
      return {
        totalErrors: errorHistory.length,
        errorCounts: { ...errorCounts },
        timeWindow: timeWindowMs
      };
    },
    
    /**
     * Clear error history
     */
    clearHistory() {
      errorHistory.length = 0;
      Object.keys(errorCounts).forEach(key => delete errorCounts[key]);
    }
  };
}

/**
 * Connection manager with reconnection capabilities
 */
class ConnectionManager {
  /**
   * Create a new connection manager
   * @param {Object} options - Configuration options
   * @param {number} options.maxReconnectAttempts - Maximum reconnection attempts
   * @param {number} options.initialReconnectDelay - Initial delay in milliseconds
   */
  constructor(options = {}) {
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.initialReconnectDelay = options.initialReconnectDelay || 1000;
    this.connected = false;
    this.errorTracker = createErrorTracker();
  }
  
  /**
   * Calculate backoff delay based on attempt number
   * @returns {number} Delay in milliseconds
   */
  calculateBackoffDelay() {
    return this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts);
  }
  
  /**
   * Handle disconnection with automatic reconnection
   * @param {string} reason - Reason for disconnection
   * @returns {Promise<void>}
   * @throws {Error} If maximum reconnection attempts are exceeded
   */
  async handleDisconnection(reason) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
    }
    
    console.log(`Connection lost: ${reason}. Attempting to reconnect...`);
    
    const delay = this.calculateBackoffDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
    
    this.reconnectAttempts++;
    
    try {
      await this.connect();
      this.reconnectAttempts = 0; // Reset on successful connection
      this.connected = true;
    } catch (error) {
      // Track connection errors
      const isRecurring = this.errorTracker.trackError({
        payload: { code: 'CONNECTION_FAILED', message: error.message }
      });
      
      if (isRecurring) {
        console.warn('Recurring connection failures detected. Consider alternative connection strategy.');
      }
      
      return this.handleDisconnection(`Reconnection failed: ${error.message}`);
    }
  }
  
  /**
   * Connect to the server
   * @returns {Promise<void>}
   */
  async connect() {
    // Implementation would depend on the actual connection mechanism
    // This is a placeholder for the test
    return Promise.resolve();
  }
}

/**
 * Rate limiter to prevent abuse
 */
class RateLimiter {
  /**
   * Create a new rate limiter
   * @param {Object} options - Configuration options
   * @param {number} options.maxRequestsPerMinute - Maximum requests per minute
   */
  constructor(options = {}) {
    this.maxRequestsPerMinute = options.maxRequestsPerMinute || 60;
    this.clientRequests = new Map();
    this.resetInterval = null;
  }
  
  /**
   * Check if a client is rate limited
   * @param {string} clientId - Client identifier
   * @returns {boolean} True if rate limited
   */
  isRateLimited(clientId) {
    if (!this.clientRequests.has(clientId)) {
      this.clientRequests.set(clientId, 1);
      return false;
    }
    
    const requests = this.clientRequests.get(clientId);
    if (requests >= this.maxRequestsPerMinute) {
      return true;
    }
    
    this.clientRequests.set(clientId, requests + 1);
    return false;
  }
  
  /**
   * Start the interval to reset rate limits
   */
  startResetInterval() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
    
    this.resetInterval = setInterval(() => {
      this.clientRequests.clear();
    }, 60000); // Reset every minute
  }
  
  /**
   * Stop the reset interval
   */
  stopResetInterval() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = null;
    }
  }
}

/**
 * Error recovery manager to implement recovery strategies
 */
class ErrorRecoveryManager {
  /**
   * Create a new error recovery manager
   * @param {Object} options - Configuration options
   * @param {Object} options.strategies - Recovery strategies by error code
   */
  constructor(options = {}) {
    this.strategies = options.strategies || {};
    this.defaultStrategy = options.defaultStrategy || this.defaultRecoveryStrategy;
  }
  
  /**
   * Default recovery strategy
   * @param {Object} error - The error message
   * @returns {Promise<void>}
   */
  async defaultRecoveryStrategy(error) {
    const recoveryAction = getRecoveryAction(error);
    console.log(`Implementing default recovery for ${error.payload.code}: ${recoveryAction || 'No action specified'}`);
    
    // Wait a moment before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    return;
  }
  
  /**
   * Register a recovery strategy for an error code
   * @param {string} errorCode - The error code
   * @param {Function} strategy - The recovery strategy function
   */
  registerStrategy(errorCode, strategy) {
    if (typeof strategy !== 'function') {
      throw new Error('Recovery strategy must be a function');
    }
    this.strategies[errorCode] = strategy;
  }
  
  /**
   * Recover from an error
   * @param {Object} error - The error message
   * @returns {Promise<void>}
   */
  async recover(error) {
    if (!error || !error.payload || !error.payload.code) {
      throw new Error('Invalid error object');
    }
    
    const code = error.payload.code;
    const strategy = this.strategies[code] || this.defaultStrategy;
    
    try {
      await strategy(error);
    } catch (recoveryError) {
      console.error(`Recovery failed for ${code}:`, recoveryError);
      throw recoveryError;
    }
  }
}

// Export all the functions and classes
// Export all the functions and classes
module.exports = {
  ErrorCategory,
  ErrorCode,
  DefaultRecoveryActions,
  createErrorMessage,
  validateErrorMessage,
  isFatalError,
  getErrorCategory,
  isRetryableError,
  getRecoveryAction,
  handleError,
  handleNetworkError,
  handleAuthError,
  handleRequestError,
  handleServerError,
  handleDisconnection,
  retryWithBackoff,
  logError,
  createErrorTracker,
  ConnectionManager,
  RateLimiter,
  ErrorRecoveryManager
};
