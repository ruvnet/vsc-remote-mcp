/**
 * Logger utility for the MCP server
 * 
 * This module provides standardized logging functions with different severity levels.
 * It uses environment variables to control log levels and output format.
 * 
 * @module logger
 */
const config = require("../config/env");

// Log levels with numeric values for comparison
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Convert string log level to numeric value
const currentLogLevel = LOG_LEVELS[config.log.level] || LOG_LEVELS.info;

/**
 * Format log message with timestamp and metadata
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [metadata] - Additional metadata
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const metadataStr = Object.keys(metadata).length > 0 
    ? ` ${JSON.stringify(metadata)}`
    : '';
  
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metadataStr}`;
}

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Object} [metadata] - Additional metadata
 */
function error(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.error) {
    console.error(formatLogMessage('error', message, metadata));
  }
}

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} [metadata] - Additional metadata
 */
function warn(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.warn) {
    console.warn(formatLogMessage('warn', message, metadata));
  }
}

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} [metadata] - Additional metadata
 */
function info(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.info) {
    console.info(formatLogMessage('info', message, metadata));
  }
}

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {Object} [metadata] - Additional metadata
 */
function debug(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.debug) {
    console.debug(formatLogMessage('debug', message, metadata));
  }
}

/**
 * Get the current log level
 * @returns {string} Current log level
 */
function getLogLevel() {
  return config.log.level;
}

/**
 * Set the log level
 * @param {string} level - New log level
 */
function setLogLevel(level) {
  // This is just for testing - in a real app, we would update the config
  config.log.level = level;
}

module.exports = {
  error,
  warn,
  info,
  debug,
  getLogLevel,
  setLogLevel
};