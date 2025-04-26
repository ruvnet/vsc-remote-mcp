/**
 * Multi-Step Initialization for VSCode MCP Client
 * 
 * This script implements a phased initialization approach to avoid timeout issues
 * by breaking down the initialization process into smaller, separate requests.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Path to the MCP server script
const MCP_SERVER_PATH = path.resolve(__dirname, 'run-mcp-server.js');

// Request timeout in milliseconds (30 seconds - shorter than server's 45 seconds)
const REQUEST_TIMEOUT = 30000;

// Server process
let serverProcess = null;

// Track if server is ready
let serverReady = false;

// Track the last response time
let lastResponseTime = Date.now();

// Message ID counter
let messageIdCounter = 1;

// Active requests with their timeouts and resolvers
const activeRequests = new Map();

/**
 * Start the MCP server
 */
function startServer() {
  console.log('Starting MCP server...');
  
  // Kill any existing server process
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (error) {
      console.error('Error killing existing server process:', error);
    }
  }
  
  // Start a new server process
  serverProcess = spawn('node', [MCP_SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Handle server stdout
  serverProcess.stdout.on('data', (data) => {
    const messages = data.toString().trim().split('\n');
    
    for (const message of messages) {
      if (message.trim()) {
        try {
          const parsedMessage = JSON.parse(message);
          handleServerMessage(parsedMessage);
        } catch (error) {
          console.error('Error parsing server message:', message);
        }
      }
    }
  });
  
  // Handle server stderr
  serverProcess.stderr.on('data', (data) => {
    console.log('Server stderr:', data.toString().trim());
  });
  
  // Handle server exit
  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    serverReady = false;
    
    // Restart server if it crashed
    if (code !== 0) {
      console.log('Server crashed, restarting...');
      setTimeout(startServer, 1000);
    }
  });
  
  // Handle server error
  serverProcess.on('error', (error) => {
    console.error('Server process error:', error);
    serverReady = false;
  });
}

/**
 * Handle messages from the server
 */
function handleServerMessage(message) {
  // Update last response time
  lastResponseTime = Date.now();
  
  // Handle server_ready notification
  if (message.method === 'server_ready') {
    console.log('Server is ready, starting initialization sequence...');
    serverReady = true;
    startInitializationSequence();
    return;
  }
  
  // Handle server_heartbeat notification
  if (message.method === 'server_heartbeat') {
    console.log('Received server heartbeat:', message.params);
    return;
  }
  
  // Handle response to a request
  if (message.id !== undefined) {
    const requestId = message.id;
    
    // Get the request data
    const requestData = activeRequests.get(requestId);
    if (requestData) {
      // Clear timeout
      clearTimeout(requestData.timeoutId);
      
      // Resolve the promise
      requestData.resolve(message);
      
      // Remove from active requests
      activeRequests.delete(requestId);
      
      console.log(`Received response for request ${requestId}`);
    }
  }
}

/**
 * Send a request to the server and return a promise
 */
function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!serverProcess || !serverReady) {
      return reject(new Error('Server is not ready'));
    }
    
    const id = messageIdCounter++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    console.log(`Sending request ${id}: ${method}`);
    
    // Set up timeout for this request
    const timeoutId = setTimeout(() => {
      if (activeRequests.has(id)) {
        const requestData = activeRequests.get(id);
        activeRequests.delete(id);
        reject(new Error(`Request ${id} timed out after ${REQUEST_TIMEOUT}ms`));
      }
    }, REQUEST_TIMEOUT);
    
    // Store request data
    activeRequests.set(id, { timeoutId, resolve, reject });
    
    // Send request to server
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Start the multi-step initialization sequence
 */
async function startInitializationSequence() {
  console.log('Starting multi-step initialization sequence...');
  
  try {
    // Step 1: Initial Connection - Discovery
    console.log('Step 1: Initial Connection - Discovery');
    const discoveryResponse = await sendRequest('mcp.discovery');
    console.log('Discovery completed successfully');
    
    // Step 2: List Available Tools
    console.log('Step 2: List Available Tools');
    const toolsResponse = await sendRequest('mcp.listTools');
    console.log('Tool listing completed successfully');
    
    // Step 3: Initialize File System
    console.log('Step 3: Initialize File System');
    const filesResponse = await sendRequest('mcp.callTool', {
      name: 'list_files',
      arguments: {
        path: '.',
        recursive: false
      }
    });
    console.log('File system initialization completed successfully');
    
    // Step 4: Read Configuration File
    console.log('Step 4: Read Configuration File');
    try {
      const configResponse = await sendRequest('mcp.callTool', {
        name: 'read_file',
        arguments: {
          path: 'package.json'
        }
      });
      console.log('Configuration file read successfully');
    } catch (error) {
      console.log('No package.json found, continuing initialization');
    }
    
    // Step 5: Execute Initialization Command
    console.log('Step 5: Execute Initialization Command');
    const commandResponse = await sendRequest('mcp.callTool', {
      name: 'execute_command',
      arguments: {
        command: 'echo "Initialization complete"'
      }
    });
    console.log('Initialization command executed successfully');
    
    console.log('Initialization sequence completed successfully');
  } catch (error) {
    console.error('Error during initialization sequence:', error);
  }
}

/**
 * Main function
 */
function main() {
  console.log('Multi-step initialization client started');
  startServer();
  
  // Handle process exit
  process.on('SIGINT', () => {
    console.log('Cleaning up...');
    if (serverProcess) {
      serverProcess.kill();
    }
    process.exit(0);
  });
}

// Start the client
if (require.main === module) {
  main();
}

module.exports = {
  startServer,
  sendRequest,
  startInitializationSequence
};
