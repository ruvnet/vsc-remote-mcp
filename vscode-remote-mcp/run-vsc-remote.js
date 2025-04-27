/**
 * VSCode Remote MCP Server - Direct Implementation
 *
 * This script provides an MCP server implementation for VSCode Remote integration
 * using the official MCP SDK. It handles file operations, code analysis, VSCode instance
 * management, and command execution through a stdio interface.
 *
 * Version: 2.0.0 - Using official MCP SDK
 */

// Import the SDK server implementation
const VSCodeRemoteMcpServer = require('./src/mcp-sdk-server');
const fs = require('fs').promises;
const path = require('path');

// Create instances directory if it doesn't exist
fs.mkdir(path.join(__dirname, 'vscode-instances'), { recursive: true })
  .catch(error => {
    console.error(`Error creating instances directory: ${error.message}`);
  });

// Create and start the server
const server = new VSCodeRemoteMcpServer();

// Start the server and keep the process alive
const serverPromise = server.serve().catch(error => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

// Set up proper signal handling for graceful shutdown
setupSignalHandlers(server);

// Add health check endpoint for network reachability testing
process.on('message', (message) => {
  if (message === 'health-check') {
    process.send({ status: 'ok' });
  }
});

// Keep the process alive with a never-resolving promise
Promise.all([
  serverPromise,
  new Promise(() => {
    // This promise intentionally never resolves to keep the process running
    console.log('Server running in persistent mode');
  })
]).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

/**
 * Set up signal handlers for graceful shutdown
 * @param {VSCodeRemoteMcpServer} server - The server instance
 */
function setupSignalHandlers(server) {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('Received SIGINT signal. Shutting down gracefully...');
    try {
      await server.shutdown();
      console.log('Server shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    process.exit(0);
  });

  // Handle SIGTERM
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal. Shutting down gracefully...');
    try {
      await server.shutdown();
      console.log('Server shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    try {
      await server.shutdown();
      console.log('Server shutdown complete');
    } catch (shutdownError) {
      console.error('Error during shutdown:', shutdownError);
    }
    process.exit(1);
  });
}