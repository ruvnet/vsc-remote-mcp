/**
 * VSCode Remote MCP Server - Main Entry Point
 * 
 * This is the main entry point for the vsc-remote package.
 * It exports the MCP server and tools for programmatic usage.
 */

const VSCodeRemoteMcpServer = require('./mcp-sdk-server');
const { tools, toolSchemas } = require('./tools');
const env = require('./config/env');
const logger = require('./cli/utils/logger');

// Set log level based on environment
logger.setLogLevel(env.LOG_LEVEL.toUpperCase());

/**
 * Create and start an MCP server
 * @param {Object} options - Server options
 * @returns {Promise<VSCodeRemoteMcpServer>} The server instance
 */
async function createServer(options = {}) {
  const server = new VSCodeRemoteMcpServer(options);
  await server.serve();
  return server;
}

// Export the public API
module.exports = {
  VSCodeRemoteMcpServer,
  createServer,
  tools,
  toolSchemas,
  env,
  logger
};