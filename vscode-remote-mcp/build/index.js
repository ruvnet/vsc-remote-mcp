"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Configure server
const server = new index_js_1.Server({
    name: 'vscode-mcp-server',
    version: '1.0.0',
    vendor: 'Edge Agents',
    description: 'MCP server for VSCode integration with edge agents'
}, {
    capabilities: {
        tools: {},
    },
});
// Handle initialize request
server.setRequestHandler(types_js_1.InitializeRequestSchema, async (request) => {
    console.error('[INITIALIZE] Handling initialize request');
    // Extract protocol version from request
    const protocolVersion = request.params.protocolVersion || '2024-11-05';
    return {
        protocolVersion,
        serverInfo: {
            name: 'vscode-mcp-server',
            version: '1.0.0',
            vendor: 'Edge Agents',
            description: 'MCP server for VSCode integration with edge agents'
        },
        capabilities: {
            tools: {
                greet: {
                    description: 'Returns a greeting message'
                },
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
    };
});
// We don't need to define an ExecuteRequestSchema since we're using CallToolRequestSchema
// for handling tool calls. The MCP protocol uses mcp.callTool for tool execution.
// Handle list tools request
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'greet',
                description: 'Returns a greeting message',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Name to greet',
                        },
                    },
                    required: ['name'],
                },
            },
            {
                name: 'list_files',
                description: 'List files in a directory',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Directory path',
                        },
                        recursive: {
                            type: 'boolean',
                            description: 'Whether to list files recursively',
                        },
                    },
                    required: ['path'],
                },
            },
            {
                name: 'read_file',
                description: 'Read file contents',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'File path',
                        },
                    },
                    required: ['path'],
                },
            },
            {
                name: 'write_file',
                description: 'Write content to a file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'File path',
                        },
                        content: {
                            type: 'string',
                            description: 'Content to write',
                        },
                    },
                    required: ['path', 'content'],
                },
            },
            {
                name: 'execute_command',
                description: 'Execute a terminal command',
                inputSchema: {
                    type: 'object',
                    properties: {
                        command: {
                            type: 'string',
                            description: 'Command to execute',
                        },
                        cwd: {
                            type: 'string',
                            description: 'Working directory for the command',
                        },
                    },
                    required: ['command'],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments || {};
    switch (toolName) {
        case 'greet':
            return handleGreet(args);
        case 'list_files':
            return handleListFiles(args);
        case 'read_file':
            return handleReadFile(args);
        case 'write_file':
            return handleWriteFile(args);
        case 'execute_command':
            return handleExecuteCommand(args);
        default:
            throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
});
// Tool handlers
async function handleGreet(args) {
    if (!args.name) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Missing required parameter: name');
    }
    return {
        content: [
            {
                type: 'text',
                text: `Hello, ${args.name}! Welcome to the VSCode MCP world!`,
            },
        ],
    };
}
async function handleListFiles(args) {
    if (!args.path) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Missing required parameter: path');
    }
    try {
        const dirPath = args.path;
        const recursive = args.recursive === true;
        // Check if directory exists
        if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, `Directory not found: ${dirPath}`);
        }
        // List files
        const files = await listFilesInDirectory(dirPath, recursive);
        return {
            content: [
                {
                    type: 'text',
                    text: `Files in ${dirPath}:`,
                },
            ],
            files,
        };
    }
    catch (error) {
        if (error instanceof types_js_1.McpError) {
            throw error;
        }
        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Error listing files: ${error.message}`);
    }
}
async function handleReadFile(args) {
    if (!args.path) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Missing required parameter: path');
    }
    try {
        const filePath = args.path;
        // Check if file exists
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, `File not found: ${filePath}`);
        }
        // Read file
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        return {
            content: [
                {
                    type: 'text',
                    text: content,
                },
            ],
            text: content,
            lines,
        };
    }
    catch (error) {
        if (error instanceof types_js_1.McpError) {
            throw error;
        }
        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Error reading file: ${error.message}`);
    }
}
async function handleWriteFile(args) {
    if (!args.path) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Missing required parameter: path');
    }
    if (args.content === undefined) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Missing required parameter: content');
    }
    try {
        const filePath = args.path;
        const content = args.content;
        // Create directory if it doesn't exist
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        // Write file
        fs.writeFileSync(filePath, content);
        const lines = content.split('\n').length;
        return {
            content: [
                {
                    type: 'text',
                    text: `File written to ${filePath}`,
                },
            ],
            success: true,
            lines,
        };
    }
    catch (error) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Error writing file: ${error.message}`);
    }
}
async function handleExecuteCommand(args) {
    if (!args.command) {
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Missing required parameter: command');
    }
    try {
        const command = args.command;
        const options = {};
        // Add working directory if provided
        if (args.cwd) {
            options.cwd = args.cwd;
        }
        // Execute command
        const { stdout, stderr } = await execAsync(command, options);
        return {
            content: [
                {
                    type: 'text',
                    text: stdout,
                },
            ],
            stdout,
            stderr,
            success: true,
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: error.message,
                },
            ],
            stdout: error.stdout || '',
            stderr: error.stderr || error.message,
            success: false,
        };
    }
}
// Helper functions
async function listFilesInDirectory(dirPath, recursive) {
    const files = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            if (recursive) {
                const subFiles = await listFilesInDirectory(fullPath, recursive);
                files.push(...subFiles.map(file => path.join(entry.name, file)));
            }
            else {
                files.push(entry.name + '/');
            }
        }
        else {
            files.push(entry.name);
        }
    }
    return files;
}
// Start server
async function startServer() {
    console.error('Starting VSCode MCP TypeScript Server...');
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('[INFO] MCP TypeScript Server started successfully on STDIO');
}
startServer().catch(error => {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map