/**
 * Modify Code Command Implementation
 * 
 * This module handles the 'modify-code' command for the VSCode Remote MCP Server CLI.
 */

const { runTool } = require('../index');

/**
 * Execute the modify-code command
 * @param {string} filePath - Path to the file to modify
 * @param {Object} options - Command options
 */
function executeModifyCodeCommand(filePath, options) {
  const params = {
    file_path: filePath,
    operation: options.operation
  };

  // Add optional parameters based on the operation
  if (options.position) {
    params.position = {
      line: parseInt(options.position.split(',')[0], 10),
      column: parseInt(options.position.split(',')[1] || 1, 10)
    };
  }

  if (options.content) {
    params.content = options.content;
  }

  if (options.pattern) {
    params.pattern = options.pattern;
  }

  if (options.range) {
    params.range = {
      start_line: parseInt(options.range.split(',')[0], 10),
      end_line: parseInt(options.range.split(',')[1], 10)
    };
  }

  return runTool('modify_code', params);
}

module.exports = {
  executeModifyCodeCommand
};