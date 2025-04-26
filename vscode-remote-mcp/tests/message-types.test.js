/**
 * Unit tests for VSCode Remote MCP message types and payloads validation
 */

// Import the validation functions (these will be implemented later)
const { 
  validateMessageType,
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
} = require('../src/utils/message-type-validator');

describe('Message Type Validator', () => {
  
  // Test for message type validation
  describe('validateMessageType', () => {
    test('should accept valid message types', () => {
      // Core message types from the specification
      expect(validateMessageType('connection')).toBe(true);
      expect(validateMessageType('connection_ack')).toBe(true);
      expect(validateMessageType('disconnection')).toBe(true);
      expect(validateMessageType('session_create')).toBe(true);
      expect(validateMessageType('session_create_ack')).toBe(true);
      expect(validateMessageType('session_join')).toBe(true);
      expect(validateMessageType('session_join_ack')).toBe(true);
      expect(validateMessageType('session_leave')).toBe(true);
      expect(validateMessageType('terminal')).toBe(true);
      expect(validateMessageType('editor')).toBe(true);
      expect(validateMessageType('extension')).toBe(true);
      expect(validateMessageType('heartbeat')).toBe(true);
      expect(validateMessageType('error')).toBe(true);
      expect(validateMessageType('server_shutdown')).toBe(true);
      expect(validateMessageType('token_refresh')).toBe(true);
      expect(validateMessageType('token_refresh_ack')).toBe(true);
    });

    test('should reject unknown message types', () => {
      expect(() => validateMessageType('unknown_type')).toThrow('Unknown message type: unknown_type');
      expect(() => validateMessageType('invalid')).toThrow('Unknown message type: invalid');
    });

    test('should reject empty or non-string message types', () => {
      expect(() => validateMessageType('')).toThrow('Message type must be a non-empty string');
      expect(() => validateMessageType(null)).toThrow('Message type must be a non-empty string');
      expect(() => validateMessageType(undefined)).toThrow('Message type must be a non-empty string');
      expect(() => validateMessageType(123)).toThrow('Message type must be a non-empty string');
      expect(() => validateMessageType({})).toThrow('Message type must be a non-empty string');
    });
  });

  // Connection Messages
  describe('Connection Messages', () => {
    // connection
    describe('validateConnectionPayload', () => {
      test('should accept valid connection payloads', () => {
        const validPayload = {
          clientId: 'client-123',
          workspaceId: 'workspace-abc',
          capabilities: ['terminal', 'editor']
        };
        
        expect(validateConnectionPayload(validPayload)).toBe(true);
        
        // With optional fields
        const payloadWithOptionals = {
          clientId: 'client-123',
          workspaceId: 'workspace-abc',
          capabilities: ['terminal', 'editor'],
          clientVersion: '1.0.0',
          authToken: 'hashed-token-xyz'
        };
        
        expect(validateConnectionPayload(payloadWithOptionals)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateConnectionPayload({
          workspaceId: 'workspace-abc',
          capabilities: ['terminal', 'editor']
        })).toThrow('Missing required field: clientId');
      });
      
      test('should reject payloads with invalid field types', () => {
        expect(() => validateConnectionPayload({
          clientId: 123,
          workspaceId: 'workspace-abc',
          capabilities: ['terminal', 'editor']
        })).toThrow('clientId must be a string');
      });
    });
    
    // connection_ack
    describe('validateConnectionAckPayload', () => {
      test('should accept valid connection_ack payloads', () => {
        const validPayload = {
          status: 'connected',
          serverTime: '2025-04-04T22:30:00Z',
          connectedClients: 5
        };
        
        expect(validateConnectionAckPayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateConnectionAckPayload({
          serverTime: '2025-04-04T22:30:00Z',
          connectedClients: 5
        })).toThrow('Missing required field: status');
      });
      
      test('should reject payloads with invalid field types', () => {
        expect(() => validateConnectionAckPayload({
          status: 123,
          serverTime: '2025-04-04T22:30:00Z',
          connectedClients: 5
        })).toThrow('status must be a string');
      });
    });
    
    // disconnection
    describe('validateDisconnectionPayload', () => {
      test('should accept valid disconnection payloads', () => {
        const validPayload = {
          clientId: 'client-123'
        };
        
        expect(validateDisconnectionPayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateDisconnectionPayload({
          reason: 'User initiated disconnect'
        })).toThrow('Missing required field: clientId');
      });
      
      test('should reject payloads with invalid field types', () => {
        expect(() => validateDisconnectionPayload({
          clientId: 123
        })).toThrow('clientId must be a string');
      });
    });
  });

  // Session Management Messages
  describe('Session Management Messages', () => {
    // session_create
    describe('validateSessionCreatePayload', () => {
      test('should accept valid session_create payloads', () => {
        const validPayload = {
          sessionId: 'session-123',
          createdBy: 'client-abc',
          workspaceId: 'workspace-xyz'
        };
        
        expect(validateSessionCreatePayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateSessionCreatePayload({
          createdBy: 'client-abc',
          workspaceId: 'workspace-xyz'
        })).toThrow('Missing required field: sessionId');
      });
      
      test('should reject payloads with invalid field types', () => {
        expect(() => validateSessionCreatePayload({
          sessionId: 123,
          createdBy: 'client-abc',
          workspaceId: 'workspace-xyz'
        })).toThrow('sessionId must be a string');
      });
    });
    
    // session_join
    describe('validateSessionJoinPayload', () => {
      test('should accept valid session_join payloads', () => {
        const validPayload = {
          sessionId: 'session-123',
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz'
        };
        
        expect(validateSessionJoinPayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateSessionJoinPayload({
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz'
        })).toThrow('Missing required field: sessionId');
      });
    });
  });

  // Collaboration Messages
  describe('Collaboration Messages', () => {
    // terminal
    describe('validateTerminalPayload', () => {
      test('should accept valid terminal payloads', () => {
        const validPayload = {
          sessionId: 'session-123',
          data: 'ls -la',
          sourceClientId: 'client-abc'
        };
        
        expect(validateTerminalPayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateTerminalPayload({
          data: 'ls -la',
          sourceClientId: 'client-abc'
        })).toThrow('Missing required field: sessionId');
      });
    });
    
    // editor
    describe('validateEditorPayload', () => {
      test('should accept valid editor payloads', () => {
        const validPayload = {
          sessionId: 'session-123',
          documentUri: 'file:///workspace/project/src/main.js',
          sourceClientId: 'client-abc'
        };
        
        expect(validateEditorPayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateEditorPayload({
          documentUri: 'file:///workspace/project/src/main.js',
          sourceClientId: 'client-abc'
        })).toThrow('Missing required field: sessionId');
      });
    });
    
    // extension
    describe('validateExtensionPayload', () => {
      test('should accept valid extension payloads', () => {
        const validPayload = {
          extensionId: 'vscode.git',
          state: { enabled: true },
          sourceClientId: 'client-abc'
        };
        
        expect(validateExtensionPayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateExtensionPayload({
          state: { enabled: true },
          sourceClientId: 'client-abc'
        })).toThrow('Missing required field: extensionId');
      });
    });
  });

  // System Messages
  describe('System Messages', () => {
    // heartbeat
    describe('validateHeartbeatPayload', () => {
      test('should accept valid heartbeat payloads', () => {
        const validPayload = {
          timestamp: '2025-04-04T22:30:00Z'
        };
        
        expect(validateHeartbeatPayload(validPayload)).toBe(true);
        
        // With optional fields
        const payloadWithOptionals = {
          clientId: 'client-123',
          timestamp: '2025-04-04T22:30:00Z'
        };
        
        expect(validateHeartbeatPayload(payloadWithOptionals)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateHeartbeatPayload({
          clientId: 'client-123'
        })).toThrow('Missing required field: timestamp');
      });
    });
    
    // error
    describe('validateErrorPayload', () => {
      test('should accept valid error payloads', () => {
        const validPayload = {
          code: 'AUTH_FAILED',
          message: 'Authentication failed'
        };
        
        expect(validateErrorPayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateErrorPayload({
          message: 'Authentication failed'
        })).toThrow('Missing required field: code');
      });
    });
    
    // server_shutdown
    describe('validateServerShutdownPayload', () => {
      test('should accept valid server_shutdown payloads', () => {
        const validPayload = {
          reason: 'Maintenance',
          time: '2025-04-04T22:30:00Z'
        };
        
        expect(validateServerShutdownPayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateServerShutdownPayload({
          time: '2025-04-04T22:30:00Z'
        })).toThrow('Missing required field: reason');
      });
    });
  });

  // Authentication Messages
  describe('Authentication Messages', () => {
    // token_refresh
    describe('validateTokenRefreshPayload', () => {
      test('should accept valid token_refresh payloads', () => {
        const validPayload = {
          clientId: 'client-123',
          newToken: 'new-hashed-token-xyz'
        };
        
        expect(validateTokenRefreshPayload(validPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateTokenRefreshPayload({
          newToken: 'new-hashed-token-xyz'
        })).toThrow('Missing required field: clientId');
      });
    });
    
    // token_refresh_ack
    describe('validateTokenRefreshAckPayload', () => {
      test('should accept valid token_refresh_ack payloads', () => {
        const validPayload = {
          status: 'accepted'
        };
        
        expect(validateTokenRefreshAckPayload(validPayload)).toBe(true);
        
        // With optional fields
        const payloadWithOptionals = {
          status: 'accepted',
          validUntil: '2025-04-05T22:30:00Z'
        };
        
        expect(validateTokenRefreshAckPayload(payloadWithOptionals)).toBe(true);
        
        // With rejected status
        const rejectedPayload = {
          status: 'rejected'
        };
        
        expect(validateTokenRefreshAckPayload(rejectedPayload)).toBe(true);
      });
      
      test('should reject payloads with missing required fields', () => {
        expect(() => validateTokenRefreshAckPayload({})).toThrow('Missing required field: status');
      });
      
      test('should reject payloads with invalid field values', () => {
        expect(() => validateTokenRefreshAckPayload({
          status: 'invalid-status'
        })).toThrow('status must be either "accepted" or "rejected"');
      });
    });
  });
});
