/**
 * MCP Server for VSCode Remote MCP
 * 
 * This server implements the Model Context Protocol (MCP) using the official SDK.
 * It provides tools for file operations, terminal commands, and editor interactions.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  DiscoveryRequestSchema,
  ErrorCode,
  McpError
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class VSCodeMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'vscode-remote-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupRequestHandlers();
  }

  setupRequestHandlers() {
    // Discovery endpoint - provides information about the server
    this.server.setRequestHandler(DiscoveryRequestSchema, async () => ({
      server: {
        name: 'vscode-remote-mcp',
        version: '1.0.0',
        vendor: 'Edge Agents',
        description: 'MCP server for VSCode integration with edge agents'
      },
      capabilities: {
        tools: {
          list_files: {
            description: 'List files in a directory'
          },
          read_file: {
            description: 'Read file contents'
          },
          write_file: {
            description: 'Write content to a file'
          },
          execute_command: {
            description: 'Execute a terminal command'
          }
        }
      }
    }));

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_files',
          description: 'List files in a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path'
              },
              recursive: {
                type: 'boolean',
                description: 'Whether to list files recursively'
              }
            },
            required: ['path']
          }
        },
        {
          name: 'read_file',
          description: 'Read file contents',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path'
              }
            },
            required: ['path']
          }
        },
        {
          name: 'write_file',
          description: 'Write content to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path'
              },
              content: {
                type: 'string',
                description: 'Content to write'
              }
            },
            required: ['path', 'content']
          }
        },
        {
          name: 'execute_command',
          description: 'Execute a terminal command',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Command to execute'
              },
              cwd: {
                type: 'string',
                description: 'Working directory'
              }
            },
            required: ['command']
          }
        }
      ]
    }));

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const params = request.params.arguments || {};

      try {
        switch (toolName) {
          case 'list_files':
            return await this.listFiles(params);
          case 'read_file':
            return await this.readFile(params);
          case 'write_file':
            return await this.writeFile(params);
          case 'execute_command':
            return await this.executeCommand(params);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${toolName}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${toolName}: ${error.message}`
        );
      }
    });
  }

  async listFiles(params) {
    if (!params.path) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Path parameter is required'
      );
    }

    try {
      const dirPath = path.resolve(params.path);
      const recursive = params.recursive === true;
      
      const files = await this.readDirectoryRecursive(dirPath, recursive);
      
      return {
        content: [
          {
            type: 'text',
            text: `Files in ${dirPath}:\n${files.join('\n')}`
          }
        ],
        files
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list files: ${error.message}`
      );
    }
  }

  async readDirectoryRecursive(dirPath, recursive, prefix = '') {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let results = [];

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      const relativePath = path.join(prefix, entry.name);
      
      if (entry.isDirectory()) {
        results.push(`${relativePath}/`);
        if (recursive) {
          const subEntries = await this.readDirectoryRecursive(
            entryPath, 
            recursive, 
            relativePath
          );
          results = results.concat(subEntries);
        }
      } else {
        results.push(relativePath);
      }
    }

    return results;
  }

  async readFile(params) {
    if (!params.path) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Path parameter is required'
      );
    }

    try {
      const filePath = path.resolve(params.path);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Add line numbers to content
      const lines = content.split('\n');
      const numberedLines = lines.map((line, index) => `${index + 1} | ${line}`).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: numberedLines
          }
        ],
        text: content,
        lines: lines.length
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read file: ${error.message}`
      );
    }
  }

  async writeFile(params) {
    if (!params.path || params.content === undefined) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Path and content parameters are required'
      );
    }

    try {
      const filePath = path.resolve(params.path);
      await fs.writeFile(filePath, params.content);
      
      return {
        content: [
          {
            type: 'text',
            text: `File written successfully: ${filePath}`
          }
        ],
        success: true,
        path: filePath
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to write file: ${error.message}`
      );
    }
  }

  async executeCommand(params) {
    if (!params.command) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Command parameter is required'
      );
    }

    // Validate command to prevent command injection
    if (typeof params.command !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Command must be a string'
      );
    }

    // Disallow potentially dangerous commands
    const dangerousCommands = [
      'rm -rf', 'sudo', '> /etc/', '| mail', '> /home/',
      '> /root/', 'wget', 'curl -o', 'chmod 777', 'mkfs'
    ];

    for (const cmd of dangerousCommands) {
      if (params.command.includes(cmd)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Command contains disallowed pattern: ${cmd}`
        );
      }
    }

    try {
      const options = {};
      if (params.cwd) {
        options.cwd = path.resolve(params.cwd);
      }
      
      // Add additional security options
      options.timeout = params.timeout || 30000; // 30 second timeout
      options.maxBuffer = 1024 * 1024 * 5; // 5MB buffer limit
      
      // Log command execution for audit purposes
      console.error(`[AUDIT] Executing command: ${params.command}`);
      
      const { stdout, stderr } = await execAsync(params.command, options);
      
      return {
        content: [
          {
            type: 'text',
            text: stdout || 'Command executed successfully with no output'
          }
        ],
        stdout,
        stderr,
        success: true
      };
    } catch (error) {
      // For command execution, we return the error output rather than throwing
      return {
        content: [
          {
            type: 'text',
            text: `Command failed: ${error.message}\n${error.stderr || ''}`
          }
        ],
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        success: false
      };
    }
  }

  async serveStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('VSCode MCP server running on stdio');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  // TCP transport is not available in the current SDK version
  // This method is kept as a placeholder for future implementation
  async serveTcp(port = 3001) {
    console.error(`TCP transport is not available in the current SDK version`);
    throw new Error('TCP transport is not available');
  }
}

// Use stdio transport by default
const args = process.argv.slice(2);
const server = new VSCodeMcpServer();

// TCP transport is not available in the current SDK version
if (args.includes('--tcp')) {
  console.error('TCP transport is not available in the current SDK version');
  console.error('Using stdio transport instead');
}

server.serveStdio().catch(console.error);