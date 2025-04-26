/**
 * Validator functions for request/response schemas in the VSCode Remote MCP system
 */

const { STATUS_VALUES, PATTERNS } = require('../config/schema-constants');

/**
 * Validates that a request and response pair match correctly
 * @param {Object} request - The request message
 * @param {Object} response - The response message
 * @throws {Error} If validation fails
 */
function validateRequestResponsePair(request, response) {
  // Validate IDs match
  if (request.id !== response.id) {
    throw new Error('Request and response IDs must match');
  }

  // Validate response type matches request type
  const expectedResponseType = `${request.type}_ack`;
  if (response.type !== expectedResponseType && response.type !== 'error') {
    throw new Error('Response type must match request type');
  }
}

/**
 * Validates a connection request
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateConnectionRequest(message) {
  const { payload } = message;
  
  if (!payload) {
    throw new Error('Missing payload');
  }
  
  // Validate clientId
  if (!payload.clientId) {
    throw new Error('Missing required field: clientId');
  } else if (typeof payload.clientId !== 'string' || payload.clientId.trim() === '') {
    throw new Error('clientId must be a non-empty string');
  }
  
  // Validate workspaceId
  if (!payload.workspaceId) {
    throw new Error('Missing required field: workspaceId');
  } else if (typeof payload.workspaceId !== 'string' || payload.workspaceId.trim() === '') {
    throw new Error('workspaceId must be a non-empty string');
  }
  
  if (payload.capabilities && !Array.isArray(payload.capabilities)) {
    throw new Error('capabilities must be an array');
  }
  
  // Validate capabilities array items if present
  if (payload.capabilities && Array.isArray(payload.capabilities)) {
    for (const capability of payload.capabilities) {
      if (typeof capability !== 'string' || capability.trim() === '') {
        throw new Error('Each capability must be a non-empty string');
      }
    }
  }
}

/**
 * Validates a connection response
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateConnectionResponse(message) {
  const { payload } = message;
  
  if (!payload) {
    throw new Error('Missing payload');
  }
  
  if (!payload.status) {
    throw new Error('Missing required field: status');
  }
  
  // Validate status value
  if (typeof payload.status !== 'string') {
    throw new Error('status must be a string');
  }
  
  if (!STATUS_VALUES.CONNECTION.includes(payload.status)) {
    throw new Error('Invalid status value');
  }
  
  // Validate serverTime if present
  if (payload.serverTime) {
    // Check if it's a valid ISO date format
    if (!PATTERNS.ISO_DATE.test(payload.serverTime)) {
      throw new Error('serverTime must be a valid ISO 8601 timestamp');
    }
    
    try {
      // Also check if it's a valid date
      const date = new Date(payload.serverTime);
      if (isNaN(date.getTime())) {
        throw new Error('serverTime must be a valid ISO 8601 timestamp');
      }
    } catch (e) {
      throw new Error('serverTime must be a valid ISO 8601 timestamp');
    }
  }
  
  // Validate connectedClients if present
  if (payload.connectedClients !== undefined) {
    if (typeof payload.connectedClients !== 'number') {
      throw new Error('connectedClients must be a number');
    }
  }
}

/**
 * Validates a session creation request
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateSessionCreateRequest(message) {
  const { payload } = message;
  
  if (!payload) {
    throw new Error('Missing payload');
  }
  
  // Validate sessionId
  if (!payload.sessionId) {
    throw new Error('Missing required field: sessionId');
  } else if (typeof payload.sessionId !== 'string' || payload.sessionId.trim() === '') {
    throw new Error('sessionId must be a non-empty string');
  }
  
  // Validate createdBy
  if (!payload.createdBy) {
    throw new Error('Missing required field: createdBy');
  } else if (typeof payload.createdBy !== 'string' || payload.createdBy.trim() === '') {
    throw new Error('createdBy must be a non-empty string');
  }
  
  // Validate workspaceId
  if (!payload.workspaceId) {
    throw new Error('Missing required field: workspaceId');
  } else if (typeof payload.workspaceId !== 'string' || payload.workspaceId.trim() === '') {
    throw new Error('workspaceId must be a non-empty string');
  }
  
  // Validate sessionName if provided
  if (payload.sessionName !== undefined) {
    if (typeof payload.sessionName !== 'string' || payload.sessionName.trim() === '') {
      throw new Error('sessionName must be a non-empty string when provided');
    }
  }
}

/**
 * Validates a session creation response
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateSessionCreateResponse(message) {
  const { payload } = message;
  
  if (!payload) {
    throw new Error('Missing payload');
  }
  
  if (!payload.sessionId) {
    throw new Error('Missing required field: sessionId');
  }
  
  if (!payload.status) {
    throw new Error('Missing required field: status');
  }
  
  // Validate status value
  if (!STATUS_VALUES.SESSION_CREATE.includes(payload.status)) {
    throw new Error('Invalid status value');
  }
  
  // Validate createdAt if present
  if (payload.createdAt) {
    // Check if it's a valid ISO date format
    if (!PATTERNS.ISO_DATE.test(payload.createdAt)) {
      throw new Error('createdAt must be a valid ISO 8601 timestamp');
    }
    
    try {
      // Also check if it's a valid date
      const date = new Date(payload.createdAt);
      if (isNaN(date.getTime())) {
        throw new Error('createdAt must be a valid ISO 8601 timestamp');
      }
    } catch (e) {
      throw new Error('createdAt must be a valid ISO 8601 timestamp');
    }
  }
}

/**
 * Validates a session join request
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateSessionJoinRequest(message) {
  const { payload } = message;
  
  if (!payload) {
    throw new Error('Missing payload');
  }
  
  if (!payload.sessionId) {
    throw new Error('Missing required field: sessionId');
  }
  
  if (!payload.clientId) {
    throw new Error('Missing required field: clientId');
  }
  
  if (!payload.workspaceId) {
    throw new Error('Missing required field: workspaceId');
  }
}

/**
 * Validates a session join response
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateSessionJoinResponse(message) {
  const { payload } = message;
  
  if (!payload) {
    throw new Error('Missing payload');
  }
  
  if (!payload.sessionId) {
    throw new Error('Missing required field: sessionId');
  }
  
  if (!payload.status) {
    throw new Error('Missing required field: status');
  }
  
  // Validate status value
  if (!STATUS_VALUES.SESSION_JOIN.includes(payload.status)) {
    throw new Error('Invalid status value');
  }
  
  // Validate participants if present
  if (payload.participants !== undefined) {
    if (!Array.isArray(payload.participants)) {
      throw new Error('participants must be an array');
    }
  }
}

/**
 * Validates a token refresh request
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateTokenRefreshRequest(message) {
  const { payload } = message;
  
  if (!payload) {
    throw new Error('Missing payload');
  }
  
  if (!payload.clientId) {
    throw new Error('Missing required field: clientId');
  }
  
  if (!payload.newToken) {
    throw new Error('Missing required field: newToken');
  }
}

/**
 * Validates a token refresh response
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateTokenRefreshResponse(message) {
  const { payload } = message;
  
  if (!payload) {
    throw new Error('Missing payload');
  }
  
  if (!payload.status) {
    throw new Error('Missing required field: status');
  }
  
  // Validate status value
  if (!STATUS_VALUES.TOKEN_REFRESH.includes(payload.status)) {
    throw new Error('Invalid status value');
  }
  
  // Validate validUntil if present
  if (payload.validUntil) {
    // Check if it's a valid ISO date format
    if (!PATTERNS.ISO_DATE.test(payload.validUntil)) {
      throw new Error('validUntil must be a valid ISO 8601 timestamp');
    }
    
    try {
      // Also check if it's a valid date
      const date = new Date(payload.validUntil);
      if (isNaN(date.getTime())) {
        throw new Error('validUntil must be a valid ISO 8601 timestamp');
      }
    } catch (e) {
      throw new Error('validUntil must be a valid ISO 8601 timestamp');
    }
  }
}

/**
 * Validates an error response
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateErrorResponse(message) {
  const { payload } = message;
  
  if (!payload) {
    throw new Error('Missing payload');
  }
  
  if (!payload.code) {
    throw new Error('Missing required field: code');
  }
  
  if (!payload.message) {
    throw new Error('Missing required field: message');
  }
  
  if (!payload.relatedTo) {
    throw new Error('Missing required field: relatedTo');
  }
  
  // Validate field formats
  if (typeof payload.code !== 'string' || payload.code.trim() === '') {
    throw new Error('code must be a non-empty string');
  }
  
  if (typeof payload.message !== 'string' || payload.message.trim() === '') {
    throw new Error('message must be a non-empty string');
  }
  
  if (typeof payload.relatedTo !== 'string' || payload.relatedTo.trim() === '') {
    throw new Error('relatedTo must be a non-empty string');
  }
}

module.exports = {
  validateRequestResponsePair,
  validateConnectionRequest,
  validateConnectionResponse,
  validateSessionCreateRequest,
  validateSessionCreateResponse,
  validateSessionJoinRequest,
  validateSessionJoinResponse,
  validateTokenRefreshRequest,
  validateTokenRefreshResponse,
  validateErrorResponse
};