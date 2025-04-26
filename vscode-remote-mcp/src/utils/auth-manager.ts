/**
 * Authentication Manager for VSCode Remote MCP
 * 
 * This module manages authentication tokens for MCP servers.
 * It handles token storage, retrieval, validation, and refresh.
 */

import config from '../config/env';
import * as logger from './logger';

/**
 * Token information interface
 */
interface TokenInfo {
  token: string;
  expiresAt: Date | null;
  refreshToken?: string;
}

/**
 * MCP Authentication Manager class
 */
export class MCPAuthManager {
  private tokens: Map<string, TokenInfo>;
  private tokenStorage: Storage;
  
  /**
   * Create a new MCPAuthManager instance
   * @param storage - Optional storage implementation
   */
  constructor(storage?: Storage) {
    this.tokens = new Map<string, TokenInfo>();
    this.tokenStorage = storage || this.createDefaultStorage();
    this.loadTokens();
  }
  
  /**
   * Create default token storage
   * @returns Default storage implementation
   */
  private createDefaultStorage(): Storage {
    // In-memory storage implementation
    const memoryStorage: Record<string, string> = {};
    
    return {
      getItem(key: string): string | null {
        return memoryStorage[key] || null;
      },
      setItem(key: string, value: string): void {
        memoryStorage[key] = value;
      },
      removeItem(key: string): void {
        delete memoryStorage[key];
      }
    };
  }
  
  /**
   * Load tokens from storage
   */
  private loadTokens(): void {
    try {
      const tokensJson = this.tokenStorage.getItem('mcp_tokens');
      if (tokensJson) {
        const tokenData = JSON.parse(tokensJson);
        
        // Convert stored data to Map
        for (const [serverId, info] of Object.entries(tokenData)) {
          const tokenInfo = info as TokenInfo;
          
          // Convert expiration string to Date if it exists
          if (tokenInfo.expiresAt) {
            tokenInfo.expiresAt = new Date(tokenInfo.expiresAt);
          }
          
          this.tokens.set(serverId, tokenInfo);
        }
      }
    } catch (error) {
      logger.error('Failed to load tokens from storage', { error });
    }
  }
  
  /**
   * Save tokens to storage
   */
  private saveTokens(): void {
    try {
      // Convert Map to object for storage
      const tokenData: Record<string, TokenInfo> = {};
      
      for (const [serverId, info] of this.tokens.entries()) {
        tokenData[serverId] = info;
      }
      
      this.tokenStorage.setItem('mcp_tokens', JSON.stringify(tokenData));
    } catch (error) {
      logger.error('Failed to save tokens to storage', { error });
    }
  }
  
  /**
   * Set a token for a server
   * @param serverId - Server ID
   * @param token - Authentication token
   * @param expiresAt - Optional expiration date
   * @param refreshToken - Optional refresh token
   */
  public setToken(serverId: string, token: string, expiresAt?: Date | null, refreshToken?: string): void {
    this.tokens.set(serverId, {
      token,
      expiresAt: expiresAt || null,
      refreshToken
    });
    
    this.saveTokens();
  }
  
  /**
   * Get a token for a server
   * @param serverId - Server ID
   * @returns Token or null if not found or expired
   */
  public async getToken(serverId: string): Promise<string | null> {
    // Check if token exists in map
    if (this.tokens.has(serverId)) {
      const tokenInfo = this.tokens.get(serverId)!;
      
      // Check if token is expired
      if (this.isTokenExpired(serverId)) {
        // Try to refresh the token if refresh token exists
        if (tokenInfo.refreshToken) {
          try {
            const newToken = await this.refreshToken(serverId, tokenInfo.refreshToken);
            if (newToken) {
              return newToken;
            }
          } catch (error) {
            logger.error('Failed to refresh token', { serverId, error });
          }
        }
        
        // Remove expired token
        this.tokens.delete(serverId);
        this.saveTokens();
        return null;
      }
      
      return tokenInfo.token;
    }
    
    // If server matches default server name, return default token
    if (config.auth.enabled && serverId === config.server.name) {
      return config.auth.token;
    }
    
    return null;
  }
  
  /**
   * Check if a token is expired
   * @param serverId - Server ID
   * @returns True if token is expired
   */
  public isTokenExpired(serverId: string): boolean {
    if (!this.tokens.has(serverId)) {
      return false;
    }
    
    const tokenInfo = this.tokens.get(serverId)!;
    
    // If no expiration, token is not expired
    if (!tokenInfo.expiresAt) {
      return false;
    }
    
    // Check if current time is past expiration
    return new Date() > tokenInfo.expiresAt;
  }
  
  /**
   * Refresh a token
   * @param serverId - Server ID
   * @param refreshToken - Refresh token
   * @returns New token or null if refresh failed
   */
  public async refreshToken(serverId: string, refreshToken: string): Promise<string | null> {
    // This would typically call an API to refresh the token
    // For now, just return null to indicate refresh failed
    logger.debug('Token refresh not implemented', { serverId });
    return null;
  }
  
  /**
   * Set a refreshed token
   * @param serverId - Server ID
   * @param token - New token
   * @param expiresAt - Optional expiration date
   */
  public setRefreshedToken(serverId: string, token: string, expiresAt: Date | null = null): void {
    // Get existing token info
    const tokenInfo = this.tokens.get(serverId);
    
    if (tokenInfo) {
      // Update token and expiration
      tokenInfo.token = token;
      tokenInfo.expiresAt = expiresAt;
      
      this.saveTokens();
    } else {
      // Set new token
      this.setToken(serverId, token, expiresAt);
    }
  }
  
  /**
   * Clear a token
   * @param serverId - Server ID
   */
  public async clearToken(serverId: string): Promise<void> {
    if (this.tokens.has(serverId)) {
      this.tokens.delete(serverId);
      this.saveTokens();
    }
  }
  
  /**
   * Clear all tokens
   */
  public async clearAllTokens(): Promise<void> {
    this.tokens.clear();
    this.saveTokens();
  }
  
  /**
   * Validate a token
   * @param serverId - Server ID
   * @param token - Token to validate
   * @returns True if token is valid
   */
  public validateToken(serverId: string, token: string): boolean {
    // Get stored token
    const storedToken = this.tokens.get(serverId)?.token;
    
    // If no stored token, check against default token
    if (!storedToken && config.auth.enabled && serverId === config.server.name) {
      return token === config.auth.token;
    }
    
    // Compare tokens
    return token === storedToken;
  }
}

/**
 * Storage interface
 */
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export default MCPAuthManager;