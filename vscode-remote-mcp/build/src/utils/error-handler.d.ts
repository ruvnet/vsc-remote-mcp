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
export declare const ErrorCategory: {
    PROTOCOL: string;
    AUTHENTICATION: string;
    SESSION: string;
    RESOURCE: string;
    SERVER: string;
    CLIENT: string;
};
/**
 * Error codes organized by category
 * @enum {Object}
 */
export declare const ErrorCode: Record<string, {
    category: string;
    retryable: boolean;
}>;
/**
 * Default recovery actions for specific error codes
 * @enum {Object}
 */
export declare const DefaultRecoveryActions: Record<string, string>;
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
export declare function createErrorMessage(code: string, message: string, id?: string, relatedTo?: string, fatal?: boolean, details?: any, recoveryAction?: string): any;
/**
 * Validate an error message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid, throws an error otherwise
 * @throws {Error} If the message is invalid
 */
export declare function validateErrorMessage(message: any): boolean;
/**
 * Check if an error is fatal
 * @param {Object} error - The error message
 * @returns {boolean} True if the error is fatal
 */
export declare function isFatalError(error: any): boolean;
/**
 * Get the category of an error
 * @param {Object} error - The error message
 * @returns {string|null} The error category or null if not categorized
 */
export declare function getErrorCategory(error: any): string | null;
/**
 * Check if an error is retryable
 * @param {Object} error - The error message
 * @returns {boolean} True if the error can be retried
 */
export declare function isRetryableError(error: any): boolean;
/**
 * Get the recovery action from an error
 * @param {Object} error - The error message
 * @param {boolean} [includeDefaults=false] - Whether to include default recovery actions
 * @returns {string|null} The recovery action or null if none
 */
export declare function getRecoveryAction(error: any, includeDefaults?: boolean): string | null;
/**
 * Handle an error with appropriate strategy
 * @param {Object} error - The error message
 * @param {string} clientId - The client ID
 * @param {Object} connectionManager - The connection manager
 * @param {Object} clientStateModel - The client state model
 */
export declare function handleError(error: any, clientId: string, connectionManager: any, clientStateModel: any): void;
/**
 * Handle authentication errors
 * @param {Object} error - The error object
 * @param {string} clientId - The client ID
 * @param {Object} connectionManager - The connection manager
 * @param {Object} clientStateModel - The client state model
 */
export declare function handleAuthError(error: any, clientId: string, connectionManager: any, clientStateModel: any): Promise<void>;
/**
 * Handle request errors
 * @param {Object} error - The error object
 * @param {string} clientId - The client ID
 * @param {string} requestId - The request ID
 * @param {Object} connectionManager - The connection manager
 * @param {Object} clientStateModel - The client state model
 */
export declare function handleRequestError(error: any, clientId: string, requestId: string, connectionManager: any, clientStateModel: any): Promise<void>;
/**
 * Handle server errors
 * @param {Object} error - The error object
 * @param {Object} connectionManager - The connection manager
 */
export declare function handleServerError(error: any, connectionManager: any): Promise<void>;
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
export declare function retryWithBackoff(operation: () => Promise<any>, maxRetries: number, initialDelayMs: number): Promise<any>;
/**
 * Log an error with optional context
 * @param {Object} error - The error message
 * @param {Object} [context={}] - Additional context information
 * @param {Object} [loggingService] - Optional external logging service
 */
export declare function logError(error: any, context?: any, loggingService?: any): void;
/**
 * Create an error tracker to monitor error patterns
 * @param {Object} options - Configuration options
 * @param {number} options.errorThreshold - Number of errors before triggering alert
 * @param {number} options.timeWindowMs - Time window for error tracking in milliseconds
 * @returns {Object} Error tracker instance
 */
export declare function createErrorTracker(options?: any): {
    /**
     * Track an error occurrence
     * @param {Object} error - The error message
     * @returns {boolean} True if error threshold was exceeded
     */
    trackError(error: any): boolean;
    /**
     * Get current error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats(): {
        totalErrors: number;
        errorCounts: {
            [x: string]: number;
        };
        timeWindow: any;
    };
    /**
     * Clear error history
     */
    clearHistory(): void;
};
/**
 * Connection manager with reconnection capabilities
 */
export declare class ConnectionManager {
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
    constructor(options?: {
        maxReconnectAttempts?: number;
        initialReconnectDelay?: number;
    });
    /**
     * Calculate backoff delay based on attempt number
     * @returns {number} Delay in milliseconds
     */
    calculateBackoffDelay(): number;
    /**
     * Handle disconnection with automatic reconnection
     * @param {string} reason - Reason for disconnection
     * @returns {Promise<void>}
     * @throws {Error} If maximum reconnection attempts are exceeded
     */
    handleDisconnection(reason: string): Promise<void>;
    /**
     * Connect to the server
     * @returns {Promise<void>}
     */
    connect(): Promise<void>;
}
/**
 * Rate limiter to prevent abuse
 */
export declare class RateLimiter {
    maxRequestsPerMinute: number;
    clientRequests: Map<string, number>;
    resetInterval: NodeJS.Timeout | null;
    /**
     * Create a new rate limiter
     * @param {Object} options - Configuration options
     * @param {number} options.maxRequestsPerMinute - Maximum requests per minute
     */
    constructor(options?: {
        maxRequestsPerMinute?: number;
    });
    /**
     * Check if a client is rate limited
     * @param {string} clientId - Client identifier
     * @returns {boolean} True if rate limited
     */
    isRateLimited(clientId: string): boolean;
    /**
     * Start the interval to reset rate limits
     */
    startResetInterval(): void;
    /**
     * Stop the reset interval
     */
    stopResetInterval(): void;
}
/**
 * Recovery strategy function type
 */
type RecoveryStrategy = (error: ErrorWithPayload) => Promise<void>;
/**
 * Error recovery manager to implement recovery strategies
 */
export declare class ErrorRecoveryManager {
    strategies: Record<string, RecoveryStrategy>;
    defaultStrategy: RecoveryStrategy;
    /**
     * Create a new error recovery manager
     * @param {Object} options - Configuration options
     * @param {Object} options.strategies - Recovery strategies by error code
     * @param {Function} options.defaultStrategy - Default recovery strategy
     */
    constructor(options?: {
        strategies?: Record<string, RecoveryStrategy>;
        defaultStrategy?: RecoveryStrategy;
    });
    /**
     * Default recovery strategy
     * @param {ErrorWithPayload} error - The error message
     * @returns {Promise<void>}
     */
    defaultRecoveryStrategy(error: ErrorWithPayload): Promise<void>;
    /**
     * Register a recovery strategy for an error code
     * @param {string} errorCode - The error code
     * @param {RecoveryStrategy} strategy - The recovery strategy function
     */
    registerStrategy(errorCode: string, strategy: RecoveryStrategy): void;
    /**
     * Recover from an error
     * @param {ErrorWithPayload} error - The error message
     * @returns {Promise<void>}
     */
    recover(error: ErrorWithPayload): Promise<void>;
}
export {};
