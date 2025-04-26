/**
 * Enhanced tests for error-handler.js
 * 
 * This test suite aims to improve coverage for the error-handler module,
 * which currently has 57.8% coverage.
 */

const errorHandler = require('../src/utils/error-handler');
const { ConnectionManager } = require('../tests/mocks/connection-manager');
const { ClientStateModel } = require('../tests/mocks/client-state-model');

// Mock dependencies
jest.mock('../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

describe('Error Handler', () => {
  let connectionManager;
  let clientStateModel;
  let mockClient;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock client
    mockClient = {
      id: 'client-123',
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined)
    };
    
    // Setup connection manager
    connectionManager = new ConnectionManager();
    connectionManager.getClient.mockReturnValue(mockClient);
    connectionManager.getAllClients.mockReturnValue(new Map([['client-123', mockClient]]));
    
    // Setup client state model
    clientStateModel = new ClientStateModel();
    clientStateModel.getClientState.mockReturnValue({
      connectionState: {
        isConnected: true,
        lastConnected: Date.now(),
        reconnectAttempts: 0
      },
      sessionState: {
        isAuthenticated: true,
        sessionId: 'session-456',
        userId: 'user-789'
      }
    });
  });
  
  // Test basic error handling
  describe('handleError', () => {
    test('should log error and notify client', async () => {
      const error = new Error('Test error');
      const clientId = 'client-123';
      
      await errorHandler.handleError(error, clientId, connectionManager, clientStateModel);
      
      // Verify error was logged
      expect(require('../src/utils/logger').error).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.objectContaining({ clientId: 'client-123' })
      );
      
      // Verify client was notified
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            message: expect.stringContaining('An error occurred'),
            code: 'INTERNAL_ERROR'
          })
        })
      );
    });
    
    test('should handle error with custom error code', async () => {
      const error = new Error('Authentication failed');
      error.code = 'AUTH_ERROR';
      const clientId = 'client-123';
      
      await errorHandler.handleError(error, clientId, connectionManager, clientStateModel);
      
      // Verify client was notified with correct error code
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Authentication failed'),
            code: 'AUTH_ERROR'
          })
        })
      );
    });
    
    test('should handle error with custom status code', async () => {
      const error = new Error('Not found');
      error.statusCode = 404;
      const clientId = 'client-123';
      
      await errorHandler.handleError(error, clientId, connectionManager, clientStateModel);
      
      // Verify client was notified with correct status code
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Not found'),
            statusCode: 404
          })
        })
      );
    });
    
    test('should handle error when client is not found', async () => {
      const error = new Error('Test error');
      const clientId = 'non-existent-client';
      
      // Mock client not found
      connectionManager.getClient.mockReturnValue(null);
      
      await errorHandler.handleError(error, clientId, connectionManager, clientStateModel);
      
      // Verify error was logged with client not found info
      expect(require('../src/utils/logger').error).toHaveBeenCalledWith(
        expect.stringContaining('Client not found'),
        expect.objectContaining({ clientId: 'non-existent-client' })
      );
      
      // Verify no attempt to send to client
      expect(mockClient.send).not.toHaveBeenCalled();
    });
  });
  
  // Test network error handling
  describe('handleNetworkError', () => {
    test('should handle temporary network error', async () => {
      const error = new Error('Connection reset');
      error.code = 'ECONNRESET';
      const clientId = 'client-123';
      
      await errorHandler.handleNetworkError(error, clientId, connectionManager, clientStateModel);
      
      // Verify warning was logged
      expect(require('../src/utils/logger').warn).toHaveBeenCalledWith(
        expect.stringContaining('Connection reset'),
        expect.objectContaining({ clientId: 'client-123' })
      );
      
      // Verify reconnection attempt
      expect(connectionManager.reconnect).toHaveBeenCalledWith(clientId);
    });
    
    test('should handle permanent network error', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      const clientId = 'client-123';
      
      // Mock multiple reconnect attempts
      clientStateModel.getClientState.mockReturnValue({
        connectionState: {
          isConnected: false,
          lastConnected: Date.now() - 60000, // 1 minute ago
          reconnectAttempts: 5
        },
        sessionState: {
          isAuthenticated: true,
          sessionId: 'session-456',
          userId: 'user-789'
        }
      });
      
      await errorHandler.handleNetworkError(error, clientId, connectionManager, clientStateModel);
      
      // Verify error was logged
      expect(require('../src/utils/logger').error).toHaveBeenCalledWith(
        expect.stringContaining('Connection refused'),
        expect.objectContaining({ clientId: 'client-123', reconnectAttempts: 5 })
      );
      
      // Verify client was disconnected after too many attempts
      expect(connectionManager.disconnect).toHaveBeenCalledWith(clientId);
    });
  });
  
  // Test authentication error handling
  describe('handleAuthError', () => {
    test('should handle invalid token error', async () => {
      const error = new Error('Invalid token');
      error.code = 'INVALID_TOKEN';
      const clientId = 'client-123';
      
      await errorHandler.handleAuthError(error, clientId, connectionManager, clientStateModel);
      
      // Verify client was notified
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth_error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Invalid token'),
            code: 'INVALID_TOKEN'
          })
        })
      );
      
      // Verify client state was updated
      expect(clientStateModel.updateSessionState).toHaveBeenCalledWith(
        clientId,
        expect.objectContaining({ isAuthenticated: false })
      );
    });
    
    test('should handle expired token error', async () => {
      const error = new Error('Token expired');
      error.code = 'TOKEN_EXPIRED';
      const clientId = 'client-123';
      
      await errorHandler.handleAuthError(error, clientId, connectionManager, clientStateModel);
      
      // Verify client was notified
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth_error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Token expired'),
            code: 'TOKEN_EXPIRED',
            requiresReauthentication: true
          })
        })
      );
    });
  });
  
  // Test request error handling
  describe('handleRequestError', () => {
    test('should handle invalid request error', async () => {
      const error = new Error('Invalid request');
      error.code = 'INVALID_REQUEST';
      const clientId = 'client-123';
      const requestId = 'request-789';
      
      await errorHandler.handleRequestError(error, clientId, requestId, connectionManager, clientStateModel);
      
      // Verify client was notified with request ID
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Invalid request'),
            code: 'INVALID_REQUEST',
            requestId: 'request-789'
          })
        })
      );
    });
    
    test('should handle request timeout error', async () => {
      const error = new Error('Request timeout');
      error.code = 'REQUEST_TIMEOUT';
      const clientId = 'client-123';
      const requestId = 'request-789';
      
      await errorHandler.handleRequestError(error, clientId, requestId, connectionManager, clientStateModel);
      
      // Verify client was notified with timeout info
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Request timeout'),
            code: 'REQUEST_TIMEOUT',
            requestId: 'request-789',
            retryable: true
          })
        })
      );
    });
  });
  
  // Test server error handling
  describe('handleServerError', () => {
    test('should handle internal server error', async () => {
      const error = new Error('Database connection failed');
      const clientId = 'client-123';
      
      await errorHandler.handleServerError(error, connectionManager);
      
      // Verify all clients were notified
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'server_error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Internal server error'),
            code: 'INTERNAL_SERVER_ERROR'
          })
        })
      );
    });
    
    test('should handle server maintenance error', async () => {
      const error = new Error('Server entering maintenance mode');
      error.code = 'MAINTENANCE';
      error.plannedMaintenance = true;
      error.estimatedDowntime = 300; // 5 minutes
      
      await errorHandler.handleServerError(error, connectionManager);
      
      // Verify all clients were notified with maintenance info
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'server_error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Server entering maintenance mode'),
            code: 'MAINTENANCE',
            plannedMaintenance: true,
            estimatedDowntime: 300
          })
        })
      );
    });
  });
  
  // Test disconnection handling
  describe('handleDisconnection', () => {
    test('should handle client disconnection', async () => {
      const clientId = 'client-123';
      const reason = 'Client closed connection';
      
      await errorHandler.handleDisconnection(clientId, reason, connectionManager, clientStateModel);
      
      // Verify client state was updated
      expect(clientStateModel.updateConnectionState).toHaveBeenCalledWith(
        clientId,
        expect.objectContaining({ isConnected: false })
      );
      
      // Verify disconnection was logged
      expect(require('../src/utils/logger').info).toHaveBeenCalledWith(
        expect.stringContaining('Client disconnected'),
        expect.objectContaining({ clientId: 'client-123', reason: 'Client closed connection' })
      );
    });
    
    test('should handle server-initiated disconnection', async () => {
      const clientId = 'client-123';
      const reason = 'Session timeout';
      
      await errorHandler.handleDisconnection(clientId, reason, connectionManager, clientStateModel, true);
      
      // Verify client state was updated
      expect(clientStateModel.updateConnectionState).toHaveBeenCalledWith(
        clientId,
        expect.objectContaining({ isConnected: false })
      );
      
      // Verify session state was cleared
      expect(clientStateModel.updateSessionState).toHaveBeenCalledWith(
        clientId,
        expect.objectContaining({ isAuthenticated: false, sessionId: null })
      );
      
      // Verify disconnection was logged
      expect(require('../src/utils/logger').info).toHaveBeenCalledWith(
        expect.stringContaining('Server disconnected client'),
        expect.objectContaining({ clientId: 'client-123', reason: 'Session timeout' })
      );
    });
  });
});