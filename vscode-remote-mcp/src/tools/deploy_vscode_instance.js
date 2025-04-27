/**
 * Deploy VSCode Instance Tool
 *
 * This tool deploys a new VSCode instance using Docker.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const net = require('net');
const crypto = require('crypto');
const os = require('os');

/**
 * Execute a command securely using spawn
 * @param {string} command - The command to execute
 * @param {string[]} args - Command arguments
 * @param {Object} options - Spawn options
 * @returns {Promise<{stdout: string, stderr: string}>} Command output
 */
function execSecure(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    // Validate command and arguments
    if (typeof command !== 'string' || !Array.isArray(args)) {
      return reject(new Error('Invalid command or arguments'));
    }
    
    // Spawn process
    const proc = spawn(command, args, options);
    
    let stdout = '';
    let stderr = '';
    
    // Collect stdout
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Collect stderr
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Handle process completion
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    // Handle process errors
    proc.on('error', (err) => {
      reject(new Error(`Failed to execute command: ${err.message}`));
    });
  });
}

// Get minimum password length from environment or use default
const MIN_PASSWORD_LENGTH = parseInt(process.env.MCP_MIN_PASSWORD_LENGTH || '12', 10);

// Load environment variables
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || generateRandomPassword();

/**
 * Generate a random secure password
 * @returns {string} A random password
 */
function generateRandomPassword() {
  const crypto = require('crypto');
  // Generate a more complex password with mixed characters
  const bytes = crypto.randomBytes(16);
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let password = '';
  
  for (let i = 0; i < 16; i++) {
    const index = bytes[i] % alphanumeric.length;
    password += alphanumeric.charAt(index);
  }
  
  return password;
}

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} Validation result with success flag and error message
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return {
      success: false,
      message: 'Password must be a non-empty string'
    };
  }
  
  // Password must meet minimum length requirement
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    };
  }
  
  // Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  // Check each requirement individually to provide specific feedback
  if (!hasUppercase) {
    return {
      success: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }
  
  if (!hasLowercase) {
    return {
      success: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }
  
  if (!hasNumber) {
    return {
      success: false,
      message: 'Password must contain at least one number'
    };
  }
  
  if (!hasSpecial) {
    return {
      success: false,
      message: 'Password must contain at least one special character'
    };
  }
  
  return { success: true };
}

/**
 * Validate a file path to prevent directory traversal attacks
 * @param {string} filePath - The file path to validate
 * @returns {Object} Validation result with success flag and normalized path
 */
function validateFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return {
      success: false,
      message: 'File path must be a non-empty string'
    };
  }
  
  try {
    // Normalize the path to resolve any '..' or '.' segments
    const normalizedPath = path.normalize(filePath);
    
    // Check for path traversal attempts
    if (normalizedPath.includes('..')) {
      return {
        success: false,
        message: 'Path contains invalid directory traversal sequences'
      };
    }
    
    // Check if path exists
    if (!fsSync.existsSync(normalizedPath)) {
      return {
        success: false,
        message: `Path does not exist: ${normalizedPath}`
      };
    }
    
    // Check if path is accessible
    try {
      fsSync.accessSync(normalizedPath, fsSync.constants.R_OK);
    } catch (error) {
      return {
        success: false,
        message: `Path is not accessible: ${normalizedPath}`
      };
    }
    
    return {
      success: true,
      path: normalizedPath
    };
  } catch (error) {
    return {
      success: false,
      message: `Invalid path: ${error.message}`
    };
  }
}

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
    
    // Validate workspace path
    const workspacePathValidation = validateFilePath(params.workspace_path);
    if (!workspacePathValidation.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${workspacePathValidation.message}`
          }
        ],
        error: {
          code: -32602,
          message: workspacePathValidation.message
        }
      };
    }
    
    const workspacePath = workspacePathValidation.path;
    
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
    
    // Handle password securely
    let password;
    if (params.password) {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(params.password);
      if (!passwordValidation.success) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${passwordValidation.message}`
            }
          ],
          error: {
            code: -32602,
            message: passwordValidation.message
          }
        };
      }
      password = params.password;
    } else {
      // Generate a strong random password
      password = DEFAULT_PASSWORD;
      // Don't log the actual password
      console.log('Generated a secure random password (not displayed for security reasons)');
    }
    
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
      // Execute Docker command using secure spawn
      const dockerArgs = buildDockerArgs(instanceName, workspacePath, port, password, extensions, cpuLimit, memoryLimit, environment);
      await execSecure('docker', dockerArgs);
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
    
    // Check if container is running using secure spawn
    const { stdout: containerStatus } = await execSecure('docker', [
      'ps',
      '--filter', `name=${instanceName}`,
      '--format', '{{.Status}}'
    ]);
    
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
 * Build Docker arguments array for secure execution
 * @param {string} instanceName - Instance name
 * @param {string} workspacePath - Path to workspace directory
 * @param {number} port - Port to expose
 * @param {string} password - Password for authentication
 * @param {Array<string>} extensions - Extensions to install
 * @param {number} cpuLimit - CPU limit
 * @param {string} memoryLimit - Memory limit
 * @param {Object} environment - Environment variables
 * @returns {string[]} Docker arguments array
 */
function buildDockerArgs(instanceName, workspacePath, port, password, extensions, cpuLimit, memoryLimit, environment) {
  // Validate inputs
  if (!instanceName || typeof instanceName !== 'string') {
    throw new Error('Instance name must be a non-empty string');
  }
  
  if (!workspacePath || typeof workspacePath !== 'string') {
    throw new Error('Workspace path must be a non-empty string');
  }
  
  // Validate port
  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
    throw new Error('Invalid port number');
  }
  
  // Validate CPU limit
  const cpuNum = parseFloat(cpuLimit);
  if (isNaN(cpuNum) || cpuNum <= 0) {
    throw new Error('Invalid CPU limit');
  }
  
  // Validate memory limit
  if (!memoryLimit || typeof memoryLimit !== 'string' || !/^\d+[kmgKMG]?$/.test(memoryLimit)) {
    throw new Error('Invalid memory limit format');
  }
  
  // Create a secure password file
  const passwordFileId = crypto.randomBytes(8).toString('hex');
  const passwordDir = path.join(os.tmpdir(), 'vsc-remote-passwords');
  
  // Create directory if it doesn't exist with secure permissions
  if (!fsSync.existsSync(passwordDir)) {
    fsSync.mkdirSync(passwordDir, { mode: 0o700 });
  }
  
  const passwordFile = path.join(passwordDir, `password-${instanceName}-${passwordFileId}`);
  
  // Write password to file with secure permissions
  fsSync.writeFileSync(passwordFile, password, { mode: 0o600 });
  
  // Build extensions list
  const extensionsList = Array.isArray(extensions) ? extensions.join(',') : extensions;
  
  // Base arguments
  const args = [
    'run',
    '-d',
    '--name', instanceName,
    '--restart', 'unless-stopped',
    '-p', `${portNum}:8080`,
    '-v', `${workspacePath}:/workspace`,
    '-v', `vscode-data-${instanceName}:/home/coder/.local/share/code-server`,
    '-v', `vscode-extensions-${instanceName}:/home/coder/.vscode/extensions`,
    '-v', `${passwordFile}:/home/coder/.config/code-server/password`,
    '--cpus', cpuNum.toString(),
    '--memory', memoryLimit,
    '-e', 'PASSWORD_FILE=/home/coder/.config/code-server/password',
    '-e', `EXTENSIONS=${extensionsList}`
  ];
  
  // Add environment variables
  if (environment && typeof environment === 'object') {
    Object.entries(environment).forEach(([key, value]) => {
      // Validate environment variable name
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        throw new Error(`Invalid environment variable name: ${key}`);
      }
      
      args.push('-e', `${key}=${value}`);
    });
  }
  
  // Add image name
  args.push('codercom/code-server:latest');
  
  // Schedule password file for deletion after 60 seconds
  setTimeout(() => {
    try {
      fsSync.unlinkSync(passwordFile);
      console.log(`Password file ${passwordFile} deleted`);
    } catch (error) {
      console.error(`Failed to delete password file: ${error.message}`);
    }
  }, 60000);
  
  return args;
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