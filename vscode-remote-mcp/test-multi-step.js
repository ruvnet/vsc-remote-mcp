/**
 * Test script for multi-step interactions with the MCP server
 * 
 * This script tests a sequence of operations with the MCP server to verify it handles
 * multi-step interactions correctly.
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

// Step 1: Initialize the server
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

console.log('Step 1: Sending initialize request...');
server.stdin.write(JSON.stringify(initializeRequest) + '\n');

// Step 2: List available tools
setTimeout(() => {
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'mcp.listTools',
    params: {}
  };

  console.log('Step 2: Sending list tools request...');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

// Step 3: Call the greet tool
setTimeout(() => {
  const greetRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'mcp.callTool',
    params: {
      name: 'greet',
      arguments: {
        name: 'Multi-step Test'
      }
    }
  };

  console.log('Step 3: Sending greet request...');
  server.stdin.write(JSON.stringify(greetRequest) + '\n');
}, 2000);

// Step 4: Execute a command
setTimeout(() => {
  const executeCommandRequest = {
    jsonrpc: '2.0',
    id: 4,
    method: 'mcp.callTool',
    params: {
      name: 'execute_command',
      arguments: {
        command: 'echo "Testing multi-step interactions"',
        cwd: '.'
      }
    }
  };

  console.log('Step 4: Sending execute command request...');
  server.stdin.write(JSON.stringify(executeCommandRequest) + '\n');
}, 3000);

// Clean up after 5 seconds
setTimeout(() => {
  console.log('Test completed, shutting down server...');
  server.kill();
  process.exit(0);
}, 5000);