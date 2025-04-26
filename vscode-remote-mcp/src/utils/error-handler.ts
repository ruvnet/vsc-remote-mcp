/**
 * Error handling utilities for the MCP server
 *
 * This module provides a comprehensive error handling system for the VSCode Remote MCP,
 * including error codes, categories, descriptive messages, logging, and recovery strategies.
 *
 * @module error-handler
 */

import * as logger from './logger';
import config from '../config/env';

/**
 * Error code categories for better organization and handling
 * @enum {Object}
 */
export const ErrorCategory = {
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
export const ErrorCode: Record<string, { category: string; retryable: boolean }> = {
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
export const DefaultRecoveryActions: Record<string, string> = {
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
export function createErrorMessage(code: string, message: string, id?: string, relatedTo?: string, fatal: boolean = false, details?: any, recoveryAction?: string) {
  if (typeof code !== 'string' || code.trim() === '') {
    throw new Error('Error code must be a non-empty string');
  }
  
  if (typeof message !== 'string' || message.trim() === '') {
    throw new Error('Error message must be a non-empty string');
  }
  
  const errorMessage: any = {
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
export function validateErrorMessage(message: any): boolean {
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
export function isFatalError(error: any): boolean {
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
export function getErrorCategory(error: any): string | null {
  return error && error.payload && error.payload.category || null;
}

/**
 * Check if an error is retryable
 * @param {Object} error - The error message
 * @returns {boolean} True if the error can be retried
 */
export function isRetryableError(error: any): boolean {
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
export function getRecoveryAction(error: any, includeDefaults: boolean = false): string | null {
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
 * Error response payload interface
 */
interface ErrorPayload {
  message: string;
  code: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Error response interface
 */
interface ErrorResponse {
  type: string;
  payload: ErrorPayload;
  id?: string;
}

/**
 * Handle an error with appropriate strategy
 * @param {Object} error - The error message
 * @param {string} clientId - The client ID
 * @param {Object} connectionManager - The connection manager
 * @param {Object} clientStateModel - The client state model
 */
export function handleError(error: any, clientId: string, connectionManager: any, clientStateModel: any) {
  // Get log level from environment config
  const logLevel = config.log.level;
  
  // Log the error with appropriate level
  if (logLevel === 'debug') {
    logger.debug(`Error for client ${clientId}: ${error.message || 'Unknown error'}`, {
      clientId,
      logLevel,
      errorCode: error.code,
      errorDetails: error.details || {}
    });
  } else {
    logger.error(`Error for client ${clientId}: ${error.message || 'Unknown error'}`, {
      clientId,
      logLevel,
      errorCode: error.code,
      errorDetails: error.details || {}
    });
  }
  
  // Get client from connection manager
  const client = connectionManager.getClient(clientId);
  if (!client) {
    logger.warn(`Cannot handle error for non-existent client: ${clientId}`);
    return;
  }
  
  // Create error response
  const errorResponse: ErrorResponse = {
    type: 'error',
    payload: {
      message: error.message || 'An error occurred',
      code: error.code || 'UNKNOWN_ERROR'
    }
  };
  
  // Add CORS information if it's a CORS error
  if (error.code === 'CORS_ERROR') {
    const corsEnabled = config.security.corsEnabled;
    if (corsEnabled) {
      const allowedOrigins = config.security.allowedOrigins;
      errorResponse.payload.allowedOrigins = allowedOrigins;
    }
  }
  
  // Send error to client
  client.send(errorResponse);
}

/**
 * Auth error response interface
 */
interface AuthErrorPayload extends ErrorPayload {
  expectedToken?: string;
}

/**
 * Auth error response interface
 */
interface AuthErrorResponse {
  type: string;
  payload: AuthErrorPayload;
  id?: string;
}

/**
 * Handle authentication errors
 * @param {Object} error - The error object
 * @param {string} clientId - The client ID
 * @param {Object} connectionManager - The connection manager
 * @param {Object} clientStateModel - The client state model
 */
export async function handleAuthError(error: any, clientId: string, connectionManager: any, clientStateModel: any) {
  // Check if authentication is enabled from config
  const authEnabled = config.auth.enabled;
  
  // Get client from connection manager
  const client = connectionManager.getClient(clientId);
  if (!client) {
    logger.warn(`Cannot handle auth error for non-existent client: ${clientId}`);
    return;
  }
  
  // Create auth error response
  const authErrorResponse: AuthErrorResponse = {
    type: 'auth_error',
    payload: {
      message: error.message || 'Authentication failed',
      code: error.code || 'AUTH_ERROR'
    }
  };
  
  // Add token information if it's a token error
  if (error.code === 'INVALID_TOKEN') {
    authErrorResponse.payload.expectedToken = config.auth.token;
  }
  
  // Send error to client
  client.send(authErrorResponse);
  
  // Update session state if auth is enabled
  if (authEnabled) {
    await clientStateModel.updateSessionState(clientId, { isAuthenticated: false });
  }
}

/**
 * Request error payload interface
 */
interface RequestErrorPayload extends ErrorPayload {
  requestId: string;
  timeoutMs?: number;
}

/**
 * Request error response interface
 */
interface RequestErrorResponse {
  type: string;
  payload: RequestErrorPayload;
  id?: string;
}

/**
 * Handle request errors
 * @param {Object} error - The error object
 * @param {string} clientId - The client ID
 * @param {string} requestId - The request ID
 * @param {Object} connectionManager - The connection manager
 * @param {Object} clientStateModel - The client state model
 */
export async function handleRequestError(error: any, clientId: string, requestId: string, connectionManager: any, clientStateModel: any) {
  // Get client from connection manager
  const client = connectionManager.getClient(clientId);
  if (!client) {
    logger.warn(`Cannot handle request error for non-existent client: ${clientId}`);
    return;
  }
  
  // Create request error response
  const requestErrorResponse: RequestErrorResponse = {
    type: 'error',
    payload: {
      message: error.message || 'Request failed',
      code: error.code || 'REQUEST_ERROR',
      requestId
    }
  };
  
  // Add timeout information if it's a timeout error
  if (error.code === 'COMMAND_TIMEOUT') {
    requestErrorResponse.payload.timeoutMs = config.command.timeoutMs;
  }
  
  // Send error to client
  client.send(requestErrorResponse);
}

/**
 * Server error payload interface
 */
interface ServerErrorPayload extends ErrorPayload {
  serverName: string;
  serverVersion?: string;
}

/**
 * Server error response interface
 */
interface ServerErrorResponse {
  type: string;
  payload: ServerErrorPayload;
  id?: string;
}

/**
 * Handle server errors
 * @param {Object} error - The error object
 * @param {Object} connectionManager - The connection manager
 */
export async function handleServerError(error: any, connectionManager: any) {
  // Get server information from config
  const serverName = config.server.name;
  const serverVersion = config.server.version;
  
  // Create server error response
  const serverErrorResponse: ServerErrorResponse = {
    type: 'server_error',
    payload: {
      message: 'Internal server error',
      code: error.code || 'SERVER_ERROR',
      serverName
    }
  };
  
  // Add version if available
  if (serverVersion) {
    serverErrorResponse.payload.serverVersion = serverVersion;
  }
  
  // Send to all clients
  const clients = connectionManager.getAllClients();
  for (const [clientId, client] of clients.entries()) {
    client.send(serverErrorResponse);
  }
  
  // Log the error
  logger.error(`Server error: ${error.message || 'Unknown error'}`, {
    stack: error.stack,
    serverName,
    serverVersion
  });
}

/**
 * Error with payload interface
 */
interface ErrorWithPayload {
  payload: {
    code?: string;
    message?: string;
    fatal?: boolean;
    category?: string;
    details?: any;
  };
}

/**
 * Retry an operation with exponential backoff
 * @param {Function} operation - The operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelayMs - Initial delay in milliseconds
 * @returns {Promise<any>} The operation result
 * @throws {Object} The last error encountered
 */
export async function retryWithBackoff(operation: () => Promise<any>, maxRetries: number, initialDelayMs: number): Promise<any> {
  let retries = 0;
  let lastError: unknown;
  
  while (retries <= maxRetries) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      
      // Type guard for errors with payload
      const errorWithPayload = error as ErrorWithPayload;
      
      // Don't retry fatal errors
      if (errorWithPayload.payload && errorWithPayload.payload.fatal) {
        break;
      }
      
      // Don't retry non-retryable errors
      if (errorWithPayload.payload && errorWithPayload.payload.code && !isRetryableError(errorWithPayload)) {
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
 * Log entry interface
 */
interface LogEntry {
  timestamp: string;
  errorCode: string;
  message: string;
  fatal: boolean;
  context: any;
  category?: string;
  details?: any;
}

/**
 * Log an error with optional context
 * @param {Object} error - The error message
 * @param {Object} [context={}] - Additional context information
 * @param {Object} [loggingService] - Optional external logging service
 */
export function logError(error: any, context: any = {}, loggingService?: any) {
  const logEntry: LogEntry = {
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
export function createErrorTracker(options: any = {}) {
  const errorThreshold = options.errorThreshold || 5;
  const timeWindowMs = options.timeWindowMs || 60000; // 1 minute default
  const errorHistory: any[] = [];
  const errorCounts: Record<string, number> = {};
  
  return {
    /**
     * Track an error occurrence
     * @param {Object} error - The error message
     * @returns {boolean} True if error threshold was exceeded
     */
    trackError(error: any) {
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
export class ConnectionManager {
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  initialReconnectDelay: number;
  connected: boolean;
  errorTracker: ReturnType<typeof createErrorTracker>;

  /**
   * Create a new connection manager
   * @param {Object} options - Configuration options
   * @param {number} options.maxReconnectAttempts - Maximum reconnection attempts
   * @param {number} options.initialReconnectDelay - Initial delay in milliseconds
   */
  constructor(options: { maxReconnectAttempts?: number; initialReconnectDelay?: number } = {}) {
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
  calculateBackoffDelay(): number {
    return this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts);
  }
  
  /**
   * Handle disconnection with automatic reconnection
   * @param {string} reason - Reason for disconnection
   * @returns {Promise<void>}
   * @throws {Error} If maximum reconnection attempts are exceeded
   */
  async handleDisconnection(reason: string): Promise<void> {
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
    } catch (error: unknown) {
      // Track connection errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isRecurring = this.errorTracker.trackError({
        payload: { code: 'CONNECTION_FAILED', message: errorMessage }
      });
      
      if (isRecurring) {
        console.warn('Recurring connection failures detected. Consider alternative connection strategy.');
      }
      
      return this.handleDisconnection(`Reconnection failed: ${errorMessage}`);
    }
  }
  
  /**
   * Connect to the server
   * @returns {Promise<void>}
   */
  async connect(): Promise<void> {
    // Implementation would depend on the actual connection mechanism
    // This is a placeholder for the test
    return Promise.resolve();
  }
}

/**
 * Rate limiter to prevent abuse
 */
export class RateLimiter {
  maxRequestsPerMinute: number;
  clientRequests: Map<string, number>;
  resetInterval: NodeJS.Timeout | null;

  /**
   * Create a new rate limiter
   * @param {Object} options - Configuration options
   * @param {number} options.maxRequestsPerMinute - Maximum requests per minute
   */
  constructor(options: { maxRequestsPerMinute?: number } = {}) {
    this.maxRequestsPerMinute = options.maxRequestsPerMinute || 60;
    this.clientRequests = new Map<string, number>();
    this.resetInterval = null;
  }
  
  /**
   * Check if a client is rate limited
   * @param {string} clientId - Client identifier
   * @returns {boolean} True if rate limited
   */
  isRateLimited(clientId: string): boolean {
    if (!this.clientRequests.has(clientId)) {
      this.clientRequests.set(clientId, 1);
      return false;
    }
    
    const requests = this.clientRequests.get(clientId);
    if (requests !== undefined && requests >= this.maxRequestsPerMinute) {
      return true;
    }
    
    this.clientRequests.set(clientId, (requests || 0) + 1);
    return false;
  }
  
  /**
   * Start the interval to reset rate limits
   */
  startResetInterval(): void {
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
  stopResetInterval(): void {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = null;
    }
  }
}

/**
 * Recovery strategy function type
 */
type RecoveryStrategy = (error: ErrorWithPayload) => Promise<void>;

/**
 * Error recovery manager to implement recovery strategies
 */
export class ErrorRecoveryManager {
  strategies: Record<string, RecoveryStrategy>;
  defaultStrategy: RecoveryStrategy;

  /**
   * Create a new error recovery manager
   * @param {Object} options - Configuration options
   * @param {Object} options.strategies - Recovery strategies by error code
   * @param {Function} options.defaultStrategy - Default recovery strategy
   */
  constructor(options: {
    strategies?: Record<string, RecoveryStrategy>;
    defaultStrategy?: RecoveryStrategy
  } = {}) {
    this.strategies = options.strategies || {};
    this.defaultStrategy = options.defaultStrategy || this.defaultRecoveryStrategy.bind(this);
  }
  
  /**
   * Default recovery strategy
   * @param {ErrorWithPayload} error - The error message
   * @returns {Promise<void>}
   */
  async defaultRecoveryStrategy(error: ErrorWithPayload): Promise<void> {
    const recoveryAction = getRecoveryAction(error);
    console.log(`Implementing default recovery for ${error.payload.code}: ${recoveryAction || 'No action specified'}`);
    
    // Wait a moment before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    return;
  }
  
  /**
   * Register a recovery strategy for an error code
   * @param {string} errorCode - The error code
   * @param {RecoveryStrategy} strategy - The recovery strategy function
   */
  registerStrategy(errorCode: string, strategy: RecoveryStrategy): void {
    if (typeof strategy !== 'function') {
      throw new Error('Recovery strategy must be a function');
    }
    this.strategies[errorCode] = strategy;
  }
  
  /**
   * Recover from an error
   * @param {ErrorWithPayload} error - The error message
   * @returns {Promise<void>}
   */
  async recover(error: ErrorWithPayload): Promise<void> {
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