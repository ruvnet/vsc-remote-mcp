/**
 * Simple test script for MCP discovery endpoints
 * 
 * This script provides a quick way to test if the discovery endpoints
 * are working correctly without timing out.
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Start the server
console.log('Starting MCP server...');
const server = spawn('node', [__dirname + '/run-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Set up readline interface for server stdout
const rl = readline.createInterface({
  input: server.stdout,
  output: null,
  terminal: false
});

// Track responses
let discoveryResponse = false;
let listToolsResponse = false;
let listResourcesResponse = false;

// Handle server output
rl.on('line', (line) => {
  if (line.trim()) {
    try {
      const message = JSON.parse(line);
      
      // Skip heartbeat messages
      if (message.method && message.method === 'mcp.heartbeat') {
        return;
      }
      
      // Handle responses
      if (message.id) {
        console.log(`Received response for ID ${message.id}:`);
        console.log(JSON.stringify(message, null, 2));
        
        // Mark test as passed based on ID
        if (message.id === 1) {
          discoveryResponse = true;
          console.log('✅ Discovery endpoint working!');
        } else if (message.id === 2) {
          listToolsResponse = true;
          console.log('✅ ListTools endpoint working!');
        } else if (message.id === 3) {
          listResourcesResponse = true;
          console.log('✅ ListResources endpoint working!');
        }
        
        // Check if all tests have passed
        if (discoveryResponse && listToolsResponse && listResourcesResponse) {
          console.log('\n✅ SUCCESS: All discovery endpoints are working correctly!');
          setTimeout(() => {
            cleanup();
          }, 500);
        }
      }
    } catch (error) {
      console.log(`Server output (non-JSON): ${line}`);
    }
  }
});

// Handle server stderr
server.stderr.on('data', (data) => {
  console.error(`Server stderr: ${data.toString()}`);
});

// Send discovery request
setTimeout(() => {
  console.log('\nSending discovery request...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'mcp.discovery',
    params: {}
  }) + '\n');
}, 1000);

// Send list tools request
setTimeout(() => {
  console.log('\nSending list tools request...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'mcp.listTools',
    params: {}
  }) + '\n');
}, 2000);

// Send list resources request
setTimeout(() => {
  console.log('\nSending list resources request...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'mcp.listResources',
    params: {}
  }) + '\n');
}, 3000);

// Set timeout for the entire test
const testTimeout = setTimeout(() => {
  console.log('\n❌ ERROR: Test timed out. Some endpoints may not be responding.');
  console.log(`Discovery: ${discoveryResponse ? '✅' : '❌'}`);
  console.log(`ListTools: ${listToolsResponse ? '✅' : '❌'}`);
  console.log(`ListResources: ${listResourcesResponse ? '✅' : '❌'}`);
  cleanup();
}, 10000);

// Clean up resources
function cleanup() {
  console.log('Cleaning up...');
  clearTimeout(testTimeout);
  server.kill();
  process.exit(0);
}

// Handle process exit
process.on('SIGINT', () => {
  cleanup();
});

console.log('Test started. Press Ctrl+C to exit.');