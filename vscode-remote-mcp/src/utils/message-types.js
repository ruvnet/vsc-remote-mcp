/**
 * Message Types for VSCode Remote MCP
 * 
 * This module defines the valid message types for communication
 * between the client and server in the MCP protocol.
 */

/**
 * Enumeration of valid message types
 * @enum {string}
 */
const MESSAGE_TYPES = {
  // Client-initiated messages
  CLIENT_HELLO: 'client_hello',
  AUTH_REQUEST: 'auth_request',
  SESSION_CREATE: 'session_create',
  SESSION_JOIN: 'session_join',
  SESSION_LEAVE: 'session_leave',
  TOKEN_REFRESH: 'token_refresh',
  DISCONNECT: 'disconnect',
  
  // Server-initiated messages
  SERVER_HELLO: 'server_hello',
  AUTH_RESPONSE: 'auth_response',
  SESSION_CREATED: 'session_created',
  SESSION_JOINED: 'session_joined',
  SESSION_LEFT: 'session_left',
  TOKEN_REFRESHED: 'token_refreshed',
  
  // Bidirectional messages
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
  
  // Content-related messages
  EDITOR: 'editor',
  TERMINAL: 'terminal',
  FILE_SYSTEM: 'file_system',
  NOTIFICATION: 'notification',
  
  // Additional message types used in validation
  CONNECTION: 'connection'
};

/**
 * Message categories for organization
 * @enum {string}
 */
const MESSAGE_CATEGORIES = {
  CONNECTION: 'connection',
  AUTHENTICATION: 'authentication',
  SESSION: 'session',
  CONTENT: 'content',
  SYSTEM: 'system'
};

/**
 * Map of message types to their categories
 * @type {Object.<string, string>}
 */
const MESSAGE_TYPE_CATEGORIES = {
  [MESSAGE_TYPES.CLIENT_HELLO]: MESSAGE_CATEGORIES.CONNECTION,
  [MESSAGE_TYPES.SERVER_HELLO]: MESSAGE_CATEGORIES.CONNECTION,
  [MESSAGE_TYPES.AUTH_REQUEST]: MESSAGE_CATEGORIES.AUTHENTICATION,
  [MESSAGE_TYPES.AUTH_RESPONSE]: MESSAGE_CATEGORIES.AUTHENTICATION,
  [MESSAGE_TYPES.TOKEN_REFRESH]: MESSAGE_CATEGORIES.AUTHENTICATION,
  [MESSAGE_TYPES.TOKEN_REFRESHED]: MESSAGE_CATEGORIES.AUTHENTICATION,
  [MESSAGE_TYPES.SESSION_CREATE]: MESSAGE_CATEGORIES.SESSION,
  [MESSAGE_TYPES.SESSION_CREATED]: MESSAGE_CATEGORIES.SESSION,
  [MESSAGE_TYPES.SESSION_JOIN]: MESSAGE_CATEGORIES.SESSION,
  [MESSAGE_TYPES.SESSION_JOINED]: MESSAGE_CATEGORIES.SESSION,
  [MESSAGE_TYPES.SESSION_LEAVE]: MESSAGE_CATEGORIES.SESSION,
  [MESSAGE_TYPES.SESSION_LEFT]: MESSAGE_CATEGORIES.SESSION,
  [MESSAGE_TYPES.EDITOR]: MESSAGE_CATEGORIES.CONTENT,
  [MESSAGE_TYPES.TERMINAL]: MESSAGE_CATEGORIES.CONTENT,
  [MESSAGE_TYPES.FILE_SYSTEM]: MESSAGE_CATEGORIES.CONTENT,
  [MESSAGE_TYPES.NOTIFICATION]: MESSAGE_CATEGORIES.CONTENT,
  [MESSAGE_TYPES.ERROR]: MESSAGE_CATEGORIES.SYSTEM,
  [MESSAGE_TYPES.PING]: MESSAGE_CATEGORIES.SYSTEM,
  [MESSAGE_TYPES.PONG]: MESSAGE_CATEGORIES.SYSTEM,
  [MESSAGE_TYPES.DISCONNECT]: MESSAGE_CATEGORIES.CONNECTION
};

module.exports = {
  MESSAGE_TYPES,
  MESSAGE_CATEGORIES,
  MESSAGE_TYPE_CATEGORIES
};