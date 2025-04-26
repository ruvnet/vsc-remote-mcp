/**
 * Test script for MCP server timeout handling
 * 
 * This script tests the timeout handling in the MCP server by sending
 * requests that will exceed the timeout limit and verifying the correct
 * error code is returned.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '45000', 10);
const TEST_TIMEOUT = Math.floor(REQUEST_TIMEOUT * 1.5); // 50% longer than the request timeout

// Test cases
const testCases = [
  {
    name: 'Discovery Test',
    method: 'mcp.discovery',
    params: {},
    expectedResult: {
      shouldTimeout: false
    }
  },
  {
    name: 'List Tools Test',
    method: 'mcp.listTools',
    params: {},
    expectedResult: {
      shouldTimeout: false
    }
  },
  {
    name: 'Timeout Test - Long Command',
    method: 'mcp.callTool',
    params: {
      name: 'execute_command',
      arguments: {
        command: `sleep ${Math.ceil(REQUEST_TIMEOUT / 1000 + 5)}` // Sleep longer than the timeout
      }
    },
    expectedResult: {
      shouldTimeout: true,
      expectedErrorCode: -32001
    }
  },
  {
    name: 'Non-Timeout Test - Short Command',
    method: 'mcp.callTool',
    params: {
      name: 'execute_command',
      arguments: {
        command: `sleep ${Math.floor(REQUEST_TIMEOUT / 1000 / 2)}` // Sleep shorter than the timeout
      }
    },
    expectedResult: {
      shouldTimeout: false
    }
  }
];

// Message ID counter
let messageIdCounter = 1;

// Track test results
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

/**
 * Run a single test case
 */
async function runTest(serverProcess, testCase) {
  console.log(`\n=== Running test: ${testCase.name} ===`);
  console.log(`Method: ${testCase.method}`);
  console.log(`Params: ${JSON.stringify(testCase.params)}`);
  
  const id = messageIdCounter++;
  
  return new Promise((resolve) => {
    const request = {
      jsonrpc: '2.0',
      id,
      method: testCase.method,
      params: testCase.params
    };
    
    let responseReceived = false;
    
    // Set a test timeout that's longer than the request timeout
    const testTimeoutId = setTimeout(() => {
      if (!responseReceived) {
        console.log(`❌ TEST FAILED: No response received within ${TEST_TIMEOUT}ms`);
        testResults.failed++;
        testResults.details.push({
          name: testCase.name,
          passed: false,
          error: 'No response received within test timeout'
        });
        resolve();
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
            clearTimeout(testTimeoutId);
            
            if (message.error) {
              console.log(`Received error response: ${JSON.stringify(message.error)}`);
              
              if (testCase.expectedResult.shouldTimeout) {
                if (message.error.code === testCase.expectedResult.expectedErrorCode) {
                  console.log(`✅ TEST PASSED: Received expected timeout error with code ${message.error.code}`);
                  testResults.passed++;
                  testResults.details.push({
                    name: testCase.name,
                    passed: true
                  });
                } else {
                  console.log(`❌ TEST FAILED: Expected error code ${testCase.expectedResult.expectedErrorCode}, got ${message.error.code}`);
                  testResults.failed++;
                  testResults.details.push({
                    name: testCase.name,
                    passed: false,
                    error: `Expected error code ${testCase.expectedResult.expectedErrorCode}, got ${message.error.code}`
                  });
                }
              } else {
                console.log(`❌ TEST FAILED: Received error response but expected success`);
                testResults.failed++;
                testResults.details.push({
                  name: testCase.name,
                  passed: false,
                  error: `Received error response but expected success: ${JSON.stringify(message.error)}`
                });
              }
            } else {
              console.log(`Received success response`);
              
              if (testCase.expectedResult.shouldTimeout) {
                console.log(`❌ TEST FAILED: Expected timeout but received success response`);
                testResults.failed++;
                testResults.details.push({
                  name: testCase.name,
                  passed: false,
                  error: 'Expected timeout but received success response'
                });
              } else {
                console.log(`✅ TEST PASSED: Received expected success response`);
                testResults.passed++;
                testResults.details.push({
                  name: testCase.name,
                  passed: true
                });
              }
            }
            
            resolve();
          }
        } catch (error) {
          console.log(`Non-JSON output: ${line}`);
        }
      }
    };
    
    // Add message handler
    serverProcess.stdout.on('data', messageHandler);
    
    // Send the request
    console.log(`Sending request: ${JSON.stringify(request)}`);
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // Clean up handler when done
    const cleanup = () => {
      serverProcess.stdout.removeListener('data', messageHandler);
    };
    
    // Ensure cleanup happens
    resolve.then(cleanup, cleanup);
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting MCP server for timeout tests...');
  
  // Start the server
  const serverProcess = spawn('node', [path.join(__dirname, 'run-mcp-server.js')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      REQUEST_TIMEOUT: REQUEST_TIMEOUT.toString()
    }
  });
  
  // Log server output to console
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data.toString()}`);
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`\n=== Running timeout tests with REQUEST_TIMEOUT=${REQUEST_TIMEOUT}ms ===`);
  
  // Run each test case
  for (const testCase of testCases) {
    await runTest(serverProcess, testCase);
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print test summary
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log('\nFailed tests:');
    testResults.details.filter(d => !d.passed).forEach(detail => {
      console.log(`- ${detail.name}: ${detail.error}`);
    });
  }
  
  // Write test results to file
  const resultsFile = path.join(__dirname, 'timeout-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    requestTimeout: REQUEST_TIMEOUT,
    results: testResults
  }, null, 2));
  
  console.log(`\nTest results written to ${resultsFile}`);
  
  // Clean up
  console.log('\nCleaning up...');
  serverProcess.kill();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});