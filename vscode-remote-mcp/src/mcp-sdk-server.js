/**
 * VSCode Remote MCP Server - SDK Implementation
 * 
 * This file implements an MCP server using the official MCP SDK.
 * It handles initialization, tool registration, and request handling
 * for VSCode Remote integration.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} = require('@modelcontextprotocol/sdk/types.js');

// Import tools
const { tools, toolSchemas } = require('./tools');

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

class VSCodeRemoteMcpServer {
  constructor() {
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
   * Set up request handlers for the MCP server
   */
  setupRequestHandlers() {
    // Handle listTools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      debugLog('Handling listTools request');
      
      const toolsList = Object.keys(tools).map(name => ({
        name,
        description: this.getToolDescription(name),
        inputSchema: toolSchemas[name]
      }));

      return {
        tools: toolsList
      };
    });

    // Handle callTool request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      debugLog('Handling callTool request:', name, args);

      if (!name) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Tool name is required'
        );
      }

      if (!tools[name]) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool not found: ${name}`
        );
      }

      try {
        const result = await tools[name](args || {});

        if (result && result.error) {
          throw new McpError(
            result.error.code || ErrorCode.InternalError,
            result.error.message || 'Unknown error'
          );
        }

        return result || {};
      } catch (error) {
        console.error(`Error calling tool ${name}:`, error);

        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Error calling tool ${name}: ${error.message || 'Unknown error'}`
        );
      }
    });
  }

  /**
   * Get tool description
   * @param {string} name - Tool name
   * @returns {string} Tool description
   */
  getToolDescription(name) {
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

  /**
   * Start the server
   */
  async serve() {
    console.error('VSCode Remote MCP Server starting...');
    
    try {
      // Create a stdio transport
      const transport = new StdioServerTransport();
      
      // Connect the server to the transport
      await this.server.connect(transport);
      
      console.error('VSCode Remote MCP Server running on stdio');
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        await this.shutdown();
      });
      
      process.on('SIGTERM', async () => {
        await this.shutdown();
      });
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }

  /**
   * Shutdown the server
   */
  async shutdown() {
    console.error('Shutting down MCP server...');
    
    try {
      await this.server.close();
      console.error('MCP server shut down successfully');
    } catch (error) {
      console.error('Error shutting down MCP server:', error);
    }
    
    process.exit(0);
  }
}

module.exports = VSCodeRemoteMcpServer;