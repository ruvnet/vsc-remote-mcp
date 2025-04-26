/**
 * Tests for the Authentication Manager in the VSCode Remote MCP system
 * Based on the authentication flow defined in 06-authentication-flow.md
 */

const { MCPAuthManager } = require('../src/utils/auth-manager');

// Mock crypto module for token hashing
const crypto = {
  subtle: {
    digest: jest.fn()
  }
};

// Mock TextEncoder
global.TextEncoder = class {
  encode(text) {
    return Buffer.from(text);
  }
};

// Mock crypto.subtle.digest to return a predictable hash
crypto.subtle.digest.mockImplementation((algorithm, data) => {
  // Convert to hex string directly instead of using "hashed-" prefix
  const mockHash = Buffer.from(data).toString('hex');
  return Promise.resolve(Buffer.from(mockHash));
});

// Make crypto available globally for the auth manager
global.crypto = crypto;

describe('Authentication Manager', () => {
  let authManager;

  beforeEach(() => {
    authManager = new MCPAuthManager();
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should store and retrieve tokens', async () => {
      const serverId = 'test-server';
      const token = 'secret-token-123';
      
      // Set the token
      const hashedToken = await authManager.setToken(serverId, token);
      
      // Verify the token was hashed
      expect(hashedToken).not.toBe(token);
      expect(typeof hashedToken).toBe('string');
      expect(hashedToken.length).toBeGreaterThan(0);
      
      // Retrieve the token
      const retrievedToken = await authManager.getToken(serverId);
      
      // Verify we get the hashed token back
      expect(retrievedToken).toBe(hashedToken);
    });

    it('should throw an error when getting a token that does not exist', async () => {
      const serverId = 'nonexistent-server';
      
      // Try to get a token that doesn't exist
      await expect(authManager.getToken(serverId)).rejects.toThrow('No token available for server');
    });

    it('should handle token expiration', async () => {
      const serverId = 'test-server';
      const token = 'expiring-token-123';
      
      // Set a token that expires in the past
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10); // 10 minutes in the past
      
      await authManager.setToken(serverId, token, pastDate);
      
      // Try to get the expired token - should throw
      await expect(authManager.getToken(serverId)).rejects.toThrow('No token available for server');
      
      // Set a token that expires in the future
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10); // 10 minutes in the future
      
      const hashedToken = await authManager.setToken(serverId, token, futureDate);
      
      // Should be able to get the token
      const retrievedToken = await authManager.getToken(serverId);
      expect(retrievedToken).toBe(hashedToken);
    });

    it('should detect when a token is about to expire', async () => {
      const serverId = 'test-server';
      const token = 'about-to-expire-token';
      
      // Set a token that expires soon
      const soonDate = new Date();
      soonDate.setSeconds(soonDate.getSeconds() + 60); // 1 minute in the future
      
      await authManager.setToken(serverId, token, soonDate);
      
      // Check if token is about to expire with 5 minute threshold
      expect(authManager.isTokenAboutToExpire(serverId, 300)).toBe(true);
      
      // Check if token is about to expire with 30 second threshold
      expect(authManager.isTokenAboutToExpire(serverId, 30)).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh tokens', async () => {
      const serverId = 'test-server';
      const oldToken = 'old-token-123';
      const newToken = 'new-token-456';
      
      // Set the initial token
      const oldHashedToken = await authManager.setToken(serverId, oldToken);
      
      // Verify we can get the old token
      expect(await authManager.getToken(serverId)).toBe(oldHashedToken);
      
      // Set a refreshed token
      const newHashedToken = await authManager.setRefreshedToken(serverId, newToken);
      
      // Verify we now get the new token
      expect(await authManager.getToken(serverId)).toBe(newHashedToken);
      expect(await authManager.getToken(serverId)).not.toBe(oldHashedToken);
    });

    it('should throw an error when refreshing a token without providing a new one', async () => {
      const serverId = 'test-server';
      
      // Try to refresh without a new token
      await expect(authManager.refreshToken(serverId)).rejects.toThrow('Token refresh requires user input');
    });
  });

  describe('Token Clearing', () => {
    it('should clear all tokens', async () => {
      // Set multiple tokens
      await authManager.setToken('server1', 'token1');
      await authManager.setToken('server2', 'token2');
      
      // Verify tokens exist
      expect(await authManager.getToken('server1')).toBeTruthy();
      expect(await authManager.getToken('server2')).toBeTruthy();
      
      // Clear all tokens
      authManager.clearAllTokens();
      
      // Verify tokens are gone
      await expect(authManager.getToken('server1')).rejects.toThrow();
      await expect(authManager.getToken('server2')).rejects.toThrow();
    });

    it('should remove a specific token', async () => {
      // Set multiple tokens
      await authManager.setToken('server1', 'token1');
      await authManager.setToken('server2', 'token2');
      
      // Remove one token
      authManager.removeToken('server1');
      
      // Verify only that token is gone
      await expect(authManager.getToken('server1')).rejects.toThrow();
      expect(await authManager.getToken('server2')).toBeTruthy();
    });
  });

  describe('Token Hashing', () => {
    it('should hash tokens securely', async () => {
      const token = 'secret-token-123';
      
      // Hash the token
      const hashedToken = await authManager.hashToken(token);
      
      // Verify the token was hashed
      expect(hashedToken).not.toBe(token);
      expect(hashedToken.length).toBeGreaterThan(0);
      
      // Verify the crypto API was called with SHA-256
      expect(crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Buffer));
    });

    it('should produce consistent hashes for the same token', async () => {
      const token = 'consistent-token-123';
      
      // Hash the token twice
      const hash1 = await authManager.hashToken(token);
      const hash2 = await authManager.hashToken(token);
      
      // Verify both hashes are the same
      expect(hash1).toBe(hash2);
    });
  });
});