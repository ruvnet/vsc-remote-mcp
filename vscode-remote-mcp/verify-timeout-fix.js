/**
 * Verification script for timeout handling fix
 * 
 * This script tests the timeout handling in the MCP server to verify
 * that the fix for error code -32001 is working correctly.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const config = {
  serverScript: path.join(__dirname, 'run-mcp-server.js'),
  timeoutCommand: 'sleep 60', // Command that will exceed the timeout
  normalCommand: 'echo "Server is responsive"',
  expectedErrorCode: -32001 // The correct error code we expect for timeouts
};

// Store server process
let serverProcess = null;
let messageIdCounter = 1;

// Track pending requests
const pendingRequests = new Map();

/**
 * Start the MCP server process
 */
function startServer() {
  console.log('Starting MCP server...');
  
  // Spawn server process with stdio pipes
  serverProcess = spawn('node', [config.serverScript], {
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
      params
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
    
    console.log('\n=== Testing timeout error code ===');
    console.log(`Executing command that should time out: ${config.timeoutCommand}`);
    console.log('Waiting for timeout response...');
    
    try {
      await sendRequest('mcp.callTool', {
        name: 'execute_command',
        arguments: {
          command: config.timeoutCommand
        }
      }, 'Command that should time out');
      
      console.log('❌ ERROR: Command did not time out as expected');
      process.exit(1);
    } catch (error) {
      console.log('Command timed out with error:', error);
      
      // Verify the error code is correct
      if (error.code === config.expectedErrorCode) {
        console.log(`✅ SUCCESS: Received correct error code ${config.expectedErrorCode}`);
      } else {
        console.log(`❌ ERROR: Expected error code ${config.expectedErrorCode}, but got ${error.code}`);
        process.exit(1);
      }
    }
    
    console.log('\n=== Testing server responsiveness ===');
    console.log('Sending a normal command to verify server is still responsive...');
    
    try {
      const result = await sendRequest('mcp.callTool', {
        name: 'execute_command',
        arguments: {
          command: config.normalCommand
        }
      }, 'Normal command after timeout');
      
      console.log('Server response:', result);
      console.log('✅ SUCCESS: Server is responsive after timeout');
    } catch (error) {
      console.log('❌ ERROR: Server is not responsive after timeout:', error);
      process.exit(1);
    }
    
    console.log('\n=== Verification completed successfully ===');
    
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
console.log('Timeout fix verification started. Press Ctrl+C to exit.');