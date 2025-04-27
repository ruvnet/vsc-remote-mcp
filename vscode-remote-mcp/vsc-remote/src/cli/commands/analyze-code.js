/**
 * Analyze Code Command Implementation
 * 
 * This module handles the 'analyze-code' command for the VSCode Remote MCP Server CLI.
 */

const { runTool } = require('../index');

/**
 * Execute the analyze-code command
 * @param {string} filePath - Path to the file to analyze
 * @param {Object} options - Command options
 */
function executeAnalyzeCodeCommand(filePath, options) {
  return runTool('analyze_code', {
    file_path: filePath,
    include_metrics: options.metrics !== false,
    include_structure: options.structure !== false,
    include_issues: options.issues !== false
  });
}

module.exports = {
  executeAnalyzeCodeCommand
};