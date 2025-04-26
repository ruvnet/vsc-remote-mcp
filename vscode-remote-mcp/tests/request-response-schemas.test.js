/**
 * Tests for request/response schema validation functions
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

describe('Request/Response Schema Validation', () => {
  describe('Connection Request/Response', () => {
    it('should validate a valid connection request', () => {
      const validRequest = {
        type: 'connection',
        id: 'conn-123',
        payload: {
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz',
          capabilities: ['terminal', 'editor', 'extensions']
        }
      };
      
      expect(() => validateConnectionRequest(validRequest)).not.toThrow();
    });
    
    it('should validate a valid connection response', () => {
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
    });
    
    it('should validate a valid connection request/response pair', () => {
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
        id: 'conn-123',
        payload: {
          sessionId: 'session-abc',
          status: 'connected',
          message: 'Connection established'
        }
      };
      
      expect(() => validateRequestResponsePair(request, response)).not.toThrow();
    });
  });
  
  describe('Session Creation Request/Response', () => {
    it('should validate a valid session creation request', () => {
      const validRequest = {
        type: 'session_create',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          createdBy: 'client-abc',
          workspaceId: 'workspace-xyz',
          sessionName: 'Collaborative Debug Session'
        }
      };
      
      expect(() => validateSessionCreateRequest(validRequest)).not.toThrow();
    });
    
    it('should validate a valid session creation response', () => {
      const validResponse = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          status: 'created',
          message: 'Session created successfully'
        }
      };
      
      expect(() => validateSessionCreateResponse(validResponse)).not.toThrow();
    });
    
    it('should validate a valid session creation request/response pair', () => {
      const request = {
        type: 'session_create',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          createdBy: 'client-abc',
          workspaceId: 'workspace-xyz',
          sessionName: 'Collaborative Debug Session'
        }
      };
      
      const response = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          status: 'created',
          message: 'Session created successfully'
        }
      };
      
      expect(() => validateRequestResponsePair(request, response)).not.toThrow();
    });
  });
  
  describe('Session Join Request/Response', () => {
    it('should validate a valid session join request', () => {
      const validRequest = {
        type: 'session_join',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz' // Required field
        }
      };
      
      expect(() => validateSessionJoinRequest(validRequest)).not.toThrow();
    });
    
    it('should validate a valid session join response', () => {
      const validResponse = {
        type: 'session_join_ack',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          status: 'joined',
          message: 'Joined session successfully'
        }
      };
      
      expect(() => validateSessionJoinResponse(validResponse)).not.toThrow();
    });
    
    it('should validate a valid session join request/response pair', () => {
      const request = {
        type: 'session_join',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          clientId: 'client-abc',
          workspaceId: 'workspace-xyz' // Required field
        }
      };
      
      const response = {
        type: 'session_join_ack',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          status: 'joined',
          message: 'Joined session successfully'
        }
      };
      
      expect(() => validateRequestResponsePair(request, response)).not.toThrow();
    });
  });
  
  describe('Token Refresh Request/Response', () => {
    it('should validate a valid token refresh request', () => {
      const validRequest = {
        type: 'token_refresh',
        id: 'refresh-123',
        payload: {
          sessionId: 'session-def',
          clientId: 'client-abc',
          newToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Required field
        }
      };
      
      expect(() => validateTokenRefreshRequest(validRequest)).not.toThrow();
    });
    
    it('should validate a valid token refresh response', () => {
      const validResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresAt: '2023-12-31T23:59:59Z',
          status: 'accepted' // Required field with valid value
        }
      };
      
      expect(() => validateTokenRefreshResponse(validResponse)).not.toThrow();
    });
    
    it('should validate a valid token refresh request/response pair', () => {
      const request = {
        type: 'token_refresh',
        id: 'refresh-123',
        payload: {
          sessionId: 'session-def',
          clientId: 'client-abc',
          newToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Required field
        }
      };
      
      const response = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresAt: '2023-12-31T23:59:59Z',
          status: 'accepted' // Required field with valid value
        }
      };
      
      expect(() => validateRequestResponsePair(request, response)).not.toThrow();
    });
  });
  
  describe('Error Response', () => {
    it('should validate a valid error response', () => {
      const validErrorResponse = {
        type: 'error',
        id: 'err-123',
        payload: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request format',
          relatedTo: 'connection-request'
        }
      };
      
      expect(() => validateErrorResponse(validErrorResponse)).not.toThrow();
    });
    
    it('should validate a valid request/error response pair', () => {
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
          relatedTo: 'connection'
        }
      };
      
      expect(() => validateRequestResponsePair(request, errorResponse)).not.toThrow();
    });
  });
});