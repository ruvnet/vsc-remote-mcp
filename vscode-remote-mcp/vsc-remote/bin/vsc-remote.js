#!/usr/bin/env node

/**
 * VSCode Remote MCP Server - CLI Entry Point
 * 
 * This is the main entry point for the vsc-remote CLI tool.
 * It parses command line arguments and routes to the appropriate commands.
 */

const { program } = require('commander');
const pkg = require('../package.json');
const { executeStartCommand } = require('../src/cli/commands/start');
const { executeAnalyzeCodeCommand } = require('../src/cli/commands/analyze-code');
const { executeSearchCodeCommand } = require('../src/cli/commands/search-code');
const { executeModifyCodeCommand } = require('../src/cli/commands/modify-code');
const { executeDeployVSCodeInstanceCommand } = require('../src/cli/commands/deploy-vscode-instance');
const { executeListVSCodeInstancesCommand } = require('../src/cli/commands/list-vscode-instances');
const { executeStopVSCodeInstanceCommand } = require('../src/cli/commands/stop-vscode-instance');
const { executeManageJobResourcesCommand } = require('../src/cli/commands/manage-job-resources');

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
  .option('-t, --token <token>', 'Authentication token for WebSocket mode')
  .option('--generate-token', 'Generate a new authentication token for WebSocket mode')
  .option('--request-timeout <ms>', 'Timeout for MCP requests in milliseconds', '60000')
  .option('--connection-timeout <ms>', 'Timeout for MCP connections in milliseconds', '300000')
  .option('--keep-alive-interval <ms>', 'Interval for MCP keep-alive messages in milliseconds', '30000')
  .option('--instances-dir <path>', 'Directory to store VSCode instances data')
  .action(executeStartCommand);

// Analyze code command
program
  .command('analyze-code <file-path>')
  .description('Analyze code files')
  .option('--no-metrics', 'Disable complexity metrics')
  .option('--no-structure', 'Disable structure analysis')
  .option('--no-issues', 'Disable issues detection')
  .action(executeAnalyzeCodeCommand);

// Search code command
program
  .command('search-code <pattern>')
  .description('Search for patterns in code files')
  .option('-d, --directory <dir>', 'Directory to search in', '.')
  .option('-f, --file-pattern <pattern>', 'File pattern to match', '*')
  .option('-c, --context-lines <lines>', 'Number of context lines', '2')
  .option('-m, --max-results <count>', 'Maximum number of results', '100')
  .option('-i, --ignore-case', 'Ignore case')
  .option('--no-regex', 'Disable regex')
  .action(executeSearchCodeCommand);

// Modify code command
program
  .command('modify-code <file-path>')
  .description('Modify code files')
  .requiredOption('-o, --operation <operation>', 'Operation to perform (add, update, remove, replace)')
  .option('-p, --position <line,column>', 'Position to modify (line,column)')
  .option('-c, --content <content>', 'Content to add or update')
  .option('-t, --pattern <pattern>', 'Pattern to match for update or remove operations')
  .option('-r, --range <start,end>', 'Line range for replace operation (start,end)')
  .action(executeModifyCodeCommand);

// Deploy VSCode instance command
program
  .command('deploy-vscode-instance')
  .description('Deploy a new VSCode instance')
  .requiredOption('-n, --name <name>', 'Instance name')
  .requiredOption('-w, --workspace-path <path>', 'Path to workspace directory')
  .option('-p, --port <port>', 'Port to expose')
  .option('--password <password>', 'Password for authentication')
  .option('-e, --extensions <extensions>', 'Comma-separated list of extensions to install')
  .option('--cpu-limit <limit>', 'CPU limit')
  .option('--memory-limit <limit>', 'Memory limit')
  .option('--environment <json>', 'Environment variables as JSON')
  .action(executeDeployVSCodeInstanceCommand);

// List VSCode instances command
program
  .command('list-vscode-instances')
  .description('List all deployed VSCode instances')
  .option('-f, --filter <filter>', 'Filter instances by name')
  .option('-s, --status <status>', 'Filter instances by status (running, stopped, all)', 'all')
  .action(executeListVSCodeInstancesCommand);

// Stop VSCode instance command
program
  .command('stop-vscode-instance')
  .description('Stop a running VSCode instance')
  .requiredOption('-n, --name <name>', 'Instance name')
  .option('--force', 'Force stop')
  .action(executeStopVSCodeInstanceCommand);

// Manage job resources command
program
  .command('manage-job-resources <job-id>')
  .description('Manage resources for VSCode instances and associated jobs')
  .requiredOption('-o, --operation <operation>', 'Operation to perform (allocate, deallocate, update, status)')
  .option('--cpu <cpu>', 'CPU allocation')
  .option('--memory <memory>', 'Memory allocation')
  .option('--disk <disk>', 'Disk allocation')
  .action(executeManageJobResourcesCommand);

// Parse arguments
program.parse(process.argv);

// Prevent the process from exiting when running the 'start' command
// This is necessary for the MCP server to keep running
if (process.argv.length > 2 && process.argv[2] === 'start') {
  // Keep the process alive by setting up an interval that never completes
  setInterval(() => {
    // This empty interval keeps the Node.js event loop active
  }, 1000);
  
  // Also handle process signals to ensure clean shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT signal. Shutting down...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Shutting down...');
    process.exit(0);
  });
}