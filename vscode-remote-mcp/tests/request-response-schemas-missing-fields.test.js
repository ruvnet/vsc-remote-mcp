/**
 * Tests for request/response schema validation functions - Missing fields scenarios
 * Focusing on the remaining uncovered lines in request-response-validator.js
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

describe('Request/Response Schema Validation - Missing Fields', () => {
  describe('Connection Request/Response - Missing Fields', () => {
    it('should reject a connection request with missing payload', () => {
      const invalidRequest = {
        type: 'connection',
        id: 'conn-123'
        // Missing payload
      };
      
      expect(() => validateConnectionRequest(invalidRequest)).toThrow('Missing payload');
    });
    
    it('should reject a connection response with missing payload', () => {
      const invalidResponse = {
        type: 'connection_ack',
        id: 'conn-123'
        // Missing payload
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow('Missing payload');
    });
  });
  
  describe('Session Creation Request/Response - Missing Fields', () => {
    it('should reject a session creation request with missing payload', () => {
      const invalidRequest = {
        type: 'session_create',
        id: 'sess-123'
        // Missing payload
      };
      
      expect(() => validateSessionCreateRequest(invalidRequest)).toThrow('Missing payload');
    });
    
    it('should reject a session creation response with missing payload', () => {
      const invalidResponse = {
        type: 'session_create_ack',
        id: 'sess-123'
        // Missing payload
      };
      
      expect(() => validateSessionCreateResponse(invalidResponse)).toThrow('Missing payload');
    });
  });
  
  describe('Session Join Request/Response - Missing Fields', () => {
    it('should reject a session join request with missing sessionId', () => {
      const invalidRequest = {
        type: 'session_join',
        id: 'join-123',
        payload: {
          // Missing sessionId
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz'
        }
      };
      
      expect(() => validateSessionJoinRequest(invalidRequest)).toThrow('Missing required field: sessionId');
    });
    
    it('should reject a session join request with missing clientId', () => {
      const invalidRequest = {
        type: 'session_join',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          // Missing clientId
          workspaceId: 'workspace-xyz'
        }
      };
      
      expect(() => validateSessionJoinRequest(invalidRequest)).toThrow('Missing required field: clientId');
    });
    
    it('should reject a session join request with missing workspaceId', () => {
      const invalidRequest = {
        type: 'session_join',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          clientId: 'client-abc'
          // Missing workspaceId
        }
      };
      
      expect(() => validateSessionJoinRequest(invalidRequest)).toThrow('Missing required field: workspaceId');
    });
    
    it('should reject a session join response with missing payload', () => {
      const invalidResponse = {
        type: 'session_join_ack',
        id: 'join-123'
        // Missing payload
      };
      
      expect(() => validateSessionJoinResponse(invalidResponse)).toThrow('Missing payload');
    });
    
    it('should reject a session join response with missing sessionId', () => {
      const invalidResponse = {
        type: 'session_join_ack',
        id: 'join-123',
        payload: {
          // Missing sessionId
          status: 'joined',
          message: 'Joined session successfully'
        }
      };
      
      expect(() => validateSessionJoinResponse(invalidResponse)).toThrow('Missing required field: sessionId');
    });
    
    it('should reject a session join response with missing status', () => {
      const invalidResponse = {
        type: 'session_join_ack',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          // Missing status
          message: 'Joined session successfully'
        }
      };
      
      expect(() => validateSessionJoinResponse(invalidResponse)).toThrow('Missing required field: status');
    });
  });
  
  describe('Token Refresh Request/Response - Missing Fields', () => {
    it('should reject a token refresh request with missing payload', () => {
      const invalidRequest = {
        type: 'token_refresh',
        id: 'refresh-123'
        // Missing payload
      };
      
      expect(() => validateTokenRefreshRequest(invalidRequest)).toThrow('Missing payload');
    });
    
    it('should reject a token refresh request with missing clientId', () => {
      const invalidRequest = {
        type: 'token_refresh',
        id: 'refresh-123',
        payload: {
          // Missing clientId
          newToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      };
      
      expect(() => validateTokenRefreshRequest(invalidRequest)).toThrow('Missing required field: clientId');
    });
    
    it('should reject a token refresh request with missing newToken', () => {
      const invalidRequest = {
        type: 'token_refresh',
        id: 'refresh-123',
        payload: {
          clientId: 'client-abc'
          // Missing newToken
        }
      };
      
      expect(() => validateTokenRefreshRequest(invalidRequest)).toThrow('Missing required field: newToken');
    });
    
    it('should reject a token refresh response with missing payload', () => {
      const invalidResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123'
        // Missing payload
      };
      
      expect(() => validateTokenRefreshResponse(invalidResponse)).toThrow('Missing payload');
    });
    
    it('should reject a token refresh response with missing status', () => {
      const invalidResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          // Missing status
        }
      };
      
      expect(() => validateTokenRefreshResponse(invalidResponse)).toThrow('Missing required field: status');
    });
  });
  
  describe('Error Response - Missing Fields', () => {
    it('should reject an error response with missing payload', () => {
      const invalidErrorResponse = {
        type: 'error',
        id: 'err-123'
        // Missing payload
      };
      
      expect(() => validateErrorResponse(invalidErrorResponse)).toThrow('Missing payload');
    });
    
    it('should reject an error response with missing code', () => {
      const invalidErrorResponse = {
        type: 'error',
        id: 'err-123',
        payload: {
          // Missing code
          message: 'Invalid request format',
          relatedTo: 'connection-request'
        }
      };
      
      expect(() => validateErrorResponse(invalidErrorResponse)).toThrow('Missing required field: code');
    });
    
    it('should reject an error response with missing message', () => {
      const invalidErrorResponse = {
        type: 'error',
        id: 'err-123',
        payload: {
          code: 'INVALID_REQUEST',
          // Missing message
          relatedTo: 'connection-request'
        }
      };
      
      expect(() => validateErrorResponse(invalidErrorResponse)).toThrow('Missing required field: message');
    });
    
    it('should reject an error response with missing relatedTo', () => {
      const invalidErrorResponse = {
        type: 'error',
        id: 'err-123',
        payload: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request format'
          // Missing relatedTo
        }
      };
      
      expect(() => validateErrorResponse(invalidErrorResponse)).toThrow('Missing required field: relatedTo');
    });
  });
  
  describe('Request/Response Pair - Edge Cases', () => {
    it('should reject a request/response pair with mismatched IDs', () => {
      const request = {
        type: 'connection',
        id: 'conn-123',
        payload: {}
      };
      
      const response = {
        type: 'connection_ack',
        id: 'conn-456', // Different ID
        payload: {}
      };
      
      expect(() => validateRequestResponsePair(request, response)).toThrow('Request and response IDs must match');
    });
    
    it('should reject a request/response pair with incompatible types', () => {
      const request = {
        type: 'connection',
        id: 'conn-123',
        payload: {}
      };
      
      const response = {
        type: 'session_create_ack', // Incompatible type
        id: 'conn-123',
        payload: {}
      };
      
      expect(() => validateRequestResponsePair(request, response)).toThrow('Response type must match request type');
    });
  });
});