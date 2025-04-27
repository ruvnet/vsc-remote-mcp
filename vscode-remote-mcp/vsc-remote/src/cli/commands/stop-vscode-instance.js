/**
 * Stop VSCode Instance Command Implementation
 * 
 * This module handles the 'stop-vscode-instance' command for the VSCode Remote MCP Server CLI.
 */

const { runTool } = require('../index');

/**
 * Execute the stop-vscode-instance command
 * @param {Object} options - Command options
 */
function executeStopVSCodeInstanceCommand(options) {
  const params = {
    name: options.name
  };

  // Add optional parameters
  if (options.force !== undefined) {
    params.force = options.force === true;
  }

  return runTool('stop_vscode_instance', params);
}

module.exports = {
  executeStopVSCodeInstanceCommand
};