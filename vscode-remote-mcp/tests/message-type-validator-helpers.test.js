/**
 * Tests for message type validator helper functions
 */

const {
  validateMessageType,
  getMessageTypeCategory,
  isSystemMessageType,
  getRelatedMessageTypes,
  getRequestResponsePair,
  validateMessageTypeFormat,
  validateMessageTypeCategory,
  isResponseMessageType
} = require('../src/utils/message-type-validator-helpers');

describe('Message Type Validator Helpers', () => {
  describe('getMessageTypeCategory', () => {
    test('should categorize connection message types', () => {
      expect(getMessageTypeCategory('connection')).toBe('connection');
      expect(getMessageTypeCategory('connection_request')).toBe('connection');
      expect(getMessageTypeCategory('connection_response')).toBe('connection');
    });

    test('should categorize session message types', () => {
      expect(getMessageTypeCategory('session_request')).toBe('session');
      expect(getMessageTypeCategory('session_response')).toBe('session');
      expect(getMessageTypeCategory('session_create')).toBe('session');
    });

    test('should categorize command message types', () => {
      expect(getMessageTypeCategory('command_request')).toBe('command');
      expect(getMessageTypeCategory('command_response')).toBe('command');
    });

    test('should categorize token message types', () => {
      expect(getMessageTypeCategory('token_refresh')).toBe('token');
      expect(getMessageTypeCategory('token_refresh_request')).toBe('token');
      expect(getMessageTypeCategory('token_refresh_response')).toBe('token');
    });

    test('should categorize system message types', () => {
      expect(getMessageTypeCategory('heartbeat')).toBe('system');
      expect(getMessageTypeCategory('error')).toBe('system');
      expect(getMessageTypeCategory('notification')).toBe('system');
    });

    test('should categorize client message types', () => {
      expect(getMessageTypeCategory('editor')).toBe('client');
      expect(getMessageTypeCategory('terminal')).toBe('client');
      expect(getMessageTypeCategory('extension')).toBe('client');
    });

    test('should return unknown for unrecognized categories', () => {
      // This test assumes validateMessageType allows these types
      // In a real scenario, validateMessageType would reject them
      expect(() => getMessageTypeCategory('unknown_type')).toThrow();
    });
  });

  describe('isSystemMessageType', () => {
    test('should identify system message types', () => {
      expect(isSystemMessageType('heartbeat')).toBe(true);
      expect(isSystemMessageType('error')).toBe(true);
      expect(isSystemMessageType('notification')).toBe(true);
    });

    test('should reject non-system message types', () => {
      expect(isSystemMessageType('connection')).toBe(false);
      expect(isSystemMessageType('session_request')).toBe(false);
      expect(isSystemMessageType('command_response')).toBe(false);
    });
  });

  describe('getRelatedMessageTypes', () => {
    test('should get related connection message types', () => {
      const related = getRelatedMessageTypes('connection');
      expect(related).toContain('connection');
      expect(related).toContain('connection_request');
      expect(related).toContain('connection_response');
      expect(related).toContain('connection_ack');
      expect(related).not.toContain('session_request');
    });

    test('should get related session message types', () => {
      const related = getRelatedMessageTypes('session_request');
      expect(related).toContain('session_request');
      expect(related).toContain('session_response');
      expect(related).toContain('session_create');
      expect(related).toContain('session_create_ack');
      expect(related).not.toContain('connection_request');
    });
  });

  describe('getRequestResponsePair', () => {
    test('should get response for request message types', () => {
      expect(getRequestResponsePair('connection_request')).toBe('connection_response');
      expect(getRequestResponsePair('session_request')).toBe('session_response');
      expect(getRequestResponsePair('command_request')).toBe('command_response');
      expect(getRequestResponsePair('token_refresh_request')).toBe('token_refresh_response');
    });

    test('should get request for response message types', () => {
      expect(getRequestResponsePair('connection_response')).toBe('connection_request');
      expect(getRequestResponsePair('session_response')).toBe('session_request');
      expect(getRequestResponsePair('command_response')).toBe('command_request');
      expect(getRequestResponsePair('token_refresh_response')).toBe('token_refresh_request');
    });

    test('should return null for non-paired message types', () => {
      expect(getRequestResponsePair('connection')).toBeNull();
      expect(getRequestResponsePair('heartbeat')).toBeNull();
      expect(getRequestResponsePair('error')).toBeNull();
    });
  });

  describe('validateMessageTypeFormat', () => {
    test('should accept valid message type formats', () => {
      expect(validateMessageTypeFormat('connection')).toBe(true);
      expect(validateMessageTypeFormat('connection_request')).toBe(true);
      expect(validateMessageTypeFormat('token_refresh_response')).toBe(true);
    });

    test('should reject message types with invalid characters', () => {
      expect(() => validateMessageTypeFormat('CONNECTION')).toThrow();
      expect(() => validateMessageTypeFormat('connection-request')).toThrow();
      expect(() => validateMessageTypeFormat('connection.request')).toThrow();
      expect(() => validateMessageTypeFormat('connection request')).toThrow();
    });

    test('should reject message types that are too long', () => {
      const longType = 'a'.repeat(51);
      expect(() => validateMessageTypeFormat(longType)).toThrow();
    });
  });

  describe('validateMessageTypeCategory', () => {
    test('should accept valid message type categories', () => {
      expect(validateMessageTypeCategory('connection', 'connection')).toBe(true);
      expect(validateMessageTypeCategory('session_request', 'session')).toBe(true);
      expect(validateMessageTypeCategory('heartbeat', 'system')).toBe(true);
    });

    test('should reject message types with incorrect categories', () => {
      expect(() => validateMessageTypeCategory('connection', 'session')).toThrow();
      expect(() => validateMessageTypeCategory('heartbeat', 'connection')).toThrow();
      expect(() => validateMessageTypeCategory('command_request', 'token')).toThrow();
    });
  });

  describe('isResponseMessageType', () => {
    test('should identify response message types', () => {
      expect(isResponseMessageType('connection_response')).toBe(true);
      expect(isResponseMessageType('session_response')).toBe(true);
      expect(isResponseMessageType('command_response')).toBe(true);
      expect(isResponseMessageType('token_refresh_response')).toBe(true);
    });

    test('should identify acknowledgment message types as responses', () => {
      expect(isResponseMessageType('connection_ack')).toBe(true);
      expect(isResponseMessageType('session_create_ack')).toBe(true);
      expect(isResponseMessageType('session_join_ack')).toBe(true);
      expect(isResponseMessageType('token_refresh_ack')).toBe(true);
    });

    test('should reject non-response message types', () => {
      expect(isResponseMessageType('connection')).toBe(false);
      expect(isResponseMessageType('session_request')).toBe(false);
      expect(isResponseMessageType('command_request')).toBe(false);
      expect(isResponseMessageType('heartbeat')).toBe(false);
    });
  });
});