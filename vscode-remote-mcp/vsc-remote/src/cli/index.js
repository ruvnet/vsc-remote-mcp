/**
 * CLI Implementation
 * 
 * This module provides the core functionality for the VSCode Remote MCP Server CLI.
 */

const VSCodeRemoteMcpServer = require('../mcp-sdk-server');
const { tools } = require('../tools');
const chalk = require('chalk');
const ora = require('ora');
const logger = require('./utils/logger');

/**
 * Start the MCP server
 * @param {Object} options - Server options
 */
async function startServer(options) {
  // Set environment variables based on options
  if (options.debug) {
    process.env.MCP_DEBUG = '1';
    logger.setLogLevel('DEBUG');
  }
  
  if (options.port) {
    process.env.MCP_PORT = options.port;
  }
  
  process.env.MCP_MODE = options.mode;
  
  // Handle authentication token for WebSocket mode
  if (options.mode === 'websocket') {
    if (options.token) {
      // Use provided token
      process.env.MCP_AUTH_TOKEN = options.token;
    } else if (options.generateToken) {
      // Force generation of a new token
      process.env.MCP_GENERATE_NEW_TOKEN = '1';
    }
  }
  
  const spinner = ora('Starting VSCode Remote MCP Server...').start();
  
  try {
    // Create and start the server
    const server = new VSCodeRemoteMcpServer();
    await server.serve();
    
    spinner.succeed(chalk.green('VSCode Remote MCP Server started successfully'));
    
    if (options.mode === 'websocket') {
      console.log(chalk.blue(`Server running on port ${options.port || 3001}`));
      console.log(chalk.yellow('Note: WebSocket mode requires authentication. Use the token displayed above to connect.'));
      console.log(chalk.yellow('To connect programmatically, use the URL format: ws://localhost:<port>?token=<auth_token>'));
    } else {
      console.log(chalk.blue('Server running in stdio mode'));
    }
    
    // Keep the process alive by creating a never-resolving promise
    // This ensures the server connection doesn't close prematurely
    return new Promise(() => {
      // This promise never resolves, keeping the Node.js process alive
      // The server will be properly shut down by the signal handlers in VSCodeRemoteMcpServer
      logger.debug('Server running in background mode');
    });
  } catch (error) {
    spinner.fail(chalk.red('Failed to start server'));
    logger.error('Server startup error:', error);
    process.exit(1);
  }
}

/**
 * Run a specific tool
 * @param {string} toolName - Name of the tool to run
 * @param {Object} args - Tool arguments
 */
async function runTool(toolName, args) {
  const spinner = ora(`Running ${toolName}...`).start();
  
  try {
    if (!tools[toolName]) {
      spinner.fail(chalk.red(`Tool not found: ${toolName}`));
      process.exit(1);
    }
    
    logger.debug(`Executing tool ${toolName} with args:`, args);
    const result = await tools[toolName](args);
    
    spinner.succeed(chalk.green(`${toolName} completed successfully`));
    
    // Format and display the result
    if (result.content && Array.isArray(result.content)) {
      // Display content blocks
      result.content.forEach(block => {
        if (block.type === 'text') {
          console.log(block.text);
        } else if (block.type === 'code') {
          console.log(chalk.cyan('\n```' + (block.language || '')));
          console.log(block.code);
          console.log(chalk.cyan('```\n'));
        }
      });
    } else {
      // Display raw result
      console.log(JSON.stringify(result, null, 2));
    }
    
    return result;
  } catch (error) {
    spinner.fail(chalk.red(`Error running ${toolName}`));
    logger.error(`Tool execution error:`, error);
    process.exit(1);
  }
}

module.exports = {
  startServer,
  runTool
};