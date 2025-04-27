/**
 * Authentication Manager for VSCode Remote MCP
 * 
 * This module manages authentication tokens for MCP connections.
 */

// Use global crypto object instead of requiring it
// This allows for easier mocking in tests
// const crypto = require('crypto');

/**
 * MCP Authentication Manager class
 */
class MCPAuthManager {
  /**
   * Create a new MCPAuthManager instance
   */
  constructor() {
    this.tokens = new Map();
    this.tokenHashes = new Map();
    this.tokenExpirations = new Map();
  }

  /**
   * Set a token for a server
   * @param {string} serverId - The server ID
   * @param {string} token - The token
   * @param {Date} [expiresAt=null] - Token expiration date
   * @returns {Promise<string>} The token hash
   */
  async setToken(serverId, token, expiresAt = null) {
    if (!serverId || !token) {
      throw new Error('Server ID and token are required');
    }
    
    // Store token securely - avoid storing raw tokens in memory when possible
    // In a production environment, consider using a secure credential store
    this.tokens.set(serverId, token);
    
    // Hash token
    const tokenHash = await this.hashToken(token);
    this.tokenHashes.set(serverId, tokenHash);
    
    // Set expiration
    if (expiresAt) {
      this.tokenExpirations.set(serverId, expiresAt);
    } else {
      this.tokenExpirations.delete(serverId);
    }
    
    return tokenHash;
  }

  /**
   * Set a refreshed token for a server
   * @param {string} serverId - The server ID
   * @param {string} token - The token
   * @param {Date} [expiresAt=null] - Token expiration date
   * @returns {Promise<string>} The new token hash
   */
  async setRefreshedToken(serverId, token, expiresAt = null) {
    await this.setToken(serverId, token, expiresAt);
    return await this.getTokenHash(serverId);
  }

  /**
   * Get a token for a server
   * @param {string} serverId - The server ID
   * @returns {Promise<string>} The token hash
   */
  async getToken(serverId) {
    // Check if token exists
    if (!this.tokens.has(serverId)) {
      throw new Error('No token available for server');
    }
    
    // Check if token is expired
    if (this.isTokenExpired(serverId)) {
      // Remove token
      this.removeToken(serverId);
      
      throw new Error('No token available for server');
    }
    
    // Return the token hash instead of the raw token
    return await this.getTokenHash(serverId);
  }

  /**
   * Get a token hash for a server
   * @param {string} serverId - The server ID
   * @returns {Promise<string>} The token hash
   */
  async getTokenHash(serverId) {
    // Check if token hash exists
    if (!this.tokenHashes.has(serverId)) {
      // Check if token exists
      if (!this.tokens.has(serverId)) {
        throw new Error('No token available for server');
      }
      
      // Hash token
      const token = this.tokens.get(serverId);
      const tokenHash = await this.hashToken(token);
      this.tokenHashes.set(serverId, tokenHash);
    }
    
    const hash = this.tokenHashes.get(serverId);
    return hash || '';
  }

  /**
   * Remove a token for a server
   * @param {string} serverId - The server ID
   * @returns {Promise<void>}
   */
  async removeToken(serverId) {
    this.tokens.delete(serverId);
    this.tokenHashes.delete(serverId);
    this.tokenExpirations.delete(serverId);
  }

  /**
   * Check if a token exists for a server
   * @param {string} serverId - The server ID
   * @returns {boolean} True if token exists
   */
  hasToken(serverId) {
    return this.tokens.has(serverId);
  }

  /**
   * Check if a token is expired
   * @param {string} serverId - The server ID
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(serverId) {
    // Check if token has expiration
    if (!this.tokenExpirations.has(serverId)) {
      return false;
    }
    
    // Get expiration
    const expiresAt = this.tokenExpirations.get(serverId);
    
    // Check if expired
    return expiresAt < new Date();
  }

  /**
   * Check if a token is about to expire
   * @param {string} serverId - The server ID
   * @param {number} [thresholdSeconds=300] - Threshold in seconds
   * @returns {boolean} True if token is about to expire
   */
  isTokenAboutToExpire(serverId, thresholdSeconds = 300) {
    // Check if token has expiration
    if (!this.tokenExpirations.has(serverId)) {
      return false;
    }
    
    // Get expiration
    const expiresAt = this.tokenExpirations.get(serverId);
    
    // Calculate threshold
    const thresholdDate = new Date();
    thresholdDate.setSeconds(thresholdDate.getSeconds() + thresholdSeconds);
    
    // Check if about to expire
    return expiresAt <= thresholdDate;
  }

  /**
   * Get token expiration for a server
   * @param {string} serverId - The server ID
   * @returns {Date|null} Token expiration date
   */
  getTokenExpiration(serverId) {
    return this.tokenExpirations.get(serverId) || null;
  }
  
  /**
   * Refresh a token for a server
   * @param {string} serverId - The server ID
   * @param {string} newToken - The new token
   * @param {Date} [expiresAt=null] - Token expiration date
   * @returns {Promise<string>} The new token hash
   * @throws {Error} If no new token is provided
   */
  async refreshToken(serverId, newToken, expiresAt = null) {
    if (!newToken) {
      throw new Error('Token refresh requires user input');
    }
    
    // Store the new token
    await this.setToken(serverId, newToken, expiresAt);
    
    // Return the new token hash
    return this.getTokenHash(serverId);
  }

  /**
   * Hash a token
   * @param {string} token - The token
   * @returns {Promise<string>} The token hash
   */
  async hashToken(token) {
    // Try to use crypto.subtle if available
    if (crypto.subtle && typeof crypto.subtle.digest === 'function') {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const buffer = Buffer.from(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Buffer.from(hashBuffer).toString('hex');
      } catch (error) {
        // Fall back to regular hash if subtle digest fails
        console.warn('Falling back to regular hash due to error:', error.message);
      }
    }
    
    // Fall back to regular hash using Node.js crypto module
    // This is a fallback for environments where crypto.subtle is not available
    try {
      // Use require only if needed to support both browser and Node.js environments
      const nodeCrypto = require('crypto');
      const hash = nodeCrypto.createHash('sha256');
      hash.update(token);
      return hash.digest('hex');
    } catch (error) {
      throw new Error('Cryptographic functions are not available in this environment');
    }
  }

  /**
   * Verify a token hash
   * @param {string} serverId - The server ID
   * @param {string} tokenHash - The token hash
   * @returns {Promise<boolean>} True if hash is valid
   */
  async verifyTokenHash(serverId, tokenHash) {
    // Check if token exists
    if (!this.tokens.has(serverId)) {
      return false;
    }
    
    // Get stored hash
    const storedHash = await this.getTokenHash(serverId);
    
    // Compare hashes
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

module.exports = {
  MCPAuthManager
};