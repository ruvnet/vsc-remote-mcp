/**
 * Manage Job Resources Tool
 * 
 * This tool manages resources for VSCode instances and associated jobs.
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

/**
 * Manage resources for a job
 * @param {Object} params - Tool parameters
 * @param {string} params.job_id - Job ID
 * @param {string} params.operation - Operation to perform (allocate, deallocate, update, status)
 * @param {Object} params.resources - Resources to allocate or update
 * @returns {Promise<Object>} Operation results
 */
async function manageJobResources(params) {
  if (!params.job_id) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: job_id parameter is required'
        }
      ],
      error: {
        code: -32602,
        message: 'job_id parameter is required'
      }
    };
  }

  if (!params.operation) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: operation parameter is required'
        }
      ],
      error: {
        code: -32602,
        message: 'operation parameter is required'
      }
    };
  }

  try {
    // Get resources directory
    const resourcesDir = path.join(__dirname, '../../vscode-instances/resources');
    
    // Create resources directory if it doesn't exist
    await fs.mkdir(resourcesDir, { recursive: true });
    
    // Get resource file path
    const resourceFilePath = path.join(resourcesDir, `${params.job_id}.json`);
    
    // Perform operation
    switch (params.operation) {
      case 'allocate':
        return await allocateResources(resourceFilePath, params);
        
      case 'deallocate':
        return await deallocateResources(resourceFilePath, params);
        
      case 'update':
        return await updateResources(resourceFilePath, params);
        
      case 'status':
        return await getResourceStatus(resourceFilePath, params);
        
      default:
        return {
          content: [
            {
              type: 'text',
              text: `Error: Invalid operation: ${params.operation}`
            }
          ],
          error: {
            code: -32602,
            message: `Invalid operation: ${params.operation}`
          }
        };
    }
  } catch (error) {
    console.error(`Error in manageJobResources: ${error.message}`);
    return {
      content: [
        {
          type: 'text',
          text: `Error: Failed to manage job resources: ${error.message}`
        }
      ],
      error: {
        code: -32603,
        message: `Failed to manage job resources: ${error.message}`
      }
    };
  }
}

/**
 * Allocate resources for a job
 * @param {string} resourceFilePath - Path to resource file
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} Allocation results
 */
async function allocateResources(resourceFilePath, params) {
  // Check if resources are already allocated
  try {
    await fs.access(resourceFilePath);
    
    // Resources already allocated
    return {
      content: [
        {
          type: 'text',
          text: `Error: Resources already allocated for job ${params.job_id}`
        }
      ],
      error: {
        code: -32602,
        message: `Resources already allocated for job ${params.job_id}`
      }
    };
  } catch (error) {
    // Resources not allocated yet
  }
  
  // Check if resources are specified
  if (!params.resources) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: resources parameter is required for allocate operation'
        }
      ],
      error: {
        code: -32602,
        message: 'resources parameter is required for allocate operation'
      }
    };
  }
  
  // Create resource allocation
  const allocation = {
    job_id: params.job_id,
    resources: {
      cpu: params.resources.cpu || 1,
      memory: params.resources.memory || '1g',
      disk: params.resources.disk || '10g'
    },
    allocated_at: new Date().toISOString(),
    status: 'allocated'
  };
  
  // Save resource allocation
  await fs.writeFile(resourceFilePath, JSON.stringify(allocation, null, 2));
  
  return {
    content: [
      {
        type: 'text',
        text: `Resources allocated successfully for job ${params.job_id}\nCPU: ${allocation.resources.cpu}\nMemory: ${allocation.resources.memory}\nDisk: ${allocation.resources.disk}\nAllocated at: ${allocation.allocated_at}`
      }
    ],
    job_id: params.job_id,
    operation: 'allocate',
    status: 'success',
    resources: allocation.resources,
    allocated_at: allocation.allocated_at
  };
}

/**
 * Deallocate resources for a job
 * @param {string} resourceFilePath - Path to resource file
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} Deallocation results
 */
async function deallocateResources(resourceFilePath, params) {
  // Check if resources are allocated
  try {
    await fs.access(resourceFilePath);
  } catch (error) {
    // Resources not allocated
    return {
      content: [
        {
          type: 'text',
          text: `Error: Resources not allocated for job ${params.job_id}`
        }
      ],
      error: {
        code: -32602,
        message: `Resources not allocated for job ${params.job_id}`
      }
    };
  }
  
  // Read resource allocation
  const allocationContent = await fs.readFile(resourceFilePath, 'utf8');
  const allocation = JSON.parse(allocationContent);
  
  // Update allocation status
  allocation.status = 'deallocated';
  allocation.deallocated_at = new Date().toISOString();
  
  // Save updated allocation
  await fs.writeFile(resourceFilePath, JSON.stringify(allocation, null, 2));
  
  // Delete resource file
  await fs.unlink(resourceFilePath);
  
  return {
    content: [
      {
        type: 'text',
        text: `Resources deallocated successfully for job ${params.job_id}\nDeallocated at: ${allocation.deallocated_at}`
      }
    ],
    job_id: params.job_id,
    operation: 'deallocate',
    status: 'success',
    deallocated_at: allocation.deallocated_at
  };
}

/**
 * Update resources for a job
 * @param {string} resourceFilePath - Path to resource file
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} Update results
 */
async function updateResources(resourceFilePath, params) {
  // Check if resources are allocated
  try {
    await fs.access(resourceFilePath);
  } catch (error) {
    // Resources not allocated
    return {
      content: [
        {
          type: 'text',
          text: `Error: Resources not allocated for job ${params.job_id}`
        }
      ],
      error: {
        code: -32602,
        message: `Resources not allocated for job ${params.job_id}`
      }
    };
  }
  
  // Check if resources are specified
  if (!params.resources) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: resources parameter is required for update operation'
        }
      ],
      error: {
        code: -32602,
        message: 'resources parameter is required for update operation'
      }
    };
  }
  
  // Read resource allocation
  const allocationContent = await fs.readFile(resourceFilePath, 'utf8');
  const allocation = JSON.parse(allocationContent);
  
  // Update resources
  const updatedResources = {
    cpu: params.resources.cpu || allocation.resources.cpu,
    memory: params.resources.memory || allocation.resources.memory,
    disk: params.resources.disk || allocation.resources.disk
  };
  
  // Update allocation
  allocation.resources = updatedResources;
  allocation.updated_at = new Date().toISOString();
  
  // Save updated allocation
  await fs.writeFile(resourceFilePath, JSON.stringify(allocation, null, 2));
  
  return {
    content: [
      {
        type: 'text',
        text: `Resources updated successfully for job ${params.job_id}\nCPU: ${allocation.resources.cpu}\nMemory: ${allocation.resources.memory}\nDisk: ${allocation.resources.disk}\nUpdated at: ${allocation.updated_at}`
      }
    ],
    job_id: params.job_id,
    operation: 'update',
    status: 'success',
    resources: allocation.resources,
    updated_at: allocation.updated_at
  };
}

/**
 * Get resource status for a job
 * @param {string} resourceFilePath - Path to resource file
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} Resource status
 */
async function getResourceStatus(resourceFilePath, params) {
  // Check if resources are allocated
  try {
    await fs.access(resourceFilePath);
  } catch (error) {
    // Resources not allocated
    return {
      content: [
        {
          type: 'text',
          text: `Resources not allocated for job ${params.job_id}`
        }
      ],
      job_id: params.job_id,
      status: 'not_allocated'
    };
  }
  
  // Read resource allocation
  const allocationContent = await fs.readFile(resourceFilePath, 'utf8');
  const allocation = JSON.parse(allocationContent);
  
  // Get resource usage
  let usage = null;
  
  try {
    // Check if job is associated with a VSCode instance
    const instancesDir = path.join(__dirname, '../../vscode-instances');
    const files = await fs.readdir(instancesDir);
    
    // Find instance associated with job
    let instanceName = null;
    
    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }
      
      try {
        const configPath = path.join(instancesDir, file);
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (config.id === params.job_id) {
          instanceName = config.instance_name;
          break;
        }
      } catch (error) {
        console.error(`Error reading config file ${file}: ${error.message}`);
      }
    }
    
    if (instanceName) {
      // Check if instance is running
      const { stdout: containerRunning } = await execAsync(`docker ps --filter "name=${instanceName}" --format "{{.Names}}"`);
      
      if (containerRunning.trim()) {
        // Get container stats
        const { stdout: stats } = await execAsync(`docker stats ${instanceName} --no-stream --format "{{.CPUPerc}},{{.MemUsage}}"`);
        const [cpuPerc, memUsage] = stats.split(',');
        
        usage = {
          cpu_usage: cpuPerc.trim(),
          memory_usage: memUsage.trim()
        };
      }
    }
  } catch (error) {
    console.error(`Error getting resource usage: ${error.message}`);
  }
  
  // Format usage information for display
  let usageText = '';
  if (usage) {
    usageText = `\nCurrent Usage:\n  CPU: ${usage.cpu_usage}\n  Memory: ${usage.memory_usage}`;
  } else {
    usageText = '\nUsage information not available';
  }

  return {
    content: [
      {
        type: 'text',
        text: `Resource Status for job ${params.job_id}:\nStatus: ${allocation.status}\nCPU: ${allocation.resources.cpu}\nMemory: ${allocation.resources.memory}\nDisk: ${allocation.resources.disk}\nAllocated at: ${allocation.allocated_at}${allocation.updated_at ? '\nLast updated: ' + allocation.updated_at : ''}${usageText}`
      }
    ],
    job_id: params.job_id,
    status: allocation.status,
    resources: allocation.resources,
    allocated_at: allocation.allocated_at,
    updated_at: allocation.updated_at,
    usage
  };
}

module.exports = manageJobResources;