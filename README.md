# CodeSwarm: VSCode Remote MCP Server

A command-line interface and MCP server for VSCode remote development tools. This package provides a set of tools for code analysis, code modification, and VSCode instance management, all accessible through a simple CLI or programmatically in your Node.js applications. Deploy and manage individual VSCode instances or entire swarms with secure login credentials and resource management.

[![npm version](https://img.shields.io/npm/v/vsc-remote.svg)](https://www.npmjs.com/package/vscode-remote-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-ruvnet/vsc--remote--mcp-blue.svg)](https://github.com/ruvnet/vsc-remote-mcp)

Created by [rUv](https://github.com/ruvnet)

## Features

- **Code Analysis**: Analyze code structure, complexity, and potential issues
- **Code Search**: Search for patterns in code files with context
- **Code Modification**: Add, update, remove, or replace code segments
- **VSCode Instance Management**: Deploy, list, and stop VSCode instances with secure UI login
- **VSCode Swarm Management**: Deploy and manage multiple VSCode instances as a coordinated swarm
- **Resource Management**: Manage resources for VSCode instances and jobs
- **Secure Access Control**: Generate and manage secure passwords for VSCode UI access
- **MCP Server**: Run as an MCP server for integration with AI assistants
- **Programmatic API**: Use all features programmatically in Node.js applications
- **Security Features**: Command injection protection, secure password handling, and authentication

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)
  - [Server Commands](#server-commands)
  - [Code Analysis Commands](#code-analysis-commands)
  - [Code Modification Commands](#code-modification-commands)
  - [VSCode Instance Management](#vscode-instance-management)
  - [Resource Management](#resource-management)
- [MCP Server Usage](#mcp-server-usage)
- [Security Features](#security-features)
  - [Authentication](#authentication)
  - [Command Injection Protection](#command-injection-protection)
  - [Secure Password Handling](#secure-password-handling)
  - [Input Validation](#input-validation)
- [Programmatic Usage](#programmatic-usage)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Installation

You can use this package without installation via npx:

```bash
npx vsc-remote <command>
```

Or install it globally:

```bash
npm install -g vsc-remote
vsc-remote <command>
```

For programmatic usage in your Node.js applications:

```bash
npm install vsc-remote --save
```

> **Note**: The package includes a postinstall script that automatically fixes SDK import paths. This ensures that the package works correctly when installed globally or used via npx. If you encounter any SDK import path issues, see the [Troubleshooting](#troubleshooting) section.

## Quick Start

### Analyze a code file:

```bash
npx vsc-remote analyze-code src/index.js
```

### Search for patterns in code:

```bash
npx vsc-remote search-code "function" --directory src --file-pattern "*.js"
```

### Deploy a VSCode instance:

```bash
npx vsc-remote deploy-vscode-instance --name my-instance --workspace-path /path/to/workspace
```

### Start an MCP server:

```bash
npx vsc-remote start --mode websocket --port 3001
```

## CLI Usage

The vsc-remote CLI provides a set of commands for various operations. Use `--help` with any command to see detailed usage information:

```bash
npx vsc-remote --help
npx vsc-remote <command> --help
```

### Server Commands

#### Start the MCP Server

```bash
# Start in stdio mode (default)
npx vsc-remote start

# Start in WebSocket mode
npx vsc-remote start --mode websocket --port 3001

# Start with debug logging
npx vsc-remote start --debug

# Start with a specific authentication token
npx vsc-remote start --mode websocket --port 3001 --token your-secure-token

# Generate a new authentication token
npx vsc-remote start --mode websocket --port 3001 --generate-token
```

### Code Analysis Commands

#### Analyze Code

Analyze code files and provide insights about their structure, complexity, and potential issues.

```bash
# Basic usage
npx vsc-remote analyze-code src/index.js

# Disable specific analysis features
npx vsc-remote analyze-code src/index.js --no-metrics
npx vsc-remote analyze-code src/index.js --no-structure
npx vsc-remote analyze-code src/index.js --no-issues
```

Example output:

```json
{
  "file_path": "src/index.js",
  "metrics": {
    "complexity": 5,
    "maintainability": 75,
    "loc": 120,
    "comments": 15
  },
  "structure": {
    "functions": [
      {
        "name": "main",
        "start_line": 10,
        "end_line": 20,
        "parameters": ["arg1", "arg2"]
      }
    ],
    "classes": [
      {
        "name": "MyClass",
        "start_line": 25,
        "end_line": 50,
        "methods": ["method1", "method2"]
      }
    ]
  },
  "issues": [
    {
      "type": "unused-variable",
      "message": "Variable 'temp' is defined but never used",
      "line": 15,
      "column": 10,
      "severity": "warning"
    }
  ]
}
```

#### Search Code

Search for patterns in code files and return matching results with context.

```bash
# Basic search
npx vsc-remote search-code "function"

# Advanced search with options
npx vsc-remote search-code "function" --directory src --file-pattern "*.js" --context-lines 3

# Case-insensitive search
npx vsc-remote search-code "error" --ignore-case

# Literal string search (no regex)
npx vsc-remote search-code "function()" --no-regex
```

Example output:

```json
{
  "matches": [
    {
      "file": "src/index.js",
      "line": 10,
      "column": 1,
      "match": "function main() {",
      "context": {
        "before": [
          "// Main entry point",
          "// Initialize application"
        ],
        "line": "function main() {",
        "after": [
          "  console.log('Starting application');",
          "  init();",
          "  run();"
        ]
      }
    }
  ],
  "total_matches": 1,
  "files_searched": 5
}
```

### Code Modification Commands

#### Modify Code

Modify code files with various operations like adding, updating, or removing code segments.

```bash
# Add a comment at line 10
npx vsc-remote modify-code src/index.js --operation add --position 10 --content "// New code here"

# Update a function name
npx vsc-remote modify-code src/index.js --operation update --pattern "oldFunction" --content "newFunction"

# Remove console.log statements
npx vsc-remote modify-code src/index.js --operation remove --pattern "console.log"

# Replace a block of code
npx vsc-remote modify-code src/index.js --operation replace --range 10,20 --content "// New code block"
```

Example output:

```json
{
  "success": true,
  "file_path": "src/index.js",
  "operation": "update",
  "changes": {
    "lines_affected": 1,
    "original_content": "function oldFunction() {",
    "new_content": "function newFunction() {"
  }
}
```

### VSCode Instance Management

#### Deploy VSCode Instance

Deploy a new VSCode instance using Docker. Each instance provides a web-based VSCode UI accessible via browser with secure login credentials.

```bash
# Basic deployment
npx vsc-remote deploy-vscode-instance --name my-instance --workspace-path /path/to/workspace

# Deployment with custom settings and specific password
npx vsc-remote deploy-vscode-instance --name my-instance --workspace-path /path/to/workspace --port 8080 --password mypassword --cpu 2 --memory 4Gi
```

Example output:

```json
{
  "instance_id": "vscode-instance-abc123",
  "name": "my-instance",
  "status": "running",
  "url": "http://localhost:8080",
  "port": 8080,
  "password": "mypassword",
  "workspace_path": "/path/to/workspace",
  "resources": {
    "cpu": "2",
    "memory": "4Gi",
    "disk": "10Gi"
  },
  "created_at": "2025-04-26T22:30:00Z",
  "container_id": "container-xyz789"
}
```

After deployment, access the VSCode UI by navigating to the URL in your browser (e.g., http://localhost:8080) and entering the password you specified. If no password is provided, a secure random password will be generated and displayed in the output.

#### VSCode Swarm Management

Deploy and manage multiple VSCode instances as a coordinated swarm for team development or distributed workloads.

```bash
# Deploy multiple instances as a swarm
for i in {1..5}; do
  npx vsc-remote deploy-vscode-instance --name "swarm-node-$i" --workspace-path /path/to/workspace --port $((8080 + $i))
done

# List all swarm instances
npx vsc-remote list-vscode-instances --filter "swarm-node"

# Stop all swarm instances
npx vsc-remote list-vscode-instances --filter "swarm-node" --format json | jq -r '.instances[].name' | xargs -I{} npx vsc-remote stop-vscode-instance --name {}
```

#### List VSCode Instances

List all deployed VSCode instances and their status.

```bash
# List all instances
npx vsc-remote list-vscode-instances

# List only running instances
npx vsc-remote list-vscode-instances --status running

# Get JSON output
npx vsc-remote list-vscode-instances --format json
```

Example output:

```
┌─────────────────────┬────────────┬─────────────────────┬───────┬─────────────────────────┐
│ Name                │ Status     │ URL                 │ Port  │ Created                 │
├─────────────────────┼────────────┼─────────────────────┼───────┼─────────────────────────┤
│ my-instance         │ running    │ http://localhost:8080 │ 8080  │ 2025-04-26 22:30:00    │
│ test-instance       │ stopped    │ http://localhost:8081 │ 8081  │ 2025-04-25 10:15:00    │
└─────────────────────┴────────────┴─────────────────────┴───────┴─────────────────────────┘
```

#### Stop VSCode Instance

Stop a running VSCode instance.

```bash
# Stop an instance
npx vsc-remote stop-vscode-instance --name my-instance

# Force stop an instance
npx vsc-remote stop-vscode-instance --name my-instance --force
```

Example output:

```json
{
  "success": true,
  "instance_id": "vscode-instance-abc123",
  "name": "my-instance",
  "status": "stopped",
  "stopped_at": "2025-04-26T23:15:00Z"
}
```

### Resource Management

#### Manage Job Resources

Manage resources for VSCode instances and associated jobs.

```bash
# Check job status
npx vsc-remote manage-job-resources job-123 --operation status

# Update resource limits
npx vsc-remote manage-job-resources job-123 --operation update --cpu 2 --memory 4Gi

# Pause a job
npx vsc-remote manage-job-resources job-123 --operation pause

# Resume a job
npx vsc-remote manage-job-resources job-123 --operation resume
```

Example output:

```json
{
  "job_id": "job-123",
  "status": "running",
  "resources": {
    "cpu": "2",
    "memory": "4Gi",
    "disk": "10Gi",
    "cpu_usage": 45,
    "memory_usage": 60,
    "disk_usage": 30
  },
  "started_at": "2025-04-26T20:00:00Z",
  "last_updated": "2025-04-26T23:30:00Z"
}
```

## MCP Server Usage

You can use this package as an MCP server for integration with AI assistants:

```bash
# Start the server in stdio mode (default)
npx vsc-remote start

# Start the server in WebSocket mode
npx vsc-remote start --mode websocket --port 3001
```

### Connecting to the MCP Server

For stdio mode, use standard input/output to communicate with the server.

For WebSocket mode, connect to `ws://localhost:3001?token=your-auth-token` (or the specified port).

### MCP Protocol

The MCP server implements the Model Context Protocol (MCP), which allows AI assistants to interact with the server using a standardized message format. See the [API documentation](docs/API.md) for details on the protocol.

## Security Features

The vsc-remote package includes several security features to protect your system and data:

### Authentication

WebSocket mode includes token-based authentication to prevent unauthorized access:

- Secure random token generation using cryptographically strong methods
- Token storage in a secure file with appropriate permissions
- Token validation for all WebSocket connections
- Options to provide your own token or generate a new one

Example usage:

```bash
# Start with a specific authentication token
npx vsc-remote start --mode websocket --port 3001 --token your-secure-token

# Generate a new authentication token
npx vsc-remote start --mode websocket --port 3001 --generate-token
```

To connect to a secure WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:3001?token=your-auth-token');
```

### Command Injection Protection

All commands that interact with the system are protected against command injection:

- Strict input validation and sanitization
- Parameter escaping for shell commands
- Use of safe execution methods that prevent shell injection
- Validation of file paths to prevent directory traversal

### Secure Password Handling

For VSCode instance deployment:

- Passwords are never stored in plain text
- Secure password generation with strong entropy
- Password strength validation
- Secure transmission of credentials

### Input Validation

All user inputs are validated:

- File path validation to prevent directory traversal
- Regex pattern validation to prevent ReDoS attacks
- Parameter type checking and sanitization
- Strict schema validation for all tool inputs

## Programmatic Usage

You can use vsc-remote programmatically in your Node.js applications:

```javascript
const { createServer, tools } = require('vsc-remote');

// Create and start an MCP server
async function startServer() {
  const server = await createServer({
    mode: 'websocket',
    port: 3001,
    debug: true,
    // Authentication options
    token: 'your-secure-token', // Optional: provide a specific token
    generateToken: true // Optional: generate a new token
  });
  
  console.log('Server started on port 3001');
  console.log(`Authentication token: ${server.authToken}`);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
  });
  
  return server;
}

// Connect to a WebSocket MCP server with authentication
function connectToServer(token) {
  const ws = new WebSocket(`ws://localhost:3001?token=${token}`);
  
  ws.on('open', () => {
    console.log('Connected to MCP server');
    // Send messages, etc.
  });
  
  ws.on('error', (error) => {
    console.error('Connection error:', error);
  });
  
  return ws;
}

// Use tools directly
async function analyzeCode() {
  try {
    const result = await tools.analyze_code({
      file_path: 'src/index.js',
      include_metrics: true,
      include_structure: true,
      include_issues: true
    });
    
    console.log('Code complexity:', result.metrics.complexity);
    console.log('Functions:', result.structure.functions.length);
    console.log('Issues:', result.issues.length);
    
    return result;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

// Search for code patterns
async function searchCode() {
  try {
    const result = await tools.search_code({
      pattern: 'function',
      directory: 'src',
      file_pattern: '*.js',
      context_lines: 3
    });
    
    console.log(`Found ${result.total_matches} matches in ${result.files_searched} files`);
    
    return result;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}
```

See the [API documentation](docs/API.md) for detailed information on the programmatic API.

## Environment Variables

You can configure the behavior using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_DEBUG` | Enable debug mode (1 = enabled, 0 = disabled) | `0` |
| `MCP_MODE` | Server mode (stdio or websocket) | `stdio` |
| `MCP_PORT` | Port for WebSocket mode | `3001` |
| `MCP_LOG_LEVEL` | Log level (error, warn, info, debug) | `info` |
| `MCP_AUTH_TOKEN` | Authentication token for WebSocket mode | Auto-generated |
| `MCP_GENERATE_NEW_TOKEN` | Force generation of a new token (1 = enabled) | `0` |
| `MCP_VSCODE_INSTANCES_DIR` | Directory for VSCode instance configurations | `./vscode-instances` |
| `MCP_VSCODE_DOCKER_IMAGE` | Docker image for VSCode instances | `codercom/code-server:latest` |
| `MCP_DEFAULT_CPU_LIMIT` | Default CPU limit for VSCode instances | `1` |
| `MCP_DEFAULT_MEMORY_LIMIT` | Default memory limit for VSCode instances | `2Gi` |
| `MCP_DEFAULT_DISK_LIMIT` | Default disk limit for VSCode instances | `5Gi` |
| `MCP_MIN_PASSWORD_LENGTH` | Minimum password length for VSCode instances | `12` |
| `MCP_PASSWORD_COMPLEXITY` | Password complexity level (low, medium, high) | `medium` |
| `MCP_AUTO_GENERATE_PASSWORD` | Auto-generate secure passwords (1 = enabled, 0 = disabled) | `1` |
| `MCP_SWARM_PREFIX` | Default prefix for swarm instance names | `swarm-node` |
| `MCP_MAX_SWARM_SIZE` | Maximum number of instances in a swarm | `10` |
| `MCP_REQUEST_TIMEOUT` | Timeout for MCP requests in milliseconds | `60000` |
| `MCP_CONNECTION_TIMEOUT` | Timeout for MCP connections in milliseconds | `300000` |
| `MCP_KEEPALIVE_INTERVAL` | Interval for MCP keep-alive messages in milliseconds | `30000` |

## Troubleshooting

### Common Issues

#### SDK Import Path Issues

If you encounter errors related to missing SDK modules or import paths:

1. The package includes a postinstall script that automatically fixes SDK import paths
2. The package also includes fallback implementations that will be used if the SDK cannot be imported
3. You may see warning messages about failed imports, but the package will continue to function using the fallback implementations
4. If you want to use the actual SDK implementation, try reinstalling the package with `npm install -g vsc-remote`
5. For manual fixes, update import statements to use specific paths:
   ```javascript
   // Change this:
   const { Server } = require('@modelcontextprotocol/sdk');
   
   // To this:
   const { Server } = require('@modelcontextprotocol/sdk/dist/cjs/server');
   ```

> **Note**: When using the fallback implementations, some advanced features may not be available, but all basic functionality will work correctly.

#### Connection Refused

If you get a "Connection refused" error when using WebSocket mode:

1. Check if the port is already in use
2. Verify firewall settings
3. Ensure the server is running

#### Connection Closed

If you encounter a "MCP error -32000: Connection closed" error:

1. Use the latest version of the package which includes fixes for persistent connections
2. Try increasing the request timeout with `--request-timeout 120000` (2 minutes)
3. Use the `--connection-timeout` and `--keep-alive-interval` options to adjust connection parameters
4. Ensure the server process stays alive by using the start command directly

Example with increased timeouts:
```bash
npx vsc-remote start --request-timeout 120000 --connection-timeout 300000 --keep-alive-interval 30000
```

#### Authentication Failed

If you get an "Authentication failed" error when connecting to the WebSocket server:

1. Ensure you're including the token in the URL: `ws://localhost:3001?token=your-auth-token`
2. Verify that you're using the correct token
3. Check if the token file exists at `~/.vsc-remote/auth-token`
4. Try generating a new token with the `--generate-token` option

#### Docker Issues

If you encounter issues with VSCode instance deployment:

1. Ensure Docker is installed and running
2. Check if you have sufficient permissions
3. Verify that the workspace path exists and is accessible

#### Password Validation Errors

If you get password validation errors when deploying VSCode instances:

1. Ensure your password meets the minimum length requirement (default: 12 characters)
2. Include a mix of uppercase, lowercase, numbers, and special characters
3. Avoid common passwords or dictionary words

### Enabling Debug Mode

To enable detailed logging:

```bash
export MCP_DEBUG=1
export MCP_LOG_LEVEL=debug
npx vsc-remote start
```

## Documentation

- [CLI Usage Documentation](docs/CLI-USAGE.md): Detailed CLI command documentation
- [API Documentation](docs/API.md): Programmatic API documentation
- [Contributing Guide](docs/CONTRIBUTING.md): Guidelines for contributing to the project

## Contributing

Contributions are welcome! Please see the [Contributing Guide](docs/CONTRIBUTING.md) for details on how to contribute to this project.

## License

MIT
