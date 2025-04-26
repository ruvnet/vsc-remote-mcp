/**
 * Comprehensive tests for message-validator.js
 */

const {
  validateMessage,
  validateMessageType,
  validateMessagePayload,
  validateMessageId,
  validateMessageTimestamp,
  validateMessageTypeSpecific,
  validateConnectionMessage,
  validateDisconnectMessage,
  validateSessionCreateMessage,
  validateSessionJoinMessage,
  validateTokenRefreshMessage,
  validateTerminalMessage,
  validateEditorMessage,
  validateConnectionPayload,
  validateConnectionAckPayload,
  validateSessionJoinAckPayload,
  validateTokenRefreshAckPayload,
  validateRequiredFields,
  validateISOTimestamp
} = require('../src/utils/message-validator');

describe('Message Validator Comprehensive Tests', () => {
  // Basic validation functions
  describe('validateMessageType', () => {
    test('should accept valid message type', () => {
      expect(validateMessageType('connection')).toBe(true);
    });

    test('should reject empty string', () => {
      expect(() => validateMessageType('')).toThrow('Message type must be a non-empty string');
    });

    test('should reject null', () => {
      expect(() => validateMessageType(null)).toThrow('Message type must be a non-empty string');
    });
  });

  describe('validateMessagePayload', () => {
    test('should accept valid payload', () => {
      expect(validateMessagePayload({ data: 'test' })).toBe(true);
    });

    test('should reject null', () => {
      expect(() => validateMessagePayload(null)).toThrow('Message payload is required');
    });
  });

  describe('validateMessageId', () => {
    test('should accept valid message ID', () => {
      expect(validateMessageId('msg-123')).toBe(true);
    });

    test('should reject empty string', () => {
      expect(() => validateMessageId('')).toThrow('Message ID must be a non-empty string when provided');
    });
  });

  describe('validateMessageTimestamp', () => {
    test('should accept valid ISO timestamp', () => {
      expect(validateMessageTimestamp('2023-01-01T12:00:00Z')).toBe(true);
    });

    test('should reject non-string timestamp', () => {
      expect(() => validateMessageTimestamp(123)).toThrow('Message timestamp must be a string when provided');
    });
  });

  describe('validateISOTimestamp', () => {
    test('should accept valid ISO timestamp', () => {
      expect(() => validateISOTimestamp('2023-01-01T12:00:00Z')).not.toThrow();
    });

    test('should reject invalid date format', () => {
      expect(() => validateISOTimestamp('2023/01/01')).toThrow('2023/01/01 must be a valid ISO 8601 timestamp');
    });
  });

  describe('validateRequiredFields', () => {
    test('should not throw when all required fields are present', () => {
      const payload = { field1: 'value1', field2: 'value2' };
      const requiredFields = ['field1', 'field2'];
      expect(() => validateRequiredFields(payload, requiredFields)).not.toThrow();
    });

    test('should throw when a required field is missing', () => {
      const payload = { field1: 'value1' };
      const requiredFields = ['field1', 'field2'];
      expect(() => validateRequiredFields(payload, requiredFields)).toThrow('Missing required field: field2');
    });
  });

  // Main message validation
  describe('validateMessage', () => {
    test('should accept valid message', () => {
      const message = {
        type: 'connection',
        payload: { clientId: 'client1', workspaceId: 'workspace1', capabilities: [] },
        id: 'msg-123',
        timestamp: '2023-01-01T12:00:00Z'
      };
      
      expect(validateMessage(message)).toBe(true);
    });

    test('should reject message without type', () => {
      const message = {
        payload: { clientId: 'client1' },
        id: 'msg-123'
      };
      
      expect(() => validateMessage(message)).toThrow('Message type must be a non-empty string');
    });

    test('should reject message with empty type', () => {
      const message = {
        type: '',
        payload: { clientId: 'client1' },
        id: 'msg-123'
      };
      
      expect(() => validateMessage(message)).toThrow('Message type must be a non-empty string');
    });

    test('should reject message without payload', () => {
      const message = {
        type: 'connection',
        id: 'msg-123'
      };
      
      expect(() => validateMessage(message)).toThrow('Message payload is required');
    });

    test('should reject message with non-object payload', () => {
      const message = {
        type: 'connection',
        payload: 'not an object',
        id: 'msg-123'
      };
      
      expect(() => validateMessage(message)).toThrow('Message payload is required');
    });
  });

  // Message type-specific validation
  describe('validateMessageTypeSpecific', () => {
    test('should validate connection message', () => {
      const message = {
        type: 'connection',
        payload: {
          clientId: 'client1',
          workspaceId: 'workspace1',
          capabilities: ['feature1']
        }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should validate disconnect message', () => {
      const message = {
        type: 'disconnect',
        payload: {}
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should validate session_create message', () => {
      const message = {
        type: 'session_create',
        payload: {
          sessionId: 'session1',
          createdBy: 'user1',
          workspaceId: 'workspace1'
        }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should validate session_join message', () => {
      const message = {
        type: 'session_join',
        payload: {
          sessionId: 'session1',
          clientId: 'client1',
          workspaceId: 'workspace1'
        }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should validate token_refresh message', () => {
      const message = {
        type: 'token_refresh',
        payload: {
          clientId: 'client1',
          newToken: 'token123'
        }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should validate terminal message', () => {
      const message = {
        type: 'terminal',
        payload: {
          sessionId: 'session1',
          terminalId: 'terminal1',
          data: 'command output'
        }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should validate editor message with edit action', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'edit',
          changes: [{ range: { start: { line: 1, character: 0 }, end: { line: 1, character: 10 } }, text: 'new text' }]
        }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should validate editor message with cursor action', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'cursor',
          position: { line: 10, character: 5 }
        }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should validate editor message with selection action', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'selection',
          selections: [{ start: { line: 1, character: 0 }, end: { line: 2, character: 10 } }]
        }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should validate editor message with open/close action', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'open'
        }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
      
      const closeMessage = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'close'
        }
      };
      expect(() => validateMessageTypeSpecific(closeMessage)).not.toThrow();
    });
    
    test('should validate unknown message type', () => {
      const message = {
        type: 'custom_type',
        payload: { data: 'custom data' }
      };
      expect(() => validateMessageTypeSpecific(message)).not.toThrow();
    });
    
    test('should reject editor message with invalid action', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'invalid_action'
        }
      };
      expect(() => validateMessageTypeSpecific(message)).toThrow('Unknown editor action: invalid_action');
    });
  });

  describe('validateConnectionPayload', () => {
    test('should validate valid connection payload', () => {
      const payload = {
        clientId: 'client1',
        workspaceId: 'workspace1',
        capabilities: ['feature1']
      };
      expect(validateConnectionPayload(payload)).toBe(true);
    });
    
    test('should reject payload missing required fields', () => {
      const payload = {
        clientId: 'client1',
        capabilities: ['feature1']
      };
      expect(() => validateConnectionPayload(payload)).toThrow('Missing required field: workspaceId');
    });
    
    test('should reject payload with invalid clientId type', () => {
      const payload = {
        clientId: 123,
        workspaceId: 'workspace1',
        capabilities: ['feature1']
      };
      expect(() => validateConnectionPayload(payload)).toThrow('clientId must be a string');
    });
    
    test('should reject payload with invalid workspaceId type', () => {
      const payload = {
        clientId: 'client1',
        workspaceId: 123,
        capabilities: ['feature1']
      };
      expect(() => validateConnectionPayload(payload)).toThrow('workspaceId must be a string');
    });
    
    test('should reject payload with invalid capabilities type', () => {
      const payload = {
        clientId: 'client1',
        workspaceId: 'workspace1',
        capabilities: 'not-an-array'
      };
      expect(() => validateConnectionPayload(payload)).toThrow('capabilities must be an array');
    });
    
    test('should validate payload with optional fields', () => {
      const payload = {
        clientId: 'client1',
        workspaceId: 'workspace1',
        capabilities: ['feature1'],
        clientVersion: '1.0.0',
        authToken: 'token123'
      };
      expect(validateConnectionPayload(payload)).toBe(true);
    });
    
    test('should reject payload with invalid clientVersion type', () => {
      const payload = {
        clientId: 'client1',
        workspaceId: 'workspace1',
        capabilities: ['feature1'],
        clientVersion: 123
      };
      expect(() => validateConnectionPayload(payload)).toThrow('clientVersion must be a string when provided');
    });
    
    test('should reject payload with invalid authToken type', () => {
      const payload = {
        clientId: 'client1',
        workspaceId: 'workspace1',
        capabilities: ['feature1'],
        authToken: 123
      };
      expect(() => validateConnectionPayload(payload)).toThrow('authToken must be a string when provided');
    });
  });

  describe('validateConnectionAckPayload', () => {
    test('should validate valid connection ack payload', () => {
      const payload = {
        status: 'connected',
        serverTime: '2023-01-01T12:00:00Z',
        connectedClients: 5
      };
      expect(validateConnectionAckPayload(payload)).toBe(true);
    });
    
    test('should reject payload missing required fields', () => {
      const payload = {
        status: 'connected',
        serverTime: '2023-01-01T12:00:00Z'
      };
      expect(() => validateConnectionAckPayload(payload)).toThrow('Missing required field: connectedClients');
    });
    
    test('should reject payload with invalid status type', () => {
      const payload = {
        status: 123,
        serverTime: '2023-01-01T12:00:00Z',
        connectedClients: 5
      };
      expect(() => validateConnectionAckPayload(payload)).toThrow('status must be a string');
    });
    
    test('should reject payload with invalid serverTime type', () => {
      const payload = {
        status: 'connected',
        serverTime: 123,
        connectedClients: 5
      };
      expect(() => validateConnectionAckPayload(payload)).toThrow('serverTime must be a string');
    });
    
    test('should reject payload with invalid connectedClients type', () => {
      const payload = {
        status: 'connected',
        serverTime: '2023-01-01T12:00:00Z',
        connectedClients: '5'
      };
      expect(() => validateConnectionAckPayload(payload)).toThrow('connectedClients must be a number');
    });
  });

  describe('validateSessionJoinAckPayload', () => {
    test('should validate valid session join ack payload', () => {
      const payload = {
        sessionId: 'session1',
        status: 'joined',
        participants: ['user1', 'user2']
      };
      expect(validateSessionJoinAckPayload(payload)).toBe(true);
    });
    
    test('should reject payload with invalid sessionId type', () => {
      const payload = {
        sessionId: 123,
        status: 'joined',
        participants: ['user1', 'user2']
      };
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('sessionId must be a string');
    });
    
    test('should reject payload with invalid status type', () => {
      const payload = {
        sessionId: 'session1',
        status: 123,
        participants: ['user1', 'user2']
      };
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('status must be a string');
    });
    
    test('should reject payload with invalid participants type', () => {
      const payload = {
        sessionId: 'session1',
        status: 'joined',
        participants: 'not-an-array'
      };
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('participants must be an array');
    });
    
    test('should validate payload with optional fields', () => {
      const payload = {
        sessionId: 'session1',
        status: 'joined',
        participants: ['user1', 'user2'],
        activeDocument: '/path/to/file.js',
        sharedTerminal: 'terminal1'
      };
      expect(validateSessionJoinAckPayload(payload)).toBe(true);
    });
    
    test('should reject payload with invalid activeDocument type', () => {
      const payload = {
        sessionId: 'session1',
        status: 'joined',
        participants: ['user1', 'user2'],
        activeDocument: 123
      };
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('activeDocument must be a string when provided');
    });
    
    test('should reject payload with invalid sharedTerminal type', () => {
      const payload = {
        sessionId: 'session1',
        status: 'joined',
        participants: ['user1', 'user2'],
        sharedTerminal: 123
      };
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('sharedTerminal must be a string when provided');
    });
  });

  describe('validateTokenRefreshAckPayload', () => {
    test('should validate valid token refresh ack payload', () => {
      const payload = {
        status: 'accepted',
        expiresAt: '2023-01-01T12:00:00Z'
      };
      expect(validateTokenRefreshAckPayload(payload)).toBe(true);
    });
    
    test('should reject payload with invalid status type', () => {
      const payload = {
        status: 123
      };
      expect(() => validateTokenRefreshAckPayload(payload)).toThrow('status must be a string');
    });
    
    test('should reject payload with invalid status value', () => {
      const payload = {
        status: 'pending'
      };
      expect(() => validateTokenRefreshAckPayload(payload)).toThrow('status must be either "accepted" or "rejected"');
    });
    
    test('should validate payload with message field', () => {
      const payload = {
        status: 'rejected',
        message: 'Invalid token'
      };
      expect(validateTokenRefreshAckPayload(payload)).toBe(true);
    });
    
    test('should reject payload with invalid message type', () => {
      const payload = {
        status: 'rejected',
        message: 123
      };
      expect(() => validateTokenRefreshAckPayload(payload)).toThrow('message must be a string when provided');
    });
  });

  describe('validateTerminalMessage', () => {
    test('should validate valid terminal message', () => {
      const message = {
        type: 'terminal',
        payload: {
          sessionId: 'session1',
          terminalId: 'terminal1',
          data: 'command output'
        }
      };
      expect(() => validateTerminalMessage(message)).not.toThrow();
    });
    
    test('should reject message without sessionId', () => {
      const message = {
        type: 'terminal',
        payload: {
          terminalId: 'terminal1',
          data: 'command output'
        }
      };
      expect(() => validateTerminalMessage(message)).toThrow('Terminal message must have a sessionId');
    });
    
    test('should reject message with non-string sessionId', () => {
      const message = {
        type: 'terminal',
        payload: {
          sessionId: 123,
          terminalId: 'terminal1',
          data: 'command output'
        }
      };
      expect(() => validateTerminalMessage(message)).toThrow('Terminal sessionId must be a string');
    });
    
    test('should reject message without terminalId', () => {
      const message = {
        type: 'terminal',
        payload: {
          sessionId: 'session1',
          data: 'command output'
        }
      };
      expect(() => validateTerminalMessage(message)).toThrow('Terminal message must have a terminalId');
    });
    
    test('should reject message with non-string terminalId', () => {
      const message = {
        type: 'terminal',
        payload: {
          sessionId: 'session1',
          terminalId: 123,
          data: 'command output'
        }
      };
      expect(() => validateTerminalMessage(message)).toThrow('Terminal terminalId must be a string');
    });
    
    test('should reject message without data', () => {
      const message = {
        type: 'terminal',
        payload: {
          sessionId: 'session1',
          terminalId: 'terminal1'
        }
      };
      expect(() => validateTerminalMessage(message)).toThrow('Terminal message must have data');
    });
    
    test('should reject message with non-string data', () => {
      const message = {
        type: 'terminal',
        payload: {
          sessionId: 'session1',
          terminalId: 'terminal1',
          data: 123
        }
      };
      expect(() => validateTerminalMessage(message)).toThrow('Terminal data must be a string');
    });
  });

  describe('validateEditorMessage', () => {
    test('should validate message with documentUri instead of filePath', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          documentUri: '/path/to/file.js',
          action: 'open'
        }
      };
      expect(() => validateEditorMessage(message)).not.toThrow();
    });
    
    test('should reject message without sessionId', () => {
      const message = {
        type: 'editor',
        payload: {
          filePath: '/path/to/file.js',
          action: 'open'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor message must have a sessionId');
    });
    
    test('should reject message with non-string sessionId', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 123,
          filePath: '/path/to/file.js',
          action: 'open'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor sessionId must be a string');
    });
    
    test('should reject message without filePath or documentUri', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          action: 'open'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor message must have a filePath');
    });
    
    test('should reject message with non-string filePath', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: 123,
          action: 'open'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor filePath must be a string');
    });
    
    test('should reject message without action', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor message must have an action');
    });
    
    test('should reject message with non-string action', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 123
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor action must be a string');
    });
    
    test('should reject edit message without changes array', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'edit'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor edit message must have an array of changes');
    });
    
    test('should reject edit message with non-array changes', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'edit',
          changes: 'not-an-array'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor edit message must have an array of changes');
    });
    
    test('should reject cursor message without position', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'cursor'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor cursor message must have a valid position object');
    });
    
    test('should reject cursor message with invalid position', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'cursor',
          position: 'not-an-object'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor cursor message must have a valid position object');
    });
    
    test('should reject cursor message with incomplete position', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'cursor',
          position: { line: 10 }
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor cursor message must have a valid position object');
    });
    
    test('should reject selection message without selections array', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'selection'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor selection message must have an array of selections');
    });
    
    test('should reject selection message with non-array selections', () => {
      const message = {
        type: 'editor',
        payload: {
          sessionId: 'session1',
          filePath: '/path/to/file.js',
          action: 'selection',
          selections: 'not-an-array'
        }
      };
      expect(() => validateEditorMessage(message)).toThrow('Editor selection message must have an array of selections');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    test('should handle null message in validateMessage', () => {
      expect(() => validateMessage(null)).toThrow('Message must be a non-null object');
    });
    
    test('should handle non-object message in validateMessage', () => {
      expect(() => validateMessage('not-an-object')).toThrow('Message must be a non-null object');
      // Arrays are objects in JavaScript, so this will pass the object check but fail on the type check
      expect(() => validateMessage([])).toThrow('Message type must be a non-empty string');
    });
  });
});
