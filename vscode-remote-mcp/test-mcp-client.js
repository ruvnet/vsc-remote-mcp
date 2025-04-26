/**
 * Test client for the VSCode Remote MCP Server
 * 
 * This script tests the basic functionality of the MCP server by:
 * 1. Sending a discovery request
 * 2. Listing available tools
 * 3. Testing each tool with sample parameters
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const config = {
  serverScript: path.join(__dirname, 'run-mcp-server.js'),
  testDirectory: '/workspaces/edge-agents',
  testFile: '/workspaces/edge-agents/README.md',
  testCommand: 'ls -la'
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
  // Handle notifications
  if (message.method && message.method === 'server_ready') {
    console.log('Server is ready, starting tests...');
    runTests();
    return;
  }
  
  // Handle responses
  if (message.id && pendingRequests.has(message.id)) {
    const { resolve, reject, description } = pendingRequests.get(message.id);
    pendingRequests.delete(message.id);
    
    console.log(`Received response for: ${description}`);
    
    if (message.error) {
      console.error(`Error: ${JSON.stringify(message.error)}`);
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
 * Run all tests
 */
async function runTests() {
  try {
    // Test 1: Discovery
    console.log('\n=== Test 1: Discovery ===');
    const discoveryResult = await sendRequest('mcp.discovery', {}, 'Discovery request');
    console.log('Server info:', discoveryResult.server);
    console.log('Capabilities:', Object.keys(discoveryResult.capabilities.tools));
    
    // Test 2: List Tools
    console.log('\n=== Test 2: List Tools ===');
    const toolsResult = await sendRequest('mcp.listTools', {}, 'List tools request');
    console.log('Available tools:', toolsResult.tools.map(t => t.name));
    
    // Test 3: List Files
    console.log('\n=== Test 3: List Files ===');
    const listFilesResult = await sendRequest('mcp.callTool', {
      name: 'list_files',
      arguments: {
        path: config.testDirectory,
        recursive: false
      }
    }, 'List files request');
    console.log('Files found:', listFilesResult.files.length);
    console.log('First 5 files:', listFilesResult.files.slice(0, 5));
    
    // Test 4: Read File
    console.log('\n=== Test 4: Read File ===');
    const readFileResult = await sendRequest('mcp.callTool', {
      name: 'read_file',
      arguments: {
        path: config.testFile
      }
    }, 'Read file request');
    console.log('File lines:', readFileResult.lines);
    console.log('First 100 characters:', readFileResult.text.substring(0, 100) + '...');
    
    // Test 5: Execute Command
    console.log('\n=== Test 5: Execute Command ===');
    const executeCommandResult = await sendRequest('mcp.callTool', {
      name: 'execute_command',
      arguments: {
        command: config.testCommand,
        cwd: config.testDirectory
      }
    }, 'Execute command request');
    console.log('Command success:', executeCommandResult.success);
    console.log('Command output first 100 chars:', executeCommandResult.stdout.substring(0, 100) + '...');
    
    console.log('\n=== All tests completed successfully! ===');
    
    // Clean up
    cleanup();
  } catch (error) {
    console.error('Test failed:', error);
    cleanup();
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

// Log startup message
console.log('MCP client test started. Press Ctrl+C to exit.');