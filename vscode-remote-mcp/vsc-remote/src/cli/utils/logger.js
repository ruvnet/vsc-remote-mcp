/**
 * Logger Utility
 * 
 * This module provides logging functionality for the VSCode Remote MCP Server CLI.
 */

const chalk = require('chalk');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
let currentLogLevel = process.env.MCP_DEBUG === '1' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

/**
 * Set the log level
 * @param {string} level - Log level (error, warn, info, debug)
 */
function setLogLevel(level) {
  const normalizedLevel = level.toUpperCase();
  if (LOG_LEVELS[normalizedLevel] !== undefined) {
    currentLogLevel = LOG_LEVELS[normalizedLevel];
  }
}

/**
 * Log an error message
 * @param {string} message - Error message
 * @param {*} data - Additional data to log
 */
function error(message, data) {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    console.error(chalk.red(`[ERROR] ${message}`));
    if (data) {
      console.error(data);
    }
  }
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 * @param {*} data - Additional data to log
 */
function warn(message, data) {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    console.warn(chalk.yellow(`[WARN] ${message}`));
    if (data) {
      console.warn(data);
    }
  }
}

/**
 * Log an info message
 * @param {string} message - Info message
 * @param {*} data - Additional data to log
 */
function info(message, data) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.info(chalk.blue(`[INFO] ${message}`));
    if (data) {
      console.info(data);
    }
  }
}

/**
 * Log a debug message
 * @param {string} message - Debug message
 * @param {*} data - Additional data to log
 */
function debug(message, data) {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.debug(chalk.gray(`[DEBUG] ${message}`));
    if (data) {
      console.debug(data);
    }
  }
}

module.exports = {
  setLogLevel,
  error,
  warn,
  info,
  debug,
  LOG_LEVELS
};