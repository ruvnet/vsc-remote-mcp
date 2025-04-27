/**
 * Start Command Implementation
 * 
 * This module handles the 'start' command for the VSCode Remote MCP Server CLI.
 */

const { startServer } = require('../index');

/**
 * Execute the start command
 * @param {Object} options - Command options
 */
function executeStartCommand(options) {
  return startServer(options);
}

module.exports = {
  executeStartCommand
};