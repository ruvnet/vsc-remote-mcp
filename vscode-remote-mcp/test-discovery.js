/**
 * Test script for the MCP server discovery endpoint
 * 
 * This script tests the MCP server's discovery endpoint to verify it's working correctly.
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

// Send discovery request
const discoveryRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'mcp.discovery',
  params: {}
};

console.log('Sending discovery request...');
server.stdin.write(JSON.stringify(discoveryRequest) + '\n');

// Send list tools request
setTimeout(() => {
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'mcp.listTools',
    params: {}
  };

  console.log('Sending list tools request...');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

// Clean up after 3 seconds
setTimeout(() => {
  console.log('Test completed, shutting down server...');
  server.kill();
  process.exit(0);
}, 3000);