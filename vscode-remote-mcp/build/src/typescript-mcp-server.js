"use strict";
/**
 * TypeScript MCP Server Implementation
 *
 * This file provides a TypeScript implementation of the MCP server with proper timeout handling.
 * It uses the official MCP SDK and implements best practices for timeout management.
 */
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
const mcp_1 = require("@modelcontextprotocol/sdk/server/mcp");
const stdio_1 = require("@modelcontextprotocol/sdk/server/stdio");
const zod_1 = require("zod");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
// Promisify exec for async/await usage
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Environment configuration
const ENV = {
    // Server-level timeout (5 minutes)
    SERVER_TIMEOUT: parseInt(process.env.SERVER_TIMEOUT || '300000', 10),
    // Tool-specific timeouts
    COMMAND_TIMEOUT: parseInt(process.env.COMMAND_TIMEOUT || '60000', 10),
    ANALYZE_TIMEOUT: parseInt(process.env.ANALYZE_TIMEOUT || '120000', 10),
    // Default request timeout (45 seconds)
    REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '45000', 10),
    // Keep-alive interval (15 seconds)
    HEARTBEAT_INTERVAL: parseInt(process.env.HEARTBEAT_INTERVAL || '15000', 10)
};
// Create MCP server with timeout configuration
const server = new mcp_1.McpServer({
    name: "vscode-remote-mcp",
    version: "1.0.0",
    // Set server-level timeout
    defaultTimeout: ENV.SERVER_TIMEOUT
});
// Tool schemas
const listFilesSchema = zod_1.z.object({
    path: zod_1.z.string().describe("Directory path"),
    recursive: zod_1.z.boolean().optional().describe("Whether to list files recursively")
});
const readFileSchema = zod_1.z.object({
    path: zod_1.z.string().describe("File path")
});
const writeFileSchema = zod_1.z.object({
    path: zod_1.z.string().describe("File path"),
    content: zod_1.z.string().describe("Content to write")
});
const executeCommandSchema = zod_1.z.object({
    command: zod_1.z.string().describe("Command to execute"),
    cwd: zod_1.z.string().optional().describe("Working directory")
});
// Register tools
server.tool("list_files", listFilesSchema, async ({ path: dirPath, recursive = false }, { sendProgress }) => {
    try {
        const resolvedPath = path.resolve(dirPath);
        const files = await readDirectoryRecursive(resolvedPath, recursive);
        return {
            content: [
                {
                    type: "text",
                    text: `Files in ${resolvedPath}:\n${files.join('\n')}`
                }
            ],
            files
        };
    }
    catch (error) {
        throw new Error(`Failed to list files: ${error.message}`);
    }
}, { timeout: ENV.REQUEST_TIMEOUT });
server.tool("read_file", readFileSchema, async ({ path: filePath }, { sendProgress }) => {
    try {
        const resolvedPath = path.resolve(filePath);
        const content = await fs.readFile(resolvedPath, 'utf8');
        // Add line numbers to content
        const lines = content.split('\n');
        const numberedLines = lines.map((line, index) => `${index + 1} | ${line}`).join('\n');
        return {
            content: [
                {
                    type: "text",
                    text: numberedLines
                }
            ],
            text: content,
            lines: lines.length
        };
    }
    catch (error) {
        throw new Error(`Failed to read file: ${error.message}`);
    }
}, { timeout: ENV.REQUEST_TIMEOUT });
server.tool("write_file", writeFileSchema, async ({ path: filePath, content }, { sendProgress }) => {
    try {
        const resolvedPath = path.resolve(filePath);
        await fs.writeFile(resolvedPath, content);
        return {
            content: [
                {
                    type: "text",
                    text: `File written successfully: ${resolvedPath}`
                }
            ],
            success: true,
            path: resolvedPath
        };
    }
    catch (error) {
        throw new Error(`Failed to write file: ${error.message}`);
    }
}, { timeout: ENV.REQUEST_TIMEOUT });
server.tool("execute_command", executeCommandSchema, async ({ command, cwd }, { sendProgress }) => {
    // Set up progress reporting for long-running commands
    let progressCount = 0;
    const progressInterval = setInterval(() => {
        progressCount++;
        sendProgress({
            text: `Command still running (${progressCount * 5}s elapsed)...`
        });
    }, 5000);
    try {
        const options = {};
        if (cwd) {
            options.cwd = path.resolve(cwd);
        }
        const { stdout, stderr } = await execAsync(command, options);
        return {
            content: [
                {
                    type: "text",
                    text: stdout || 'Command executed successfully with no output'
                }
            ],
            stdout,
            stderr,
            success: true
        };
    }
    catch (error) {
        // For command execution, we return the error output rather than throwing
        return {
            content: [
                {
                    type: "text",
                    text: `Command failed: ${error.message}\n${error.stderr || ''}`
                }
            ],
            stdout: error.stdout || '',
            stderr: error.stderr || error.message,
            success: false
        };
    }
    finally {
        clearInterval(progressInterval);
    }
}, { timeout: ENV.COMMAND_TIMEOUT });
// Add a dynamic resource for server status
server.resource("status", new mcp_1.ResourceTemplate("status://server", { list: undefined }), async () => ({
    contents: [{
            uri: "status://server",
            text: `Server Status: Running\nUptime: ${process.uptime()} seconds\nMemory Usage: ${JSON.stringify(process.memoryUsage())}\nTimestamp: ${new Date().toISOString()}`
        }]
}));
/**
 * Read directory recursively
 */
async function readDirectoryRecursive(dirPath, recursive, prefix = '') {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let results = [];
    for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        const relativePath = path.join(prefix, entry.name);
        if (entry.isDirectory()) {
            results.push(`${relativePath}/`);
            if (recursive) {
                const subEntries = await readDirectoryRecursive(entryPath, recursive, relativePath);
                results = results.concat(subEntries);
            }
        }
        else {
            results.push(relativePath);
        }
    }
    return results;
}
/**
 * Start the server
 */
async function startServer() {
    try {
        // Configure transport with keep-alive
        const transport = new stdio_1.StdioServerTransport({
            pingInterval: ENV.HEARTBEAT_INTERVAL
        });
        // Handle cancellation properly
        server.onCancellation(async (requestId) => {
            console.error(`Cancelling request ${requestId}`);
            // Add custom cancellation logic here if needed
        });
        // Connect to transport
        await server.connect(transport);
        console.error("VSCode Remote MCP server running on stdio");
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            await server.close();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            await server.close();
            process.exit(0);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
// Start the server
startServer();
//# sourceMappingURL=typescript-mcp-server.js.map