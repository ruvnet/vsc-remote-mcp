# VSCode Remote MCP Server

This is an enhanced Model Context Protocol (MCP) server implementation for VSCode Remote integration. It provides a set of tools for code analysis, VSCode instance management, and more.

## Features

- **Code Analysis**: Analyze code files for structure, complexity, and potential issues
- **Code Modification**: Modify code files with various operations
- **Code Search**: Search for patterns in code files
- **VSCode Instance Management**: Deploy, list, and stop VSCode instances
- **Job Resource Management**: Manage resources for VSCode instances and jobs
- **Robust Discovery Endpoints**: Reliable discovery endpoints with proper timeout handling
- **Standardized Protocol**: Follows the MCP protocol specification

## Installation

1. Clone this repository
2. Install dependencies:

```bash
cd vscode-remote-mcp
npm install
```

## Usage

### Starting the Server

```bash
node run-mcp-server.js
```

### Configuration

The server can be configured through environment variables:

- `PORT`: Port to listen on (default: 3001)
- `HOST`: Host to bind to (default: localhost)
- `LOG_LEVEL`: Logging level (default: info)
- `REQUEST_TIMEOUT`: Timeout for requests in milliseconds (default: 45000)
- `HEARTBEAT_INTERVAL`: Interval for heartbeat messages in milliseconds (default: 10000)
- `MCP_DEBUG`: Enable debug logging (set to '1' to enable)

Create a `.env` file in the root directory to set these variables:

```
PORT=3001
HOST=localhost
LOG_LEVEL=debug
REQUEST_TIMEOUT=45000
HEARTBEAT_INTERVAL=10000
MCP_DEBUG=1
```

### Testing Discovery Endpoints

To test that the discovery endpoints are working correctly, run:

```bash
node test-discovery-fix.js
```

This script will:
1. Start the MCP server
2. Send requests to all discovery endpoints
3. Verify that responses are received without timeouts
4. Validate the response format

## Tools

### Code Analysis and Modification

- `analyze_code`: Analyze code files and provide insights about their structure, complexity, and potential issues
- `modify_code`: Modify code files with various operations like adding, updating, or removing code segments
- `search_code`: Search for patterns in code files and return matching results with context

### VSCode Instance Management

- `deploy_vscode_instance`: Deploy a new VSCode instance using Docker
- `list_vscode_instances`: List all deployed VSCode instances and their status
- `stop_vscode_instance`: Stop a running VSCode instance

### Job and Resource Management

- `manage_job_resources`: Manage resources for VSCode instances and associated jobs

## Docker Integration

The server integrates with Docker to manage VSCode instances. Make sure Docker is installed and running on your system.

### VSCode Instance Structure

Each VSCode instance is deployed as a Docker container with the following structure:

- Container name: `vscode-{instance-id}`
- Exposed port: Random or specified port
- Volumes:
  - `vscode-data-{instance-id}`: VSCode configuration
  - `vscode-extensions-{instance-id}`: VSCode extensions
  - Workspace mount: Specified workspace path

## Development

### Project Structure

```
vscode-remote-mcp/
├── run-mcp-server.js       # Main server entry point
├── test-discovery-fix.js   # Test script for discovery endpoints
├── DISCOVERY-FIX-SUMMARY.md # Documentation of discovery endpoint fixes
├── src/
│   ├── tools/              # Tool implementations
│   │   ├── analyze_code.js
│   │   ├── modify_code.js
│   │   ├── search_code.js
│   │   ├── deploy_vscode_instance.js
│   │   ├── list_vscode_instances.js
│   │   ├── stop_vscode_instance.js
│   │   ├── manage_job_resources.js
│   │   └── index.js        # Tool registry
│   ├── utils/              # Utility functions
│   └── config/             # Configuration
├── tests/                  # Tests
└── docker/                 # Docker configuration
```

### Protocol Version

The server implements the MCP protocol version `2024-11-05`. This version includes:

- Standard discovery endpoints
- Tool and resource listing
- Heartbeat notifications
- Proper error handling and timeout management

### Adding New Tools

1. Create a new tool implementation in `src/tools/`
2. Register the tool in `src/tools/index.js`
3. Update the server capabilities in `run-mcp-server.js`

## Integration with Roo

This MCP server can be integrated with Roo by adding the following configuration to `.roo/mcp.json`:

```json
{
  "mcpServers": {
    "sparc2-mcp": {
      "command": "node",
      "args": [
        "vscode-remote-mcp/run-mcp-server.js"
      ],
      "alwaysAllow": [
        "analyze_code",
        "modify_code",
        "search_code",
        "deploy_vscode_instance",
        "list_vscode_instances",
        "stop_vscode_instance",
        "manage_job_resources"
      ]
    }
  }
}
```

## Troubleshooting

### Discovery Endpoint Timeouts

If you encounter timeout issues with the discovery endpoints, check:

1. Make sure the server is running and accessible
2. Check the `REQUEST_TIMEOUT` environment variable (default: 45000ms)
3. Enable debug logging by setting `MCP_DEBUG=1`
4. Run the test script: `node test-discovery-fix.js`

For more details on the discovery endpoint fixes, see [DISCOVERY-FIX-SUMMARY.md](./DISCOVERY-FIX-SUMMARY.md).

## License

MIT