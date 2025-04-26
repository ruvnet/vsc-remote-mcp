/**
 * Token Manager for VSCode Remote MCP
 * 
 * This module manages authentication tokens for MCP connections.
 */

const crypto = require('crypto');

/**
 * Token Manager class
 */
class TokenManager {
  /**
   * Create a new TokenManager instance
   */
  constructor() {
    this.tokens = new Map();
    this.tokenHashes = new Map();
  }

  /**
   * Set token for a server
   * @param {string} serverId - The server ID
   * @param {string} token - The token
   * @param {Date} [expiresAt] - Optional expiration date
   * @returns {Promise<string>} Hashed token
   */
  async setToken(serverId, token, expiresAt = null) {
    // Hash token
    const hashedToken = await this._hashToken(token);
    
    // Store token
    this.tokens.set(serverId, {
      token,
      hashedToken,
      createdAt: new Date(),
      expiresAt
    });
    
    // Store token hash
    this.tokenHashes.set(serverId, hashedToken);
    
    return hashedToken;
  }

  /**
   * Get token for a server
   * @param {string} serverId - The server ID
   * @returns {Promise<string|null>} Token or null if not found
   */
  async getToken(serverId) {
    const tokenInfo = this.tokens.get(serverId);
    
    if (!tokenInfo) {
      return null;
    }
    
    return tokenInfo.token;
  }

  /**
   * Get token hash for a server
   * @param {string} serverId - The server ID
   * @returns {Promise<string|null>} Token hash or null if not found
   */
  async getTokenHash(serverId) {
    return this.tokenHashes.get(serverId) || null;
  }

  /**
   * Check if token exists for a server
   * @param {string} serverId - The server ID
   * @returns {Promise<boolean>} True if token exists
   */
  async hasToken(serverId) {
    return this.tokens.has(serverId);
  }

  /**
   * Remove token for a server
   * @param {string} serverId - The server ID
   * @returns {Promise<boolean>} True if token was removed
   */
  async removeToken(serverId) {
    const hadToken = this.tokens.has(serverId);
    
    this.tokens.delete(serverId);
    this.tokenHashes.delete(serverId);
    
    return hadToken;
  }

  /**
   * Refresh token for a server
   * @param {string} serverId - The server ID
   * @param {string} [newToken] - Optional new token
   * @returns {Promise<string>} Hashed token
   */
  async refreshToken(serverId, newToken = null) {
    const tokenInfo = this.tokens.get(serverId);
    
    if (!tokenInfo) {
      throw new Error(`No token available for server: ${serverId}`);
    }
    
    // Check if a new token was provided
    if (!newToken) {
      throw new Error('Token refresh requires user input');
    }
    
    // Hash new token
    const hashedToken = await this._hashToken(newToken);
    
    // Update token
    tokenInfo.token = newToken;
    tokenInfo.hashedToken = hashedToken;
    tokenInfo.createdAt = new Date();
    
    // Store updated token
    this.tokens.set(serverId, tokenInfo);
    this.tokenHashes.set(serverId, hashedToken);
    
    return hashedToken;
  }

  /**
   * Verify token for a server
   * @param {string} serverId - The server ID
   * @param {string} token - The token to verify
   * @returns {Promise<boolean>} True if token is valid
   */
  async verifyToken(serverId, token) {
    const tokenInfo = this.tokens.get(serverId);
    
    if (!tokenInfo) {
      return false;
    }
    
    // Check if token is expired
    if (tokenInfo.expiresAt && tokenInfo.expiresAt <= new Date()) {
      return false;
    }
    
    // Hash token
    const hashedToken = await this._hashToken(token);
    
    // Compare hashes
    return hashedToken === tokenInfo.hashedToken;
  }

  /**
   * Hash a token
   * @param {string} token - The token to hash
   * @returns {Promise<string>} Hashed token
   * @private
   */
  async _hashToken(token) {
    // Create a SHA-256 hash of the token
    const hash = crypto.createHash('sha256');
    hash.update(token);
    return hash.digest('hex');
  }

  /**
   * Get all server IDs with tokens
   * @returns {Promise<string[]>} Server IDs
   */
  async getServerIds() {
    return Array.from(this.tokens.keys());
  }

  /**
   * Get token info for a server
   * @param {string} serverId - The server ID
   * @returns {Promise<Object|null>} Token info or null if not found
   */
  async getTokenInfo(serverId) {
    const tokenInfo = this.tokens.get(serverId);
    
    if (!tokenInfo) {
      return null;
    }
    
    // Return a copy without the actual token
    return {
      hashedToken: tokenInfo.hashedToken,
      createdAt: tokenInfo.createdAt,
      expiresAt: tokenInfo.expiresAt
    };
  }

  /**
   * Clear all tokens
   * @returns {Promise<number>} Number of tokens cleared
   */
  async clearAllTokens() {
    const count = this.tokens.size;
    
    this.tokens.clear();
    this.tokenHashes.clear();
    
    return count;
  }

  /**
   * Get token count
   * @returns {Promise<number>} Token count
   */
  async getTokenCount() {
    return this.tokens.size;
  }
}

module.exports = {
  TokenManager
};