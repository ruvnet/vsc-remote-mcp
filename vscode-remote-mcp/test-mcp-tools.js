/**
 * Test MCP Tools
 * 
 * This script tests the MCP tools by sending requests to the MCP server.
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Message ID counter
let messageIdCounter = 1;

// Active requests with their promises
const activeRequests = new Map();

// Start the MCP server
const server = spawn('node', ['run-mcp-server.js'], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// Set up readline interface for stdout
const rl = readline.createInterface({
  input: server.stdout,
  output: null,
  terminal: false
});

// Handle server output
rl.on('line', (line) => {
  if (line.trim()) {
    try {
      const message = JSON.parse(line);
      
      // Handle response
      if (message.id && activeRequests.has(message.id)) {
        const { resolve, reject } = activeRequests.get(message.id);
        activeRequests.delete(message.id);
        
        if (message.error) {
          reject(message.error);
        } else {
          resolve(message.result);
        }
      }
    } catch (error) {
      console.error(`Error parsing server output: ${error.message}`);
    }
  }
});

/**
 * Send a request to the MCP server
 * @param {string} method - Method name
 * @param {Object} params - Method parameters
 * @returns {Promise<Object>} Response
 */
function sendRequest(method, params) {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    activeRequests.set(id, { resolve, reject });
    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Initialize the MCP server
 * @returns {Promise<Object>} Initialization result
 */
async function initialize() {
  return sendRequest('initialize', {
    capabilities: {}
  });
}

/**
 * Discover MCP server capabilities
 * @returns {Promise<Object>} Discovery result
 */
async function discover() {
  return sendRequest('mcp.discovery', {});
}

/**
 * List available tools
 * @returns {Promise<Object>} Tools list
 */
async function listTools() {
  return sendRequest('mcp.listTools', {});
}

/**
 * Call an MCP tool
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} Tool result
 */
async function callTool(name, args) {
  return sendRequest('mcp.callTool', {
    name,
    arguments: args
  });
}

/**
 * Run tests
 */
async function runTests() {
  try {
    console.log('Initializing MCP server...');
    const initResult = await initialize();
    console.log('Initialization result:', JSON.stringify(initResult, null, 2));
    
    console.log('\nDiscovering MCP server capabilities...');
    const discoveryResult = await discover();
    console.log('Discovery result:', JSON.stringify(discoveryResult, null, 2));
    
    console.log('\nListing available tools...');
    const toolsResult = await listTools();
    console.log('Tools result:', JSON.stringify(toolsResult, null, 2));
    
    // Test analyze_code tool
    console.log('\nTesting analyze_code tool...');
    try {
      const analyzeResult = await callTool('analyze_code', {
        file_path: 'run-mcp-server.js'
      });
      console.log('Analyze result:', JSON.stringify(analyzeResult, null, 2));
    } catch (error) {
      console.error('Error testing analyze_code:', error);
    }
    
    // Test search_code tool
    console.log('\nTesting search_code tool...');
    try {
      const searchResult = await callTool('search_code', {
        pattern: 'function',
        directory: '.',
        file_pattern: '*.js',
        context_lines: 2
      });
      console.log('Search result:', JSON.stringify(searchResult, null, 2));
    } catch (error) {
      console.error('Error testing search_code:', error);
    }
    
    // Test list_vscode_instances tool
    console.log('\nTesting list_vscode_instances tool...');
    try {
      const listResult = await callTool('list_vscode_instances', {});
      console.log('List result:', JSON.stringify(listResult, null, 2));
    } catch (error) {
      console.error('Error testing list_vscode_instances:', error);
    }
    
    console.log('\nTests completed successfully!');
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Clean up
    server.stdin.end();
    rl.close();
    server.kill();
  }
}

// Run tests
runTests();