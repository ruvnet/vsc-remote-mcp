/**
 * Simple MCP Server Implementation
 * 
 * This is a minimal implementation of an MCP server that handles the basic
 * protocol without relying on the SDK. It implements the core functionality
 * needed to respond to initialization, heartbeats, and tool requests.
 */

const { tools, toolSchemas } = require('./tools');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

// Debug mode
const DEBUG_MODE = process.env.MCP_DEBUG === '1';

/**
 * Debug logging
 * @param {...any} args - Arguments to log
 */
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.error('[MCP-DEBUG]', ...args);
  }
}

/**
 * Get tool description
 * @param {string} name - Tool name
 * @returns {string} Tool description
 */
function getToolDescription(name) {
  switch (name) {
    case 'analyze_code':
      return 'Analyze code files and provide insights about their structure, complexity, and potential issues';
    case 'modify_code':
      return 'Modify code files with various operations like adding, updating, or removing code segments';
    case 'search_code':
      return 'Search for patterns in code files and return matching results with context';
    case 'deploy_vscode_instance':
      return 'Deploy a new VSCode instance using Docker';
    case 'list_vscode_instances':
      return 'List all deployed VSCode instances and their status';
    case 'stop_vscode_instance':
      return 'Stop a running VSCode instance';
    case 'manage_job_resources':
      return 'Manage resources for VSCode instances and associated jobs';
    default:
      return 'Unknown tool';
  }
}

class SimpleMcpServer {
  constructor() {
    this.initialized = false;
    this.requestMap = new Map();
    this.heartbeatInterval = null;
    this.lastHeartbeat = Date.now();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: null,
      terminal: false
    });
  }

  /**
   * Start the server
   */
  async serve() {
    console.error('Simple MCP Server starting...');
    
    // Set up input handling
    this.rl.on('line', (line) => {
      try {
        const message = JSON.parse(line);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Set up heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 10000); // Send heartbeat every 10 seconds

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    console.error('Simple MCP Server started');
  }

  /**
   * Send a message to the client
   * @param {object} message - Message to send
   */
  sendMessage(message) {
    console.log(JSON.stringify(message));
  }

  /**
   * Send a heartbeat message
   */
  sendHeartbeat() {
    this.sendMessage({
      jsonrpc: '2.0',
      method: 'mcp.heartbeat',
      params: {
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Handle an incoming message
   * @param {object} message - Message to handle
   */
  handleMessage(message) {
    debugLog('Received message:', message);

    // Handle request
    if (message.method && message.id) {
      this.handleRequest(message);
    }
    // Handle notification
    else if (message.method && !message.id) {
      this.handleNotification(message);
    }
    // Handle response (not expected in server)
    else if (message.id && (message.result !== undefined || message.error !== undefined)) {
      console.error('Unexpected response received:', message);
    }
    // Invalid message
    else {
      console.error('Invalid message received:', message);
    }
  }

  /**
   * Handle a request
   * @param {object} request - Request to handle
   */
  async handleRequest(request) {
    const { id, method, params } = request;

    try {
      let result;

      switch (method) {
        case 'mcp.initialize':
          result = await this.handleInitialize(params);
          break;
        case 'mcp.listTools':
          result = await this.handleListTools(params);
          break;
        case 'mcp.callTool':
          result = await this.handleCallTool(params);
          break;
        default:
          return this.sendError(id, -32601, `Method not found: ${method}`);
      }

      this.sendResponse(id, result);
    } catch (error) {
      console.error(`Error handling request ${method}:`, error);
      
      if (error.code && error.message) {
        this.sendError(id, error.code, error.message);
      } else {
        this.sendError(id, -32000, error.message || 'Unknown error');
      }
    }
  }

  /**
   * Handle a notification
   * @param {object} notification - Notification to handle
   */
  handleNotification(notification) {
    const { method, params } = notification;

    switch (method) {
      case 'mcp.heartbeat':
        this.lastHeartbeat = Date.now();
        break;
      case 'mcp.shutdown':
        this.shutdown();
        break;
      default:
        console.error(`Unknown notification method: ${method}`);
    }
  }

  /**
   * Send a response
   * @param {string|number} id - Request ID
   * @param {object} result - Result object
   */
  sendResponse(id, result) {
    this.sendMessage({
      jsonrpc: '2.0',
      id,
      result
    });
  }

  /**
   * Send an error
   * @param {string|number} id - Request ID
   * @param {number} code - Error code
   * @param {string} message - Error message
   * @param {object} data - Additional error data
   */
  sendError(id, code, message, data) {
    this.sendMessage({
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    });
  }

  /**
   * Handle initialize request
   * @param {object} params - Request parameters
   * @returns {object} Initialize result
   */
  async handleInitialize(params) {
    debugLog('Handling initialize request:', params);

    if (this.initialized) {
      throw { code: -32002, message: 'Server already initialized' };
    }

    this.initialized = true;

    return {
      serverInfo: {
        name: 'sparc2-mcp',
        version: '1.0.0',
      },
      capabilities: {
        tools: {
          analyze_code: true,
          modify_code: true,
          search_code: true,
          deploy_vscode_instance: true,
          list_vscode_instances: true,
          stop_vscode_instance: true,
          manage_job_resources: true
        },
      },
      protocolVersion: '2024-11-05'
    };
  }

  /**
   * Handle listTools request
   * @param {object} params - Request parameters
   * @returns {object} List tools result
   */
  async handleListTools(params) {
    debugLog('Handling listTools request:', params);

    if (!this.initialized) {
      throw { code: -32002, message: 'Server not initialized' };
    }

    const toolsList = Object.keys(tools).map(name => ({
      name,
      description: getToolDescription(name),
      inputSchema: toolSchemas[name]
    }));

    return {
      tools: toolsList
    };
  }

  /**
   * Handle callTool request
   * @param {object} params - Request parameters
   * @returns {object} Call tool result
   */
  async handleCallTool(params) {
    debugLog('Handling callTool request:', params);

    if (!this.initialized) {
      throw { code: -32002, message: 'Server not initialized' };
    }

    const { name, arguments: args } = params;

    if (!name) {
      throw { code: -32602, message: 'Tool name is required' };
    }

    if (!tools[name]) {
      throw { code: -32601, message: `Tool not found: ${name}` };
    }

    try {
      const result = await tools[name](args || {});

      if (result && result.error) {
        throw {
          code: result.error.code || -32000,
          message: result.error.message || 'Unknown error'
        };
      }

      return result || {};
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error);

      if (error.code && error.message) {
        throw error;
      }

      throw {
        code: -32000,
        message: `Error calling tool ${name}: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Shutdown the server
   */
  shutdown() {
    console.error('Shutting down MCP server...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.rl.close();
    
    process.exit(0);
  }
}

module.exports = SimpleMcpServer;