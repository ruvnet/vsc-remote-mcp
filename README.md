# VSCode Remote MCP Server

## Introduction

The VSCode Remote MCP Server is an enhanced implementation of the Model Context Protocol (MCP) designed specifically for VSCode Remote integration. It provides a robust set of tools for code analysis, modification, searching, and VSCode instance management through Docker containers. This server enables AI assistants and other tools to interact with your codebase and manage development environments programmatically.

## Overview

### Architecture

The VSCode Remote MCP Server follows a client-server architecture based on the Model Context Protocol (MCP) specification. The server exposes a set of tools and resources that clients can use to perform various operations on code files and manage VSCode instances.

```
┌─────────────┐     ┌───────────────────────┐     ┌─────────────────┐
│             │     │                       │     │                 │
│  MCP Client ├─────┤ VSCode Remote MCP     ├─────┤ Code Files     │
│  (AI Tool)  │     │ Server                │     │ VSCode Instances│
│             │     │                       │     │                 │
└─────────────┘     └───────────────────────┘     └─────────────────┘
```

The server implements the MCP protocol version `2024-11-05`, which includes:
- Standard discovery endpoints
- Tool and resource listing
- Heartbeat notifications
- Proper error handling and timeout management

### How It Works

1. **Tool Discovery**: Clients connect to the server and discover available tools through standard MCP discovery endpoints.
2. **Tool Execution**: Clients send requests to execute specific tools with parameters.
3. **Resource Management**: The server manages resources for VSCode instances and associated jobs.
4. **Docker Integration**: The server uses Docker to deploy and manage VSCode instances.

## Features

- **Code Analysis**: Analyze code files for structure, complexity, and potential issues
  - Detect code structure (functions, classes, imports)
  - Calculate complexity metrics
  - Identify potential issues (long functions, TODO comments, etc.)

- **Code Modification**: Modify code files with various operations
  - Add new code segments
  - Update existing code
  - Remove code segments
  - Replace code within a specified range

- **Code Search**: Search for patterns in code files
  - Support for regex patterns
  - Context-aware search results
  - Configurable search parameters

- **VSCode Instance Management**: Deploy, list, and stop VSCode instances
  - Deploy new VSCode instances using Docker
  - List all deployed instances with their status
  - Stop running instances

- **Job Resource Management**: Manage resources for VSCode instances and jobs
  - Allocate resources (CPU, memory, disk)
  - Update resource allocations
  - Monitor resource usage
  - Deallocate resources when no longer needed

- **Robust Discovery Endpoints**: Reliable discovery endpoints with proper timeout handling
- **Standardized Protocol**: Follows the MCP protocol specification

## Benefits

- **Automation**: Automate code analysis, modification, and environment management tasks
- **Integration**: Easily integrate with AI assistants and other tools through the MCP protocol
- **Isolation**: Run multiple VSCode instances in isolated Docker containers
- **Resource Control**: Manage and monitor resource usage for VSCode instances
- **Standardization**: Use a standardized protocol for tool discovery and execution
- **Extensibility**: Add new tools and capabilities to the server as needed

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/vscode-remote-mcp.git
```

2. Install dependencies:
```bash
cd vscode-remote-mcp
npm install
```

3. Create a `.env` file in the root directory (optional):
```
PORT=3001
HOST=localhost
LOG_LEVEL=debug
REQUEST_TIMEOUT=45000
HEARTBEAT_INTERVAL=10000
MCP_DEBUG=1
```

4. Ensure Docker is installed and running on your system.

## Usage

### Starting the Server

Start the MCP server with the following command:

```bash
node run-mcp-server.js
```

### Connecting to the Server

Clients can connect to the server using the MCP protocol. The server exposes the following endpoints:

- Discovery: `http://localhost:3001/mcp/discovery`
- Tools: `http://localhost:3001/mcp/tools`
- Resources: `http://localhost:3001/mcp/resources`

### Example: Using the Server with Roo

To integrate this MCP server with Roo, add the following configuration to `.roo/mcp.json`:

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

### Example: Deploying a VSCode Instance

To deploy a new VSCode instance:

```javascript
// Example client code
const response = await client.executeTool('deploy_vscode_instance', {
  name: 'my-project',
  workspace_path: '/path/to/workspace',
  port: 8080,
  extensions: ['ms-python.python', 'dbaeumer.vscode-eslint']
});

console.log(`VSCode instance deployed at: ${response.url}`);
```

### Example: Analyzing Code

To analyze a code file:

```javascript
// Example client code
const response = await client.executeTool('analyze_code', {
  file_path: '/path/to/file.js',
  include_metrics: true,
  include_structure: true,
  include_issues: true
});

console.log(response.content[0].text);
```

## Configuration

The server can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to listen on | 3001 |
| `HOST` | Host to bind to | localhost |
| `LOG_LEVEL` | Logging level | info |
| `REQUEST_TIMEOUT` | Timeout for requests in milliseconds | 45000 |
| `HEARTBEAT_INTERVAL` | Interval for heartbeat messages in milliseconds | 10000 |
| `MCP_DEBUG` | Enable debug logging | 0 |
| `DEFAULT_PASSWORD` | Default password for VSCode instances | changeme |
| `DEFAULT_EXTENSIONS` | Default extensions for VSCode instances | ms-python.python,dbaeumer.vscode-eslint |
| `DEFAULT_CPU_LIMIT` | Default CPU limit for VSCode instances | 1.0 |
| `DEFAULT_MEMORY_LIMIT` | Default memory limit for VSCode instances | 2g |

## Advanced Options

### Adding New Tools

1. Create a new tool implementation in `src/tools/`:

```javascript
// src/tools/my_new_tool.js
async function myNewTool(params) {
  // Tool implementation
  return {
    content: [
      {
        type: 'text',
        text: 'Tool executed successfully'
      }
    ],
    // Additional result data
  };
}

module.exports = myNewTool;
```

2. Register the tool in `src/tools/index.js`:

```javascript
// src/tools/index.js
const analyzeCode = require('./analyze_code');
const modifyCode = require('./modify_code');
const searchCode = require('./search_code');
const deployVSCodeInstance = require('./deploy_vscode_instance');
const listVSCodeInstances = require('./list_vscode_instances');
const stopVSCodeInstance = require('./stop_vscode_instance');
const manageJobResources = require('./manage_job_resources');
const myNewTool = require('./my_new_tool');

module.exports = {
  analyze_code: analyzeCode,
  modify_code: modifyCode,
  search_code: searchCode,
  deploy_vscode_instance: deployVSCodeInstance,
  list_vscode_instances: listVSCodeInstances,
  stop_vscode_instance: stopVSCodeInstance,
  manage_job_resources: manageJobResources,
  my_new_tool: myNewTool
};
```

3. Update the server capabilities in `run-mcp-server.js`.

### Custom Docker Images

You can customize the Docker image used for VSCode instances by modifying the `buildDockerCommand` function in `src/tools/deploy_vscode_instance.js`.

### Resource Management

The server includes a resource management system for VSCode instances and associated jobs. You can use the `manage_job_resources` tool to allocate, update, and deallocate resources.

## Tools Reference

### analyze_code

Analyzes code files and provides insights about their structure, complexity, and potential issues.

**Parameters:**
- `file_path` (required): Path to the file to analyze
- `include_metrics` (optional, default: true): Whether to include complexity metrics
- `include_structure` (optional, default: true): Whether to include structure analysis
- `include_issues` (optional, default: true): Whether to include potential issues

**Returns:**
- File type and size information
- Complexity metrics (cyclomatic complexity, maintainability index, function count, etc.)
- Code structure (imports, functions, classes)
- Potential issues (long functions, TODO comments, console.log statements, etc.)

**Example:**
```javascript
{
  file_path: '/path/to/file.js',
  include_metrics: true,
  include_structure: true,
  include_issues: true
}
```

### modify_code

Modifies code files with various operations like adding, updating, or removing code segments.

**Parameters:**
- `file_path` (required): Path to the file to modify
- `operation` (required): Operation to perform (add, update, remove, replace)
- `position` (optional): Position to perform the operation at (line, column)
- `content` (optional): Content to add or update
- `pattern` (optional): Pattern to match for update or remove operations
- `range` (optional): Range of lines to modify (start_line, end_line)

**Returns:**
- Success status
- Modification details

**Example:**
```javascript
{
  file_path: '/path/to/file.js',
  operation: 'add',
  position: { line: 10 },
  content: 'console.log("Hello, world!");'
}
```

### search_code

Searches for patterns in code files and returns matching results with context.

**Parameters:**
- `pattern` (required): Pattern to search for
- `directory` (optional, default: '.'): Directory to search in
- `file_pattern` (optional, default: '*'): File pattern to match
- `context_lines` (optional, default: 2): Number of context lines to include
- `max_results` (optional, default: 100): Maximum number of results to return
- `ignore_case` (optional, default: false): Whether to ignore case
- `use_regex` (optional, default: true): Whether to use regex

**Returns:**
- Matching results with context
- File paths and line numbers

**Example:**
```javascript
{
  pattern: 'function\\s+\\w+\\s*\\(',
  directory: 'src',
  file_pattern: '*.js',
  context_lines: 2,
  max_results: 50,
  ignore_case: false,
  use_regex: true
}
```

### deploy_vscode_instance

Deploys a new VSCode instance using Docker.

**Parameters:**
- `name` (required): Instance name
- `workspace_path` (required): Path to workspace directory
- `port` (optional): Port to expose (random if not specified)
- `password` (optional): Password for authentication
- `extensions` (optional): Extensions to install
- `cpu_limit` (optional): CPU limit
- `memory_limit` (optional): Memory limit
- `environment` (optional): Environment variables

**Returns:**
- Instance ID
- Instance name
- Port
- URL
- Status

**Example:**
```javascript
{
  name: 'my-project',
  workspace_path: '/path/to/workspace',
  port: 8080,
  extensions: ['ms-python.python', 'dbaeumer.vscode-eslint'],
  cpu_limit: 2,
  memory_limit: '4g'
}
```

### list_vscode_instances

Lists all deployed VSCode instances and their status.

**Parameters:**
- `filter` (optional): Filter instances by name
- `status` (optional, default: 'all'): Filter instances by status (running, stopped, all)

**Returns:**
- List of instances with details (ID, name, status, workspace path, URL, port, resource usage)

**Example:**
```javascript
{
  filter: 'my-project',
  status: 'running'
}
```

### stop_vscode_instance

Stops a running VSCode instance.

**Parameters:**
- `name` (required): Instance name
- `force` (optional, default: false): Force stop

**Returns:**
- Success status
- Instance name
- Status

**Example:**
```javascript
{
  name: 'my-project',
  force: false
}
```

### manage_job_resources

Manages resources for VSCode instances and associated jobs.

**Parameters:**
- `job_id` (required): Job ID
- `operation` (required): Operation to perform (allocate, deallocate, update, status)
- `resources` (optional): Resources to allocate or update (cpu, memory, disk)

**Returns:**
- Success status
- Job ID
- Operation
- Resources
- Timestamps

**Example:**
```javascript
{
  job_id: '12345',
  operation: 'allocate',
  resources: {
    cpu: 2,
    memory: '4g',
    disk: '20g'
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

### Docker Issues

If you encounter issues with Docker:

1. Make sure Docker is installed and running
2. Check Docker permissions
3. Check if the specified ports are available
4. Check Docker logs: `docker logs <container-name>`

### Resource Management Issues

If you encounter issues with resource management:

1. Check if the resources directory exists
2. Check if the resource files are valid JSON
3. Check if the job ID exists
4. Check Docker resource limits

## License

MIT