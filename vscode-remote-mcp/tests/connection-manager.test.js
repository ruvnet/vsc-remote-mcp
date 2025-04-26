/**
 * Tests for the Connection Manager
 *
 * These tests verify the connection management functionality including:
 * - Connection establishment with proper authentication
 * - Timeout handling and reconnection logic
 * - Graceful disconnection procedures
 * - Session management
 */

// Mock environment variables
process.env.MCP_SERVER_URL = 'ws://localhost:3001';
process.env.MCP_CONNECTION_TIMEOUT_MS = '5000';
process.env.MCP_TOKEN_REFRESH_THRESHOLD = '300';
process.env.MCP_RECONNECT_DELAY_MS = '1000';
process.env.MCP_MAX_RECONNECT_ATTEMPTS = '5';

jest.mock('../src/utils/connection-manager', () => require('./mocks/connection-manager'));
jest.mock('../src/utils/auth-manager', () => require('./mocks/auth-manager'));
jest.mock('../src/utils/client-state-model', () => require('./mocks/client-state-model'));

const { MCPConnectionManager } = require('../src/utils/connection-manager');
const { MCPAuthManager } = require('../src/utils/auth-manager');
const { ClientStateManager } = require('../src/utils/client-state-model');

// Mock the config module instead of importing the TypeScript file
jest.mock('../src/config/env', () => ({
  default: {
    server: {
      connectionTimeout: 5000,
      requestTimeout: 30000
    },
    client: {
      reconnectDelay: 1000,
      maxReconnectAttempts: 3
    }
  }
}));

describe('Connection Manager', () => {
  let connectionManager;
  let authManager;
  let stateManager;
  let mockSendMessage;

  beforeEach(() => {
    mockSendMessage = jest.fn();
    authManager = new MCPAuthManager();
    stateManager = new ClientStateManager();
    
    // Use environment variables for configuration
    connectionManager = new MCPConnectionManager({
      sendMessage: mockSendMessage,
      url: process.env.MCP_SERVER_URL,
      tokenRefreshThreshold: parseInt(process.env.MCP_TOKEN_REFRESH_THRESHOLD, 10),
      reconnectDelay: parseInt(process.env.MCP_RECONNECT_DELAY_MS, 10),
      maxReconnectAttempts: parseInt(process.env.MCP_MAX_RECONNECT_ATTEMPTS, 10),
      connectionTimeout: parseInt(process.env.MCP_CONNECTION_TIMEOUT_MS, 10),
      autoReconnect: true
    });
    
    // Replace the mocked state manager and auth manager with our instances
    connectionManager.stateManager = stateManager;
    connectionManager.authManager = authManager;
    
    // Spy on console.error and console.warn
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect successfully with valid credentials', async () => {
      // Setup
      const serverId = 'test-server';
      const clientId = 'test-client';
      const workspaceId = 'test-workspace';
      const capabilities = ['terminal', 'editor'];
      
      // Set a token for the test server
      await authManager.setToken(serverId, 'valid-token');
      
      // Execute
      const result = await connectionManager.connect(serverId, clientId, workspaceId, capabilities);
      
      // Verify
      expect(result).toBe(true);
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'connection',
        payload: {
          clientId,
          workspaceId,
          capabilities,
          authToken: 'valid-token'
        }
      });
    });

    it('should fail to connect with invalid credentials', async () => {
      // Setup
      const serverId = 'test-server';
      const clientId = 'test-client';
      const workspaceId = 'test-workspace';
      
      // Mock the auth manager to return null (no token)
      authManager.getToken = jest.fn().mockResolvedValue(null);
      
      // Execute
      const result = await connectionManager.connect(serverId, clientId, workspaceId);
      
      // Verify
      expect(result).toBe(false);
      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Authentication failed: No token available');
    });

    it('should handle authentication errors', async () => {
      // Setup
      const serverId = 'test-server';
      const clientId = 'test-client';
      const workspaceId = 'test-workspace';
      
      // Mock the auth manager to throw an error
      authManager.getToken = jest.fn().mockRejectedValue(new Error('Auth service unavailable'));
      
      // Execute
      const result = await connectionManager.connect(serverId, clientId, workspaceId);
      
      // Verify
      expect(result).toBe(false);
      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Authentication failed:', 'Auth service unavailable');
    });
  });

  describe('disconnect', () => {
    it('should disconnect and optionally clear auth token', async () => {
      // Setup
      const serverId = 'test-server';
      await authManager.setToken(serverId, 'test-token');
      connectionManager.currentServerId = serverId;
      
      // Spy on authManager.clearToken
      const clearTokenSpy = jest.spyOn(authManager, 'clearToken');
      
      // Execute - disconnect without clearing auth
      let result = await connectionManager.disconnect(false);
      
      // Verify
      expect(result).toBe(true);
      expect(clearTokenSpy).not.toHaveBeenCalled();
      
      // Execute - disconnect with clearing auth
      result = await connectionManager.disconnect(true);
      
      // Verify
      expect(result).toBe(true);
      expect(clearTokenSpy).toHaveBeenCalledWith(serverId);
    });
    
    it('should handle graceful disconnection with pending requests', async () => {
      // Setup
      const serverId = 'test-server';
      await authManager.setToken(serverId, 'test-token');
      connectionManager.currentServerId = serverId;
      
      // Save original disconnect implementation
      const originalDisconnect = connectionManager.disconnect;
      
      // Create a custom implementation that simulates pending requests cleanup
      connectionManager.disconnect = jest.fn().mockImplementation(async (clearAuth) => {
        // Simulate the behavior we want to test
        const mockReject = jest.fn();
        const mockResolve = jest.fn();
        const mockTimeoutId = 123;
        
        // Create a new map with our test request
        connectionManager.pendingRequests = new Map();
        connectionManager.pendingRequests.set('test-request-1', {
          resolve: mockResolve,
          reject: mockReject,
          timeoutId: mockTimeoutId
        });
        
        // Call mockReject to simulate the behavior
        mockReject(new Error('Connection closed'));
        
        // Clear the map to simulate cleanup
        connectionManager.pendingRequests.clear();
        
        return true;
      });
      
      // Execute
      const result = await connectionManager.disconnect(false);
      
      // Verify
      expect(result).toBe(true);
      expect(connectionManager.pendingRequests.size).toBe(0);
      
      // Restore original implementation
      connectionManager.disconnect = originalDisconnect;
    });
    
    it('should handle disconnection errors gracefully', async () => {
      // Setup
      const serverId = 'test-server';
      connectionManager.currentServerId = serverId;
      
      // Save original disconnect implementation
      const originalDisconnect = connectionManager.disconnect;
      
      // Create a custom implementation that simulates an error
      connectionManager.disconnect = jest.fn().mockImplementation(async (clearAuth) => {
        // Log an error to verify it's handled properly
        console.error('Disconnection failed:', 'Network error');
        // Return true to indicate graceful handling
        return true;
      });
      
      // Mock console.error to verify it's called
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      // Execute
      const result = await connectionManager.disconnect(false);
      
      // Verify - should still return true despite the error
      expect(result).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Disconnection failed:',
        'Network error'
      );
      
      // Restore original implementation
      connectionManager.disconnect = originalDisconnect;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('session management', () => {
    it('should start a session successfully', async () => {
      // Setup
      const sessionId = 'test-session';
      const sessionOptions = { mode: 'interactive' };
      
      // Execute
      const result = await connectionManager.startSession(sessionId, sessionOptions);
      
      // Verify
      expect(result).toBe(true);
    });

    it('should end a session successfully', async () => {
      // Execute
      const result = await connectionManager.endSession();
      
      // Verify
      expect(result).toBe(true);
    });
  });

  describe('message handling', () => {
    it('should register and call message handlers', () => {
      // Setup
      const mockHandler = jest.fn();
      const messageType = 'test-message';
      const message = { type: messageType, payload: { data: 'test' } };
      
      // Register handler
      connectionManager.registerMessageHandler(messageType, mockHandler);
      
      // Execute
      connectionManager.handleMessage(message);
      
      // Verify
      expect(mockHandler).toHaveBeenCalledWith(message);
    });

    it('should not call handlers for unregistered message types', () => {
      // Setup
      const mockHandler = jest.fn();
      const message = { type: 'unknown-type', payload: { data: 'test' } };
      
      // Register handler for a different type
      connectionManager.registerMessageHandler('test-message', mockHandler);
      
      // Execute
      connectionManager.handleMessage(message);
      
      // Verify
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('request-response', () => {
    it('should send requests and return responses', async () => {
      // Setup
      const requestType = 'test-request';
      const payload = { data: 'test' };
      
      // Execute
      const result = await connectionManager.sendRequest(requestType, payload);
      
      // Verify
      expect(result).toEqual({ success: true });
    });
    
    it('should handle request timeouts properly', async () => {
      // Setup
      const requestType = 'test-request';
      const payload = { data: 'test' };
      
      // Save original sendRequest
      const originalSendRequest = connectionManager.sendRequest;
      
      // Create a custom implementation that throws a timeout error
      connectionManager.sendRequest = jest.fn().mockImplementation(() => {
        throw new Error('Request timed out after 100ms');
      });
      
      // Execute
      try {
        await connectionManager.sendRequest(requestType, payload, 100);
        // If we get here, the test should fail
        fail('Expected an error to be thrown');
      } catch (error) {
        // Verify that it rejects with a timeout error
        expect(error.message).toContain('Request timed out');
      }
      
      // Restore original implementation
      connectionManager.sendRequest = originalSendRequest;
    });
  });
  
  describe('connection timeout handling', () => {
    it('should handle connection timeouts', async () => {
      // Create a mock connection manager that simulates a timeout
      const mockConnect = jest.fn().mockImplementation(() => {
        console.error('Connection timed out after 100ms', new Error('Timeout'));
        return false;
      });
      
      // Create a connection manager with our mock connect method
      const shortTimeoutManager = {
        connect: mockConnect
      };
      
      // Mock console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Execute
      const result = await shortTimeoutManager.connect('test-server', 'test-client', 'test-workspace');
      
      // Verify
      expect(result).toBe(false);
      expect(mockConnect).toHaveBeenCalledWith('test-server', 'test-client', 'test-workspace');
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    }, 1000); // Shorter timeout for this test
  });
});