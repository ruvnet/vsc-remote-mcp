# NPX Implementation Plan for VSCode Remote MCP Server

This document outlines the implementation plan for converting the VSCode Remote MCP Server into a globally installable NPX package called 'vsc-remote'.

## 1. Project Structure

The current project structure will be reorganized to support NPX compatibility:

```
vsc-remote/
├── bin/                      # Binary executable files
│   └── vsc-remote.js         # Main CLI entry point
├── src/
│   ├── cli/                  # CLI-specific code
│   │   ├── index.js          # CLI command router
│   │   ├── commands/         # Command implementations
│   │   └── utils/            # CLI utilities
│   ├── config/               # Configuration
│   ├── tools/                # MCP tools implementation
│   └── utils/                # Utility functions
├── test/                     # Tests
├── package.json              # Package configuration
├── README.md                 # Documentation
└── LICENSE                   # License file
```

## 2. Package Setup

### package.json Changes

The package.json file will need the following modifications:

```json
{
  "name": "vsc-remote",
  "version": "1.0.0",
  "description": "VSCode Remote MCP Server as an NPX package",
  "main": "src/index.js",
  "bin": {
    "vsc-remote": "./bin/vsc-remote.js"
  },
  "scripts": {
    "start": "node bin/vsc-remote.js",
    "test": "jest",
    "lint": "eslint .",
    "build": "npm run lint && npm run test"
  },
  "keywords": [
    "vscode",
    "mcp",
    "remote",
    "docker",
    "cli"
  ],
  "author": "Edge Agents",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.7.0",
    "commander": "^11.0.0",
    "dotenv": "^16.0.3",
    "inquirer": "^8.2.5",
    "chalk": "^4.1.2",
    "ora": "^5.4.1",
    "uuid": "^9.0.1",
    "ws": "^8.18.1"
  },
  "devDependencies": {
    "@babel/core": "^7.21.4",
    "@babel/preset-env": "^7.21.4",
    "eslint": "^8.38.0",
    "jest": "^29.5.0",
    "nodemon": "^2.0.22"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "files": [
    "bin/",
    "src/",
    "LICENSE",
    "README.md"
  ]
}
```

## 3. Command Line Interface

### Main Entry Point (bin/vsc-remote.js)

The main entry point will be a CLI wrapper that uses Commander.js for argument parsing:

```javascript
#!/usr/bin/env node

/**
 * VSCode Remote MCP Server - CLI Entry Point
 * 
 * This is the main entry point for the vsc-remote CLI tool.
 * It parses command line arguments and routes to the appropriate commands.
 */

const { program } = require('commander');
const pkg = require('../package.json');
const { startServer, runTool } = require('../src/cli');

// Configure the CLI
program
  .name('vsc-remote')
  .description('VSCode Remote MCP Server CLI')
  .version(pkg.version);

// Start server command
program
  .command('start')
  .description('Start the MCP server')
  .option('-d, --debug', 'Enable debug mode')
  .option('-p, --port <port>', 'Port to run the server on (for WebSocket mode)')
  .option('-m, --mode <mode>', 'Server mode (stdio or websocket)', 'stdio')
  .action(startServer);

// Tool commands
program
  .command('analyze-code <file-path>')
  .description('Analyze code files')
  .option('--no-metrics', 'Disable complexity metrics')
  .option('--no-structure', 'Disable structure analysis')
  .option('--no-issues', 'Disable issues detection')
  .action((filePath, options) => {
    runTool('analyze_code', {
      file_path: filePath,
      include_metrics: options.metrics !== false,
      include_structure: options.structure !== false,
      include_issues: options.issues !== false
    });
  });

program
  .command('search-code <pattern>')
  .description('Search for patterns in code files')
  .option('-d, --directory <dir>', 'Directory to search in', '.')
  .option('-f, --file-pattern <pattern>', 'File pattern to match', '*')
  .option('-c, --context-lines <lines>', 'Number of context lines', '2')
  .option('-m, --max-results <count>', 'Maximum number of results', '100')
  .option('-i, --ignore-case', 'Ignore case')
  .option('--no-regex', 'Disable regex')
  .action((pattern, options) => {
    runTool('search_code', {
      pattern,
      directory: options.directory,
      file_pattern: options.filePattern,
      context_lines: parseInt(options.contextLines, 10),
      max_results: parseInt(options.maxResults, 10),
      ignore_case: options.ignoreCase === true,
      use_regex: options.regex !== false
    });
  });

// Add similar commands for other tools: modify_code, deploy_vscode_instance, 
// list_vscode_instances, stop_vscode_instance, manage_job_resources

// Parse arguments
program.parse(process.argv);
```

### CLI Implementation (src/cli/index.js)

```javascript
/**
 * CLI Implementation
 */

const VSCodeRemoteMcpServer = require('../mcp-sdk-server');
const { tools } = require('../tools');
const chalk = require('chalk');
const ora = require('ora');

/**
 * Start the MCP server
 */
async function startServer(options) {
  // Set environment variables based on options
  if (options.debug) {
    process.env.MCP_DEBUG = '1';
  }
  
  if (options.port) {
    process.env.MCP_PORT = options.port;
  }
  
  process.env.MCP_MODE = options.mode;
  
  const spinner = ora('Starting VSCode Remote MCP Server...').start();
  
  try {
    // Create and start the server
    const server = new VSCodeRemoteMcpServer();
    await server.serve();
    
    spinner.succeed(chalk.green('VSCode Remote MCP Server started successfully'));
    
    if (options.mode === 'websocket') {
      console.log(chalk.blue(`Server running on port ${options.port || 3001}`));
    } else {
      console.log(chalk.blue('Server running in stdio mode'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to start server'));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Run a specific tool
 */
async function runTool(toolName, args) {
  const spinner = ora(`Running ${toolName}...`).start();
  
  try {
    if (!tools[toolName]) {
      spinner.fail(chalk.red(`Tool not found: ${toolName}`));
      process.exit(1);
    }
    
    const result = await tools[toolName](args);
    
    spinner.succeed(chalk.green(`${toolName} completed successfully`));
    
    // Format and display the result
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    spinner.fail(chalk.red(`Error running ${toolName}`));
    console.error(error);
    process.exit(1);
  }
}

module.exports = {
  startServer,
  runTool
};
```

## 4. Tool Exposure

The existing tools will be exposed through both the CLI interface and the MCP server. The tools will be modified to work in both contexts:

### Modified MCP Server (src/mcp-sdk-server.js)

The MCP server will need to be updated to support both stdio and WebSocket modes:

```javascript
/**
 * VSCode Remote MCP Server - SDK Implementation
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { WebSocketServerTransport } = require('@modelcontextprotocol/sdk/server/websocket.js');
const { tools, toolSchemas } = require('./tools');

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

  // ... (existing code)

  /**
   * Start the server
   */
  async serve() {
    console.error('VSCode Remote MCP Server starting...');
    
    try {
      // Determine transport based on environment
      let transport;
      
      if (process.env.MCP_MODE === 'websocket') {
        const port = process.env.MCP_PORT || 3001;
        transport = new WebSocketServerTransport({ port });
        console.error(`Starting WebSocket server on port ${port}`);
      } else {
        transport = new StdioServerTransport();
        console.error('Starting stdio server');
      }
      
      // Connect the server to the transport
      await this.server.connect(transport);
      
      console.error('VSCode Remote MCP Server running');
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        await this.shutdown();
      });
      
      process.on('SIGTERM', async () => {
        await this.shutdown();
      });
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  // ... (existing code)
}

module.exports = VSCodeRemoteMcpServer;
```

## 5. Development Steps

1. **Project Setup**
   - Create the new directory structure
   - Update package.json with NPX configuration
   - Set up the bin directory with executable permissions

2. **CLI Implementation**
   - Implement the main CLI entry point
   - Create command handlers for each tool
   - Implement the server start command

3. **Server Modifications**
   - Update the MCP server to support both stdio and WebSocket modes
   - Ensure tools work in both CLI and server contexts

4. **Tool Adaptations**
   - Modify tools to work with CLI arguments
   - Ensure consistent output formatting

5. **Documentation**
   - Create comprehensive README with usage examples
   - Document CLI commands and options
   - Add examples for each tool

6. **Testing**
   - Create tests for CLI functionality
   - Test NPX installation and execution
   - Verify tool functionality in both CLI and server modes

## 6. Testing Strategy

### Unit Tests

- Test CLI argument parsing
- Test tool execution through CLI
- Test server startup in different modes

### Integration Tests

- Test NPX installation process
- Test tool execution through NPX
- Test MCP server communication

### Manual Testing

- Verify global installation works
- Test all CLI commands
- Test MCP server functionality

## 7. Deployment Process

1. **Prepare for Publishing**
   - Ensure all tests pass
   - Update version number
   - Verify package.json configuration

2. **Build and Package**
   - Run linting and tests
   - Prepare distribution files

3. **Publish to npm**
   - Login to npm
   - Publish the package
   ```bash
   npm login
   npm publish
   ```

4. **Verify Installation**
   - Test global installation
   ```bash
   npm install -g vsc-remote
   vsc-remote --version
   ```
   - Test NPX execution
   ```bash
   npx vsc-remote --version
   ```

## 8. Usage Examples

### Starting the MCP Server

```bash
# Start in stdio mode (default)
npx vsc-remote start

# Start in WebSocket mode
npx vsc-remote start --mode websocket --port 3001

# Start with debug logging
npx vsc-remote start --debug
```

### Using Tools Directly

```bash
# Analyze code
npx vsc-remote analyze-code src/index.js

# Search code
npx vsc-remote search-code "function" --directory src --file-pattern "*.js" --context-lines 3

# Deploy a VSCode instance
npx vsc-remote deploy-vscode-instance --name my-instance --workspace-path /path/to/workspace

# List VSCode instances
npx vsc-remote list-vscode-instances

# Stop a VSCode instance
npx vsc-remote stop-vscode-instance --name my-instance
```

### Using as an MCP Server

```bash
# Start the server
npx vsc-remote start

# In another terminal or application, connect to the MCP server
# For stdio mode, use standard input/output
# For WebSocket mode, connect to ws://localhost:3001
```

## 9. Timeline

| Week | Tasks |
|------|-------|
| Week 1 | Project setup, directory structure, package.json configuration |
| Week 2 | CLI implementation, command handlers, server modifications |
| Week 3 | Tool adaptations, testing framework setup |
| Week 4 | Documentation, testing, bug fixes |
| Week 5 | Final testing, deployment preparation, npm publishing |

## 10. Considerations and Challenges

### Backward Compatibility

- Ensure existing MCP clients can still connect to the server
- Maintain compatibility with current tool schemas and interfaces

### Performance

- Minimize startup time for CLI commands
- Optimize for both one-off tool usage and long-running server mode

### Security

- Handle authentication for WebSocket mode
- Secure storage of instance credentials

### Cross-Platform Support

- Ensure compatibility with Windows, macOS, and Linux
- Handle path differences between platforms

## 11. Future Enhancements

- Add configuration file support
- Implement plugin system for custom tools
- Add interactive mode with inquirer.js
- Support for remote MCP server connections
- Add telemetry and analytics (opt-in)

## Conclusion

This implementation plan provides a comprehensive roadmap for converting the VSCode Remote MCP Server into an NPX package. By following this plan, the development team can create a flexible, user-friendly CLI tool that maintains compatibility with the existing MCP ecosystem while adding new capabilities through the command-line interface.