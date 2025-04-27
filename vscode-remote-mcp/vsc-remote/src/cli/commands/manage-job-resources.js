/**
 * Manage Job Resources Command Implementation
 * 
 * This module handles the 'manage-job-resources' command for the VSCode Remote MCP Server CLI.
 */

const { runTool } = require('../index');

/**
 * Execute the manage-job-resources command
 * @param {string} jobId - Job ID
 * @param {Object} options - Command options
 */
function executeManageJobResourcesCommand(jobId, options) {
  const params = {
    job_id: jobId,
    operation: options.operation
  };

  // Add resources if provided
  if (options.cpu || options.memory || options.disk) {
    params.resources = {};
    
    if (options.cpu) {
      params.resources.cpu = parseFloat(options.cpu);
    }
    
    if (options.memory) {
      params.resources.memory = options.memory;
    }
    
    if (options.disk) {
      params.resources.disk = options.disk;
    }
  }

  return runTool('manage_job_resources', params);
}

module.exports = {
  executeManageJobResourcesCommand
};