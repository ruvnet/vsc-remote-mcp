/**
 * VSCode Remote MCP Server - SDK Implementation
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
server.serve().catch(error => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

// Add health check endpoint for network reachability testing
process.on('message', (message) => {
  if (message === 'health-check') {
    process.send({ status: 'ok' });
  }
});