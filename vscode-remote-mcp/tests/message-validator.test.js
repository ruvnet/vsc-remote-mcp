/**
 * Tests for the message validator functions
 */

const {
  validateMessage,
  validateMessageType,
  validateMessagePayload,
  validateServerShutdownPayload,
  validateTokenRefreshAckPayload,
  validateSessionJoinAckPayload
} = require('../src/utils/message-type-validator');

describe('Message Validator', () => {
  describe('validateMessage', () => {
    test('should accept valid messages', () => {
      const message = {
        type: 'connection_request',
        id: '123',
        payload: {
          authToken: 'token123',
          clientInfo: {
            version: '1.0.0'
          }
        }
      };
      
      expect(() => validateMessage(message)).not.toThrow();
    });
    
    test('should reject non-object messages', () => {
      expect(() => validateMessage('not an object')).toThrow('Message must be an object');
    });
    
    test('should reject messages without a type', () => {
      const message = {
        id: '123',
        payload: {}
      };
      
      expect(() => validateMessage(message)).toThrow('Message must have a type');
    });
    
    test('should reject messages without an ID', () => {
      const message = {
        type: 'connection_request',
        payload: {}
      };
      
      expect(() => validateMessage(message)).toThrow('Message must have an ID');
    });
    
    test('should reject messages without a payload', () => {
      const message = {
        type: 'connection_request',
        id: '123'
      };
      
      expect(() => validateMessage(message)).toThrow('Message must have a payload');
    });
  });
  
  describe('validateServerShutdownPayload', () => {
    test('should accept valid server shutdown payloads', () => {
      const payload = {
        reason: 'maintenance'
      };
      
      expect(validateServerShutdownPayload(payload)).toBe(true);
    });
    
    test('should accept server shutdown payloads with optional fields', () => {
      const payload = {
        reason: 'maintenance',
        time: '2023-01-01T12:00:00Z',
        plannedRestart: true,
        estimatedDowntime: 30
      };
      
      expect(validateServerShutdownPayload(payload)).toBe(true);
    });
    
    test('should reject server shutdown payloads without a reason', () => {
      const payload = {};
      
      expect(() => validateServerShutdownPayload(payload)).toThrow('Missing required field: reason');
    });
    
    test('should reject server shutdown payloads with invalid time format', () => {
      const payload = {
        reason: 'maintenance',
        time: 'not a timestamp'
      };
      
      expect(() => validateServerShutdownPayload(payload)).toThrow('time must be a valid ISO 8601 timestamp');
    });
    
    test('should reject server shutdown payloads with invalid plannedRestart type', () => {
      const payload = {
        reason: 'maintenance',
        plannedRestart: 'yes'
      };
      
      expect(() => validateServerShutdownPayload(payload)).toThrow('plannedRestart must be a boolean');
    });
    
    test('should reject server shutdown payloads with invalid estimatedDowntime type', () => {
      const payload = {
        reason: 'maintenance',
        estimatedDowntime: '30 minutes'
      };
      
      expect(() => validateServerShutdownPayload(payload)).toThrow('estimatedDowntime must be a number');
    });
  });
  
  describe('validateSessionJoinAckPayload', () => {
    test('should accept valid session join ack payloads', () => {
      const payload = {
        sessionId: 'session123',
        status: 'joined',
        participants: ['user1', 'user2']
      };
      
      expect(validateSessionJoinAckPayload(payload)).toBe(true);
    });
    
    test('should accept session join ack payloads with optional fields', () => {
      const payload = {
        sessionId: 'session123',
        status: 'joined',
        participants: ['user1', 'user2'],
        activeDocument: 'file.js',
        sharedTerminal: 'terminal1'
      };
      
      expect(validateSessionJoinAckPayload(payload)).toBe(true);
    });
    
    test('should reject session join ack payloads without required fields', () => {
      const payload = {
        sessionId: 'session123',
        status: 'joined'
      };
      
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('Missing required field: participants');
    });
    
    test('should reject session join ack payloads with invalid status', () => {
      const payload = {
        sessionId: 'session123',
        status: 'pending',
        participants: ['user1', 'user2']
      };
      
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('status must be either "joined" or "rejected"');
    });
    
    test('should reject session join ack payloads with invalid participants type', () => {
      const payload = {
        sessionId: 'session123',
        status: 'joined',
        participants: 'user1, user2'
      };
      
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('participants must be an array');
    });
  });
  
  describe('validateTokenRefreshAckPayload', () => {
    test('should accept valid token refresh ack payloads with accepted status', () => {
      const payload = {
        status: 'accepted',
        expiresAt: '2023-01-01T12:00:00Z'
      };
      
      expect(validateTokenRefreshAckPayload(payload)).toBe(true);
    });
    
    test('should accept valid token refresh ack payloads with rejected status', () => {
      const payload = {
        status: 'rejected',
        message: 'Invalid token'
      };
      
      expect(validateTokenRefreshAckPayload(payload)).toBe(true);
    });
    
    test('should reject token refresh ack payloads without a status', () => {
      const payload = {};
      
      expect(() => validateTokenRefreshAckPayload(payload)).toThrow('Missing required field: status');
    });
    
    test('should reject token refresh ack payloads with invalid status', () => {
      const payload = {
        status: 'pending'
      };
      
      expect(() => validateTokenRefreshAckPayload(payload)).toThrow('status must be either "accepted" or "rejected"');
    });
    
    test('should reject token refresh ack payloads with invalid expiresAt format', () => {
      const payload = {
        status: 'accepted',
        expiresAt: 'not a timestamp'
      };
      
      expect(() => validateTokenRefreshAckPayload(payload)).toThrow('expiresAt must be a valid ISO 8601 string when provided');
    });
  });
});