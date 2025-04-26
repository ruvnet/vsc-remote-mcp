/**
 * Unit tests for VSCode Remote MCP error handling patterns
 * 
 * These tests verify the error handling functionality according to the
 * patterns defined in the error handling documentation.
 */

const {
  createErrorMessage,
  validateErrorMessage,
  isFatalError,
  isRetryableError,
  getRecoveryAction,
  handleError,
  retryWithBackoff,
  logError,
  ConnectionManager,
  RateLimiter
} = require('../src/utils/error-handler');

describe('Error Message Format', () => {
  describe('createErrorMessage', () => {
    test('should create a valid error message with required fields', () => {
      const error = createErrorMessage('TEST_ERROR', 'Test error message');
      
      expect(error.type).toBe('error');
      expect(error.payload.code).toBe('TEST_ERROR');
      expect(error.payload.message).toBe('Test error message');
      expect(error.payload.fatal).toBe(false);
    });
    
    test('should create an error message with all optional fields', () => {
      const error = createErrorMessage(
        'TEST_ERROR',
        'Test error message',
        'msg-123',
        'test_message',
        true,
        { detail: 'Additional details' },
        'Retry operation'
      );
      
      expect(error.type).toBe('error');
      expect(error.id).toBe('msg-123');
      expect(error.payload.code).toBe('TEST_ERROR');
      expect(error.payload.message).toBe('Test error message');
      expect(error.payload.relatedTo).toBe('test_message');
      expect(error.payload.fatal).toBe(true);
      expect(error.payload.details).toEqual({ detail: 'Additional details' });
      expect(error.payload.recoveryAction).toBe('Retry operation');
    });
  });
  
  describe('validateErrorMessage', () => {
    test('should validate a correctly formatted error message', () => {
      const error = {
        type: 'error',
        payload: {
          code: 'TEST_ERROR',
          message: 'Test error message'
        }
      };
      
      expect(validateErrorMessage(error)).toBe(true);
    });
    
    test('should reject messages with wrong type', () => {
      const error = {
        type: 'not_error',
        payload: {
          code: 'TEST_ERROR',
          message: 'Test error message'
        }
      };
      
      expect(() => validateErrorMessage(error)).toThrow('Error message must have type "error"');
    });
    
    test('should reject messages with missing required payload fields', () => {
      const error = {
        type: 'error',
        payload: {
          message: 'Test error message'
        }
      };
      
      expect(() => validateErrorMessage(error)).toThrow('Error payload must contain a code');
    });
    
    test('should reject messages with invalid payload field types', () => {
      const error = {
        type: 'error',
        payload: {
          code: 123,
          message: 'Test error message'
        }
      };
      
      expect(() => validateErrorMessage(error)).toThrow('Error code must be a string');
    });
  });
});

describe('Error Categories', () => {
  describe('Protocol Errors', () => {
    test('should create valid INVALID_MESSAGE_FORMAT error', () => {
      const error = createErrorMessage(
        'INVALID_MESSAGE_FORMAT',
        'Message does not conform to the expected format',
        'msg-123',
        'unknown',
        false,
        null,
        'Resend with correct format'
      );
      
      expect(error.payload.code).toBe('INVALID_MESSAGE_FORMAT');
      expect(error.payload.recoveryAction).toBe('Resend with correct format');
    });
    
    test('should create valid UNKNOWN_MESSAGE_TYPE error', () => {
      const error = createErrorMessage(
        'UNKNOWN_MESSAGE_TYPE',
        'Message type is not recognized',
        'msg-123',
        'unknown',
        false,
        null,
        'Check message type spelling'
      );
      
      expect(error.payload.code).toBe('UNKNOWN_MESSAGE_TYPE');
      expect(error.payload.recoveryAction).toBe('Check message type spelling');
    });
    
    test('should create valid MISSING_REQUIRED_FIELD error', () => {
      const error = createErrorMessage(
        'MISSING_REQUIRED_FIELD',
        'Required field is missing from the message',
        'msg-123',
        'connection',
        false,
        { field: 'clientId' },
        'Resend with all required fields'
      );
      
      expect(error.payload.code).toBe('MISSING_REQUIRED_FIELD');
      expect(error.payload.details.field).toBe('clientId');
    });
    
    test('should create valid INVALID_FIELD_VALUE error', () => {
      const error = createErrorMessage(
        'INVALID_FIELD_VALUE',
        'A field contains an invalid value',
        'msg-123',
        'connection',
        false,
        { field: 'clientId', value: null },
        'Resend with valid field value'
      );
      
      expect(error.payload.code).toBe('INVALID_FIELD_VALUE');
      expect(error.payload.details.field).toBe('clientId');
    });
  });
  
  describe('Authentication Errors', () => {
    test('should create valid AUTH_FAILED error', () => {
      const error = createErrorMessage(
        'AUTH_FAILED',
        'Authentication token is invalid',
        null,
        'auth',
        true,
        null,
        'Retry with valid token'
      );
      
      expect(error.payload.code).toBe('AUTH_FAILED');
      expect(error.payload.fatal).toBe(true);
    });
    
    test('should create valid AUTH_EXPIRED error', () => {
      const error = createErrorMessage(
        'AUTH_EXPIRED',
        'Authentication token has expired',
        null,
        'auth',
        true,
        null,
        'Refresh token and reconnect'
      );
      
      expect(error.payload.code).toBe('AUTH_EXPIRED');
      expect(error.payload.fatal).toBe(true);
    });
    
    test('should create valid AUTH_REQUIRED error', () => {
      const error = createErrorMessage(
        'AUTH_REQUIRED',
        'Authentication is required but no token was provided',
        null,
        'auth',
        true,
        null,
        'Provide authentication token'
      );
      
      expect(error.payload.code).toBe('AUTH_REQUIRED');
      expect(error.payload.fatal).toBe(true);
    });
    
    test('should create valid AUTH_INSUFFICIENT_PERMISSIONS error', () => {
      const error = createErrorMessage(
        'AUTH_INSUFFICIENT_PERMISSIONS',
        'Token lacks required permissions',
        null,
        'auth',
        true,
        { requiredPermissions: ['read', 'write'] },
        'Request token with appropriate permissions'
      );
      
      expect(error.payload.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
      expect(error.payload.details.requiredPermissions).toEqual(['read', 'write']);
    });
  });
  
  describe('Session Errors', () => {
    test('should create valid SESSION_NOT_FOUND error', () => {
      const error = createErrorMessage(
        'SESSION_NOT_FOUND',
        'Requested session does not exist',
        'join-123',
        'session_join',
        false,
        { sessionId: 'session-456' },
        'Check session ID or create new session'
      );
      
      expect(error.payload.code).toBe('SESSION_NOT_FOUND');
      expect(error.payload.details.sessionId).toBe('session-456');
    });
    
    test('should create valid SESSION_ALREADY_EXISTS error', () => {
      const error = createErrorMessage(
        'SESSION_ALREADY_EXISTS',
        'Attempted to create a session with an existing ID',
        'create-123',
        'session_create',
        false,
        { sessionId: 'session-456' },
        'Use a different session ID'
      );
      
      expect(error.payload.code).toBe('SESSION_ALREADY_EXISTS');
      expect(error.payload.details.sessionId).toBe('session-456');
    });
    
    test('should create valid SESSION_JOIN_REJECTED error', () => {
      const error = createErrorMessage(
        'SESSION_JOIN_REJECTED',
        'Request to join a session was rejected',
        'join-456',
        'session_join',
        false,
        { sessionId: 'session-789', reason: 'Owner rejected request' }
      );
      
      expect(error.payload.code).toBe('SESSION_JOIN_REJECTED');
      expect(error.payload.details.reason).toBe('Owner rejected request');
    });
    
    test('should create valid SESSION_FULL error', () => {
      const error = createErrorMessage(
        'SESSION_FULL',
        'Session has reached maximum number of participants',
        'join-456',
        'session_join',
        false,
        { sessionId: 'session-789', maxParticipants: 5 },
        'Wait for a participant to leave or join another session'
      );
      
      expect(error.payload.code).toBe('SESSION_FULL');
      expect(error.payload.details.maxParticipants).toBe(5);
    });
  });
  
  describe('Resource Errors', () => {
    test('should create valid RESOURCE_NOT_FOUND error', () => {
      const error = createErrorMessage(
        'RESOURCE_NOT_FOUND',
        'Requested resource does not exist',
        'get-123',
        'resource_get',
        false,
        { resourceId: 'file-456', resourceType: 'file' },
        'Check resource identifier'
      );
      
      expect(error.payload.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.payload.details.resourceType).toBe('file');
    });
    
    test('should create valid RESOURCE_LOCKED error', () => {
      const error = createErrorMessage(
        'RESOURCE_LOCKED',
        'Resource is locked by another client',
        'edit-123',
        'resource_edit',
        false,
        { resourceId: 'file-456', lockedBy: 'client-789' },
        'Wait and retry later'
      );
      
      expect(error.payload.code).toBe('RESOURCE_LOCKED');
      expect(error.payload.details.lockedBy).toBe('client-789');
    });
    
    test('should create valid RESOURCE_LIMIT_EXCEEDED error', () => {
      const error = createErrorMessage(
        'RESOURCE_LIMIT_EXCEEDED',
        'Operation would exceed a resource limit',
        'upload-123',
        'resource_upload',
        false,
        { resourceType: 'storage', limit: '100MB', current: '95MB', requested: '10MB' },
        'Free up resources or reduce scope'
      );
      
      expect(error.payload.code).toBe('RESOURCE_LIMIT_EXCEEDED');
      expect(error.payload.details.limit).toBe('100MB');
    });
    
    test('should create valid RESOURCE_CONFLICT error', () => {
      const error = createErrorMessage(
        'RESOURCE_CONFLICT',
        'Conflicting changes to a resource',
        'edit-789',
        'editor',
        false,
        { documentUri: 'file:///workspace/project/src/main.ts', conflictingVersion: 42 },
        'Refresh document and reapply changes'
      );
      
      expect(error.payload.code).toBe('RESOURCE_CONFLICT');
      expect(error.payload.details.conflictingVersion).toBe(42);
    });
  });
  
  describe('Server Errors', () => {
    test('should create valid SERVER_ERROR error', () => {
      const error = createErrorMessage(
        'SERVER_ERROR',
        'Generic server error',
        'req-123',
        'operation',
        false,
        { errorId: 'srv-err-456' },
        'Retry operation'
      );
      
      expect(error.payload.code).toBe('SERVER_ERROR');
      expect(error.payload.details.errorId).toBe('srv-err-456');
    });
    
    test('should create valid SERVER_OVERLOADED error', () => {
      const error = createErrorMessage(
        'SERVER_OVERLOADED',
        'Server is too busy to process the request',
        'req-123',
        'operation',
        false,
        { currentLoad: 95, maxLoad: 100 },
        'Wait and retry with backoff'
      );
      
      expect(error.payload.code).toBe('SERVER_OVERLOADED');
      expect(error.payload.details.currentLoad).toBe(95);
    });
    
    test('should create valid SERVER_MAINTENANCE error', () => {
      const error = createErrorMessage(
        'SERVER_MAINTENANCE',
        'Server is in maintenance mode',
        null,
        null,
        true,
        { estimatedCompletion: '2023-01-01T12:00:00Z' },
        'Reconnect later'
      );
      
      expect(error.payload.code).toBe('SERVER_MAINTENANCE');
      expect(error.payload.fatal).toBe(true);
    });
    
    test('should create valid SERVER_SHUTTING_DOWN error', () => {
      const error = createErrorMessage(
        'SERVER_SHUTTING_DOWN',
        'Server is shutting down',
        null,
        null,
        true,
        { plannedRestart: true, estimatedDowntime: 300 },
        'Reconnect when server is available'
      );
      
      expect(error.payload.code).toBe('SERVER_SHUTTING_DOWN');
      expect(error.payload.details.plannedRestart).toBe(true);
    });
  });
});

describe('Error Handling Strategies', () => {
  describe('Client-Side Error Handling', () => {
    describe('handleError', () => {
      test('should handle fatal errors correctly', () => {
        const disconnectAndNotifyUser = jest.fn();
        const logWarningAndContinue = jest.fn();
        const implementRecoveryAction = jest.fn();
        
        const error = createErrorMessage('AUTH_FAILED', 'Authentication failed', null, null, true);
        
        handleError(error, {
          disconnectAndNotifyUser,
          logWarningAndContinue,
          implementRecoveryAction
        });
        
        expect(disconnectAndNotifyUser).toHaveBeenCalledWith(error);
        expect(logWarningAndContinue).not.toHaveBeenCalled();
        expect(implementRecoveryAction).not.toHaveBeenCalled();
      });
      
      test('should handle non-fatal errors correctly', () => {
        const disconnectAndNotifyUser = jest.fn();
        const logWarningAndContinue = jest.fn();
        const implementRecoveryAction = jest.fn();
        
        const error = createErrorMessage('RESOURCE_LOCKED', 'Resource is locked', null, null, false);
        
        handleError(error, {
          disconnectAndNotifyUser,
          logWarningAndContinue,
          implementRecoveryAction
        });
        
        expect(disconnectAndNotifyUser).not.toHaveBeenCalled();
        expect(logWarningAndContinue).toHaveBeenCalledWith(error);
        expect(implementRecoveryAction).not.toHaveBeenCalled();
      });
      
      test('should implement recovery action when provided', () => {
        const disconnectAndNotifyUser = jest.fn();
        const logWarningAndContinue = jest.fn();
        const implementRecoveryAction = jest.fn();
        
        const error = createErrorMessage(
          'RESOURCE_LOCKED',
          'Resource is locked',
          null,
          null,
          false,
          null,
          'Wait and retry'
        );
        
        handleError(error, {
          disconnectAndNotifyUser,
          logWarningAndContinue,
          implementRecoveryAction
        });
        
        expect(disconnectAndNotifyUser).not.toHaveBeenCalled();
        expect(logWarningAndContinue).toHaveBeenCalledWith(error);
        expect(implementRecoveryAction).toHaveBeenCalledWith('Wait and retry', error);
      });
    });
    
    describe('retryWithBackoff', () => {
      test('should retry operation until success', async () => {
        const operation = jest.fn();
        operation
          .mockRejectedValueOnce({ payload: { fatal: false } })
          .mockRejectedValueOnce({ payload: { fatal: false } })
          .mockResolvedValueOnce('success');
        
        const result = await retryWithBackoff(operation, 5, 10);
        
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(3);
      });
      
      test('should stop retrying after max retries', async () => {
        const operation = jest.fn().mockRejectedValue({ payload: { fatal: false } });
        
        await expect(retryWithBackoff(operation, 3, 10)).rejects.toEqual({ payload: { fatal: false } });
        expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
      });
      
      test('should not retry fatal errors', async () => {
        const operation = jest.fn().mockRejectedValue({ payload: { fatal: true } });
        
        await expect(retryWithBackoff(operation, 3, 10)).rejects.toEqual({ payload: { fatal: true } });
        expect(operation).toHaveBeenCalledTimes(1); // Only the initial attempt
      });
    });
    
    describe('ConnectionManager', () => {
      let connectionManager;
      
      beforeEach(() => {
        connectionManager = new ConnectionManager();
        connectionManager.connect = jest.fn().mockResolvedValue(undefined);
        jest.useFakeTimers();
      });
      
      afterEach(() => {
        jest.useRealTimers();
      });
      
      test('should attempt to reconnect after disconnection', async () => {
        const disconnectionPromise = connectionManager.handleDisconnection('Connection lost');
        
        jest.runAllTimers();
        
        await disconnectionPromise;
        
        expect(connectionManager.connect).toHaveBeenCalledTimes(1);
        expect(connectionManager.reconnectAttempts).toBe(0); // Reset after successful reconnection
      });
      
      test('should handle reconnection with exponential backoff', () => {
        // Just verify the delay calculation is correct
        connectionManager.reconnectAttempts = 0;
        expect(connectionManager.calculateBackoffDelay()).toBe(1000); // 1st attempt: 1000ms
        
        connectionManager.reconnectAttempts = 1;
        expect(connectionManager.calculateBackoffDelay()).toBe(2000); // 2nd attempt: 2000ms
        
        connectionManager.reconnectAttempts = 2;
        expect(connectionManager.calculateBackoffDelay()).toBe(4000); // 3rd attempt: 4000ms
        
        connectionManager.reconnectAttempts = 3;
        expect(connectionManager.calculateBackoffDelay()).toBe(8000); // 4th attempt: 8000ms
      });
      
      test('should reset reconnect attempts after successful connection', async () => {
        connectionManager.reconnectAttempts = 2;
        
        const disconnectionPromise = connectionManager.handleDisconnection('Connection lost');
        
        jest.runAllTimers();
        
        await disconnectionPromise;
        
        expect(connectionManager.reconnectAttempts).toBe(0);
      });
      
      test('should throw error after max reconnection attempts', async () => {
        connectionManager.reconnectAttempts = connectionManager.maxReconnectAttempts;
        
        await expect(connectionManager.handleDisconnection('Connection lost'))
          .rejects
          .toThrow(`Failed to reconnect after ${connectionManager.maxReconnectAttempts} attempts`);
      });
    });
  });
  
  describe('Server-Side Error Handling', () => {
    describe('Input Validation', () => {
      test('should validate message type', () => {
        const sendError = jest.fn();
        const messageHandlers = new Map([['test_type', () => {}]]);
        
        function validateMessage(message) {
          if (!message.type || typeof message.type !== 'string') {
            sendError(message.id, 'INVALID_MESSAGE_FORMAT', 'Message type must be a string');
            return false;
          }
          
          if (!messageHandlers.has(message.type)) {
            sendError(message.id, 'UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${message.type}`);
            return false;
          }
          
          return true;
        }
        
        // Valid message
        expect(validateMessage({ id: '123', type: 'test_type' })).toBe(true);
        
        // Invalid message type
        expect(validateMessage({ id: '123', type: 'unknown_type' })).toBe(false);
        expect(sendError).toHaveBeenCalledWith('123', 'UNKNOWN_MESSAGE_TYPE', 'Unknown message type: unknown_type');
      });
    });
    
    describe('RateLimiter', () => {
      let rateLimiter;
      
      beforeEach(() => {
        rateLimiter = new RateLimiter();
        jest.useFakeTimers();
      });
      
      afterEach(() => {
        jest.useRealTimers();
      });
      
      test('should limit requests per client', () => {
        rateLimiter.maxRequestsPerMinute = 2;
        
        expect(rateLimiter.isRateLimited('client1')).toBe(false); // 1st request
        expect(rateLimiter.isRateLimited('client1')).toBe(false); // 2nd request
        expect(rateLimiter.isRateLimited('client1')).toBe(true);  // 3rd request (limited)
        
        // Different client should not be affected
        expect(rateLimiter.isRateLimited('client2')).toBe(false);
      });
      
      test('should reset rate limits after interval', () => {
        rateLimiter.maxRequestsPerMinute = 1;
        rateLimiter.startResetInterval();
        
        expect(rateLimiter.isRateLimited('client1')).toBe(false); // 1st request
        expect(rateLimiter.isRateLimited('client1')).toBe(true);  // 2nd request (limited)
        
        // After 1 minute, limits should reset
        jest.advanceTimersByTime(60000);
        
        expect(rateLimiter.isRateLimited('client1')).toBe(false); // Should be allowed again
      });
    });
  });
});

describe('Error Logging and Monitoring', () => {
  describe('logError', () => {
    let consoleErrorSpy;
    
    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    
    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });
    
    test('should log error to console', () => {
      const error = createErrorMessage('TEST_ERROR', 'Test error message');
      
      logError(error);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
      expect(loggedData.errorCode).toBe('TEST_ERROR');
      expect(loggedData.message).toBe('Test error message');
    });
    
    test('should include context in log entry', () => {
      const error = createErrorMessage('TEST_ERROR', 'Test error message');
      const context = { userId: '123', action: 'test_action' };
      
      logError(error, context);
      
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
      expect(loggedData.context).toEqual(context);
    });
    
    test('should send to logging service when available', () => {
      const error = createErrorMessage('TEST_ERROR', 'Test error message');
      const loggingService = { logError: jest.fn() };
      
      logError(error, {}, loggingService);
      
      expect(loggingService.logError).toHaveBeenCalled();
      const logEntry = loggingService.logError.mock.calls[0][0];
      expect(logEntry.errorCode).toBe('TEST_ERROR');
    });
  });
});