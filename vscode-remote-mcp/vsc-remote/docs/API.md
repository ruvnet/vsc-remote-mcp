# VSC-Remote Programmatic API Reference

This document provides detailed information about using the vsc-remote package programmatically in your Node.js applications.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
  - [Server API](#server-api)
    - [createServer](#createserver)
    - [VSCodeRemoteMcpServer Class](#vscoderemoteserver-class)
  - [Tools API](#tools-api)
    - [analyze_code](#analyze_code)
    - [search_code](#search_code)
    - [modify_code](#modify_code)
    - [deploy_vscode_instance](#deploy_vscode_instance)
    - [list_vscode_instances](#list_vscode_instances)
    - [stop_vscode_instance](#stop_vscode_instance)
    - [manage_job_resources](#manage_job_resources)
- [Advanced Usage](#advanced-usage)
  - [Custom Tool Integration](#custom-tool-integration)
  - [Error Handling](#error-handling)
  - [Authentication](#authentication)
- [Examples](#examples)
  - [Creating a Custom MCP Server](#creating-a-custom-mcp-server)
  - [Building a Code Analysis Tool](#building-a-code-analysis-tool)
  - [Integrating with AI Assistants](#integrating-with-ai-assistants)

## Installation

To use vsc-remote in your Node.js project:

```bash
npm install vsc-remote
```

## Basic Usage

```javascript
const { createServer, tools } = require('vsc-remote');

// Create and start an MCP server
async function startServer() {
  const server = await createServer();
  console.log('Server started');
  return server;
}

// Use tools directly
async function analyzeCode() {
  const result = await tools.analyze_code({
    file_path: 'src/index.js',
    include_metrics: true,
    include_structure: true,
    include_issues: true
  });
  console.log(result);
  return result;
}
```

## API Reference

### Server API

#### createServer

Creates and starts a new VSCode Remote MCP Server instance.

**Syntax:**

```javascript
async function createServer(options)
```

**Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `options` | Object | Configuration options | `{}` |
| `options.mode` | string | Server mode ('stdio' or 'websocket') | `'stdio'` |
| `options.port` | number | Port for WebSocket mode | `3001` |
| `options.debug` | boolean | Enable debug logging | `false` |

**Returns:**

A Promise that resolves to a VSCodeRemoteMcpServer instance.

**Example:**

```javascript
const { createServer } = require('vsc-remote');

async function main() {
  // Create a WebSocket server
  const server = await createServer({
    mode: 'websocket',
    port: 3001,
    debug: true
  });
  
  console.log('Server running on port 3001');
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
  });
}

main().catch(console.error);
```

#### VSCodeRemoteMcpServer Class

The main server class that handles MCP protocol communication.

**Constructor:**

```javascript
new VSCodeRemoteMcpServer(options)
```

**Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `options` | Object | Configuration options | `{}` |
| `options.name` | string | Server name | `'vsc-remote-mcp'` |
| `options.version` | string | Server version | Package version |

**Methods:**

| Method | Description | Returns |
|--------|-------------|---------|
| `serve()` | Starts the server | Promise\<void\> |
| `shutdown()` | Gracefully shuts down the server | Promise\<void\> |
| `setupRequestHandlers()` | Sets up request handlers for tools | void |
| `getCapabilities()` | Returns server capabilities | Object |

**Example:**

```javascript
const { VSCodeRemoteMcpServer } = require('vsc-remote');

const server = new VSCodeRemoteMcpServer({
  name: 'custom-mcp-server',
  version: '1.0.0'
});

server.serve()
  .then(() => console.log('Server started'))
  .catch(err => console.error('Failed to start server:', err));
```

### Tools API

The vsc-remote package provides a set of tools that can be used programmatically.

#### analyze_code

Analyzes code files and provides insights about their structure, complexity, and potential issues.

**Syntax:**

```javascript
async function analyze_code(options)
```

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options` | Object | Tool options | Yes |
| `options.file_path` | string | Path to the file to analyze | Yes |
| `options.include_metrics` | boolean | Include complexity metrics | No (default: true) |
| `options.include_structure` | boolean | Include structure analysis | No (default: true) |
| `options.include_issues` | boolean | Include issues detection | No (default: true) |

**Returns:**

A Promise that resolves to an object containing the analysis results:

```javascript
{
  metrics: {
    complexity: number,
    maintainability: number,
    loc: number,
    // ...other metrics
  },
  structure: {
    functions: [
      {
        name: string,
        start_line: number,
        end_line: number,
        parameters: string[],
        // ...other function details
      }
    ],
    classes: [
      // ...class details
    ],
    imports: [
      // ...import details
    ]
  },
  issues: [
    {
      type: string,
      message: string,
      line: number,
      column: number,
      severity: 'error' | 'warning' | 'info'
    }
  ]
}
```

**Example:**

```javascript
const { tools } = require('vsc-remote');

async function analyzeCodeFile() {
  try {
    const result = await tools.analyze_code({
      file_path: 'src/index.js',
      include_metrics: true,
      include_structure: true,
      include_issues: true
    });
    
    console.log('Code Complexity:', result.metrics.complexity);
    console.log('Functions:', result.structure.functions.length);
    console.log('Issues:', result.issues.length);
    
    return result;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}
```

#### search_code

Searches for patterns in code files and returns matching results with context.

**Syntax:**

```javascript
async function search_code(options)
```

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options` | Object | Tool options | Yes |
| `options.pattern` | string | Pattern to search for | Yes |
| `options.directory` | string | Directory to search in | No (default: '.') |
| `options.file_pattern` | string | File pattern to match | No (default: '*') |
| `options.context_lines` | number | Number of context lines | No (default: 2) |
| `options.max_results` | number | Maximum number of results | No (default: 100) |
| `options.ignore_case` | boolean | Ignore case | No (default: false) |
| `options.use_regex` | boolean | Use regex for pattern | No (default: true) |

**Returns:**

A Promise that resolves to an object containing the search results:

```javascript
{
  matches: [
    {
      file: string,
      line: number,
      column: number,
      match: string,
      context: {
        before: string[],
        line: string,
        after: string[]
      }
    }
  ],
  total_matches: number,
  files_searched: number
}
```

**Example:**

```javascript
const { tools } = require('vsc-remote');

async function searchForFunction() {
  try {
    const result = await tools.search_code({
      pattern: 'function',
      directory: 'src',
      file_pattern: '*.js',
      context_lines: 3,
      ignore_case: false,
      use_regex: true
    });
    
    console.log(`Found ${result.total_matches} matches in ${result.files_searched} files`);
    
    result.matches.forEach(match => {
      console.log(`${match.file}:${match.line} - ${match.match}`);
      console.log('Context:');
      match.context.before.forEach(line => console.log(`  ${line}`));
      console.log(`> ${match.context.line}`);
      match.context.after.forEach(line => console.log(`  ${line}`));
      console.log('---');
    });
    
    return result;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}
```

#### modify_code

Modifies code files with various operations like adding, updating, or removing code segments.

**Syntax:**

```javascript
async function modify_code(options)
```

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options` | Object | Tool options | Yes |
| `options.file_path` | string | Path to the file to modify | Yes |
| `options.operation` | string | Operation type ('add', 'update', 'remove', 'replace') | Yes |
| `options.position` | number | Line number for add operation | For 'add' operation |
| `options.pattern` | string | Pattern to match for update/remove operations | For 'update'/'remove' operations |
| `options.range` | [number, number] | Line range for replace operation | For 'replace' operation |
| `options.content` | string | New content to add/update/replace | For 'add'/'update'/'replace' operations |
| `options.use_regex` | boolean | Use regex for pattern matching | No (default: false) |

**Returns:**

A Promise that resolves to an object containing the modification results:

```javascript
{
  success: boolean,
  file_path: string,
  operation: string,
  changes: {
    lines_affected: number,
    original_content?: string,
    new_content?: string
  }
}
```

**Example:**

```javascript
const { tools } = require('vsc-remote');

async function addComment() {
  try {
    const result = await tools.modify_code({
      file_path: 'src/index.js',
      operation: 'add',
      position: 10,
      content: '// This is a new comment'
    });
    
    console.log(`Modified ${result.file_path} with ${result.operation} operation`);
    console.log(`Affected ${result.changes.lines_affected} lines`);
    
    return result;
  } catch (error) {
    console.error('Modification failed:', error);
    throw error;
  }
}

async function updateFunctionName() {
  try {
    const result = await tools.modify_code({
      file_path: 'src/index.js',
      operation: 'update',
      pattern: 'function oldName',
      content: 'function newName',
      use_regex: false
    });
    
    console.log(`Updated function name in ${result.file_path}`);
    console.log(`Original: ${result.changes.original_content}`);
    console.log(`New: ${result.changes.new_content}`);
    
    return result;
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  }
}
```

#### deploy_vscode_instance

Deploys a new VSCode instance using Docker.

**Syntax:**

```javascript
async function deploy_vscode_instance(options)
```

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options` | Object | Tool options | Yes |
| `options.name` | string | Instance name | Yes |
| `options.workspace_path` | string | Path to workspace directory | Yes |
| `options.port` | number | Port to expose VSCode on | No (auto-assigned) |
| `options.password` | string | Password for authentication | No (auto-generated) |
| `options.cpu` | string | CPU limit (e.g., "1" for 1 core) | No |
| `options.memory` | string | Memory limit (e.g., "2Gi") | No |
| `options.disk` | string | Disk space limit (e.g., "10Gi") | No |

**Returns:**

A Promise that resolves to an object containing the deployment results:

```javascript
{
  instance_id: string,
  name: string,
  status: 'running',
  url: string,
  port: number,
  password: string,
  workspace_path: string,
  resources: {
    cpu: string,
    memory: string,
    disk: string
  },
  created_at: string,
  container_id: string
}
```

**Example:**

```javascript
const { tools } = require('vsc-remote');

async function deployInstance() {
  try {
    const result = await tools.deploy_vscode_instance({
      name: 'my-vscode-instance',
      workspace_path: '/path/to/workspace',
      port: 8080,
      password: 'securepassword',
      cpu: '2',
      memory: '4Gi'
    });
    
    console.log(`Deployed VSCode instance: ${result.name}`);
    console.log(`Access URL: ${result.url}`);
    console.log(`Password: ${result.password}`);
    
    return result;
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error;
  }
}
```

#### list_vscode_instances

Lists all deployed VSCode instances and their status.

**Syntax:**

```javascript
async function list_vscode_instances(options)
```

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options` | Object | Tool options | No |
| `options.status` | string | Filter by status ('running', 'stopped', 'all') | No (default: 'all') |

**Returns:**

A Promise that resolves to an array of instance objects:

```javascript
[
  {
    instance_id: string,
    name: string,
    status: 'running' | 'stopped',
    url: string,
    port: number,
    workspace_path: string,
    resources: {
      cpu: string,
      memory: string,
      disk: string
    },
    created_at: string,
    last_active: string
  }
]
```

**Example:**

```javascript
const { tools } = require('vsc-remote');

async function listInstances() {
  try {
    const instances = await tools.list_vscode_instances({
      status: 'running'
    });
    
    console.log(`Found ${instances.length} running instances:`);
    
    instances.forEach(instance => {
      console.log(`- ${instance.name} (${instance.status})`);
      console.log(`  URL: ${instance.url}`);
      console.log(`  Created: ${instance.created_at}`);
      console.log(`  Last active: ${instance.last_active}`);
      console.log('---');
    });
    
    return instances;
  } catch (error) {
    console.error('Failed to list instances:', error);
    throw error;
  }
}
```

#### stop_vscode_instance

Stops a running VSCode instance.

**Syntax:**

```javascript
async function stop_vscode_instance(options)
```

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options` | Object | Tool options | Yes |
| `options.name` | string | Instance name | Yes |
| `options.force` | boolean | Force stop without confirmation | No (default: false) |

**Returns:**

A Promise that resolves to an object containing the stop results:

```javascript
{
  success: boolean,
  instance_id: string,
  name: string,
  status: 'stopped',
  stopped_at: string
}
```

**Example:**

```javascript
const { tools } = require('vsc-remote');

async function stopInstance() {
  try {
    const result = await tools.stop_vscode_instance({
      name: 'my-vscode-instance',
      force: true
    });
    
    console.log(`Stopped VSCode instance: ${result.name}`);
    console.log(`Status: ${result.status}`);
    console.log(`Stopped at: ${result.stopped_at}`);
    
    return result;
  } catch (error) {
    console.error('Failed to stop instance:', error);
    throw error;
  }
}
```

#### manage_job_resources

Manages resources for VSCode instances and associated jobs.

**Syntax:**

```javascript
async function manage_job_resources(options)
```

**Parameters:**

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `options` | Object | Tool options | Yes |
| `options.job_id` | string | Job ID | Yes |
| `options.operation` | string | Operation ('status', 'update', 'pause', 'resume') | Yes |
| `options.cpu` | string | CPU limit for update operation | For 'update' operation |
| `options.memory` | string | Memory limit for update operation | For 'update' operation |
| `options.disk` | string | Disk limit for update operation | For 'update' operation |

**Returns:**

A Promise that resolves to an object containing the operation results (structure varies by operation).

For 'status' operation:
```javascript
{
  job_id: string,
  status: 'running' | 'paused' | 'stopped',
  resources: {
    cpu: string,
    memory: string,
    disk: string,
    cpu_usage: number,
    memory_usage: number,
    disk_usage: number
  },
  started_at: string,
  last_updated: string
}
```

For 'update' operation:
```javascript
{
  job_id: string,
  operation: 'update',
  success: boolean,
  previous_resources: {
    cpu: string,
    memory: string,
    disk: string
  },
  new_resources: {
    cpu: string,
    memory: string,
    disk: string
  },
  updated_at: string
}
```

For 'pause'/'resume' operations:
```javascript
{
  job_id: string,
  operation: 'pause' | 'resume',
  success: boolean,
  status: 'paused' | 'running',
  timestamp: string
}
```

**Example:**

```javascript
const { tools } = require('vsc-remote');

async function checkJobStatus() {
  try {
    const status = await tools.manage_job_resources({
      job_id: 'job-123',
      operation: 'status'
    });
    
    console.log(`Job ${status.job_id} is ${status.status}`);
    console.log('Resource usage:');
    console.log(`- CPU: ${status.resources.cpu_usage}%`);
    console.log(`- Memory: ${status.resources.memory_usage}%`);
    console.log(`- Disk: ${status.resources.disk_usage}%`);
    
    return status;
  } catch (error) {
    console.error('Failed to get job status:', error);
    throw error;
  }
}

async function updateJobResources() {
  try {
    const result = await tools.manage_job_resources({
      job_id: 'job-123',
      operation: 'update',
      cpu: '2',
      memory: '4Gi'
    });
    
    console.log(`Updated resources for job ${result.job_id}`);
    console.log('Previous resources:', result.previous_resources);
    console.log('New resources:', result.new_resources);
    
    return result;
  } catch (error) {
    console.error('Failed to update job resources:', error);
    throw error;
  }
}
```

## Advanced Usage

### Custom Tool Integration

You can extend the vsc-remote package with your own custom tools:

```javascript
const { VSCodeRemoteMcpServer } = require('vsc-remote');

// Create a custom tool
const customTool = async (args) => {
  // Tool implementation
  return { result: 'Custom tool executed', args };
};

// Create a server with custom tools
const server = new VSCodeRemoteMcpServer();

// Add custom tool to the server
server.addTool('custom_tool', customTool, {
  // Tool schema
  type: 'object',
  properties: {
    param1: { type: 'string' },
    param2: { type: 'number' }
  },
  required: ['param1']
});

// Start the server
server.serve()
  .then(() => console.log('Server started with custom tool'))
  .catch(console.error);
```

### Error Handling

The vsc-remote package uses a standardized error handling mechanism:

```javascript
const { tools, errors } = require('vsc-remote');

async function safeAnalyzeCode() {
  try {
    const result = await tools.analyze_code({
      file_path: 'src/index.js'
    });
    return result;
  } catch (error) {
    if (error instanceof errors.FileNotFoundError) {
      console.error('File not found:', error.message);
      // Handle file not found error
    } else if (error instanceof errors.ToolExecutionError) {
      console.error('Tool execution failed:', error.message);
      // Handle tool execution error
    } else {
      console.error('Unexpected error:', error);
      // Handle other errors
    }
    throw error;
  }
}
```

### Authentication

For secure operations, you can configure authentication:

```javascript
const { createServer } = require('vsc-remote');

async function createSecureServer() {
  const server = await createServer({
    mode: 'websocket',
    port: 3001,
    auth: {
      enabled: true,
      tokenSecret: process.env.TOKEN_SECRET,
      tokenExpiration: 3600 // 1 hour
    }
  });
  
  console.log('Secure server started');
  return server;
}
```

## Examples

### Creating a Custom MCP Server

```javascript
const { VSCodeRemoteMcpServer } = require('vsc-remote');
const { WebSocketServerTransport } = require('@modelcontextprotocol/sdk/server/websocket.js');

async function createCustomServer() {
  // Create server instance
  const server = new VSCodeRemoteMcpServer({
    name: 'custom-mcp-server',
    version: '1.0.0'
  });
  
  // Add custom request handler
  server.server.onRequest('custom_operation', async (request) => {
    console.log('Received custom operation request:', request);
    return {
      result: 'Custom operation completed',
      timestamp: new Date().toISOString()
    };
  });
  
  // Create WebSocket transport
  const transport = new WebSocketServerTransport({ port: 3001 });
  
  // Connect server to transport
  await server.server.connect(transport);
  
  console.log('Custom MCP server running on port 3001');
  
  return server;
}

createCustomServer().catch(console.error);
```

### Building a Code Analysis Tool

```javascript
const { tools } = require('vsc-remote');
const fs = require('fs').promises;
const path = require('path');

async function analyzeProject() {
  try {
    // Get all JavaScript files in the project
    const files = await findJsFiles('src');
    
    // Analyze each file
    const results = await Promise.all(
      files.map(file => tools.analyze_code({
        file_path: file,
        include_metrics: true,
        include_structure: true,
        include_issues: true
      }))
    );
    
    // Aggregate results
    const aggregated = {
      total_files: files.length,
      total_issues: results.reduce((sum, r) => sum + r.issues.length, 0),
      average_complexity: results.reduce((sum, r) => sum + r.metrics.complexity, 0) / results.length,
      functions: results.flatMap(r => r.structure.functions.map(f => ({
        file: r.file_path,
        ...f
      }))),
      issues_by_severity: {
        error: results.flatMap(r => r.issues.filter(i => i.severity === 'error')),
        warning: results.flatMap(r => r.issues.filter(i => i.severity === 'warning')),
        info: results.flatMap(r => r.issues.filter(i => i.severity === 'info'))
      }
    };
    
    // Generate report
    await fs.writeFile(
      'code-analysis-report.json',
      JSON.stringify(aggregated, null, 2)
    );
    
    console.log(`Analysis complete. Found ${aggregated.total_issues} issues in ${aggregated.total_files} files.`);
    console.log(`Average complexity: ${aggregated.average_complexity.toFixed(2)}`);
    
    return aggregated;
  } catch (error) {
    console.error('Project analysis failed:', error);
    throw error;
  }
}

async function findJsFiles(dir) {
  const files = [];
  
  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

analyzeProject().catch(console.error);
```

### Integrating with AI Assistants

```javascript
const { createServer } = require('vsc-remote');
const { WebSocketServerTransport } = require('@modelcontextprotocol/sdk/server/websocket.js');

async function createAIAssistantServer() {
  // Start the MCP server
  const server = await createServer({
    mode: 'websocket',
    port: 3001
  });
  
  console.log('MCP server running on port 3001');
  
  // In your AI assistant integration code:
  // 1. Connect to the MCP server
  // 2. Send tool requests
  // 3. Process tool responses
  
  // Example client connection (in a separate process/application):
  /*
  const { Client } = require('@modelcontextprotocol/sdk/client');
  const { WebSocketClientTransport } = require('@modelcontextprotocol/sdk/client/websocket');
  
  const transport = new WebSocketClientTransport('ws://localhost:3001');
  const client = new Client();
  
  await client.connect(transport);
  
  // Use tools via the client
  const result = await client.callTool('analyze_code', {
    file_path: 'src/index.js'
  });
  
  console.log('Analysis result:', result);
  */
  
  return server;
}

createAIAssistantServer().catch(console.error);