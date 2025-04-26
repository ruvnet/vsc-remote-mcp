/**
 * VSCode Remote MCP Client using stdio protocol
 * 
 * This script connects to the MCP server using stdio protocol and provides
 * a simple interface for VSCode extensions to interact with the server.
 */

const { spawn } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuration
const config = {
  serverScript: path.join(__dirname, 'run-mcp-server.js'),
  clientId: `stdio-client-${uuidv4().substring(0, 8)}`,
  workspaceId: `stdio-workspace-${uuidv4().substring(0, 8)}`,
  sessionId: `stdio-session-${uuidv4().substring(0, 8)}`,
  requestTimeout: 50000, // 50 seconds timeout (slightly more than server's 45s)
  maxRetries: 3, // Maximum number of retries for failed requests
  retryDelay: 1000 // Delay between retries in milliseconds
};

// Store server process
let serverProcess = null;
let messageIdCounter = 1;
let serverReady = false;
let serverStartTime = 0;

// Track pending requests
const pendingRequests = new Map();

// Server health monitoring
let serverHealthCheckInterval = null;
let lastResponseTime = 0;

/**
 * Start the MCP server process with stdio communication
 */
function startServer() {
  console.error('Starting MCP server with stdio communication...');
  serverStartTime = Date.now();
  
  // Kill any existing server process
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (error) {
      console.error('Error killing existing server process:', error);
    }
  }
  
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
          console.error(`Server output (non-JSON): ${line}`);
        }
      }
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data.toString()}`);
  });
  
  serverProcess.on('close', (code) => {
    console.error(`Server process exited with code ${code}`);
    serverReady = false;
    
    // Reject all pending requests
    for (const [id, { reject, description }] of pendingRequests.entries()) {
      reject(new Error(`Server process exited with code ${code} while processing: ${description}`));
    }
    pendingRequests.clear();
    
    // Notify about server exit
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      method: 'server_exit',
      params: { code }
    }));
    
    // Restart server if it crashed
    if (code !== 0) {
      console.error('Server crashed, restarting...');
      setTimeout(startServer, 1000);
    }
  });
  
  // Handle server process errors
  serverProcess.on('error', (error) => {
    console.error(`Server process error: ${error.message}`);
    serverReady = false;
    
    // Notify about server error
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      method: 'server_error',
      params: { error: error.message }
    }));
  });
  
  // Start server health monitoring
  startServerHealthMonitoring();
}

/**
 * Start monitoring server health
 */
function startServerHealthMonitoring() {
  // Clear any existing interval
  if (serverHealthCheckInterval) {
    clearInterval(serverHealthCheckInterval);
  }
  
  // Check server health every 30 seconds (reduced frequency to prevent overlapping requests)
  serverHealthCheckInterval = setInterval(() => {
    if (!serverProcess) {
      console.error('Server process not found during health check, restarting...');
      startServer();
      return;
    }
    
    // Check if server has been unresponsive for too long
    const now = Date.now();
    if (serverReady && lastResponseTime > 0 && (now - lastResponseTime) > 120000) {
      console.error('Server has been unresponsive for too long, restarting...');
      startServer();
      return;
    }
    
    // Send a ping to check if server is responsive
    if (serverReady) {
      sendRequest('mcp.discovery', {}, 'Health check discovery')
        .then(() => {
          // Server is responsive
          lastResponseTime = Date.now();
        })
        .catch(error => {
          console.error('Health check failed:', error);
          // If health check fails multiple times, restart server
          if ((now - lastResponseTime) > 90000) {
            console.error('Multiple health checks failed, restarting server...');
            startServer();
          }
        });
    }
  }, 30000);
}

/**
 * Handle messages from the server
 */
function handleServerMessage(message) {
  // Update last response time
  lastResponseTime = Date.now();
  
  // Handle notifications
  if (message.method && message.method === 'server_ready') {
    console.error('Server is ready, sending discovery request...');
    serverReady = true;
    sendDiscoveryRequest();
    return;
  }
  
  // Handle responses
  if (message.id && pendingRequests.has(message.id)) {
    const { resolve, reject, description, timeoutId, retryCount } = pendingRequests.get(message.id);
    pendingRequests.delete(message.id);
    
    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    console.error(`Received response for: ${description}`);
    
    if (message.error) {
      console.error(`Error: ${JSON.stringify(message.error)}`);
      
      // If this was a timeout error and we haven't exceeded max retries, retry the request
      if (message.error.code === -32001 && retryCount < config.maxRetries) {
        console.error(`Retrying request after timeout: ${description} (attempt ${retryCount + 1}/${config.maxRetries})`);
        // Don't reject yet, we'll retry
        setTimeout(() => {
          // The original request info is lost, but we can notify that we're retrying
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            method: 'request_retry',
            params: { 
              id: message.id, 
              description,
              attempt: retryCount + 1,
              maxRetries: config.maxRetries
            }
          }));
        }, config.retryDelay);
      } else {
        reject(message.error);
      }
    } else {
      resolve(message.result);
      
      // Handle specific responses
      if (description === 'Discovery request') {
        console.error('Discovery completed, server is ready for commands');
        // You can add additional initialization here if needed
      }
    }
  }
  
  // Forward all messages to stdout for the VSCode extension
  console.log(JSON.stringify(message));
}

/**
 * Send a request to the server with retry capability
 */
function sendRequest(method, params, description, retryCount = 0) {
  return new Promise((resolve, reject) => {
    if (!serverProcess) {
      reject(new Error('Server process not started'));
      return;
    }
    
    const id = messageIdCounter++;
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        const error = { code: -32001, message: 'Request timed out' };
        console.error(`Request timed out: ${description}`);
        
        // Send timeout notification to stdout
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          method: 'request_timeout',
          params: { id, method, description }
        }));
        
        // If we haven't exceeded max retries, retry the request
        if (retryCount < config.maxRetries) {
          console.error(`Retrying request after timeout: ${description} (attempt ${retryCount + 1}/${config.maxRetries})`);
          setTimeout(() => {
            sendRequest(method, params, description, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, config.retryDelay);
        } else {
          reject(error);
        }
      }
    }, config.requestTimeout);
    
    // Store the promise callbacks
    pendingRequests.set(id, { resolve, reject, description, timeoutId, retryCount });
    
    // Create the request
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    console.error(`Sending request: ${description}${retryCount > 0 ? ` (retry ${retryCount}/${config.maxRetries})` : ''}`);
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Send discovery request
 */
function sendDiscoveryRequest() {
  sendRequest('mcp.discovery', {}, 'Discovery request')
    .then(result => {
      console.error('Discovery successful:', result.server.name, result.server.version);
      
      // Notify about successful discovery
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        method: 'discovery_complete',
        params: { server: result.server }
      }));
    })
    .catch(error => {
      console.error('Discovery request failed:', error);
      
      // Retry discovery after a delay
      setTimeout(() => {
        console.error('Retrying discovery...');
        sendDiscoveryRequest();
      }, 2000);
    });
}

/**
 * Process incoming messages from VSCode extension
 */
function processStdinMessages() {
  // Set up stdin to receive messages from VSCode extension
  process.stdin.setEncoding('utf8');
  
  process.stdin.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          handleClientMessage(message);
        } catch (error) {
          console.error(`Failed to parse client message: ${error.message}`);
          
          // Notify about parse error
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32700,
              message: `Parse error: ${error.message}`
            }
          }));
        }
      }
    }
  });
  
  // Handle stdin errors
  process.stdin.on('error', (error) => {
    console.error(`Stdin error: ${error.message}`);
  });
  
  // Handle stdin close
  process.stdin.on('close', () => {
    console.error('Stdin closed, shutting down...');
    cleanup();
    process.exit(0);
  });
}

/**
 * Handle messages from the VSCode extension
 */
function handleClientMessage(message) {
  if (!message.method) {
    console.error('Invalid client message, missing method:', message);
    
    // Notify about invalid request
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32600,
        message: 'Invalid request: missing method'
      }
    }));
    
    return;
  }
  
  // Check if server is ready
  if (!serverReady) {
    // If server is starting up, wait a bit
    if (Date.now() - serverStartTime < 5000) {
      console.error('Server is starting up, queuing request...');
      setTimeout(() => handleClientMessage(message), 1000);
      return;
    }
    
    console.error('Server not ready, restarting...');
    
    // Notify about server not ready
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32603,
        message: 'Server not ready'
      }
    }));
    
    // Try to restart the server
    startServer();
    
    // Queue the message to be sent after server is ready
    setTimeout(() => {
      if (serverReady) {
        handleClientMessage(message);
      } else {
        console.error('Server still not ready after restart, dropping request');
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message: 'Server failed to start'
          }
        }));
      }
    }, 5000);
    
    return;
  }
  
  // Forward the message to the server
  if (serverProcess) {
    serverProcess.stdin.write(JSON.stringify(message) + '\n');
  } else {
    console.error('Cannot forward message, server not running');
    
    // Notify about server not running
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32603,
        message: 'Server not running'
      }
    }));
    
    // Try to restart the server
    startServer();
  }
}

/**
 * Clean up resources
 */
function cleanup() {
  // Clear server health check interval
  if (serverHealthCheckInterval) {
    clearInterval(serverHealthCheckInterval);
    serverHealthCheckInterval = null;
  }
  
  if (serverProcess) {
    console.error('Cleaning up...');
    
    // Reject all pending requests
    for (const [id, { reject, description }] of pendingRequests.entries()) {
      reject(new Error(`Client shutting down while processing: ${description}`));
    }
    pendingRequests.clear();
    
    // Kill the server process
    serverProcess.kill();
    serverProcess = null;
  }
}

// Set up cleanup on exit
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  
  // Notify about uncaught exception
  console.log(JSON.stringify({
    jsonrpc: '2.0',
    method: 'client_error',
    params: { error: error.message, stack: error.stack }
  }));
  
  cleanup();
  process.exit(1);
});

// Start the server
startServer();

// Process messages from VSCode extension
processStdinMessages();

// Log startup message
console.error('Stdio MCP client started. Press Ctrl+C to exit.');