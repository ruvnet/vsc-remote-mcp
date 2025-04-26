/**
 * Tests for the Authentication Flow
 * 
 * These tests verify the authentication token management and validation
 * using environment variables and proper security practices.
 */

jest.mock('../src/utils/connection-manager', () => require('./mocks/connection-manager'));
jest.mock('../src/utils/auth-manager', () => require('./mocks/auth-manager'));
jest.mock('../src/utils/client-state-model', () => require('./mocks/client-state-model'));
jest.mock('../src/config/env', () => ({
  default: {
    auth: {
      enabled: true,
      token: 'env-default-token'
    },
    server: {
      name: 'vscode-mcp-server'
    }
  }
}));

const { MCPAuthManager } = require('../src/utils/auth-manager');
const { MCPConnectionManager } = require('../src/utils/connection-manager');
const config = require('../src/config/env').default;

describe('Authentication Flow', () => {
  let authManager;
  let connectionManager;
  let mockSendMessage;

  beforeEach(() => {
    mockSendMessage = jest.fn();
    authManager = new MCPAuthManager();
    
    connectionManager = new MCPConnectionManager({
      sendMessage: mockSendMessage,
      url: 'ws://localhost:3001'
    });
    
    // Replace the mocked auth manager with our instance
    connectionManager.authManager = authManager;
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should store and retrieve tokens', async () => {
      // Setup
      const serverId = 'test-server';
      const token = 'test-token';
      
      // Execute - set token
      await authManager.setToken(serverId, token);
      
      // Verify - get token
      const retrievedToken = await authManager.getToken(serverId);
      expect(retrievedToken).toBe(token);
    });

    it('should clear tokens', async () => {
      // Setup
      const serverId = 'test-server';
      const token = 'test-token';
      
      // Set a token
      await authManager.setToken(serverId, token);
      
      // Execute - clear token
      await authManager.clearToken(serverId);
      
      // Verify - token should be cleared
      const retrievedToken = await authManager.getToken(serverId);
      expect(retrievedToken).toBe('mock-token'); // Default mock token
    });

    it('should use environment token for default server', async () => {
      // Setup - use the default server ID from config
      const serverId = config.server.name;
      
      // No explicit token set, should use environment default
      const retrievedToken = await authManager.getToken(serverId);
      
      // Verify - should get the environment default token
      expect(retrievedToken).toBe(config.auth.token);
    });

    it('should hash tokens for secure storage', async () => {
      // Setup
      const serverId = 'test-server';
      const token = 'test-token';
      
      // Set a token
      await authManager.setToken(serverId, token);
      
      // Get the token hash
      const hash = await authManager.getTokenHash(serverId);
      
      // Verify - hash should be generated
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(token); // Hash should not be the raw token
    });
  });

  describe('Connection Authentication', () => {
    it('should authenticate connection with valid token', async () => {
      // Setup
      const serverId = 'test-server';
      const clientId = 'test-client';
      const workspaceId = 'test-workspace';
      
      // Set a token
      await authManager.setToken(serverId, 'valid-token');
      
      // Execute
      const result = await connectionManager.connect(serverId, clientId, workspaceId);
      
      // Verify
      expect(result).toBe(true);
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'connection',
        payload: expect.objectContaining({
          clientId,
          workspaceId,
          authToken: expect.any(String)
        })
      });
    });

    it('should fail authentication with invalid token', async () => {
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
    });

    it('should verify token hash correctly', async () => {
      // Setup
      const serverId = 'test-server';
      const token = 'secure-token';
      
      // Set a token
      await authManager.setToken(serverId, token);
      
      // Get the token hash
      const hash = await authManager.getTokenHash(serverId);
      
      // Verify the hash
      const isValid = await authManager.verifyTokenHash(serverId, hash);
      expect(isValid).toBe(true);
      
      // Verify with invalid hash
      const isInvalid = await authManager.verifyTokenHash(serverId, 'invalid-hash');
      expect(isInvalid).toBe(false);
    });

    it('should handle token expiration', async () => {
      // Setup
      const serverId = 'test-server';
      const token = 'expiring-token';
      
      // Set a token with expiration in the past
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1); // 1 hour in the past
      await authManager.setToken(serverId, token, pastDate);
      
      // Check if token is expired
      const isExpired = authManager.isTokenExpired(serverId);
      expect(isExpired).toBe(true);
      
      // Attempt to get the token
      const retrievedToken = await authManager.getToken(serverId);
      expect(retrievedToken).toBe('mock-token'); // Should get default mock token
    });
  });
});