/**
 * List VSCode Instances Command Implementation
 * 
 * This module handles the 'list-vscode-instances' command for the VSCode Remote MCP Server CLI.
 */

const { runTool } = require('../index');

/**
 * Execute the list-vscode-instances command
 * @param {Object} options - Command options
 */
function executeListVSCodeInstancesCommand(options) {
  const params = {};

  // Add optional parameters
  if (options.filter) {
    params.filter = options.filter;
  }

  if (options.status) {
    params.status = options.status;
  }

  return runTool('list_vscode_instances', params);
}

module.exports = {
  executeListVSCodeInstancesCommand
};