/**
 * Tests for request/response schema validation functions - Invalid scenarios
 * Based on the schemas defined in 03-request-response-schemas.md
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

describe('Request/Response Schema Validation - Invalid Scenarios', () => {
  describe('Connection Request/Response - Invalid', () => {
    it('should reject a connection request with missing clientId', () => {
      const invalidRequest = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          // Missing clientId
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest)).toThrow('Missing required field: clientId');
    });
    
    it('should reject a connection request with missing workspaceId', () => {
      const invalidRequest = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          // Missing workspaceId
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest)).toThrow('Missing required field: workspaceId');
    });
    
    it('should reject a connection response with missing status', () => {
      const invalidResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          // Missing status
          message: 'Connection established'
        }
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow('Missing required field: status');
    });
    
    it('should reject a connection response with invalid status', () => {
      const invalidResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'invalid_status', // Invalid status
          message: 'Connection established'
        }
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow('Invalid status value');
    });
  });
  
  describe('Session Creation Request/Response - Invalid', () => {
    it('should reject a session creation request with missing sessionId', () => {
      const invalidRequest = {
        type: 'session_create',
        id: 'sess-123',
        payload: {
          // Missing sessionId
          createdBy: 'client-abc',
          workspaceId: 'workspace-xyz',
          sessionName: 'Collaborative Debug Session'
        }
      };
      
      expect(() => validateSessionCreateRequest(invalidRequest)).toThrow('Missing required field: sessionId');
    });
    
    it('should reject a session creation request with missing createdBy', () => {
      const invalidRequest = {
        type: 'session_create',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          // Missing createdBy
          workspaceId: 'workspace-xyz',
          sessionName: 'Collaborative Debug Session'
        }
      };
      
      expect(() => validateSessionCreateRequest(invalidRequest)).toThrow('Missing required field: createdBy');
    });
    
    it('should reject a session creation response with missing sessionId', () => {
      const invalidResponse = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          // Missing sessionId
          status: 'created',
          message: 'Session created successfully'
        }
      };
      
      expect(() => validateSessionCreateResponse(invalidResponse)).toThrow('Missing required field: sessionId');
    });
    
    it('should reject a session creation response with invalid status', () => {
      const invalidResponse = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          status: 'invalid_status', // Invalid status
          message: 'Session created successfully'
        }
      };
      
      expect(() => validateSessionCreateResponse(invalidResponse)).toThrow('Invalid status value');
    });
  });
  
  describe('Session Join Request/Response - Invalid', () => {
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
    
    it('should reject a session join response with invalid status', () => {
      const invalidResponse = {
        type: 'session_join_ack',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          status: 'invalid_status', // Invalid status
          message: 'Joined session successfully'
        }
      };
      
      expect(() => validateSessionJoinResponse(invalidResponse)).toThrow('Invalid status value');
    });
  });
  
  describe('Token Refresh Request/Response - Invalid', () => {
    it('should reject a token refresh request with missing newToken', () => {
      const invalidRequest = {
        type: 'token_refresh',
        id: 'refresh-123',
        payload: {
          sessionId: 'session-def',
          clientId: 'client-abc'
          // Missing newToken
        }
      };
      
      expect(() => validateTokenRefreshRequest(invalidRequest)).toThrow('Missing required field: newToken');
    });
    
    it('should reject a token refresh request with missing clientId', () => {
      const invalidRequest = {
        type: 'token_refresh',
        id: 'refresh-123',
        payload: {
          sessionId: 'session-def',
          // Missing clientId
          newToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      };
      
      expect(() => validateTokenRefreshRequest(invalidRequest)).toThrow('Missing required field: clientId');
    });
    
    it('should reject a token refresh response with missing status', () => {
      const invalidResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresAt: '2023-12-31T23:59:59Z'
          // Missing status
        }
      };
      
      expect(() => validateTokenRefreshResponse(invalidResponse)).toThrow('Missing required field: status');
    });
    
    it('should reject a token refresh response with invalid status', () => {
      const invalidResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresAt: '2023-12-31T23:59:59Z',
          status: 'invalid_status' // Invalid status
        }
      };
      
      expect(() => validateTokenRefreshResponse(invalidResponse)).toThrow('Invalid status value');
    });
  });
  
  describe('Error Response - Invalid', () => {
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
  
  describe('Request/Response Pair - Invalid', () => {
    it('should reject a mismatched request/response pair with different IDs', () => {
      const request = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      const response = {
        type: 'connection_ack',
        id: 'conn-456', // Different ID
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established'
        }
      };
      
      expect(() => validateRequestResponsePair(request, response)).toThrow('Request and response IDs must match');
    });
    
    it('should reject a mismatched request/response pair with incompatible types', () => {
      const request = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      const response = {
        type: 'session_create_ack', // Incompatible type
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'created',
          message: 'Session created successfully'
        }
      };
      
      expect(() => validateRequestResponsePair(request, response)).toThrow('Response type must match request type');
    });
  });
});