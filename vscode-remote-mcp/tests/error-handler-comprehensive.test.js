/**
 * Comprehensive tests for error-handler.js
 * 
 * This test suite provides complete coverage for the error-handler module,
 * focusing on previously untested or under-tested functionality.
 */

const {
  ErrorCategory,
  ErrorCode,
  DefaultRecoveryActions,
  createErrorMessage,
  validateErrorMessage,
  isFatalError,
  getErrorCategory,
  isRetryableError,
  getRecoveryAction,
  handleError,
  retryWithBackoff,
  logError,
  createErrorTracker,
  ConnectionManager,
  RateLimiter,
  ErrorRecoveryManager
} = require('../src/utils/error-handler');

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Error Categories and Codes', () => {
  test('should have all expected error categories', () => {
    expect(ErrorCategory).toEqual({
      PROTOCOL: 'PROTOCOL',
      AUTHENTICATION: 'AUTH',
      SESSION: 'SESSION',
      RESOURCE: 'RESOURCE',
      SERVER: 'SERVER',
      CLIENT: 'CLIENT'
    });
  });

  test('should have error codes properly categorized', () => {
    // Check a sample from each category
    expect(ErrorCode.INVALID_MESSAGE_FORMAT.category).toBe(ErrorCategory.PROTOCOL);
    expect(ErrorCode.AUTH_FAILED.category).toBe(ErrorCategory.AUTHENTICATION);
    expect(ErrorCode.SESSION_NOT_FOUND.category).toBe(ErrorCategory.SESSION);
    expect(ErrorCode.RESOURCE_LOCKED.category).toBe(ErrorCategory.RESOURCE);
    expect(ErrorCode.SERVER_ERROR.category).toBe(ErrorCategory.SERVER);
    expect(ErrorCode.CLIENT_TIMEOUT.category).toBe(ErrorCategory.CLIENT);
  });

  test('should have correct retryable property for error codes', () => {
    // Protocol errors should be retryable
    expect(ErrorCode.INVALID_MESSAGE_FORMAT.retryable).toBe(true);
    
    // Authentication errors should not be retryable
    expect(ErrorCode.AUTH_FAILED.retryable).toBe(false);
    
    // Some session errors should be retryable, others not
    expect(ErrorCode.SESSION_NOT_FOUND.retryable).toBe(true);
    expect(ErrorCode.SESSION_ALREADY_EXISTS.retryable).toBe(false);
  });

  test('should have default recovery actions for error codes', () => {
    // Check a sample of recovery actions
    expect(DefaultRecoveryActions.INVALID_MESSAGE_FORMAT).toBe('Resend with correct format');
    expect(DefaultRecoveryActions.AUTH_EXPIRED).toBe('Refresh token and reconnect');
    expect(DefaultRecoveryActions.SESSION_NOT_FOUND).toBe('Check session ID or create new session');
    
    // Ensure all error codes have a recovery action
    Object.keys(ErrorCode).forEach(code => {
      expect(DefaultRecoveryActions[code]).toBeDefined();
    });
  });
});

describe('Error Message Creation and Validation', () => {
  describe('createErrorMessage edge cases', () => {
    test('should throw error when code is empty', () => {
      expect(() => createErrorMessage('', 'Test message')).toThrow('Error code must be a non-empty string');
    });
    
    test('should throw error when message is empty', () => {
      expect(() => createErrorMessage('TEST_ERROR', '')).toThrow('Error message must be a non-empty string');
    });
    
    test('should throw error when id is provided but invalid', () => {
      expect(() => createErrorMessage('TEST_ERROR', 'Test message', '')).toThrow('Message ID must be a non-empty string when provided');
    });
    
    test('should throw error when details is provided but not an object', () => {
      expect(() => createErrorMessage('TEST_ERROR', 'Test message', 'msg-123', 'related-123', false, 'not an object')).toThrow('Error details must be an object when provided');
    });
  });
  
  describe('validateErrorMessage edge cases', () => {
    test('should throw error when message is not an object', () => {
      expect(() => validateErrorMessage('not an object')).toThrow('Error message must be an object');
    });
    
    test('should throw error when payload is missing', () => {
      expect(() => validateErrorMessage({ type: 'error' })).toThrow('Error message must contain a payload object');
    });
    
    test('should throw error when code is missing', () => {
      expect(() => validateErrorMessage({ type: 'error', payload: { message: 'Test message' } })).toThrow('Error payload must contain a code');
    });
    
    test('should throw error when category is invalid', () => {
      expect(() => validateErrorMessage({ 
        type: 'error', 
        payload: { 
          code: 'TEST_ERROR', 
          message: 'Test message',
          category: 'INVALID_CATEGORY'
        } 
      })).toThrow('Error category must be a valid category');
    });
  });
});

describe('Error Utility Functions', () => {
  describe('isFatalError', () => {
    test('should return true for fatal errors', () => {
      const error = createErrorMessage('TEST_ERROR', 'Test message', null, null, true);
      expect(isFatalError(error)).toBe(true);
    });
    
    test('should return false for non-fatal errors', () => {
      const error = createErrorMessage('TEST_ERROR', 'Test message');
      expect(isFatalError(error)).toBe(false);
    });
    
    test('should handle null or undefined input', () => {
      expect(isFatalError(null)).toBe(false);
      expect(isFatalError(undefined)).toBe(false);
    });
  });
  
  describe('getErrorCategory', () => {
    test('should return the correct category for categorized errors', () => {
      const error = createErrorMessage('INVALID_MESSAGE_FORMAT', 'Test message');
      expect(getErrorCategory(error)).toBe('PROTOCOL');
    });
    
    test('should return null for uncategorized errors', () => {
      const error = createErrorMessage('UNKNOWN_ERROR', 'Test message');
      expect(getErrorCategory(error)).toBe(null);
    });
  });
  
  describe('isRetryableError', () => {
    test('should return true for retryable errors', () => {
      const error = createErrorMessage('INVALID_MESSAGE_FORMAT', 'Test message');
      expect(isRetryableError(error)).toBe(true);
    });
    
    test('should return false for non-retryable errors', () => {
      const error = createErrorMessage('AUTH_FAILED', 'Test message');
      expect(isRetryableError(error)).toBe(false);
    });
    
    test('should return false for fatal errors regardless of code', () => {
      const error = createErrorMessage('INVALID_MESSAGE_FORMAT', 'Test message', null, null, true);
      expect(isRetryableError(error)).toBe(false);
    });
  });
  
  describe('getRecoveryAction', () => {
    test('should return explicit recovery action when provided', () => {
      const error = createErrorMessage(
        'TEST_ERROR', 
        'Test message', 
        null, 
        null, 
        false, 
        null, 
        'Custom recovery action'
      );
      expect(getRecoveryAction(error)).toBe('Custom recovery action');
    });
    
    test('should return default recovery action when includeDefaults is true', () => {
      const error = createErrorMessage('INVALID_MESSAGE_FORMAT', 'Test message');
      expect(getRecoveryAction(error, true)).toBe('Resend with correct format');
    });
  });
});

describe('Error Tracking', () => {
  describe('createErrorTracker', () => {
    test('should create error tracker with default options', () => {
      const tracker = createErrorTracker();
      expect(tracker).toHaveProperty('trackError');
      expect(tracker).toHaveProperty('getErrorStats');
      expect(tracker).toHaveProperty('clearHistory');
    });
    
    test('should track errors correctly', () => {
      const tracker = createErrorTracker();
      const error = createErrorMessage('TEST_ERROR', 'Test message');
      
      tracker.trackError(error);
      
      const stats = tracker.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorCounts.TEST_ERROR).toBe(1);
    });
    
    test('should detect threshold exceeded', () => {
      const tracker = createErrorTracker({ errorThreshold: 3 });
      const error = createErrorMessage('TEST_ERROR', 'Test message');
      
      // First two errors should not exceed threshold
      expect(tracker.trackError(error)).toBe(false);
      expect(tracker.trackError(error)).toBe(false);
      
      // Third error should exceed threshold
      expect(tracker.trackError(error)).toBe(true);
    });
    
    test('should expire old errors based on time window', () => {
      jest.useFakeTimers();
      
      const tracker = createErrorTracker({ timeWindowMs: 1000 }); // 1 second window
      const error = createErrorMessage('TEST_ERROR', 'Test message');
      
      // Track an error
      tracker.trackError(error);
      
      // Advance time beyond the window
      jest.advanceTimersByTime(1500);
      
      // Track another error and check if the old one was removed
      tracker.trackError(error);
      
      const stats = tracker.getErrorStats();
      expect(stats.totalErrors).toBe(1); // Only the new error should remain
      
      jest.useRealTimers();
    });
  });
});

describe('Rate Limiting', () => {
  describe('RateLimiter', () => {
    let rateLimiter;
    
    beforeEach(() => {
      rateLimiter = new RateLimiter();
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      if (rateLimiter.resetInterval) {
        rateLimiter.stopResetInterval();
      }
      jest.useRealTimers();
    });
    
    test('should limit requests correctly', () => {
      rateLimiter.maxRequestsPerMinute = 3;
      
      // First three requests should be allowed
      expect(rateLimiter.isRateLimited('client1')).toBe(false);
      expect(rateLimiter.isRateLimited('client1')).toBe(false);
      expect(rateLimiter.isRateLimited('client1')).toBe(false);
      
      // Fourth request should be rate limited
      expect(rateLimiter.isRateLimited('client1')).toBe(true);
    });
    
    test('should track clients separately', () => {
      rateLimiter.maxRequestsPerMinute = 2;
      
      // Client 1 uses up their limit
      expect(rateLimiter.isRateLimited('client1')).toBe(false);
      expect(rateLimiter.isRateLimited('client1')).toBe(false);
      expect(rateLimiter.isRateLimited('client1')).toBe(true);
      
      // Client 2 should still have their full limit
      expect(rateLimiter.isRateLimited('client2')).toBe(false);
    });
    
    test('should reset limits after interval', () => {
      rateLimiter.maxRequestsPerMinute = 2;
      rateLimiter.startResetInterval();
      
      // Use up the limit
      expect(rateLimiter.isRateLimited('client1')).toBe(false);
      expect(rateLimiter.isRateLimited('client1')).toBe(false);
      expect(rateLimiter.isRateLimited('client1')).toBe(true);
      
      // Advance time to trigger reset
      jest.advanceTimersByTime(60000);
      
      // Limit should be reset
      expect(rateLimiter.isRateLimited('client1')).toBe(false);
    });
  });
});

describe('Error Recovery Manager', () => {
  describe('ErrorRecoveryManager', () => {
    test('should create recovery manager with default options', () => {
      const manager = new ErrorRecoveryManager();
      expect(manager).toHaveProperty('strategies');
      expect(manager).toHaveProperty('defaultStrategy');
    });
    
    test('should register new strategy', () => {
      const manager = new ErrorRecoveryManager();
      const customStrategy = jest.fn();
      
      manager.registerStrategy('TEST_ERROR', customStrategy);
      
      expect(manager.strategies.TEST_ERROR).toBe(customStrategy);
    });
    
    test('should use specific strategy when available', async () => {
      const specificStrategy = jest.fn().mockResolvedValue(undefined);
      const defaultStrategy = jest.fn().mockResolvedValue(undefined);
      
      const manager = new ErrorRecoveryManager({
        strategies: {
          'TEST_ERROR': specificStrategy
        },
        defaultStrategy
      });
      
      const error = createErrorMessage('TEST_ERROR', 'Test message');
      
      await manager.recover(error);
      
      expect(specificStrategy).toHaveBeenCalledWith(error);
      expect(defaultStrategy).not.toHaveBeenCalled();
    });
    
    test('should throw error for invalid error object', async () => {
      const manager = new ErrorRecoveryManager();
      
      await expect(manager.recover(null)).rejects.toThrow('Invalid error object');
    });
  });
});

describe('Connection Manager', () => {
  describe('ConnectionManager', () => {
    let connectionManager;
    
    beforeEach(() => {
      connectionManager = new ConnectionManager();
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    test('should calculate backoff delay correctly', () => {
      connectionManager.reconnectAttempts = 0;
      expect(connectionManager.calculateBackoffDelay()).toBe(1000); // 1000 * 2^0
      
      connectionManager.reconnectAttempts = 1;
      expect(connectionManager.calculateBackoffDelay()).toBe(2000); // 1000 * 2^1
      
      connectionManager.reconnectAttempts = 2;
      expect(connectionManager.calculateBackoffDelay()).toBe(4000); // 1000 * 2^2
    });
    
    test('should throw error after max reconnect attempts', async () => {
      connectionManager.reconnectAttempts = connectionManager.maxReconnectAttempts;
      
      await expect(connectionManager.handleDisconnection('Test disconnection'))
        .rejects
        .toThrow(`Failed to reconnect after ${connectionManager.maxReconnectAttempts} attempts`);
    });
  });
});

describe('Integration Tests', () => {
  test('should handle errors with appropriate handlers', () => {
    const disconnectAndNotifyUser = jest.fn();
    const logWarningAndContinue = jest.fn();
    const implementRecoveryAction = jest.fn();
    
    // Test fatal error
    const fatalError = createErrorMessage('SERVER_MAINTENANCE', 'Server is in maintenance mode', null, null, true);
    handleError(fatalError, {
      disconnectAndNotifyUser,
      logWarningAndContinue,
      implementRecoveryAction
    });
    
    expect(disconnectAndNotifyUser).toHaveBeenCalledWith(fatalError);
    expect(logWarningAndContinue).not.toHaveBeenCalled();
    
    // Reset mocks
    disconnectAndNotifyUser.mockReset();
    logWarningAndContinue.mockReset();
    implementRecoveryAction.mockReset();
    
    // Test non-fatal error with recovery action
    const recoverableError = createErrorMessage(
      'RESOURCE_LOCKED', 
      'Resource is locked', 
      null, 
      null, 
      false, 
      null, 
      'Wait and retry later'
    );
    
    handleError(recoverableError, {
      disconnectAndNotifyUser,
      logWarningAndContinue,
      implementRecoveryAction
    });
    
    expect(disconnectAndNotifyUser).not.toHaveBeenCalled();
    expect(logWarningAndContinue).toHaveBeenCalledWith(recoverableError);
    expect(implementRecoveryAction).toHaveBeenCalledWith('Wait and retry later', recoverableError);
  });
  
  test('should retry operations with backoff for retryable errors', async () => {
    const operation = jest.fn();
    operation
      .mockRejectedValueOnce({ payload: { code: 'RESOURCE_LOCKED', fatal: false } })
      .mockRejectedValueOnce({ payload: { code: 'RESOURCE_LOCKED', fatal: false } })
      .mockResolvedValueOnce('success');
    
    // Mock setTimeout to execute immediately
    jest.spyOn(global, 'setTimeout').mockImplementation(callback => {
      callback();
      return 123;
    });
    
    const result = await retryWithBackoff(operation, 5, 10);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
