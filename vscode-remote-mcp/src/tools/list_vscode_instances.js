/**
 * List VSCode Instances Tool
 * 
 * This tool lists all deployed VSCode instances and their status.
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

/**
 * List all deployed VSCode instances
 * @param {Object} params - Tool parameters
 * @param {string} params.filter - Filter instances by name
 * @param {string} params.status - Filter instances by status (running, stopped, all)
 * @returns {Promise<Object>} List of instances
 */
async function listVSCodeInstances(params) {
  try {
    const filter = params.filter || '';
    const status = params.status || 'all';
    
    // Get instances directory
    const instancesDir = path.join(__dirname, '../../vscode-instances');
    
    // Create instances directory if it doesn't exist
    await fs.mkdir(instancesDir, { recursive: true });
    
    // Get instance configuration files
    let files;
    try {
      files = await fs.readdir(instancesDir);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: 'No instances found.'
          }
        ],
        instances: []
      };
    }
    
    // Filter JSON files
    const configFiles = files.filter(file => file.endsWith('.json'));
    
    // Get running containers
    const { stdout: runningContainers } = await execAsync('docker ps --format "{{.Names}}"');
    const runningContainerNames = runningContainers.split('\n').filter(Boolean);
    
    // Get all containers (running and stopped)
    const { stdout: allContainers } = await execAsync('docker ps -a --format "{{.Names}}"');
    const allContainerNames = allContainers.split('\n').filter(Boolean);
    
    // Process each instance
    const instances = [];
    
    for (const configFile of configFiles) {
      try {
        // Read instance configuration
        const configPath = path.join(instancesDir, configFile);
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        // Check if container exists
        const containerName = config.instance_name;
        const isRunning = runningContainerNames.includes(containerName);
        const exists = allContainerNames.includes(containerName);
        
        // Determine instance status
        let instanceStatus;
        if (isRunning) {
          instanceStatus = 'running';
        } else if (exists) {
          instanceStatus = 'stopped';
        } else {
          instanceStatus = 'missing';
        }
        
        // Apply status filter
        if (status !== 'all' && instanceStatus !== status) {
          continue;
        }
        
        // Apply name filter
        if (filter && !config.name.includes(filter)) {
          continue;
        }
        
        // Get container details if running
        let containerDetails = {};
        
        if (isRunning) {
          try {
            const { stdout: details } = await execAsync(`docker inspect ${containerName}`);
            const inspectData = JSON.parse(details)[0];
            
            // Get port mapping
            const ports = inspectData.NetworkSettings.Ports;
            const portMapping = ports['8080/tcp'] ? ports['8080/tcp'][0].HostPort : null;
            
            // Get container stats
            const { stdout: stats } = await execAsync(`docker stats ${containerName} --no-stream --format "{{.CPUPerc}},{{.MemUsage}}"`);
            const [cpuPerc, memUsage] = stats.split(',');
            
            containerDetails = {
              port: portMapping ? parseInt(portMapping, 10) : config.port,
              url: portMapping ? `http://localhost:${portMapping}` : `http://localhost:${config.port}`,
              cpu_usage: cpuPerc.trim(),
              memory_usage: memUsage.trim(),
              uptime: inspectData.State.StartedAt
            };
          } catch (error) {
            console.error(`Error getting container details: ${error.message}`);
          }
        }
        
        // Add instance to list
        instances.push({
          id: config.id,
          name: config.name,
          instance_name: containerName,
          status: instanceStatus,
          workspace_path: config.workspace_path,
          created_at: config.created_at,
          ...containerDetails
        });
      } catch (error) {
        console.error(`Error processing instance ${configFile}: ${error.message}`);
      }
    }
    
    // Format output for display
    let output = `VSCode Instances\n\n`;
    output += `Total Instances: ${instances.length}\n`;
    output += `Filter: ${filter || 'None'}\n`;
    output += `Status: ${status}\n\n`;
    
    if (instances.length > 0) {
      instances.forEach((instance, index) => {
        output += `Instance ${index + 1}: ${instance.name}\n`;
        output += `  ID: ${instance.id}\n`;
        output += `  Status: ${instance.status}\n`;
        output += `  Workspace: ${instance.workspace_path}\n`;
        
        if (instance.status === 'running') {
          output += `  URL: ${instance.url}\n`;
          output += `  Port: ${instance.port}\n`;
          output += `  CPU Usage: ${instance.cpu_usage}\n`;
          output += `  Memory Usage: ${instance.memory_usage}\n`;
        }
        
        output += `  Created: ${instance.created_at}\n\n`;
      });
    } else {
      output += 'No instances found.\n';
    }
    
    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ],
      instances,
      count: instances.length,
      filter,
      status
    };
  } catch (error) {
    console.error(`Error in listVSCodeInstances: ${error.message}`);
    return {
      content: [
        {
          type: 'text',
          text: `Error: Failed to list VSCode instances: ${error.message}`
        }
      ],
      error: {
        code: -32603,
        message: `Failed to list VSCode instances: ${error.message}`
      }
    };
  }
}

module.exports = listVSCodeInstances;