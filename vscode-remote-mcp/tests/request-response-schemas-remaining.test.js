/**
 * Tests for request/response schema validation functions - Remaining edge cases
 * Focusing on the final uncovered lines in request-response-validator.js
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

describe('Request/Response Schema Validation - Remaining Edge Cases', () => {
  describe('Connection Request/Response - Remaining Edge Cases', () => {
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
          // Missing status
          message: 'Connection established'
        }
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow('Missing required field: status');
    });
    
    it('should reject a connection response with invalid status value', () => {
      const invalidResponse = {
        type: 'connection_ack',
        id: 'conn-123',
        payload: {
          status: 'invalid_status', // Invalid status value
          message: 'Connection established'
        }
      };
      
      expect(() => validateConnectionResponse(invalidResponse)).toThrow('Invalid status value');
    });
  });
  
  describe('Session Creation Request/Response - Remaining Edge Cases', () => {
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
    
    it('should reject a session creation request with missing workspaceId', () => {
      const invalidRequest = {
        type: 'session_create',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          createdBy: 'client-abc',
          // Missing workspaceId
          sessionName: 'Collaborative Debug Session'
        }
      };
      
      expect(() => validateSessionCreateRequest(invalidRequest)).toThrow('Missing required field: workspaceId');
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
    
    it('should reject a session creation response with missing status', () => {
      const invalidResponse = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          // Missing status
          message: 'Session created successfully'
        }
      };
      
      expect(() => validateSessionCreateResponse(invalidResponse)).toThrow('Missing required field: status');
    });
    
    it('should reject a session creation response with invalid status value', () => {
      const invalidResponse = {
        type: 'session_create_ack',
        id: 'sess-123',
        payload: {
          sessionId: 'session-def',
          status: 'invalid_status', // Invalid status value
          message: 'Session created successfully'
        }
      };
      
      expect(() => validateSessionCreateResponse(invalidResponse)).toThrow('Invalid status value');
    });
  });
  
  describe('Token Refresh Response - Remaining Edge Cases', () => {
    it('should reject a token refresh response with invalid status value', () => {
      const invalidResponse = {
        type: 'token_refresh_ack',
        id: 'refresh-123',
        payload: {
          status: 'invalid_status', // Invalid status value
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      };
      
      expect(() => validateTokenRefreshResponse(invalidResponse)).toThrow('Invalid status value');
    });
  });
});