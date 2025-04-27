/**
 * Log error message
 * @param {string} message - Error message
 * @param {Object} [metadata] - Additional metadata
 */
export declare function error(message: string, metadata?: Record<string, any>): void;
/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} [metadata] - Additional metadata
 */
export declare function warn(message: string, metadata?: Record<string, any>): void;
/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} [metadata] - Additional metadata
 */
export declare function info(message: string, metadata?: Record<string, any>): void;
/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {Object} [metadata] - Additional metadata
 */
export declare function debug(message: string, metadata?: Record<string, any>): void;
/**
 * Get the current log level
 * @returns {string} Current log level
 */
export declare function getLogLevel(): string;
/**
 * Set the log level
 * @param {string} level - New log level
 */
export declare function setLogLevel(level: 'error' | 'warn' | 'info' | 'debug'): void;
