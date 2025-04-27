/**
 * Environment configuration for the MCP server
 *
 * This module centralizes all environment variable access and provides
 * type-safe defaults and validation for required variables.
 *
 * @module env
 */
/**
 * Server configuration interface
 */
export interface ServerConfig {
    name: string;
    version: string;
    vendor: string;
    description: string;
}
/**
 * Authentication configuration interface
 */
export interface AuthConfig {
    token: string;
    enabled: boolean;
}
/**
 * Logging configuration interface
 */
export interface LogConfig {
    level: 'error' | 'warn' | 'info' | 'debug';
}
/**
 * Security configuration interface
 */
export interface SecurityConfig {
    allowedOrigins: string[];
    corsEnabled: boolean;
}
/**
 * Command execution configuration interface
 */
export interface CommandConfig {
    timeoutMs: number;
    allowedCommands: string[];
    blockedCommands: string[];
}
/**
 * File operations configuration interface
 */
export interface FileConfig {
    maxFileSizeMb: number;
    allowedFilePaths: string[];
}
/**
 * Complete environment configuration
 */
export interface EnvConfig {
    server: ServerConfig;
    auth: AuthConfig;
    log: LogConfig;
    security: SecurityConfig;
    command: CommandConfig;
    file: FileConfig;
}
declare const config: EnvConfig;
export default config;
