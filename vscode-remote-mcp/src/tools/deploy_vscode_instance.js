/**
 * Deploy VSCode Instance Tool
 *
 * This tool deploys a new VSCode instance using Docker.
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const { v4: uuidv4 } = require('uuid');
const net = require('net');

// Load environment variables
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'changeme';
const DEFAULT_EXTENSIONS = process.env.DEFAULT_EXTENSIONS || 'ms-python.python,dbaeumer.vscode-eslint';
const DEFAULT_CPU_LIMIT = process.env.DEFAULT_CPU_LIMIT || '1.0';
const DEFAULT_MEMORY_LIMIT = process.env.DEFAULT_MEMORY_LIMIT || '2g';

/**
 * Deploy a new VSCode instance
 * @param {Object} params - Tool parameters
 * @param {string} params.name - Instance name
 * @param {string} params.workspace_path - Path to workspace directory
 * @param {number} params.port - Port to expose
 * @param {string} params.password - Password for authentication
 * @param {Array<string>} params.extensions - Extensions to install
 * @param {number} params.cpu_limit - CPU limit
 * @param {string} params.memory_limit - Memory limit
 * @param {Object} params.environment - Environment variables
 * @returns {Promise<Object>} Deployment results
 */
async function deployVSCodeInstance(params) {
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

  if (!params.workspace_path) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: workspace_path parameter is required'
        }
      ],
      error: {
        code: -32602,
        message: 'workspace_path parameter is required'
      }
    };
  }

  try {
    // Generate instance ID
    const instanceId = uuidv4().substring(0, 8);
    const instanceName = `vscode-${params.name}-${instanceId}`;
    
    // Resolve workspace path
    const workspacePath = path.resolve(params.workspace_path);
    
    // Check if workspace path exists
    try {
      await fs.access(workspacePath);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Workspace path not found: ${workspacePath}`
          }
        ],
        error: {
          code: -32602,
          message: `Workspace path not found: ${workspacePath}`
        }
      };
    }
    
    // Check if port is specified and available
    let port = params.port;
    if (port) {
      const isPortAvailable = await checkPortAvailability(port);
      if (!isPortAvailable) {
        // Find an alternative port if the requested one is not available
        const alternativePort = await getRandomPort();
        return {
          content: [
            {
              type: 'text',
              text: `Error: Port ${port} is already in use. Consider using port ${alternativePort} instead.`
            }
          ],
          error: {
            code: -32603,
            message: `Port ${port} is already in use`,
            details: {
              suggested_port: alternativePort
            }
          }
        };
      }
    } else {
      // Get random port if not specified
      port = await getRandomPort();
    }
    
    // Get password
    const password = params.password || DEFAULT_PASSWORD;
    
    // Get extensions
    const extensions = params.extensions || DEFAULT_EXTENSIONS.split(',');
    
    // Get resource limits
    const cpuLimit = params.cpu_limit || DEFAULT_CPU_LIMIT;
    const memoryLimit = params.memory_limit || DEFAULT_MEMORY_LIMIT;
    
    // Create environment variables
    const environment = params.environment || {};
    
    // Create instance directory
    const instancesDir = path.join(__dirname, '../../vscode-instances');
    await fs.mkdir(instancesDir, { recursive: true });
    
    // Create instance configuration
    const instanceConfig = {
      id: instanceId,
      name: params.name,
      instance_name: instanceName,
      workspace_path: workspacePath,
      port,
      extensions,
      cpu_limit: cpuLimit,
      memory_limit: memoryLimit,
      environment,
      created_at: new Date().toISOString()
    };
    
    // Save instance configuration
    const configPath = path.join(instancesDir, `${instanceName}.json`);
    await fs.writeFile(configPath, JSON.stringify(instanceConfig, null, 2));
    
    // Build Docker command
    const dockerCommand = buildDockerCommand(instanceName, workspacePath, port, password, extensions, cpuLimit, memoryLimit, environment);
    
    try {
      // Execute Docker command
      await execAsync(dockerCommand);
    } catch (error) {
      // Handle Docker-specific errors
      if (error.message.includes('port is already allocated')) {
        // Clean up the config file we created
        try {
          await fs.unlink(configPath);
        } catch (unlinkError) {
          console.error(`Failed to clean up config file: ${unlinkError.message}`);
        }
        
        // Find an alternative port
        const alternativePort = await getRandomPort();
        
        return {
          content: [
            {
              type: 'text',
              text: `Error: Port ${port} is already allocated. Consider using port ${alternativePort} instead.`
            }
          ],
          error: {
            code: -32603,
            message: `Port ${port} is already allocated`,
            details: {
              suggested_port: alternativePort
            }
          }
        };
      }
      
      // Other Docker errors
      return {
        content: [
          {
            type: 'text',
            text: `Error deploying Docker container: ${error.message}`
          }
        ],
        error: {
          code: -32603,
          message: `Failed to deploy Docker container: ${error.message}`
        }
      };
    }
    
    // Wait for container to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if container is running
    const { stdout: containerStatus } = await execAsync(`docker ps --filter "name=${instanceName}" --format "{{.Status}}"`);
    
    if (!containerStatus.trim()) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to start VSCode instance'
          }
        ],
        error: {
          code: -32603,
          message: 'Failed to start VSCode instance'
        }
      };
    }
    
    // Success response with content array
    return {
      content: [
        {
          type: 'text',
          text: `VSCode instance deployed successfully!\n\nName: ${params.name}\nInstance ID: ${instanceId}\nURL: http://localhost:${port}\nStatus: running\nWorkspace: ${workspacePath}`
        }
      ],
      id: instanceId,
      name: params.name,
      instance_name: instanceName,
      port,
      url: `http://localhost:${port}`,
      status: 'running',
      workspace_path: workspacePath
    };
  } catch (error) {
    console.error(`Error in deployVSCodeInstance: ${error.message}`);
    return {
      content: [
        {
          type: 'text',
          text: `Error: Failed to deploy VSCode instance: ${error.message}`
        }
      ],
      error: {
        code: -32603,
        message: `Failed to deploy VSCode instance: ${error.message}`
      }
    };
  }
}

/**
 * Build Docker command
 * @param {string} instanceName - Instance name
 * @param {string} workspacePath - Path to workspace directory
 * @param {number} port - Port to expose
 * @param {string} password - Password for authentication
 * @param {Array<string>} extensions - Extensions to install
 * @param {number} cpuLimit - CPU limit
 * @param {string} memoryLimit - Memory limit
 * @param {Object} environment - Environment variables
 * @returns {string} Docker command
 */
function buildDockerCommand(instanceName, workspacePath, port, password, extensions, cpuLimit, memoryLimit, environment) {
  // Build environment variables
  const envVars = Object.entries(environment)
    .map(([key, value]) => `-e ${key}=${value}`)
    .join(' ');
  
  // Build extensions list
  const extensionsList = extensions.join(',');
  
  // Build Docker command
  return `docker run -d \
    --name ${instanceName} \
    --restart unless-stopped \
    -p ${port}:8080 \
    -v ${workspacePath}:/workspace \
    -v vscode-data-${instanceName}:/home/coder/.local/share/code-server \
    -v vscode-extensions-${instanceName}:/home/coder/.vscode/extensions \
    --cpus=${cpuLimit} \
    --memory=${memoryLimit} \
    ${envVars} \
    -e PASSWORD=${password} \
    -e EXTENSIONS=${extensionsList} \
    codercom/code-server:latest`;
}

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} True if port is available, false otherwise
 */
function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      // Port is in use
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        // Some other error, assume port is available
        resolve(true);
      }
      server.close();
    });
    
    server.once('listening', () => {
      // Port is available
      server.close();
      resolve(true);
    });
    
    server.listen(port, '0.0.0.0');
  });
}

/**
 * Get a random available port
 * @returns {Promise<number>} Random port
 */
async function getRandomPort() {
  // Get a random port between 10000 and 65535
  const minPort = 10000;
  const maxPort = 65535;
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
    const isAvailable = await checkPortAvailability(port);
    
    if (isAvailable) {
      return port;
    }
  }
  
  // If we couldn't find an available port after maxAttempts, throw an error
  throw new Error('Could not find an available port after multiple attempts');
}

module.exports = deployVSCodeInstance;