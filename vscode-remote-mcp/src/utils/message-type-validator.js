/**
 * Message Type Validator for VSCode Remote MCP
 * 
 * This module provides validation functions for specific message types
 * to ensure they conform to the expected format and structure.
 */

const { validateRequiredFields, validateISOTimestamp } = require('./message-validator');

/**
 * Validate a message type
 * @param {string} type - The message type to validate
 * @returns {boolean} True if valid, throws error otherwise
 */
function validateMessageType(type) {
  if (typeof type !== 'string' || type.trim() === '') {
    throw new Error('Message type must be a non-empty string');
  }
  
  // List of valid message types
  const validTypes = [
    'connection',
    'connection_ack',
    'connection_request',
    'disconnection',
    'session_create',
    'session_create_ack',
    'session_join',
    'session_join_ack',
    'session_leave',
    'terminal',
    'editor',
    'extension',
    'heartbeat',
    'error',
    'server_shutdown',
    'token_refresh',
    'token_refresh_ack'
  ];
  
  if (!validTypes.includes(type)) {
    throw new Error(`Unknown message type: ${type}`);
  }
  
  return true;
}

/**
 * Validate a connection message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateConnectionPayload(payload) {
  validateRequiredFields(payload, ['clientId', 'workspaceId', 'capabilities']);
  
  if (typeof payload.clientId !== 'string') {
    throw new Error('clientId must be a string');
  }
  
  if (typeof payload.workspaceId !== 'string') {
    throw new Error('workspaceId must be a string');
  }
  
  if (!Array.isArray(payload.capabilities)) {
    throw new Error('capabilities must be an array');
  }
  
  // Optional fields
  if (payload.clientVersion !== undefined && typeof payload.clientVersion !== 'string') {
    throw new Error('clientVersion must be a string when provided');
  }
  
  if (payload.authToken !== undefined && typeof payload.authToken !== 'string') {
    throw new Error('authToken must be a string when provided');
  }
  
  return true;
}

/**
 * Validate a connection_ack message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateConnectionAckPayload(payload) {
  validateRequiredFields(payload, ['status', 'serverTime', 'connectedClients']);
  
  if (typeof payload.status !== 'string') {
    throw new Error('status must be a string');
  }
  
  if (typeof payload.serverTime !== 'string') {
    throw new Error('serverTime must be a string');
  }
  
  if (typeof payload.connectedClients !== 'number') {
    throw new Error('connectedClients must be a number');
  }
  
  // Validate ISO timestamp format
  validateISOTimestamp(payload.serverTime);
  
  return true;
}

/**
 * Validate a disconnection message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateDisconnectionPayload(payload) {
  validateRequiredFields(payload, ['clientId']);
  
  if (typeof payload.clientId !== 'string') {
    throw new Error('clientId must be a string');
  }
  
  // Optional fields
  if (payload.reason !== undefined && typeof payload.reason !== 'string') {
    throw new Error('reason must be a string when provided');
  }
  
  return true;
}

/**
 * Validate a session_create message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateSessionCreatePayload(payload) {
  validateRequiredFields(payload, ['sessionId', 'createdBy', 'workspaceId']);
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.createdBy !== 'string') {
    throw new Error('createdBy must be a string');
  }
  
  if (typeof payload.workspaceId !== 'string') {
    throw new Error('workspaceId must be a string');
  }
  
  // Validate sessionOptions if present
  if (payload.sessionOptions !== undefined) {
    if (typeof payload.sessionOptions !== 'object' || payload.sessionOptions === null) {
      throw new Error('sessionOptions must be an object');
    }
    
    // Validate sessionOptions fields if present
    if (payload.sessionOptions.allowEditing !== undefined &&
        typeof payload.sessionOptions.allowEditing !== 'boolean') {
      throw new Error('allowEditing must be a boolean');
    }
    
    if (payload.sessionOptions.allowTerminal !== undefined &&
        typeof payload.sessionOptions.allowTerminal !== 'boolean') {
      throw new Error('allowTerminal must be a boolean');
    }
    
    if (payload.sessionOptions.isPrivate !== undefined &&
        typeof payload.sessionOptions.isPrivate !== 'boolean') {
      throw new Error('isPrivate must be a boolean');
    }
  }
  
  return true;
}

/**
 * Validate a session_create_ack message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateSessionCreateAckPayload(payload) {
  validateRequiredFields(payload, ['sessionId', 'status']);
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.status !== 'string') {
    throw new Error('status must be a string');
  }
  
  if (payload.status !== 'created' && payload.status !== 'failed') {
    throw new Error('status must be either "created" or "failed"');
  }
  
  return true;
}

/**
 * Validate a session_join message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateSessionJoinPayload(payload) {
  validateRequiredFields(payload, ['sessionId', 'clientId', 'workspaceId']);
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.clientId !== 'string') {
    throw new Error('clientId must be a string');
  }
  
  if (typeof payload.workspaceId !== 'string') {
    throw new Error('workspaceId must be a string');
  }
  
  return true;
}

/**
 * Validate a session_join_ack message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateSessionJoinAckPayload(payload) {
  // First check if payload is an object
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a non-null object');
  }
  
  // Check required fields
  const requiredFields = ['sessionId', 'status', 'participants'];
  for (const field of requiredFields) {
    if (payload[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Then validate types
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.status !== 'string') {
    throw new Error('status must be a string');
  }
  
  if (!Array.isArray(payload.participants)) {
    throw new Error('participants must be an array');
  }
  
  // Validate status value
  if (payload.status !== 'joined' && payload.status !== 'rejected') {
    throw new Error('status must be either "joined" or "rejected"');
  }
  
  // Optional fields
  if (payload.activeDocument !== undefined && typeof payload.activeDocument !== 'string') {
    throw new Error('activeDocument must be a string when provided');
  }
  
  if (payload.sharedTerminal !== undefined && typeof payload.sharedTerminal !== 'string') {
    throw new Error('sharedTerminal must be a string when provided');
  }
  
  return true;
}

/**
 * Validate a session_leave message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateSessionLeavePayload(payload) {
  validateRequiredFields(payload, ['sessionId', 'clientId']);
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.clientId !== 'string') {
    throw new Error('clientId must be a string');
  }
  
  return true;
}

/**
 * Validate a terminal message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateTerminalPayload(payload) {
  validateRequiredFields(payload, ['sessionId', 'data', 'sourceClientId']);
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.data !== 'string') {
    throw new Error('data must be a string');
  }
  
  if (typeof payload.sourceClientId !== 'string') {
    throw new Error('sourceClientId must be a string');
  }
  
  return true;
}

/**
 * Validate an editor message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateEditorPayload(payload) {
  validateRequiredFields(payload, ['sessionId', 'sourceClientId']);
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.sourceClientId !== 'string') {
    throw new Error('sourceClientId must be a string');
  }
  
  // Check for either documentUri or filePath
  if (!payload.documentUri && !payload.filePath) {
    throw new Error('Missing required field: documentUri or filePath');
  }
  
  if (payload.documentUri && typeof payload.documentUri !== 'string') {
    throw new Error('documentUri must be a string');
  }
  
  if (payload.filePath && typeof payload.filePath !== 'string') {
    throw new Error('filePath must be a string');
  }
  
  // Validate edit object if present
  if (payload.edit) {
    // Check if edit is an object
    if (typeof payload.edit !== 'object' || payload.edit === null) {
      throw new Error('edit must be an object');
    }
    
    // Validate edit.range if present
    if (payload.edit.range) {
      // Check if range is an object
      if (typeof payload.edit.range !== 'object' || payload.edit.range === null) {
        throw new Error('range must be an object');
      }
      
      // Check required range fields
      const requiredRangeFields = ['startLine', 'startColumn', 'endLine', 'endColumn'];
      for (const field of requiredRangeFields) {
        if (payload.edit.range[field] === undefined) {
          throw new Error(`Missing required field: ${field}`);
        }
        
        if (typeof payload.edit.range[field] !== 'number') {
          throw new Error(`${field} must be a number`);
        }
      }
    } else {
      throw new Error('Missing required field: range');
    }
    
    // Validate edit.text if present
    if (payload.edit.text !== undefined && typeof payload.edit.text !== 'string') {
      throw new Error('edit.text must be a string when provided');
    }
    
    // Validate edit.version if present
    if (payload.edit.version !== undefined && typeof payload.edit.version !== 'number') {
      throw new Error('edit.version must be a number when provided');
    }
  }
  
  // Validate cursorPosition if present
  if (payload.cursorPosition) {
    if (typeof payload.cursorPosition !== 'object' || payload.cursorPosition === null) {
      throw new Error('cursorPosition must be an object');
    }
    
    // Check required cursorPosition fields
    if (payload.cursorPosition.line === undefined) {
      throw new Error('Missing required field: line');
    }
    
    if (payload.cursorPosition.column === undefined) {
      throw new Error('Missing required field: column');
    }
    
    if (typeof payload.cursorPosition.line !== 'number') {
      throw new Error('line must be a number');
    }
    
    if (typeof payload.cursorPosition.column !== 'number') {
      throw new Error('column must be a number');
    }
  }
  
  // Validate selection if present
  if (payload.selection) {
    if (typeof payload.selection !== 'object' || payload.selection === null) {
      throw new Error('selection must be an object');
    }
    
    // Check required selection fields
    const requiredSelectionFields = ['startLine', 'startColumn', 'endLine', 'endColumn'];
    for (const field of requiredSelectionFields) {
      if (payload.selection[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
      
      if (typeof payload.selection[field] !== 'number') {
        throw new Error(`${field} must be a number`);
      }
    }
  }
  
  return true;
}

/**
 * Validate an extension message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateExtensionPayload(payload) {
  validateRequiredFields(payload, ['extensionId', 'state', 'sourceClientId']);
  
  if (typeof payload.extensionId !== 'string') {
    throw new Error('extensionId must be a string');
  }
  
  if (typeof payload.state !== 'object' || payload.state === null) {
    throw new Error('state must be an object');
  }
  
  if (typeof payload.sourceClientId !== 'string') {
    throw new Error('sourceClientId must be a string');
  }
  
  // Validate scope if present
  if (payload.scope !== undefined) {
    if (typeof payload.scope !== 'string') {
      throw new Error('scope must be a string');
    }
    
    // Validate scope value
    if (payload.scope !== 'session' && payload.scope !== 'global') {
      throw new Error('scope must be either "session" or "global"');
    }
    
    // Check for sessionId when scope is "session"
    if (payload.scope === 'session' && !payload.sessionId) {
      throw new Error('sessionId is required when scope is "session"');
    }
  }
  
  return true;
}

/**
 * Validate a heartbeat message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateHeartbeatPayload(payload) {
  validateRequiredFields(payload, ['timestamp']);
  
  if (typeof payload.timestamp !== 'string') {
    throw new Error('timestamp must be a string');
  }
  
  // Validate ISO timestamp format
  validateISOTimestamp(payload.timestamp);
  
  // Optional fields
  if (payload.clientId !== undefined && typeof payload.clientId !== 'string') {
    throw new Error('clientId must be a string when provided');
  }
  
  return true;
}

/**
 * Validate an error message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateErrorPayload(payload) {
  validateRequiredFields(payload, ['code', 'message']);
  
  if (typeof payload.code !== 'string') {
    throw new Error('code must be a string');
  }
  
  if (typeof payload.message !== 'string') {
    throw new Error('message must be a string');
  }
  
  return true;
}

/**
 * Validate a server_shutdown message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateServerShutdownPayload(payload) {
  // First check if payload is an object
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a non-null object');
  }
  
  // Check required fields
  if (payload.reason === undefined) {
    throw new Error('Missing required field: reason');
  }
  
  // Then validate types
  if (typeof payload.reason !== 'string') {
    throw new Error('reason must be a string');
  }
  
  // Optional fields
  if (payload.time !== undefined) {
    if (typeof payload.time !== 'string') {
      throw new Error('time must be a string');
    }
    
    try {
      validateISOTimestamp(payload.time);
    } catch (error) {
      throw new Error('time must be a valid ISO 8601 timestamp');
    }
  }
  
  if (payload.plannedRestart !== undefined && typeof payload.plannedRestart !== 'boolean') {
    throw new Error('plannedRestart must be a boolean');
  }
  
  if (payload.estimatedDowntime !== undefined && typeof payload.estimatedDowntime !== 'number') {
    throw new Error('estimatedDowntime must be a number');
  }
  
  return true;
}

/**
 * Validate a token_refresh message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateTokenRefreshPayload(payload) {
  validateRequiredFields(payload, ['clientId', 'newToken']);
  
  if (typeof payload.clientId !== 'string') {
    throw new Error('clientId must be a string');
  }
  
  if (typeof payload.newToken !== 'string') {
    throw new Error('newToken must be a string');
  }
  
  return true;
}

/**
 * Validate a token_refresh_ack message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateTokenRefreshAckPayload(payload) {
  // First check if payload is an object
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a non-null object');
  }
  
  // Check required fields
  if (payload.status === undefined) {
    throw new Error('Missing required field: status');
  }
  
  // Then validate types
  if (typeof payload.status !== 'string') {
    throw new Error('status must be a string');
  }
  
  // Validate status value
  if (payload.status !== 'accepted' && payload.status !== 'rejected') {
    throw new Error('status must be either "accepted" or "rejected"');
  }
  
  // Optional fields
  if (payload.expiresAt !== undefined) {
    if (typeof payload.expiresAt !== 'string') {
      throw new Error('expiresAt must be a string when provided');
    }
    
    try {
      validateISOTimestamp(payload.expiresAt);
    } catch (error) {
      throw new Error('expiresAt must be a valid ISO 8601 string when provided');
    }
  }
  
  if (payload.validUntil !== undefined) {
    if (typeof payload.validUntil !== 'string') {
      throw new Error('validUntil must be a string when provided');
    }
    
    try {
      validateISOTimestamp(payload.validUntil);
    } catch (error) {
      throw new Error('validUntil must be a valid ISO 8601 timestamp');
    }
  }
  
  if (payload.message !== undefined && typeof payload.message !== 'string') {
    throw new Error('message must be a string when provided');
  }
  
  return true;
}

/**
 * Validate a connection_request message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateConnectionRequestPayload(payload) {
  // Basic validation - just check if payload is an object
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be an object');
  }
  
  // Check for authToken if provided
  if (payload.authToken !== undefined && typeof payload.authToken !== 'string') {
    throw new Error('authToken must be a string when provided');
  }
  
  // Check for clientInfo if provided
  if (payload.clientInfo !== undefined && (typeof payload.clientInfo !== 'object' || payload.clientInfo === null)) {
    throw new Error('clientInfo must be an object when provided');
  }
  
  return true;
}

/**
 * Validate a message payload based on its type
 * @param {string} type - The message type
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid, throws an error otherwise
 */
function validateMessagePayload(type, payload) {
  // First validate the message type
  validateMessageType(type);
  
  // Then validate the payload based on the message type
  switch (type) {
    case 'connection':
      return validateConnectionPayload(payload);
    case 'connection_ack':
      return validateConnectionAckPayload(payload);
    case 'connection_request':
      return validateConnectionRequestPayload(payload);
    case 'disconnection':
      return validateDisconnectionPayload(payload);
    case 'session_create':
      return validateSessionCreatePayload(payload);
    case 'session_create_ack':
      return validateSessionCreateAckPayload(payload);
    case 'session_join':
      return validateSessionJoinPayload(payload);
    case 'session_join_ack':
      return validateSessionJoinAckPayload(payload);
    case 'session_leave':
      return validateSessionLeavePayload(payload);
    case 'terminal':
      return validateTerminalPayload(payload);
    case 'editor':
      return validateEditorPayload(payload);
    case 'extension':
      return validateExtensionPayload(payload);
    case 'heartbeat':
      return validateHeartbeatPayload(payload);
    case 'error':
      return validateErrorPayload(payload);
    case 'server_shutdown':
      return validateServerShutdownPayload(payload);
    case 'token_refresh':
      return validateTokenRefreshPayload(payload);
    case 'token_refresh_ack':
      return validateTokenRefreshAckPayload(payload);
    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

/**
 * Validate a complete message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid, throws error otherwise
 */
function validateMessage(message) {
  // Check if message is an object
  if (!message || typeof message !== 'object') {
    throw new Error('Message must be an object');
  }

  // Check required fields
  if (!message.type) {
    throw new Error('Message must have a type');
  }

  if (!message.id) {
    throw new Error('Message must have an ID');
  }

  if (!message.payload || typeof message.payload !== 'object') {
    throw new Error('Message must have a payload');
  }

  // Validate message type
  validateMessageType(message.type);
  
  // Validate payload based on message type
  validateMessagePayload(message.type, message.payload);
  
  return true;
}

module.exports = {
  validateMessage,
  validateMessageType,
  validateMessagePayload,
  validateConnectionPayload,
  validateConnectionAckPayload,
  validateDisconnectionPayload,
  validateSessionCreatePayload,
  validateSessionCreateAckPayload,
  validateSessionJoinPayload,
  validateSessionJoinAckPayload,
  validateSessionLeavePayload,
  validateTerminalPayload,
  validateEditorPayload,
  validateExtensionPayload,
  validateHeartbeatPayload,
  validateErrorPayload,
  validateServerShutdownPayload,
  validateTokenRefreshPayload,
  validateTokenRefreshAckPayload
};