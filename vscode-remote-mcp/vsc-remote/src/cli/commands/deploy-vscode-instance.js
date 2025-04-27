/**
 * Deploy VSCode Instance Command Implementation
 * 
 * This module handles the 'deploy-vscode-instance' command for the VSCode Remote MCP Server CLI.
 */

const { runTool } = require('../index');

/**
 * Execute the deploy-vscode-instance command
 * @param {Object} options - Command options
 */
function executeDeployVSCodeInstanceCommand(options) {
  const params = {
    name: options.name,
    workspace_path: options.workspacePath
  };

  // Add optional parameters
  if (options.port) {
    params.port = parseInt(options.port, 10);
  }
  
  // Handle password securely
  if (options.password) {
    // Validate password strength
    if (options.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    params.password = options.password;
  } else {
    // Generate a strong random password if not provided
    const crypto = require('crypto');
    params.password = crypto.randomBytes(16).toString('hex');
    console.log(`Generated secure random password: ${params.password}`);
  }

  if (options.extensions) {
    params.extensions = options.extensions.split(',').map(ext => ext.trim());
  }

  if (options.cpuLimit) {
    params.cpu_limit = parseFloat(options.cpuLimit);
  }

  if (options.memoryLimit) {
    params.memory_limit = options.memoryLimit;
  }

  if (options.environment) {
    try {
      params.environment = JSON.parse(options.environment);
    } catch (error) {
      console.error('Error parsing environment JSON:', error.message);
      process.exit(1);
    }
  }

  return runTool('deploy_vscode_instance', params);
}

module.exports = {
  executeDeployVSCodeInstanceCommand
};