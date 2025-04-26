/**
 * Message Type Validator Remaining Functions for VSCode Remote MCP
 * 
 * This module provides additional validator functions for message types.
 */

const { 
  validateRequiredFields, 
  validateStringFields, 
  validateBooleanFields, 
  validateNumberFields, 
  validateObjectFields, 
  validateArrayFields, 
  validateISOTimestamp 
} = require('./message-type-validator-helpers');

/**
 * Validate session creation payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if payload is valid
 * @throws {Error} If payload is invalid
 */
function validateSessionCreationPayload(payload) {
  // Check required fields
  validateRequiredFields(payload, ['parameters']);
  validateObjectFields(payload, ['parameters']);
  
  // Check parameters
  const { parameters } = payload;
  
  // Check optional fields in parameters
  if (parameters.hasOwnProperty('timeout')) {
    validateNumberFields(parameters, ['timeout']);
  }
  
  if (parameters.hasOwnProperty('persistent')) {
    validateBooleanFields(parameters, ['persistent']);
  }
  
  if (parameters.hasOwnProperty('name')) {
    validateStringFields(parameters, ['name']);
  }
  
  return true;
}

/**
 * Validate session end payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if payload is valid
 * @throws {Error} If payload is invalid
 */
function validateSessionEndPayload(payload) {
  // Check required fields
  validateRequiredFields(payload, ['sessionId']);
  validateStringFields(payload, ['sessionId']);
  
  // Check optional fields
  if (payload.hasOwnProperty('reason')) {
    validateStringFields(payload, ['reason']);
  }
  
  return true;
}

/**
 * Validate session pause payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if payload is valid
 * @throws {Error} If payload is invalid
 */
function validateSessionPausePayload(payload) {
  // Check required fields
  validateRequiredFields(payload, ['sessionId']);
  validateStringFields(payload, ['sessionId']);
  
  // Check optional fields
  if (payload.hasOwnProperty('duration')) {
    validateNumberFields(payload, ['duration']);
  }
  
  return true;
}

/**
 * Validate session resume payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if payload is valid
 * @throws {Error} If payload is invalid
 */
function validateSessionResumePayload(payload) {
  // Check required fields
  validateRequiredFields(payload, ['sessionId']);
  validateStringFields(payload, ['sessionId']);
  
  return true;
}

/**
 * Validate session list payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if payload is valid
 * @throws {Error} If payload is invalid
 */
function validateSessionListPayload(payload) {
  // Check optional fields
  if (payload.hasOwnProperty('filter')) {
    validateObjectFields(payload, ['filter']);
    
    const { filter } = payload;
    
    if (filter.hasOwnProperty('status')) {
      validateStringFields(filter, ['status']);
      
      if (!['active', 'paused', 'ended', 'all'].includes(filter.status)) {
        throw new Error('status must be one of: active, paused, ended, all');
      }
    }
    
    if (filter.hasOwnProperty('createdAfter')) {
      validateISOTimestamp(filter.createdAfter, 'createdAfter');
    }
    
    if (filter.hasOwnProperty('createdBefore')) {
      validateISOTimestamp(filter.createdBefore, 'createdBefore');
    }
  }
  
  return true;
}

/**
 * Validate editor payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if payload is valid
 * @throws {Error} If payload is invalid
 */
function validateEditorPayload(payload) {
  // Check required fields
  validateRequiredFields(payload, ['edit']);
  validateObjectFields(payload, ['edit']);
  
  // Check edit fields
  validateRequiredFields(payload.edit, ['range', 'text']);
  validateObjectFields(payload.edit, ['range']);
  validateStringFields(payload.edit, ['text']);
  
  // Check range fields
  validateRequiredFields(payload.edit.range, ['startLine', 'startColumn', 'endLine', 'endColumn']);
  validateNumberFields(payload.edit.range, ['startLine', 'startColumn', 'endLine', 'endColumn']);
  
  return true;
}

/**
 * Validate extension payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if payload is valid
 * @throws {Error} If payload is invalid
 */
function validateExtensionPayload(payload) {
  // Check required fields
  validateRequiredFields(payload, ['extensionId', 'command']);
  validateStringFields(payload, ['extensionId', 'command']);
  
  // Check optional fields
  if (payload.hasOwnProperty('args')) {
    validateArrayFields(payload, ['args']);
  }
  
  if (payload.hasOwnProperty('state')) {
    validateObjectFields(payload, ['state']);
  }
  
  return true;
}

module.exports = {
  validateSessionCreationPayload,
  validateSessionEndPayload,
  validateSessionPausePayload,
  validateSessionResumePayload,
  validateSessionListPayload,
  validateEditorPayload,
  validateExtensionPayload
};