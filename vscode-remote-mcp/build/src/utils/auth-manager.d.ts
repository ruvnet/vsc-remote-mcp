/**
 * Authentication Manager for VSCode Remote MCP
 *
 * This module manages authentication tokens for MCP servers.
 * It handles token storage, retrieval, validation, and refresh.
 */
/**
 * MCP Authentication Manager class
 */
export declare class MCPAuthManager {
    private tokens;
    private tokenStorage;
    /**
     * Create a new MCPAuthManager instance
     * @param storage - Optional storage implementation
     */
    constructor(storage?: Storage);
    /**
     * Create default token storage
     * @returns Default storage implementation
     */
    private createDefaultStorage;
    /**
     * Load tokens from storage
     */
    private loadTokens;
    /**
     * Save tokens to storage
     */
    private saveTokens;
    /**
     * Set a token for a server
     * @param serverId - Server ID
     * @param token - Authentication token
     * @param expiresAt - Optional expiration date
     * @param refreshToken - Optional refresh token
     */
    setToken(serverId: string, token: string, expiresAt?: Date | null, refreshToken?: string): void;
    /**
     * Get a token for a server
     * @param serverId - Server ID
     * @returns Token or null if not found or expired
     */
    getToken(serverId: string): Promise<string | null>;
    /**
     * Check if a token is expired
     * @param serverId - Server ID
     * @returns True if token is expired
     */
    isTokenExpired(serverId: string): boolean;
    /**
     * Refresh a token
     * @param serverId - Server ID
     * @param refreshToken - Refresh token
     * @returns New token or null if refresh failed
     */
    refreshToken(serverId: string, refreshToken: string): Promise<string | null>;
    /**
     * Set a refreshed token
     * @param serverId - Server ID
     * @param token - New token
     * @param expiresAt - Optional expiration date
     */
    setRefreshedToken(serverId: string, token: string, expiresAt?: Date | null): void;
    /**
     * Clear a token
     * @param serverId - Server ID
     */
    clearToken(serverId: string): Promise<void>;
    /**
     * Clear all tokens
     */
    clearAllTokens(): Promise<void>;
    /**
     * Validate a token
     * @param serverId - Server ID
     * @param token - Token to validate
     * @returns True if token is valid
     */
    validateToken(serverId: string, token: string): boolean;
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
