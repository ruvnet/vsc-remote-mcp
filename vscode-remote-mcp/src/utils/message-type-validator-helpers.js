/**
 * Message Type Validator Helpers for VSCode Remote MCP
 *
 * This module provides helper functions for message type validation.
 */

// Define the allowed types here to avoid circular dependency
const allowedTypes = [
  'connection',
  'connection_request',
  'connection_response',
  'connection_ack',
  'disconnection',
  'session_request',
  'session_response',
  'session_create',
  'session_create_ack',
  'session_join',
  'session_join_ack',
  'session_leave',
  'session_update',
  'command_request',
  'command_response',
  'token_refresh',
  'token_refresh_request',
  'token_refresh_response',
  'token_refresh_ack',
  'editor',
  'extension',
  'terminal',
  'heartbeat',
  'server_shutdown',
  'notification',
  'error'
];

/**
 * Validate a message type
+ * @param {string} type - The message type to validate
+ * @returns {boolean} - True if the message type is valid
+ * @throws {Error} - If the message type is invalid
+ */
function validateMessageType(type) {
  if (typeof type !== 'string' || type.trim() === '') {
    throw new Error('Message type must be a non-empty string');
  }
  
  if (!allowedTypes.includes(type)) {
    throw new Error(`Unknown message type: ${type}`);
  }
  
  return true;
}

/**
 * Get the category of a message type
 * @param {string} type - The message type
 * @returns {string} The category of the message type
 */
function getMessageTypeCategory(type) {
  validateMessageType(type);
  
  if (type.startsWith('connection')) return 'connection';
  if (type.startsWith('session')) return 'session';
  if (type.startsWith('command')) return 'command';
  if (type.startsWith('token')) return 'token';
  if (['heartbeat', 'error', 'notification'].includes(type)) return 'system';
  if (['editor', 'terminal', 'extension'].includes(type)) return 'client';
  return 'unknown';
}

/**
 * Check if a message type is a system message type
 * @param {string} type - The message type
 * @returns {boolean} True if the message type is a system message type
 */
function isSystemMessageType(type) {
  validateMessageType(type);
  return getMessageTypeCategory(type) === 'system';
}

/**
 * Get related message types for a given message type
 * @param {string} type - The message type
 * @returns {string[]} Related message types
 */
function getRelatedMessageTypes(type) {
  validateMessageType(type);
  const category = getMessageTypeCategory(type);
  
  // Use the allowedTypes array defined at the top of the file
  return allowedTypes.filter(t => getMessageTypeCategory(t) === category);
}

/**
 * Get the request or response message type for a given message type
 * @param {string} type - The message type
 * @returns {string|null} The paired message type, or null if not applicable
 */
function getRequestResponsePair(type) {
  validateMessageType(type);
  
  if (type.endsWith('_request')) {
    return type.replace('_request', '_response');
  }
  if (type.endsWith('_response')) {
    return type.replace('_response', '_request');
  }
  return null;
}

/**
 * Validate the format of a message type
 * @param {string} type - The message type
 * @returns {boolean} True if the format is valid
 * @throws {Error} If the format is invalid
 */
function validateMessageTypeFormat(type) {
  validateMessageType(type);
  
  if (!/^[a-z_]+$/.test(type)) {
    throw new Error(`Invalid message type format: ${type}. Must contain only lowercase letters and underscores.`);
  }
  if (type.length > 50) {
    throw new Error(`Invalid message type length: ${type}. Must be 50 characters or less.`);
  }
  return true;
}

/**
 * Validate the category of a message type
 * @param {string} type - The message type
 * @param {string} expectedCategory - The expected category
 * @returns {boolean} True if the category is valid
 * @throws {Error} If the category is invalid
 */
function validateMessageTypeCategory(type, expectedCategory) {
  validateMessageType(type);
  
  const category = getMessageTypeCategory(type);
  if (category !== expectedCategory) {
    throw new Error(`Invalid message type category: ${type}. Expected ${expectedCategory}, got ${category}.`);
  }
  return true;
}

/**
 * Check if a message type is a response type
 * @param {string} type - The message type
 * @returns {boolean} True if the message type is a response type
 */
function isResponseMessageType(type) {
  validateMessageType(type);
  return type.endsWith('_response') || type.endsWith('_ack');
}

module.exports = {
  validateMessageType,
  getMessageTypeCategory,
  isSystemMessageType,
  getRelatedMessageTypes,
  getRequestResponsePair,
  validateMessageTypeFormat,
  validateMessageTypeCategory,
  isResponseMessageType
};