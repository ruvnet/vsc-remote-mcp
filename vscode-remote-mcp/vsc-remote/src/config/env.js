/**
 * Environment Configuration
 * 
 * This module loads and provides access to environment variables for the VSCode Remote MCP Server CLI.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Environment variables with defaults
 */
const env = {
  // Debug mode
  DEBUG: process.env.MCP_DEBUG === '1',
  
  // Server mode (stdio or websocket)
  MODE: process.env.MCP_MODE || 'stdio',
  
  // Server port (for websocket mode)
  PORT: parseInt(process.env.MCP_PORT || '3001', 10),
  
  // VSCode instances directory
  VSCODE_INSTANCES_DIR: process.env.MCP_VSCODE_INSTANCES_DIR || path.resolve(process.cwd(), 'vscode-instances'),
  
  // Log level
  LOG_LEVEL: process.env.MCP_LOG_LEVEL || (process.env.MCP_DEBUG === '1' ? 'debug' : 'info'),
  
  // Docker image for VSCode instances
  VSCODE_DOCKER_IMAGE: process.env.MCP_VSCODE_DOCKER_IMAGE || 'codercom/code-server:latest',
  
  // Default CPU limit for VSCode instances
  DEFAULT_CPU_LIMIT: parseFloat(process.env.MCP_DEFAULT_CPU_LIMIT || '1.0'),
  
  // Default memory limit for VSCode instances
  DEFAULT_MEMORY_LIMIT: process.env.MCP_DEFAULT_MEMORY_LIMIT || '2Gi',
  
  // Default disk limit for VSCode instances
  DEFAULT_DISK_LIMIT: process.env.MCP_DEFAULT_DISK_LIMIT || '10Gi'
};

module.exports = env;