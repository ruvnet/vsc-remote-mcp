# VSCode Remote MCP Server - SDK Implementation

This document describes the implementation of the VSCode Remote MCP server using the official Model Context Protocol (MCP) SDK.

## Overview

The VSCode Remote MCP server has been updated to use the official MCP SDK, which provides a more robust and standardized implementation of the protocol. This update addresses initialization and discovery timeout issues that were present in the previous implementation.

## Implementation Details

### Key Components

1. **Server Class**: `VSCodeRemoteMcpServer` in `src/mcp-sdk-server.js` implements the MCP server using the official SDK.
2. **Transport**: Uses `StdioServerTransport` for communication over standard input/output.
3. **Tools**: Integrates existing tools for code analysis, modification, search, and VSCode instance management.

### Key Improvements

- **Reliable Initialization**: The SDK handles the initialization process with proper timeout management.
- **Standardized Protocol**: Follows the official MCP protocol specification.
- **Robust Error Handling**: Uses the SDK's error handling mechanisms for consistent error reporting.
- **Graceful Shutdown**: Properly closes connections and resources on shutdown.

## Available Tools

The server provides the following tools:

- `analyze_code`: Analyze code files and provide insights about their structure, complexity, and potential issues.
- `modify_code`: Modify code files with various operations like adding, updating, or removing code segments.
- `search_code`: Search for patterns in code files and return matching results with context.
- `deploy_vscode_instance`: Deploy a new VSCode instance using Docker.
- `list_vscode_instances`: List all deployed VSCode instances and their status.
- `stop_vscode_instance`: Stop a running VSCode instance.
- `manage_job_resources`: Manage resources for VSCode instances and associated jobs.

## Usage

### Starting the Server

```bash
npm start
```

This will start the MCP server using the SDK implementation.

### Testing the Server

```bash
npm run test:sdk
```

This will run a test script that verifies the server initialization and tool registration.

## Debugging

Set the `MCP_DEBUG` environment variable to `1` to enable debug logging:

```bash
MCP_DEBUG=1 npm start
```

## Implementation Reference

The implementation is based on the reference implementation in `edge-agents-vscode-april12/scripts/agents/mcp-hello`.

## Dependencies

- `@modelcontextprotocol/sdk`: The official MCP SDK.
- `uuid`: For generating unique identifiers.
- `dotenv`: For environment variable management.

## File Structure

- `src/mcp-sdk-server.js`: The main server implementation using the MCP SDK.
- `run-mcp-server.js`: The entry point that creates and starts the server.
- `test-sdk-server.js`: A test script to verify the server implementation.
- `src/tools/`: Directory containing tool implementations.