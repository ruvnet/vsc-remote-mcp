/**
 * Additional tests to achieve 100% coverage for request-response-validator.js
 * Focusing on edge cases and uncovered code paths
 */

const {
  validateConnectionRequest,
  validateConnectionResponse,
  validateSessionCreateRequest,
  validateSessionCreateResponse,
  validateSessionJoinRequest,
  validateSessionJoinResponse,
  validateTokenRefreshRequest,
  validateTokenRefreshResponse,
  validateErrorResponse,
  validateRequestResponsePair
} = require('../src/utils/request-response-validator');

describe('Request/Response Schema Validation - Complete Coverage', () => {
  describe('Connection Request/Response - Edge Cases', () => {
    it('should reject a connection request with non-string clientId', () => {
      const invalidRequest = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 123,  // Number instead of string
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest)).toThrow('clientId must be a non-empty string');
    });
    
    it('should reject a connection request with non-string workspaceId', () => {
      const invalidRequest = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          workspaceId: 123,  // Number instead of string
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest)).toThrow('workspaceId must be a non-empty string');
    });
    
    it('should reject a connection request with invalid capability items', () => {
      const invalidRequest = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', '', 'extensions']  // Empty string in array
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest)).toThrow('Each capability must be a non-empty string');
    });
    
    it('should reject a connection request with non-array capabilities', () => {
      const invalidRequest = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz',
          capabilities: 'terminal,editor,extensions'  // String instead of array
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest)).toThrow('capabilities must be an array');
    });
    
    it('should reject a connection response with non-string status', () => {
      const invalidResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 123,  // Number instead of string
          message: 'Connection established'
        }
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow('status must be a string');
    });
    
    it('should validate a connection response with connectedClients field', () => {
      const validResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established',
          connectedClients: 5  // Valid number
        }
      };
      
      expect(() => validateConnectionResponse(validResponse)).not.toThrow();
    });
    
    it('should reject a connection response with invalid connectedClients type', () => {
      const invalidResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established',
          connectedClients: "5"  // String instead of number
        }
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow('connectedClients must be a number');
    });
    
    it('should validate a connection response with valid serverTime', () => {
      const validResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established',
          serverTime: '2023-01-01T12:00:00Z'  // Valid ISO timestamp
        }
      };
      
      expect(() => validateConnectionResponse(validResponse)).not.toThrow();
    });
    
    it('should reject a connection response with invalid serverTime format', () => {
      const invalidResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established',
          serverTime: '2023-01-01 12:00:00'  // Invalid format
        }
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow('serverTime must be a valid ISO 8601 timestamp');
    });
    
    it('should reject a connection response with invalid serverTime value', () => {
      const invalidResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established',
          serverTime: '2023-99-99T99:99:99Z'  // Invalid date
        }
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow('serverTime must be a valid ISO 8601 timestamp');
    });
  });
  
  describe('Session Creation Request/Response - Edge Cases', () => {
    it('should reject a session creation request with non-string sessionId', () => {
      const invalidRequest = {
        type: 'session_create',
        id: 'sess-123',
        payload: {
          sessionId: 123,  // Number instead of string
          createdBy: 'client-abc',
          workspaceId: 'workspace-xyz',
          sessionName: 'Collaborative Debug Session'
        }
      };
      
      expect(() => validateSessionCreateRequest(invalidRequest)).toThrow('sessionId must be a non-empty string');
    });
    
    it('should reject a session creation request with non-string createdBy', () => {
      const invalidRequest = {
        type: 'session_create',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          createdBy: 123,  // Number instead of string
          workspaceId: 'workspace-xyz',
          sessionName: 'Collaborative Debug Session'
        }
      };
      
      expect(() => validateSessionCreateRequest(invalidRequest)).toThrow('createdBy must be a non-empty string');
    });
    
    it('should reject a session creation request with non-string workspaceId', () => {
      const invalidRequest = {
        type: 'session_create',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          createdBy: 'client-abc',
          workspaceId: 123,  // Number instead of string
          sessionName: 'Collaborative Debug Session'
        }
      };
      
      expect(() => validateSessionCreateRequest(invalidRequest)).toThrow('workspaceId must be a non-empty string');
    });
    
    it('should reject a session creation request with invalid sessionName', () => {
      const invalidRequest = {
        type: 'session_create',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          createdBy: 'client-abc',
          workspaceId: 'workspace-xyz',
          sessionName: ''  // Empty string
        }
      };
      
      expect(() => validateSessionCreateRequest(invalidRequest)).toThrow('sessionName must be a non-empty string when provided');
    });
    
    it('should validate a session creation response with valid createdAt', () => {
      const validResponse = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          status: 'created',
          message: 'Session created successfully',
          createdAt: '2023-01-01T12:00:00Z'  // Valid ISO timestamp
        }
      };
      
      expect(() => validateSessionCreateResponse(validResponse)).not.toThrow();
    });
    
    it('should reject a session creation response with invalid createdAt format', () => {
      const invalidResponse = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          status: 'created',
          message: 'Session created successfully',
          createdAt: '2023-01-01 12:00:00'  // Invalid format
        }
      };
      
      expect(() => validateSessionCreateResponse(invalidResponse)).toThrow('createdAt must be a valid ISO 8601 timestamp');
    });
    
    it('should reject a session creation response with invalid createdAt value', () => {
      const invalidResponse = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          status: 'created',
          message: 'Session created successfully',
          createdAt: '2023-99-99T99:99:99Z'  // Invalid date
        }
      };
      
      expect(() => validateSessionCreateResponse(invalidResponse)).toThrow('createdAt must be a valid ISO 8601 timestamp');
    });
  });
  
  describe('Session Join Request/Response - Edge Cases', () => {
    it('should reject a session join request with missing payload', () => {
      const invalidRequest = {
        type: 'session_join',
        id: 'join-123'
        // Missing payload
      };
      
      expect(() => validateSessionJoinRequest(invalidRequest)).toThrow('Missing payload');
    });
    
    it('should validate a session join response with participants array', () => {
      const validResponse = {
        type: 'session_join_ack',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          status: 'joined',
          message: 'Joined session successfully',
          participants: ['client-abc', 'client-def']  // Valid array
        }
      };
      
      expect(() => validateSessionJoinResponse(validResponse)).not.toThrow();
    });
    
    it('should reject a session join response with invalid participants type', () => {
      const invalidResponse = {
        type: 'session_join_ack',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          status: 'joined',
          message: 'Joined session successfully',
          participants: 'client-abc, client-def'  // String instead of array
        }
      };
      
      expect(() => validateSessionJoinResponse(invalidResponse)).toThrow('participants must be an array');
    });
  });
  
  describe('Token Refresh Request/Response - Edge Cases', () => {
    it('should reject a token refresh request with missing payload', () => {
      const invalidRequest = {
        type: 'token_refresh',
        id: 'refresh-123'
        // Missing payload
      };
      
      expect(() => validateTokenRefreshRequest(invalidRequest)).toThrow('Missing payload');
    });
    
    it('should validate a token refresh response with valid validUntil', () => {
      const validResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          status: 'accepted',
          validUntil: '2023-01-01T12:00:00Z'  // Valid ISO timestamp
        }
      };
      
      expect(() => validateTokenRefreshResponse(validResponse)).not.toThrow();
    });
    
    it('should reject a token refresh response with invalid validUntil format', () => {
      const invalidResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          status: 'accepted',
          validUntil: '2023-01-01 12:00:00'  // Invalid format
        }
      };
      
      expect(() => validateTokenRefreshResponse(invalidResponse)).toThrow('validUntil must be a valid ISO 8601 timestamp');
    });
    
    it('should reject a token refresh response with invalid validUntil value', () => {
      const invalidResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          status: 'accepted',
          validUntil: '2023-99-99T99:99:99Z'  // Invalid date
        }
      };
      
      expect(() => validateTokenRefreshResponse(invalidResponse)).toThrow('validUntil must be a valid ISO 8601 timestamp');
    });
  });
  
  describe('Error Response - Edge Cases', () => {
    it('should reject an error response with non-string code', () => {
      const invalidErrorResponse = {
        type: 'error',
        id: 'err-123',
        payload: {
          code: 123,  // Number instead of string
          message: 'Invalid request format',
          relatedTo: 'connection-request'
        }
      };
      
      expect(() => validateErrorResponse(invalidErrorResponse)).toThrow('code must be a non-empty string');
    });
    
    it('should reject an error response with non-string message', () => {
      const invalidErrorResponse = {
        type: 'error',
        id: 'err-123',
        payload: {
          code: 'INVALID_REQUEST',
          message: 123,  // Number instead of string
          relatedTo: 'connection-request'
        }
      };
      
      expect(() => validateErrorResponse(invalidErrorResponse)).toThrow('message must be a non-empty string');
    });
    
    it('should reject an error response with non-string relatedTo', () => {
      const invalidErrorResponse = {
        type: 'error',
        id: 'err-123',
        payload: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request format',
          relatedTo: 123  // Number instead of string
        }
      };
      
      expect(() => validateErrorResponse(invalidErrorResponse)).toThrow('relatedTo must be a non-empty string');
    });
  });
  
  describe('Request/Response Pair - Edge Cases', () => {
    it('should handle undefined request or response', () => {
      expect(() => validateRequestResponsePair(undefined, {})).toThrow();
      expect(() => validateRequestResponsePair({}, undefined)).toThrow();
    });
    
    it('should validate a matching request/response pair', () => {
      const request = {
        type: 'connection',
        id: 'conn-123',
        payload: {}
      };
      
      const response = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {}
      };
      
      expect(() => validateRequestResponsePair(request, response)).not.toThrow();
    });
    
    it('should validate a request/response pair with error response', () => {
      const request = {
        type: 'connection',
        id: 'conn-123',
        payload: {}
      };
      
      const response = {
        type: 'error',
        id: 'conn-123',
        payload: {}
      };
      
      expect(() => validateRequestResponsePair(request, response)).not.toThrow();
    });
  });
});