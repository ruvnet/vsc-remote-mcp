/**
 * Test script for the MCP server initialize endpoint
 * 
 * This script tests the MCP server's initialize endpoint to verify it's working correctly.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the server
const serverPath = path.join(__dirname, 'run-mcp-server.js');

// Check if the server exists
if (!fs.existsSync(serverPath)) {
  console.error(`Error: Server not found at ${serverPath}`);
  process.exit(1);
}

console.log('Starting MCP server...');

// Start the server process
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
server.stdout.on('data', (data) => {
  console.log(`Server stdout: ${data}`);
});

server.stderr.on('data', (data) => {
  console.log(`Server stderr: ${data}`);
});

// Send initialize request
const initializeRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    },
    capabilities: {
      tools: {}
    }
  }
};

console.log('Sending initialize request...');
server.stdin.write(JSON.stringify(initializeRequest) + '\n');

// Clean up after 3 seconds
setTimeout(() => {
  console.log('Test completed, shutting down server...');
  server.kill();
  process.exit(0);
}, 3000);