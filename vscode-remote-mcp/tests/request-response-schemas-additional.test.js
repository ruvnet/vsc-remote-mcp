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

describe('Additional Schema Validation Tests', () => {
  describe('Connection Request/Response Validation', () => {
    it('should reject a connection request with missing required fields', () => {
      const invalidRequest = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          // Missing clientId
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest)).toThrow();
      
      const invalidRequest2 = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          // Missing workspaceId
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest2)).toThrow();
    });
    
    it('should reject a connection request with invalid field types', () => {
      const invalidRequest = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 123, // Should be a string
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest)).toThrow();
      
      const invalidRequest2 = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz',
          capabilities: "not-an-array" // Should be an array
        }
      };
      
      expect(() => validateConnectionRequest(invalidRequest2)).toThrow();
    });
    
    it('should validate connection response structure', () => {
      // Valid response should pass validation
      const validResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established'
        }
      };
      
      expect(() => validateConnectionResponse(validResponse)).not.toThrow();
      
      // Response with missing payload should fail
      const invalidResponse = {
        type: 'connection_ack',
        id: 'conn-123'
        // Missing payload
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow();
    });
  });

  describe('Session Creation Request/Response Validation', () => {
    it('should reject a session creation request with missing required fields', () => {
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
      
      expect(() => validateSessionCreateRequest(invalidRequest)).toThrow();
    });
    
    it('should reject a session creation response with invalid field types', () => {
      const invalidResponse = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          status: 123, // Should be a string
          message: 'Session created successfully'
        }
      };
      
      expect(() => validateSessionCreateResponse(invalidResponse)).toThrow();
    });
  });

  describe('Session Join Request/Response Validation', () => {
    it('should reject a session join request with missing required fields', () => {
      const invalidRequest = {
        type: 'session_join',
        id: 'join-123',
        payload: {
          // Missing sessionId
          clientId: 'client-abc'
        }
      };
      
      expect(() => validateSessionJoinRequest(invalidRequest)).toThrow();
    });
    
    it('should reject a session join response with invalid field types', () => {
      const invalidResponse = {
        type: 'session_join_ack',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          status: true, // Should be a string
          message: 'Joined session successfully'
        }
      };
      
      expect(() => validateSessionJoinResponse(invalidResponse)).toThrow();
    });
  });

  describe('Token Refresh Request/Response Validation', () => {
    it('should reject a token refresh request with missing required fields', () => {
      const invalidRequest = {
        type: 'token_refresh',
        id: 'refresh-123',
        payload: {
          // Missing sessionId
          clientId: 'client-abc'
        }
      };
      
      expect(() => validateTokenRefreshRequest(invalidRequest)).toThrow();
    });
    
    it('should reject a token refresh response with invalid field types', () => {
      const invalidResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          token: 123, // Should be a string
          expiresAt: '2023-12-31T23:59:59Z'
        }
      };
      
      expect(() => validateTokenRefreshResponse(invalidResponse)).toThrow();
    });
  });

  describe('Error Response Validation', () => {
    it('should reject an error response with missing required fields', () => {
      const invalidResponse = {
        type: 'error',
        id: 'err-123',
        payload: {
          // Missing code
          message: 'An error occurred'
        }
      };
      
      expect(() => validateErrorResponse(invalidResponse)).toThrow();
      
      const invalidResponse2 = {
        type: 'error',
        id: 'err-123',
        payload: {
          code: 'INVALID_REQUEST',
          // Missing message
        }
      };
      
      expect(() => validateErrorResponse(invalidResponse2)).toThrow();
    });
    
    it('should reject an error response with invalid field types', () => {
      const invalidResponse = {
        type: 'error',
        id: 'err-123',
        payload: {
          code: 123, // Should be a string
          message: 'An error occurred'
        }
      };
      
      expect(() => validateErrorResponse(invalidResponse)).toThrow();
    });
  });

  describe('Request/Response Pair Validation Edge Cases', () => {
    it('should reject a pair with null request', () => {
      const response = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established'
        }
      };
      
      expect(() => validateRequestResponsePair(null, response)).toThrow();
    });
    
    it('should reject a pair with null response', () => {
      const request = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      expect(() => validateRequestResponsePair(request, null)).toThrow();
    });
    
    it('should reject a pair with mismatched types', () => {
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
        type: 'session_create_ack', // Wrong type for the request
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established'
        }
      };
      
      expect(() => validateRequestResponsePair(request, response)).toThrow();
    });
  });
  
  describe('Additional Edge Cases', () => {
    it('should validate message structure', () => {
      // Test with missing type
      const invalidMessage = {
        id: 'conn-123',
        payload: {}
      };
      
      expect(() => validateConnectionRequest(invalidMessage)).toThrow();
      
      // Test with missing id
      const invalidMessage2 = {
        type: 'connection',
        payload: {}
      };
      
      expect(() => validateConnectionRequest(invalidMessage2)).toThrow();
      
      // Test with missing payload
      const invalidMessage3 = {
        type: 'connection',
        id: 'conn-123'
      };
      
      expect(() => validateConnectionRequest(invalidMessage3)).toThrow();
    });
    
    it('should handle error responses correctly', () => {
      // Valid error response
      const errorResponse = {
        type: 'error',
        id: 'conn-123',
        payload: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request format',
          relatedTo: 'connection-request' // Required field
        }
      };
      
      expect(() => validateErrorResponse(errorResponse)).not.toThrow();
      
      // Error response with additional fields should still be valid
      const errorResponseWithExtra = {
        type: 'error',
        id: 'conn-123',
        payload: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request format',
          relatedTo: 'connection-request', // Required field
          details: 'Missing required fields',
          timestamp: '2023-01-01T00:00:00Z'
        }
      };
      
      expect(() => validateErrorResponse(errorResponseWithExtra)).not.toThrow();
    });
    
    it('should validate request/response pairs with error responses', () => {
      const request = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      const errorResponse = {
        type: 'error',
        id: 'conn-123',
        payload: {
          code: 'SERVER_ERROR',
          message: 'Internal server error',
          relatedTo: 'connection' // Required field
        }
      };
      
      // Error responses should be valid for any request type
      expect(() => validateRequestResponsePair(request, errorResponse)).not.toThrow();
    });
  });
});
