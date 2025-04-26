/**
 * Test script for the MCP server discovery endpoint fixes
 * 
 * This script tests the MCP server's discovery endpoints to verify they're working correctly
 * and not timing out with "MCP error -32001: Request timed out".
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

// Store server process
let serverProcess = null;
let messageIdCounter = 1;

// Track pending requests
const pendingRequests = new Map();
const results = {
  discovery: false,
  listTools: false,
  listResources: false
};

/**
 * Start the MCP server process
 */
function startServer() {
  console.log('Starting MCP server...');
  
  // Spawn server process with stdio pipes
  serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          handleServerMessage(message);
        } catch (error) {
          console.log(`Server output (non-JSON): ${line}`);
        }
      }
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data.toString()}`);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

/**
 * Handle messages from the server
 */
function handleServerMessage(message) {
  // Handle heartbeat notifications
  if (message.method && message.method === 'mcp.heartbeat') {
    return;
  }
  
  // Handle responses
  if (message.id && pendingRequests.has(message.id)) {
    const { resolve, reject, description } = pendingRequests.get(message.id);
    pendingRequests.delete(message.id);
    
    console.log(`Received response for: ${description}`);
    
    if (message.error) {
      console.log(`Error: ${JSON.stringify(message.error)}`);
      reject(message.error);
    } else {
      console.log(`Success: ${JSON.stringify(message.result)}`);
      
      // Mark test as passed
      if (description === 'Discovery request') {
        results.discovery = true;
      } else if (description === 'List tools request') {
        results.listTools = true;
      } else if (description === 'List resources request') {
        results.listResources = true;
      }
      
      resolve(message.result);
    }
  }
}

/**
 * Send a request to the server
 */
function sendRequest(method, params, description) {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    
    // Store the promise callbacks
    pendingRequests.set(id, { resolve, reject, description });
    
    // Create the request
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params: params || {}
    };
    
    console.log(`Sending request: ${description}`);
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Run the verification test
 */
async function runVerificationTest() {
  try {
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n=== Testing discovery endpoint ===');
    try {
      const discoveryResult = await sendRequest('mcp.discovery', {}, 'Discovery request');
      console.log('Discovery endpoint working correctly');
    } catch (error) {
      console.log('❌ ERROR: Discovery endpoint failed:', error);
      process.exit(1);
    }
    
    console.log('\n=== Testing listTools endpoint ===');
    try {
      const listToolsResult = await sendRequest('mcp.listTools', {}, 'List tools request');
      console.log('ListTools endpoint working correctly');
    } catch (error) {
      console.log('❌ ERROR: ListTools endpoint failed:', error);
      process.exit(1);
    }
    
    console.log('\n=== Testing listResources endpoint ===');
    try {
      const listResourcesResult = await sendRequest('mcp.listResources', {}, 'List resources request');
      console.log('ListResources endpoint working correctly');
    } catch (error) {
      console.log('❌ ERROR: ListResources endpoint failed:', error);
      process.exit(1);
    }
    
    // Check if all tests passed
    if (results.discovery && results.listTools && results.listResources) {
      console.log('\n✅ SUCCESS: All discovery endpoints are working correctly!');
    } else {
      console.log('\n❌ ERROR: Some tests did not complete successfully');
      console.log(`Discovery: ${results.discovery ? '✅' : '❌'}`);
      console.log(`ListTools: ${results.listTools ? '✅' : '❌'}`);
      console.log(`ListResources: ${results.listResources ? '✅' : '❌'}`);
      process.exit(1);
    }
    
    // Clean up
    cleanup();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    cleanup();
    process.exit(1);
  }
}

/**
 * Clean up resources
 */
function cleanup() {
  if (serverProcess) {
    console.log('Cleaning up...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// Set up cleanup on exit
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

// Start the server
startServer();

// Start the verification test after a short delay
setTimeout(runVerificationTest, 2000);

// Log startup message
console.log('Discovery endpoints verification started. Press Ctrl+C to exit.');