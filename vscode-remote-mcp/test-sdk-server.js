/**
 * Test script for the MCP SDK server implementation
 * 
 * This script tests the initialization and tool registration of the MCP SDK server.
 * It simulates client requests to verify proper server functionality.
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

// Set debug mode for the server
process.env.MCP_DEBUG = '1';

// Test configuration
const TEST_TIMEOUT = 10000; // 10 seconds
const SERVER_PATH = path.join(__dirname, 'run-mcp-server.js');

/**
 * Run a test for the MCP server
 */
async function runTest() {
  console.log('Starting MCP SDK server test...');
  
  // Start the server process
  const serverProcess = spawn('node', [SERVER_PATH], {
    stdio: ['pipe', 'pipe', process.stderr]
  });
  
  // Create readline interface for server output
  const rl = readline.createInterface({
    input: serverProcess.stdout,
    crlfDelay: Infinity
  });
  
  // Set up timeout
  const timeout = setTimeout(() => {
    console.error('Test timed out after', TEST_TIMEOUT, 'ms');
    serverProcess.kill();
    process.exit(1);
  }, TEST_TIMEOUT);
  
  try {
    // Wait for server to initialize
    console.log('Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test listTools request
    console.log('Testing listTools request...');
    const listToolsResult = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: '1',
      method: 'tools/list',
      params: {}
    });
    
    console.log('ListTools response:', JSON.stringify(listToolsResult, null, 2));
    
    // Verify listTools response
    if (!listToolsResult.result || !listToolsResult.result.tools) {
      throw new Error('Invalid listTools response');
    }
    
    // Verify all tools are registered
    const toolNames = listToolsResult.result.tools.map(tool => tool.name);
    const requiredTools = [
      'analyze_code',
      'modify_code',
      'search_code',
      'deploy_vscode_instance',
      'list_vscode_instances',
      'stop_vscode_instance',
      'manage_job_resources'
    ];
    
    for (const toolName of requiredTools) {
      if (!toolNames.includes(toolName)) {
        throw new Error(`Required tool not registered: ${toolName}`);
      }
    }
    
    console.log('All required tools are registered');
    
    // Test callTool request with analyze_code
    console.log('Testing callTool request...');
    const callToolResult = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools/call',
      params: {
        name: 'analyze_code',
        arguments: {
          file_path: 'src/mcp-sdk-server.js',
          include_metrics: true
        }
      }
    });
    
    console.log('CallTool response:', JSON.stringify(callToolResult, null, 2));
    
    // Verify callTool response
    if (callToolResult.error) {
      throw new Error(`CallTool error: ${callToolResult.error.message}`);
    }
    
    // Test successful
    console.log('MCP SDK server test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    clearTimeout(timeout);
    serverProcess.kill();
    rl.close();
  }
}

/**
 * Send a request to the server and wait for the response
 * @param {ChildProcess} serverProcess - Server process
 * @param {object} request - Request to send
 * @returns {Promise<object>} Response
 */
function sendRequest(serverProcess, request) {
  return new Promise((resolve, reject) => {
    // Set up response handler
    const responseHandler = (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.id === request.id) {
          serverProcess.stdout.removeListener('data', responseHandler);
          resolve(response);
        }
      } catch (error) {
        // Ignore non-JSON data
      }
    };
    
    // Listen for response
    serverProcess.stdout.on('data', responseHandler);
    
    // Send request
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // Set timeout for response
    setTimeout(() => {
      serverProcess.stdout.removeListener('data', responseHandler);
      reject(new Error(`Request timed out: ${request.method}`));
    }, 5000);
  });
}

// Run the test
runTest().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});