/**
 * Test script for verifying the timeout fix
 * 
 * This script tests the timeout handling in the MCP server by sending
 * a request that will exceed the timeout limit and verifying the correct
 * error code (-32001) is returned.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '45000', 10);
const TEST_TIMEOUT = Math.floor(REQUEST_TIMEOUT * 1.5); // 50% longer than the request timeout

// Message ID counter
let messageIdCounter = 1;

// Server process
let serverProcess = null;

/**
 * Start the MCP server
 */
function startServer() {
  console.log('Starting MCP server...');
  
  serverProcess = spawn('node', [path.join(__dirname, 'run-mcp-server.js')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      REQUEST_TIMEOUT: REQUEST_TIMEOUT.toString()
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data.toString().trim()}`);
  });
  
  return serverProcess;
}

/**
 * Send a request to the server
 */
function sendRequest(serverProcess, method, params) {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    console.log(`Sending request: ${JSON.stringify(request)}`);
    
    let responseReceived = false;
    let responseData = null;
    
    // Set a timeout for the test
    const testTimeoutId = setTimeout(() => {
      if (!responseReceived) {
        cleanup();
        reject(new Error(`Test timed out after ${TEST_TIMEOUT}ms`));
      }
    }, TEST_TIMEOUT);
    
    // Handle server response
    const messageHandler = (data) => {
      const lines = data.toString().trim().split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const message = JSON.parse(line);
          
          // Skip heartbeat messages
          if (message.method === 'mcp.heartbeat') continue;
          
          // Check if this is a response to our request
          if (message.id === id) {
            responseReceived = true;
            responseData = message;
            clearTimeout(testTimeoutId);
            
            if (message.error) {
              reject(message.error);
            } else {
              resolve(message.result);
            }
            
            // Remove the message handler
            serverProcess.stdout.removeListener('data', messageHandler);
          }
        } catch (error) {
          console.log(`Non-JSON output: ${line}`);
        }
      }
    };
    
    // Add message handler
    serverProcess.stdout.on('data', messageHandler);
    
    // Send the request
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
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

/**
 * Run the test
 */
async function runTest() {
  try {
    console.log(`Testing timeout handling with REQUEST_TIMEOUT=${REQUEST_TIMEOUT}ms`);
    
    // Start the server
    const server = startServer();
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 1: Discovery (should succeed quickly)
    console.log('\n=== Test 1: Discovery ===');
    try {
      const discoveryResult = await sendRequest(server, 'mcp.discovery', {});
      console.log('Discovery successful:', discoveryResult);
      console.log('✅ Test 1 passed: Discovery works');
    } catch (error) {
      console.error('❌ Test 1 failed: Discovery error:', error);
      cleanup();
      process.exit(1);
    }
    
    // Test 2: Timeout test (should fail with -32001)
    console.log('\n=== Test 2: Timeout Test ===');
    try {
      // Create a tool call that will exceed the timeout
      // We'll use search_code with a complex pattern that will take time
      console.log('Executing a search operation that should timeout');
      
      await sendRequest(server, 'mcp.callTool', {
        name: 'search_code',
        arguments: {
          pattern: '.*',
          directory: '/',
          file_pattern: '*',
          max_results: 1000000,
          context_lines: 10
        }
      });
      
      console.log('❌ Test 2 failed: Command did not timeout as expected');
      cleanup();
      process.exit(1);
    } catch (error) {
      console.log('Command timed out with error:', error);
      
      if (error.code === -32001) {
        console.log('✅ Test 2 passed: Received correct timeout error code -32001');
      } else {
        console.log(`❌ Test 2 failed: Expected error code -32001, got ${error.code}`);
        cleanup();
        process.exit(1);
      }
    }
    
    // Test 3: Server responsiveness after timeout
    console.log('\n=== Test 3: Server Responsiveness After Timeout ===');
    try {
      const result = await sendRequest(server, 'mcp.callTool', {
        name: 'list_vscode_instances',
        arguments: {
          status: 'all'
        }
      });
      
      console.log('Command result:', result);
      console.log('✅ Test 3 passed: Server is still responsive after timeout');
    } catch (error) {
      console.log('❌ Test 3 failed: Server is not responsive after timeout:', error);
      cleanup();
      process.exit(1);
    }
    
    console.log('\n=== All tests passed! ===');
    console.log('The timeout fix is working correctly.');
    
    // Clean up
    cleanup();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    cleanup();
    process.exit(1);
  }
}

// Handle process exit
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

// Run the test
runTest();