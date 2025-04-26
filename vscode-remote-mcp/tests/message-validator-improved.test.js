/**
 * Enhanced tests for message-validator.js
 * 
 * This test suite aims to improve coverage for the message-validator module,
 * which currently has only 6.43% coverage.
 */

const messageValidator = require('../src/utils/message-validator');
const { MESSAGE_TYPES } = require('../src/utils/message-types');

describe('Message Validator', () => {
  // Test basic validation functionality
  describe('validateMessage', () => {
    test('should validate a well-formed message', () => {
      const message = {
        type: 'client_hello',
        id: '123456',
        timestamp: Date.now(),
        payload: {
          clientId: 'test-client',
          version: '1.0.0'
        }
      };
      
      const result = messageValidator.validateMessageCompat(message);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('should reject a message with missing type', () => {
      const message = {
        id: '123456',
        timestamp: Date.now(),
        payload: {
          clientId: 'test-client',
          version: '1.0.0'
        }
      };
      
      const result = messageValidator.validateMessageCompat(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message type is required');
    });
    
    test('should reject a message with invalid type', () => {
      const message = {
        type: 'invalid_type',
        id: '123456',
        timestamp: Date.now(),
        payload: {
          clientId: 'test-client',
          version: '1.0.0'
        }
      };
      
      const result = messageValidator.validateMessageCompat(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid message type: invalid_type');
    });
    
    test('should reject a message with missing id', () => {
      const message = {
        type: 'client_hello',
        timestamp: Date.now(),
        payload: {
          clientId: 'test-client',
          version: '1.0.0'
        }
      };
      
      const result = messageValidator.validateMessageCompat(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message id is required');
    });
    
    test('should reject a message with missing timestamp', () => {
      const message = {
        type: 'client_hello',
        id: '123456',
        payload: {
          clientId: 'test-client',
          version: '1.0.0'
        }
      };
      
      const result = messageValidator.validateMessageCompat(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message timestamp is required');
    });
    
    test('should reject a message with invalid timestamp', () => {
      const message = {
        type: 'client_hello',
        id: '123456',
        timestamp: 'not-a-timestamp',
        payload: {
          clientId: 'test-client',
          version: '1.0.0'
        }
      };
      
      const result = messageValidator.validateMessageCompat(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message timestamp must be a number');
    });
    
    test('should reject a message with missing payload', () => {
      const message = {
        type: 'client_hello',
        id: '123456',
        timestamp: Date.now()
      };
      
      const result = messageValidator.validateMessageCompat(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message payload is required');
    });
    
    test('should reject a message with non-object payload', () => {
      const message = {
        type: 'client_hello',
        id: '123456',
        timestamp: Date.now(),
        payload: 'not-an-object'
      };
      
      const result = messageValidator.validateMessageCompat(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message payload must be an object');
    });
  });
  
  // Test specific message type validation
  describe('validateMessageType', () => {
    test('should validate client_hello message', () => {
      const message = {
        type: 'client_hello',
        id: '123456',
        timestamp: Date.now(),
        payload: {
          clientId: 'test-client',
          version: '1.0.0'
        }
      };
      
      const result = messageValidator.validateMessageTypeWithPayload(message);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('should reject client_hello with missing clientId', () => {
      const message = {
        type: 'client_hello',
        id: '123456',
        timestamp: Date.now(),
        payload: {
          version: '1.0.0'
        }
      };
      
      const result = messageValidator.validateMessageTypeWithPayload(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('client_hello message requires clientId in payload');
    });
    
    test('should reject client_hello with missing version', () => {
      const message = {
        type: 'client_hello',
        id: '123456',
        timestamp: Date.now(),
        payload: {
          clientId: 'test-client'
        }
      };
      
      const result = messageValidator.validateMessageTypeWithPayload(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('client_hello message requires version in payload');
    });
    
    // Test server_hello validation
    test('should validate server_hello message', () => {
      const message = {
        type: 'server_hello',
        id: '123456',
        timestamp: Date.now(),
        payload: {
          serverId: 'test-server',
          version: '1.0.0',
          sessionId: 'session-123'
        }
      };
      
      const result = messageValidator.validateMessageTypeWithPayload(message);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('should reject server_hello with missing serverId', () => {
      const message = {
        type: 'server_hello',
        id: '123456',
        timestamp: Date.now(),
        payload: {
          version: '1.0.0',
          sessionId: 'session-123'
        }
      };
      
      const result = messageValidator.validateMessageTypeWithPayload(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('server_hello message requires serverId in payload');
    });
    
    // Test auth_request validation
    test('should validate auth_request message', () => {
      const message = {
        type: 'auth_request',
        id: '123456',
        timestamp: Date.now(),
        payload: {
          authType: 'token',
          token: 'valid-token'
        }
      };
      
      const result = messageValidator.validateMessageTypeWithPayload(message);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('should reject auth_request with invalid authType', () => {
      const message = {
        type: 'auth_request',
        id: '123456',
        timestamp: Date.now(),
        payload: {
          authType: 'invalid-type',
          token: 'valid-token'
        }
      };
      
      const result = messageValidator.validateMessageTypeWithPayload(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('auth_request message requires valid authType (token, basic, oauth)');
    });
  });
  
  // Test edge cases
  describe('Edge Cases', () => {
    test('should handle null message', () => {
      const result = messageValidator.validateMessageCompat(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message must be a non-null object');
    });
    
    test('should handle undefined message', () => {
      const result = messageValidator.validateMessageCompat(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message must be a non-null object');
    });
    
    test('should handle non-object message', () => {
      const result = messageValidator.validateMessageCompat('not-an-object');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message must be a non-null object');
    });
    
    test('should handle empty object message', () => {
      const result = messageValidator.validateMessageCompat({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message type is required');
    });
  });
  
  // Test validation helpers
  describe('Validation Helpers', () => {
    test('isValidMessageType should return true for valid types', () => {
      Object.values(MESSAGE_TYPES).forEach(type => {
        expect(messageValidator.isValidMessageType(type)).toBe(true);
      });
    });
    
    test('isValidMessageType should return false for invalid types', () => {
      expect(messageValidator.isValidMessageType('invalid_type')).toBe(false);
      expect(messageValidator.isValidMessageType('')).toBe(false);
      expect(messageValidator.isValidMessageType(null)).toBe(false);
      expect(messageValidator.isValidMessageType(undefined)).toBe(false);
      expect(messageValidator.isValidMessageType(123)).toBe(false);
    });
    
    test('validateRequiredFields should return errors for missing fields', () => {
      const obj = { field1: 'value1' };
      const requiredFields = ['field1', 'field2', 'field3'];
      
      const errors = messageValidator.validateRequiredFieldsCompat(obj, requiredFields);
      expect(errors).toContain('field2 is required');
      expect(errors).toContain('field3 is required');
      expect(errors).not.toContain('field1 is required');
    });
    
    test('validateRequiredFields should return empty array when all fields present', () => {
      const obj = { field1: 'value1', field2: 'value2', field3: 'value3' };
      const requiredFields = ['field1', 'field2', 'field3'];
      
      const errors = messageValidator.validateRequiredFieldsCompat(obj, requiredFields);
      expect(errors).toEqual([]);
    });
  });
});