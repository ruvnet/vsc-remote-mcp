"use strict";
/**
 * Environment configuration for the MCP server
 *
 * This module centralizes all environment variable access and provides
 * type-safe defaults and validation for required variables.
 *
 * @module env
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Get environment variable with fallback
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns The environment variable value or default
 */
function getEnv(key, defaultValue) {
    return process.env[key] || defaultValue;
}
/**
 * Parse boolean environment variable
 * @param value - String value to parse
 * @returns Parsed boolean value
 */
function parseBoolean(value) {
    return value.toLowerCase() === 'true';
}
/**
 * Parse string array from comma-separated environment variable
 * @param value - Comma-separated string
 * @returns Array of strings
 */
function parseStringArray(value) {
    if (!value || value.trim() === '') {
        return [];
    }
    return value.split(',').map(item => item.trim());
}
/**
 * Parse number from environment variable
 * @param value - String value to parse
 * @param defaultValue - Default number if parsing fails
 * @returns Parsed number value
 */
function parseNumber(value, defaultValue) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}
/**
 * Validate required environment variables
 * @throws Error if required variables are missing
 */
function validateRequiredEnv() {
    // Add validation for critical environment variables if needed
    // For example:
    // if (!process.env.CRITICAL_API_KEY) {
    //   throw new Error('CRITICAL_API_KEY environment variable is required');
    // }
}
// Initialize and validate environment
validateRequiredEnv();
// Server configuration
const serverConfig = {
    name: getEnv('MCP_SERVER_NAME', 'vscode-mcp-server'),
    version: getEnv('MCP_SERVER_VERSION', '1.0.0'),
    vendor: getEnv('MCP_SERVER_VENDOR', 'Edge Agents'),
    description: getEnv('MCP_SERVER_DESCRIPTION', 'MCP server for VSCode integration with edge agents')
};
// Authentication configuration
const authConfig = {
    token: getEnv('MCP_AUTH_TOKEN', 'local_dev_token'),
    enabled: parseBoolean(getEnv('MCP_AUTH_ENABLED', 'true'))
};
// Logging configuration
const logConfig = {
    level: getEnv('MCP_LOG_LEVEL', 'info')
};
// Security configuration
const securityConfig = {
    allowedOrigins: parseStringArray(getEnv('MCP_ALLOWED_ORIGINS', '*')),
    corsEnabled: parseBoolean(getEnv('MCP_CORS_ENABLED', 'true'))
};
// Command execution configuration
const commandConfig = {
    timeoutMs: parseNumber(getEnv('MCP_COMMAND_TIMEOUT_MS', '30000'), 30000),
    allowedCommands: parseStringArray(getEnv('MCP_ALLOWED_COMMANDS', 'npm test,npm install,tsc,git log,git show,cd,ls,node,npm run,deno task,deno test')),
    blockedCommands: parseStringArray(getEnv('MCP_BLOCKED_COMMANDS', 'rm -rf,git push'))
};
// File operations configuration
const fileConfig = {
    maxFileSizeMb: parseNumber(getEnv('MCP_MAX_FILE_SIZE_MB', '10'), 10),
    allowedFilePaths: parseStringArray(getEnv('MCP_ALLOWED_FILE_PATHS', './,../,src/,scripts/'))
};
// Complete configuration
const config = {
    server: serverConfig,
    auth: authConfig,
    log: logConfig,
    security: securityConfig,
    command: commandConfig,
    file: fileConfig
};
exports.default = config;
//# sourceMappingURL=env.js.map