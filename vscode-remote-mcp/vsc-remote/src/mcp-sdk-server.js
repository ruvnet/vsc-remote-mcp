/**
 * VSCode Remote MCP Server - SDK Implementation
 *
 * This module implements the MCP server with support for both stdio and WebSocket modes.
 */

// Import required modules
const { tools, toolSchemas } = require('./tools');
const logger = require('./cli/utils/logger');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Define fallback implementations for when the SDK is not available
class FallbackServer {
  constructor(options = {}) {
    this.options = options;
    this.tools = options.tools || {};
    this.resources = options.resources || {};
    if (process.env.MCP_DEBUG === '1') {
      logger.debug('Using fallback Server implementation');
    }
  }

  async serve(transport) {
    if (process.env.MCP_DEBUG === '1') {
      logger.debug('Fallback server started');
    }
    return this;
  }

  connect(transport) {
    if (process.env.MCP_DEBUG === '1') {
      logger.debug('Fallback server connected');
    }
    return Promise.resolve(this);
  }

  disconnect() {
    if (process.env.MCP_DEBUG === '1') {
      logger.debug('Fallback server disconnected');
    }
    return Promise.resolve();
  }

  registerTool(name, tool, schema) {
    this.tools[name] = { tool, schema };
    return this;
  }

  registerResource(uri, resource) {
    this.resources[uri] = resource;
    return this;
  }

  onToolUse(name, handler) {
    this.tools[name] = { handler };
    return this;
  }

  close() {
    if (process.env.MCP_DEBUG === '1') {
      logger.debug('Fallback server closed');
    }
  }
}

class FallbackStdioTransport {
  constructor() {
    if (process.env.MCP_DEBUG === '1') {
      logger.debug('Using fallback StdioServerTransport implementation');
    }
  }
}

class FallbackWebSocketTransport {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.authToken = options.authToken;
    if (process.env.MCP_DEBUG === '1') {
      logger.debug('Using fallback WebSocketServerTransport implementation');
    }
  }
}

// Helper functions for token management
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

function saveTokenToFile(token) {
  const tokenDir = path.join(os.homedir(), '.vsc-remote');
  const tokenFile = path.join(tokenDir, 'auth-token');
  
  // Create directory if it doesn't exist with secure permissions
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { mode: 0o700 });
  }
  
  // Write token to file with secure permissions
  fs.writeFileSync(tokenFile, token, { mode: 0o600 });
  
  return tokenFile;
}

function readTokenFromFile() {
  const tokenFile = path.join(os.homedir(), '.vsc-remote', 'auth-token');
  
  if (fs.existsSync(tokenFile)) {
    return fs.readFileSync(tokenFile, 'utf8').trim();
  }
  
  return null;
}

// Try to import the real SDK, but use fallbacks if not available
let Server, StdioServerTransport, WebSocketServerTransport;
let usingFallback = false;

try {
  // Try different import paths to handle various installation scenarios
  try {
    // First try the direct path to the compiled files
    const serverModule = require('@modelcontextprotocol/sdk/dist/cjs/server');
    const stdioModule = require('@modelcontextprotocol/sdk/dist/cjs/server/stdio');
    const wsModule = require('@modelcontextprotocol/sdk/dist/cjs/server/websocket');
    
    Server = serverModule.Server;
    StdioServerTransport = stdioModule.StdioServerTransport;
    WebSocketServerTransport = wsModule.WebSocketServerTransport;
    
    if (process.env.MCP_DEBUG === '1') {
      logger.debug('Successfully imported SDK using dist/cjs paths');
    }
  } catch (error) {
    // If that fails, try the source files
    try {
      const serverModule = require('@modelcontextprotocol/sdk/src/server');
      const stdioModule = require('@modelcontextprotocol/sdk/src/server/stdio');
      const wsModule = require('@modelcontextprotocol/sdk/src/server/websocket');
      
      Server = serverModule.Server;
      StdioServerTransport = stdioModule.StdioServerTransport;
      WebSocketServerTransport = wsModule.WebSocketServerTransport;
      
      if (process.env.MCP_DEBUG === '1') {
        logger.debug('Successfully imported SDK using src paths');
      }
    } catch (srcError) {
      // If that fails too, try to find the package in node_modules
      try {
        const serverModule = require('vscode-remote-mcp/node_modules/@modelcontextprotocol/sdk/dist/cjs/server');
        const stdioModule = require('vscode-remote-mcp/node_modules/@modelcontextprotocol/sdk/dist/cjs/server/stdio');
        const wsModule = require('vscode-remote-mcp/node_modules/@modelcontextprotocol/sdk/dist/cjs/server/websocket');
        
        Server = serverModule.Server;
        StdioServerTransport = stdioModule.StdioServerTransport;
        WebSocketServerTransport = wsModule.WebSocketServerTransport;
        
        if (process.env.MCP_DEBUG === '1') {
          logger.debug('Successfully imported SDK from node_modules path');
        }
      } catch (nodeModulesError) {
        throw new Error('Could not import SDK from any known location');
      }
    }
  }
} catch (error) {
  if (process.env.MCP_DEBUG === '1') {
    logger.warn('Failed to import MCP SDK components:', error.message);
    logger.warn('Using fallback implementations instead.');
  }
  
  // Use fallback implementations
  Server = FallbackServer;
  StdioServerTransport = FallbackStdioTransport;
  WebSocketServerTransport = FallbackWebSocketTransport;
  usingFallback = true;
}

/**
 * VSCode Remote MCP Server
 *
 * This class provides a wrapper around the MCP SDK Server to make it easier to use.
 * It includes support for both stdio and WebSocket modes, with authentication for WebSocket.
 */
class VSCodeRemoteMcpServer {
  /**
   * Create a new VSCode Remote MCP Server
   * @param {Object} options - Server options
   */
  constructor(options = {}) {
    this.options = options;
    this.mode = process.env.MCP_MODE || options.mode || 'stdio';
    this.port = process.env.MCP_PORT || options.port || 3001;
    this.debug = process.env.MCP_DEBUG === '1' || options.debug || false;
    this.authToken = process.env.MCP_AUTH_TOKEN || options.authToken;
    this.generateNewToken = process.env.MCP_GENERATE_NEW_TOKEN === '1' || options.generateNewToken || false;
    
    // Create the MCP server with server info and capabilities
    this.server = new Server(
      {
        name: 'sparc2-mcp',
        version: '1.0.0',
      },
      {
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
      }
    );
    
    // Set up request handlers
    this.setupRequestHandlers();
  }
  
  /**
   * Set up request handlers for the server
   */
  setupRequestHandlers() {
    // Register tool handlers
    Object.keys(tools).forEach(toolName => {
      this.server.onToolUse(toolName, async (params) => {
        try {
          logger.debug(`Executing tool ${toolName} with params:`, params);
          const result = await tools[toolName](params);
          logger.debug(`Tool ${toolName} execution completed`);
          return result;
        } catch (error) {
          logger.error(`Error executing tool ${toolName}:`, error);
          throw error;
        }
      });
    });
  }
  
  /**
   * Start the server
   * @returns {Promise<VSCodeRemoteMcpServer>} The server instance
   */
  async serve() {
    logger.info('VSCode Remote MCP Server starting...');
    
    try {
      // Determine transport based on environment
      let transport;
      
      if (this.mode === 'websocket') {
        // Set up authentication for WebSocket mode
        let authToken = this.authToken;
        
        if (!authToken) {
          // Check if token exists in file and if we should generate a new one
          const shouldGenerateNewToken = this.generateNewToken;
          
          if (!shouldGenerateNewToken) {
            authToken = readTokenFromFile();
          }
          
          // Generate a new token if none exists or if explicitly requested
          if (!authToken || shouldGenerateNewToken) {
            authToken = generateSecureToken();
            const tokenFile = saveTokenToFile(authToken);
            logger.info(`Generated new authentication token and saved to ${tokenFile}`);
          }
        }
        
        // Store the token for verification
        this.authToken = authToken;
        
        // Create WebSocket transport with authentication
        transport = new WebSocketServerTransport({
          port: this.port,
          authToken: this.authToken,
          verifyClient: (info) => {
            const url = new URL(info.req.url, `http://${info.req.headers.host}`);
            const token = url.searchParams.get('token');
            
            if (!token || token !== this.authToken) {
              logger.warn(`Authentication failed: Invalid token from ${info.req.socket.remoteAddress}`);
              return false;
            }
            
            return true;
          }
        });
        
        logger.info(`Starting WebSocket server on port ${this.port} with authentication`);
        logger.info(`Use the following URL to connect: ws://localhost:${this.port}?token=${this.authToken}`);
      } else {
        // Stdio mode
        transport = new StdioServerTransport();
        logger.info('Starting stdio server');
      }
      
      // Connect the server to the transport
      if (usingFallback) {
        await this.server.serve(transport);
      } else {
        await this.server.connect(transport);
      }
      
      logger.info('VSCode Remote MCP Server running');
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        await this.shutdown();
      });
      
      process.on('SIGTERM', async () => {
        await this.shutdown();
      });
      
      return this;
    } catch (error) {
      logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }
  
  /**
   * Shutdown the server
   */
  async shutdown() {
    logger.info('Shutting down MCP server...');
    try {
      if (usingFallback) {
        this.server.close();
      } else {
        await this.server.disconnect();
      }
      logger.info('MCP server shut down successfully');
    } catch (error) {
      logger.error('Error shutting down MCP server:', error);
    }
    process.exit(0);
  }
  
  /**
   * Close the server (for backward compatibility)
   */
  close() {
    this.shutdown().catch(error => {
      logger.error('Error during server close:', error);
    });
  }
}

module.exports = VSCodeRemoteMcpServer;