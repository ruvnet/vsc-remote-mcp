/**
 * Final test to achieve 100% coverage for request-response-validator.js
 */

const { validateSessionJoinResponse } = require('../src/utils/request-response-validator');

describe('Request/Response Schema Validation - Final Coverage', () => {
  describe('Session Join Response - Final Edge Case', () => {
    it('should reject a session join response with invalid status value', () => {
      const invalidResponse = {
        type: 'session_join_ack',
        id: 'join-123',
        payload: {
          sessionId: 'session-def',
          status: 'invalid_status', // Invalid status value
          message: 'Joined session successfully'
        }
      };
      
      expect(() => validateSessionJoinResponse(invalidResponse)).toThrow('Invalid status value');
    });
  });
});