/**
 * Search Code Command Implementation
 * 
 * This module handles the 'search-code' command for the VSCode Remote MCP Server CLI.
 */

const { runTool } = require('../index');

/**
 * Execute the search-code command
 * @param {string} pattern - Pattern to search for
 * @param {Object} options - Command options
 */
function executeSearchCodeCommand(pattern, options) {
  return runTool('search_code', {
    pattern,
    directory: options.directory,
    file_pattern: options.filePattern,
    context_lines: parseInt(options.contextLines, 10),
    max_results: parseInt(options.maxResults, 10),
    ignore_case: options.ignoreCase === true,
    use_regex: options.regex !== false
  });
}

module.exports = {
  executeSearchCodeCommand
};