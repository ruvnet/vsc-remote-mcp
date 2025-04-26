/**
 * Stop VSCode Instance Tool
 * 
 * This tool stops a running VSCode instance.
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

/**
 * Stop a running VSCode instance
 * @param {Object} params - Tool parameters
 * @param {string} params.name - Instance name
 * @param {boolean} params.force - Force stop
 * @returns {Promise<Object>} Stop results
 */
async function stopVSCodeInstance(params) {
  if (!params.name) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: name parameter is required'
        }
      ],
      error: {
        code: -32602,
        message: 'name parameter is required'
      }
    };
  }

  try {
    const force = params.force || false;
    
    // Get instances directory
    const instancesDir = path.join(__dirname, '../../vscode-instances');
    
    // Find instance configuration
    let instanceConfig = null;
    let instanceName = null;
    
    try {
      const files = await fs.readdir(instancesDir);
      
      // Find configuration file for the instance
      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }
        
        try {
          const configPath = path.join(instancesDir, file);
          const configContent = await fs.readFile(configPath, 'utf8');
          const config = JSON.parse(configContent);
          
          if (config.name === params.name) {
            instanceConfig = config;
            instanceName = config.instance_name;
            break;
          }
        } catch (error) {
          console.error(`Error reading config file ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error reading instances directory: ${error.message}`);
    }
    
    if (!instanceConfig || !instanceName) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Instance not found: ${params.name}`
          }
        ],
        error: {
          code: -32602,
          message: `Instance not found: ${params.name}`
        }
      };
    }
    
    // Check if container exists
    const { stdout: containerExists } = await execAsync(`docker ps -a --filter "name=${instanceName}" --format "{{.Names}}"`);
    
    if (!containerExists.trim()) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Container not found: ${instanceName}`
          }
        ],
        error: {
          code: -32602,
          message: `Container not found: ${instanceName}`
        }
      };
    }
    
    // Check if container is running
    const { stdout: containerRunning } = await execAsync(`docker ps --filter "name=${instanceName}" --format "{{.Names}}"`);
    
    if (!containerRunning.trim()) {
      return {
        content: [
          {
            type: 'text',
            text: `Instance ${params.name} is already stopped`
          }
        ],
        name: params.name,
        instance_name: instanceName,
        status: 'already_stopped',
        message: `Instance ${params.name} is already stopped`
      };
    }
    
    // Stop container
    const stopCommand = force ? `docker kill ${instanceName}` : `docker stop ${instanceName}`;
    await execAsync(stopCommand);
    
    // Wait for container to stop
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if container is stopped
    const { stdout: containerStillRunning } = await execAsync(`docker ps --filter "name=${instanceName}" --format "{{.Names}}"`);
    
    if (containerStillRunning.trim()) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Failed to stop instance ${params.name}`
          }
        ],
        error: {
          code: -32603,
          message: `Failed to stop instance ${params.name}`
        }
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Instance ${params.name} stopped successfully`
        }
      ],
      name: params.name,
      instance_name: instanceName,
      status: 'stopped',
      message: `Instance ${params.name} stopped successfully`
    };
  } catch (error) {
    console.error(`Error in stopVSCodeInstance: ${error.message}`);
    return {
      content: [
        {
          type: 'text',
          text: `Error: Failed to stop VSCode instance: ${error.message}`
        }
      ],
      error: {
        code: -32603,
        message: `Failed to stop VSCode instance: ${error.message}`
      }
    };
  }
}

module.exports = stopVSCodeInstance;