# VSCode Remote MCP TypeScript Server

This directory contains a TypeScript implementation of the Model Control Panel (MCP) server for VSCode integration.

## Overview

The MCP server provides a standardized way for AI assistants to interact with VSCode through a set of tools. These tools allow the AI to perform operations like:

- Greeting users
- Listing files in a directory
- Reading file contents
- Writing content to files
- Executing terminal commands

## Implementation

The server is implemented in two ways:

1. **JavaScript Implementation** (`run-mcp-server.js`): A fully functional JavaScript implementation that handles all MCP protocol operations.
2. **TypeScript Implementation** (`src/index.ts`): A TypeScript implementation that demonstrates how to structure an MCP server using TypeScript.

## Server Protocol

The server communicates using the JSON-RPC protocol over stdio. It supports the following methods:

- `initialize`: Initializes the server and returns its capabilities
- `mcp.discovery`: Returns information about the server and its capabilities
- `mcp.listTools`: Lists all available tools with their input schemas
- `mcp.callTool`: Calls a specific tool with arguments

## Available Tools

The server provides the following tools:

1. **greet**
   - Description: Returns a greeting message
   - Parameters:
     - `name` (string, required): Name to greet

2. **list_files**
   - Description: List files in a directory
   - Parameters:
     - `path` (string, required): Directory path
     - `recursive` (boolean, optional): Whether to list files recursively

3. **read_file**
   - Description: Read file contents
   - Parameters:
     - `path` (string, required): File path

4. **write_file**
   - Description: Write content to a file
   - Parameters:
     - `path` (string, required): File path
     - `content` (string, required): Content to write

5. **execute_command**
   - Description: Execute a terminal command
   - Parameters:
     - `command` (string, required): Command to execute
     - `cwd` (string, optional): Working directory

## Testing

You can test the server using the provided test scripts:

- `test-typescript-server.js`: Tests the server by sending initialize and tool call requests
- `test-discovery.js`: Tests the server's discovery capabilities
- `test-initialize.js`: Tests the server's initialization
- `test-multi-step.js`: Tests multi-step interactions with the server

To run a specific test:

```bash
node test-typescript-server.js
```

To run all tests:

```bash
./run-tests.sh
```

The tests verify that all endpoints are working correctly:
1. `initialize`: Initializes the server and returns its capabilities
2. `mcp.discovery`: Returns information about the server and its capabilities
3. `mcp.listTools`: Lists all available tools with their input schemas
4. `mcp.callTool`: Calls a specific tool with arguments

## Configuration

The server can be configured in the MCP settings file:

```json
{
  "mcpServers": {
    "vscode-mcp": {
      "command": "node",
      "args": [
        "/workspaces/edge-agents/scripts/vscode-remote-mcp/run-mcp-server.js"
      ],
      "disabled": false,
      "timeout": 60,
      "transportType": "stdio",
      "autoApprove": [
        "greet",
        "list_files",
        "read_file",
        "write_file",
        "execute_command"
      ]
    }
  }
}
```

## Building the TypeScript Implementation

To build the TypeScript implementation:

```bash
npm run build
```

This will compile the TypeScript code in the `src` directory to JavaScript in the `build` directory.

## Known Issues

- The TypeScript implementation currently has some type errors that need to be fixed.
- The server doesn't support streaming responses yet.
- Error handling could be improved for better diagnostics.

## Future Improvements

- Add support for streaming responses
- Implement better error handling
- Add more tools for file manipulation
- Add support for workspace operations
- Improve TypeScript type definitions