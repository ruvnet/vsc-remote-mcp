/**
 * Start Command Implementation
 *
 * This module handles the 'start' command for the VSCode Remote MCP Server CLI.
 */

const VSCodeRemoteMcpServer = require('../../mcp-sdk-server');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const env = require('../../config/env');
const os = require('os');

/**
 * Execute the start command
 * @param {Object} options - Command options
 */
function executeStartCommand(options) {
  // Set environment variables based on options
  if (options.debug) {
    process.env.MCP_DEBUG = '1';
    logger.setLogLevel('DEBUG');
  }
  
  if (options.port) {
    process.env.MCP_PORT = options.port;
  }
  
  process.env.MCP_MODE = options.mode;
  
  // Set timeout configuration for MCP requests
  process.env.MCP_REQUEST_TIMEOUT = options.requestTimeout || '60000'; // 60 seconds default
  process.env.MCP_CONNECTION_TIMEOUT = options.connectionTimeout || '300000'; // 5 minutes default
  process.env.MCP_KEEPALIVE_INTERVAL = options.keepAliveInterval || '30000'; // 30 seconds default
  
  // Handle authentication token for WebSocket mode
  if (options.mode === 'websocket') {
    if (options.token) {
      // Use provided token
      process.env.MCP_AUTH_TOKEN = options.token;
    } else if (options.generateToken) {
      // Force generation of a new token
      process.env.MCP_GENERATE_NEW_TOKEN = '1';
    }
  }

  // Create instances directory if it doesn't exist
  // Use a reliable path that works when installed globally or via npx
  const instancesDir = options.instancesDir ||
                       process.env.MCP_VSCODE_INSTANCES_DIR ||
                       path.resolve(process.cwd(), 'vscode-instances');
  
  logger.debug(`Using instances directory: ${instancesDir}`);
  
  fs.mkdir(instancesDir, { recursive: true })
    .catch(error => {
      logger.error(`Error creating instances directory: ${error.message}`);
    });

  // Create and start the server
  const server = new VSCodeRemoteMcpServer();
  
  // Start the server and keep the process alive
  const serverPromise = server.serve().catch(error => {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  });

  // Set up proper signal handling for graceful shutdown
  setupSignalHandlers(server);
  
  // Return a promise that never resolves to keep the connection alive
  return Promise.all([
    serverPromise,
    new Promise(() => {
      // This promise intentionally never resolves to keep the process running
      logger.info('Server running in persistent mode');
      logger.info(`Using MCP request timeout: ${process.env.MCP_REQUEST_TIMEOUT}ms`);
      logger.info(`Using MCP connection timeout: ${process.env.MCP_CONNECTION_TIMEOUT}ms`);
    })
  ]);
}

/**
 * Set up signal handlers for graceful shutdown
 * @param {VSCodeRemoteMcpServer} server - The server instance
 */
function setupSignalHandlers(server) {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal. Shutting down gracefully...');
    try {
      await server.shutdown();
      logger.info('Server shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
    process.exit(0);
  });

  // Handle SIGTERM
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal. Shutting down gracefully...');
    try {
      await server.shutdown();
      logger.info('Server shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught exception:', error);
    try {
      await server.shutdown();
      logger.info('Server shutdown complete');
    } catch (shutdownError) {
      logger.error('Error during shutdown:', shutdownError);
    }
    process.exit(1);
  });
}

module.exports = {
  executeStartCommand
};