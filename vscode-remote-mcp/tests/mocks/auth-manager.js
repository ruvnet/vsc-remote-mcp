/**
 * Mock Auth Manager for VSCode Remote MCP
 * 
 * This is a simplified mock implementation of the auth manager for testing.
 */

// Mock environment config
const mockConfig = {
  auth: {
    enabled: true,
    token: 'env-default-token'
  },
  server: {
    name: 'vscode-mcp-server'
  }
};

class MCPAuthManager {
  constructor() {
    this.tokens = new Map();
    this.tokenHashes = new Map();
    this.tokenExpirations = new Map();
  }

  /**
   * Get a token for a server
   * @param {string} serverId - Server ID
   * @returns {Promise<string|null>} - Token or null
   */
  async getToken(serverId) {
    // Check if token is expired
    if (this.isTokenExpired(serverId)) {
      // Remove token
      this.tokens.delete(serverId);
      
      // If server matches default server name, return default token
      if (mockConfig.auth.enabled && serverId === mockConfig.server.name) {
        return mockConfig.auth.token;
      }
      
      // Default for tests
      return 'mock-token';
    }
    
    // If token exists in map, return it
    if (this.tokens.has(serverId)) {
      return this.tokens.get(serverId);
    }
    
    // If server matches default server name, return default token
    if (mockConfig.auth.enabled && serverId === mockConfig.server.name) {
      return mockConfig.auth.token;
    }
    
    // Default for tests
    return 'mock-token';
  }

  /**
   * Get a token hash for a server
   * @param {string} serverId - Server ID
   * @returns {Promise<string|null>} - Token hash or null
   */
  async getTokenHash(serverId) {
    if (this.tokenHashes.has(serverId)) {
      return this.tokenHashes.get(serverId);
    }
    
    // Mock hash generation
    const token = await this.getToken(serverId);
    if (token) {
      const hash = `hash-of-${token}`;
      this.tokenHashes.set(serverId, hash);
      return hash;
    }
    
    return null;
  }

  /**
   * Set a token for a server
   * @param {string} serverId - Server ID
   * @param {string} token - Token
   * @param {Date} [expiresAt=null] - Token expiration date
   * @returns {Promise<string>} - Token hash
   */
  async setToken(serverId, token, expiresAt = null) {
    if (!serverId || !token) {
      throw new Error('Server ID and token are required');
    }
    
    this.tokens.set(serverId, token);
    
    // Generate and store hash
    const hash = `hash-of-${token}`;
    this.tokenHashes.set(serverId, hash);
    
    // Store expiration if provided
    if (expiresAt) {
      this.tokenExpirations.set(serverId, expiresAt);
    } else {
      this.tokenExpirations.delete(serverId);
    }
    
    return hash;
  }

  /**
   * Clear a token for a server
   * @param {string} serverId - Server ID
   * @returns {Promise<void>}
   */
  async clearToken(serverId) {
    this.tokens.delete(serverId);
    this.tokenHashes.delete(serverId);
    this.tokenExpirations.delete(serverId);
  }

  /**
   * Check if a token exists for a server
   * @param {string} serverId - Server ID
   * @returns {boolean} - True if token exists
   */
  hasToken(serverId) {
    return this.tokens.has(serverId) || 
      (mockConfig.auth.enabled && serverId === mockConfig.server.name);
  }

  /**
   * Check if a token is expired
   * @param {string} serverId - Server ID
   * @returns {boolean} - True if token is expired
   */
  isTokenExpired(serverId) {
    if (!this.tokenExpirations.has(serverId)) {
      return false;
    }
    
    const expiresAt = this.tokenExpirations.get(serverId);
    return expiresAt < new Date();
  }

  /**
   * Verify a token hash
   * @param {string} serverId - Server ID
   * @param {string} tokenHash - Token hash to verify
   * @returns {Promise<boolean>} - True if hash is valid
   */
  async verifyTokenHash(serverId, tokenHash) {
    const storedHash = await this.getTokenHash(serverId);
    return storedHash === tokenHash;
  }

  /**
   * Clear all tokens
   * @returns {Promise<void>}
   */
  async clearAllTokens() {
    this.tokens.clear();
    this.tokenHashes.clear();
    this.tokenExpirations.clear();
  }
}

module.exports = { MCPAuthManager };