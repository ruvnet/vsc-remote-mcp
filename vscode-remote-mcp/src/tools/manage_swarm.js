/**
 * Swarm Management Tool
 * Provides MCP tools for managing the VSCode Remote Swarm
 *
 * This is a mock implementation that returns dummy data
 * until the TypeScript implementation is ready.
 *
 * Response Structure:
 * All responses follow a consistent structure:
 * {
 *   success: boolean,          // Whether the operation was successful
 *   timestamp: Date,           // When the response was generated
 *   data?: any,                // Response data (when success is true)
 *   error?: {                  // Error information (when success is false)
 *     code: string,            // Error code
 *     message: string,         // Human-readable error message
 *     details?: any            // Additional error details
 *   }
 * }
 */

const logger = require('../utils/logger');

/**
 * Creates a standardized successful response
 * @param {Object} data - Response data
 * @returns {Object} - Standardized response object with MCP-compliant format
 */
function createSuccessResponse(data) {
  // Create a human-readable text representation based on the data
  let textContent = '';
  
  if (data.instance) {
    // Format instance details
    const instance = data.instance;
    textContent = `Instance: ${instance.name || instance.id}\n`;
    
    if (instance.status) {
      textContent += `Status: ${typeof instance.status === 'object' ? instance.status.current : instance.status}\n`;
    }
    
    if (instance.provider) {
      textContent += `Provider: ${typeof instance.provider === 'object' ? instance.provider.type : instance.provider}\n`;
    }
    
    if (instance.network && instance.network.urls) {
      textContent += `URLs: ${Array.isArray(instance.network.urls) ? instance.network.urls.join(', ') : instance.network.urls}\n`;
    }
    
    if (instance.action) {
      textContent += `Action: ${instance.action}\n`;
    }
    
    if (instance.message) {
      textContent += `\n${instance.message}`;
    }
  } else if (data.instances) {
    // Format instances list
    textContent = `Found ${data.instances.length} instances\n`;
    
    if (data.pagination) {
      textContent += `Page: ${Math.floor(data.pagination.offset / data.pagination.limit) + 1}\n`;
      textContent += `Total: ${data.pagination.total}\n`;
    }
    
    if (data.instances.length > 0) {
      textContent += '\nInstances:\n';
      data.instances.forEach((instance, index) => {
        textContent += `${index + 1}. ${instance.name} (${instance.status}) - ${instance.provider}\n`;
      });
    }
  } else if (data.health) {
    // Format health information
    textContent = `Health Status: ${data.health.summary?.status || 'Unknown'}\n`;
    
    if (data.health.summary?.score !== undefined) {
      textContent += `Health Score: ${data.health.summary.score}%\n`;
    }
    
    if (data.health.metrics) {
      textContent += '\nMetrics:\n';
      Object.entries(data.health.metrics).forEach(([key, value]) => {
        textContent += `- ${key}: ${value.usage !== undefined ? `${value.usage}/${value.limit}` : JSON.stringify(value)}\n`;
      });
    }
    
    if (data.health.alerts && data.health.alerts.length > 0) {
      textContent += '\nAlerts:\n';
      data.health.alerts.forEach((alert, index) => {
        textContent += `${index + 1}. [${alert.severity}] ${alert.message}\n`;
      });
    }
  } else if (data.plan) {
    // Format migration plan
    textContent = `Migration Plan: ${data.plan.id}\n`;
    textContent += `Source: ${data.plan.source.name} (${data.plan.source.provider})\n`;
    textContent += `Target: ${data.plan.target.provider} (${data.plan.target.region})\n`;
    textContent += `Estimated Duration: ${data.plan.timing.estimatedDurationFormatted}\n`;
    textContent += `Estimated Downtime: ${data.plan.timing.estimatedDowntimeFormatted}\n`;
    
    if (data.plan.steps && data.plan.steps.length > 0) {
      textContent += '\nSteps:\n';
      data.plan.steps.forEach((step, index) => {
        textContent += `${index + 1}. ${step.name} - ${step.estimatedDurationFormatted}\n`;
      });
    }
  } else if (data.migration) {
    // Format migration status
    textContent = `Migration: ${data.migration.id}\n`;
    textContent += `Status: ${data.migration.status}\n`;
    textContent += `Progress: ${data.migration.progress}%\n`;
    
    if (data.migration.currentStep) {
      textContent += `Current Step: ${data.migration.currentStep}\n`;
    }
    
    if (data.migration.timing) {
      if (data.migration.timing.startedAt) {
        textContent += `Started: ${data.migration.timing.startedAt.toISOString()}\n`;
      }
      if (data.migration.timing.estimatedCompletionTime) {
        textContent += `Estimated Completion: ${data.migration.timing.estimatedCompletionTime.toISOString()}\n`;
      }
    }
  } else if (data.status) {
    // Format swarm status
    textContent = `Swarm Status: ${data.status.health?.status || 'Unknown'}\n`;
    textContent += `Version: ${data.status.system?.version || 'Unknown'}\n`;
    textContent += `Uptime: ${data.status.system?.uptimeFormatted || 'Unknown'}\n\n`;
    
    if (data.status.instances?.summary) {
      textContent += `Instances: ${data.status.instances.summary.total} total\n`;
      textContent += `- Running: ${data.status.instances.summary.byStatus.running}\n`;
      textContent += `- Stopped: ${data.status.instances.summary.byStatus.stopped}\n`;
    }
    
    if (data.status.resources) {
      textContent += `\nResources:\n`;
      textContent += `- CPU: ${data.status.resources.cpu.utilization} (${data.status.resources.cpu.used}/${data.status.resources.cpu.total})\n`;
      textContent += `- Memory: ${data.status.resources.memory.utilization} (${data.status.resources.memory.usedFormatted}/${data.status.resources.memory.totalFormatted})\n`;
      textContent += `- Storage: ${data.status.resources.storage.utilization} (${data.status.resources.storage.usedFormatted}/${data.status.resources.storage.totalFormatted})\n`;
    }
  } else {
    // Default to JSON string for other data types
    textContent = JSON.stringify(data, null, 2);
  }
  
  return {
    content: [
      {
        type: 'text',
        text: textContent
      }
    ],
    success: true,
    timestamp: new Date(),
    data
  };
}

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} - Standardized error response object with MCP-compliant format
 */
function createErrorResponse(message, code = 'UNKNOWN_ERROR', details = null) {
  const error = {
    code,
    message
  };
  
  if (details) {
    error.details = details;
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${message}`
      }
    ],
    success: false,
    timestamp: new Date(),
    error
  };
}

// Mock provider types
const ProviderType = {
  DOCKER: 'docker',
  FLYIO: 'flyio'
};

// Mock instance statuses
const InstanceStatus = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  CREATING: 'creating',
  DELETING: 'deleting',
  ERROR: 'error'
};

// Mock instances
const mockInstances = [
  {
    id: 'instance-1',
    name: 'vscode-instance-1',
    providerType: ProviderType.DOCKER,
    status: InstanceStatus.RUNNING,
    createdAt: new Date('2025-04-01T12:00:00Z'),
    updatedAt: new Date('2025-04-01T12:05:00Z'),
    network: {
      externalIp: '127.0.0.1',
      urls: ['http://localhost:8080']
    },
    resources: {
      cpu: 2,
      memory: '2048m',
      storage: 10
    },
    metadata: {
      environment: 'development'
    }
  },
  {
    id: 'instance-2',
    name: 'vscode-instance-2',
    providerType: ProviderType.DOCKER,
    status: InstanceStatus.STOPPED,
    createdAt: new Date('2025-04-02T12:00:00Z'),
    updatedAt: new Date('2025-04-02T12:05:00Z'),
    network: {
      externalIp: '127.0.0.1',
      urls: ['http://localhost:8081']
    },
    resources: {
      cpu: 1,
      memory: '1024m',
      storage: 5
    },
    metadata: {
      environment: 'testing'
    }
  }
];

// Mock health statuses
const HealthStatus = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

// Mock migration statuses
const MigrationStatus = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Log a message about the mock implementation
 */
function logMockWarning() {
  logger.warn('Using mock swarm management implementation. This is not a real implementation.');
}

/**
 * List swarm instances
 * @param {Object} params - Tool parameters
 * @param {string} [params.status] - Filter by instance status
 * @param {string} [params.provider] - Filter by provider type
 * @param {string} [params.namePattern] - Filter by instance name pattern
 * @param {string} [params.createdAfter] - Filter by creation date
 * @param {string} [params.createdBefore] - Filter by creation date
 * @param {Object} [params.tags] - Filter by tags
 * @param {number} [params.limit] - Maximum number of results
 * @param {number} [params.offset] - Result offset
 * @returns {Promise<Object>} - List of instances
 */
async function listSwarmInstances(params) {
  try {
    logMockWarning();
    
    // Filter instances
    let instances = [...mockInstances];
    
    if (params.status) {
      instances = instances.filter(instance => instance.status === params.status);
    }
    
    if (params.provider) {
      instances = instances.filter(instance => instance.providerType === params.provider);
    }
    
    if (params.namePattern) {
      const regex = new RegExp(params.namePattern, 'i');
      instances = instances.filter(instance => regex.test(instance.name));
    }
    
    if (params.createdAfter) {
      const createdAfter = new Date(params.createdAfter);
      instances = instances.filter(instance => instance.createdAt >= createdAfter);
    }
    
    if (params.createdBefore) {
      const createdBefore = new Date(params.createdBefore);
      instances = instances.filter(instance => instance.createdAt <= createdBefore);
    }
    
    if (params.tags) {
      instances = instances.filter(instance => {
        const metadata = instance.metadata || {};
        const tags = metadata.tags || {};
        
        return Object.entries(params.tags).every(([key, value]) =>
          tags[key] === value
        );
      });
    }
    
    // Get total count before pagination
    const totalCount = instances.length;
    
    // Apply limit and offset
    if (params.offset && params.offset > 0) {
      instances = instances.slice(params.offset);
    }
    
    if (params.limit && params.limit > 0) {
      instances = instances.slice(0, params.limit);
    }
    
    // Map instances to response format with enhanced metadata
    const instancesData = instances.map(instance => ({
      id: instance.id,
      name: instance.name,
      provider: instance.providerType,
      region: instance.metadata?.region || 'default',
      status: instance.status,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
      network: {
        externalIp: instance.network.externalIp,
        urls: instance.network.urls,
        accessMethods: ['http', 'ssh'],
        securityGroups: instance.network.securityGroups || ['default']
      },
      resources: {
        cpu: instance.resources.cpu,
        memory: instance.resources.memory,
        storage: instance.resources.storage,
        usageMetrics: {
          cpuUsage: Math.floor(Math.random() * 100) + '%',
          memoryUsage: Math.floor(Math.random() * 80) + '%',
          storageUsage: Math.floor(Math.random() * 70) + '%'
        }
      },
      metadata: {
        environment: instance.metadata.environment,
        workspacePath: instance.metadata.workspacePath,
        image: instance.metadata.image,
        extensions: instance.metadata.extensions || [],
        tags: instance.metadata.tags || {},
        description: instance.metadata.description || '',
        owner: instance.metadata.owner || 'system',
        lastHealthCheck: instance.metadata.lastHealthCheck || null
      }
    }));
    
    return createSuccessResponse({
      instances: instancesData,
      pagination: {
        total: totalCount,
        offset: params.offset || 0,
        limit: params.limit || totalCount,
        hasMore: params.limit && (params.offset || 0) + params.limit < totalCount
      },
      filters: {
        status: params.status,
        provider: params.provider,
        namePattern: params.namePattern,
        createdAfter: params.createdAfter,
        createdBefore: params.createdBefore,
        tags: params.tags
      }
    });
  } catch (error) {
    logger.error('Failed to list swarm instances', error);
    return createErrorResponse(
      'Failed to list swarm instances: ' + error.message,
      'LIST_INSTANCES_ERROR',
      { originalError: error.toString() }
    );
  }
}

/**
 * Get swarm instance details
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @returns {Promise<Object>} - Instance details
 */
async function getSwarmInstance(params) {
  try {
    logMockWarning();
    
    // Find instance
    const instance = mockInstances.find(instance => instance.id === params.instanceId);
    
    if (!instance) {
      return createErrorResponse(
        `Instance ${params.instanceId} not found`,
        'INSTANCE_NOT_FOUND',
        { instanceId: params.instanceId }
      );
    }
    
    // Generate enhanced instance details
    const instanceDetails = {
      id: instance.id,
      name: instance.name,
      provider: {
        type: instance.providerType,
        region: instance.metadata?.region || 'default',
        zone: instance.metadata?.zone || 'default'
      },
      status: {
        current: instance.status,
        since: instance.updatedAt,
        previousStates: instance.metadata?.statusHistory || [],
        isHealthy: instance.status === InstanceStatus.RUNNING
      },
      timing: {
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
        lastStartedAt: instance.metadata?.lastStartedAt || instance.createdAt,
        lastStoppedAt: instance.metadata?.lastStoppedAt,
        uptime: instance.status === InstanceStatus.RUNNING
          ? `${Math.floor(Math.random() * 86400)}s`
          : '0s'
      },
      network: {
        externalIp: instance.network.externalIp,
        urls: instance.network.urls,
        accessMethods: ['http', 'ssh'],
        securityGroups: instance.network.securityGroups || ['default'],
        firewallRules: instance.network.firewallRules || [
          { port: 22, protocol: 'tcp', description: 'SSH access' },
          { port: 80, protocol: 'tcp', description: 'HTTP access' },
          { port: 443, protocol: 'tcp', description: 'HTTPS access' }
        ]
      },
      resources: {
        cpu: {
          allocated: instance.resources.cpu,
          usage: Math.floor(Math.random() * 100),
          limit: instance.resources.cpu * 100
        },
        memory: {
          allocated: instance.resources.memory,
          usage: `${Math.floor(Math.random() * parseInt(instance.resources.memory))}MB`,
          limit: instance.resources.memory
        },
        storage: {
          allocated: `${instance.resources.storage}GB`,
          usage: `${Math.floor(Math.random() * instance.resources.storage)}GB`,
          limit: `${instance.resources.storage}GB`
        }
      },
      metadata: {
        environment: instance.metadata.environment,
        workspacePath: instance.metadata.workspacePath,
        image: instance.metadata.image,
        extensions: instance.metadata.extensions || [],
        tags: instance.metadata.tags || {},
        description: instance.metadata.description || '',
        owner: instance.metadata.owner || 'system',
        lastHealthCheck: instance.metadata.lastHealthCheck || null,
        configuration: instance.metadata.configuration || {
          autoStart: false,
          autoStop: true,
          idleTimeout: 30,
          backupEnabled: true,
          backupSchedule: 'daily'
        }
      },
      services: {
        web: {
          status: 'running',
          port: 80,
          url: instance.network.urls[0]
        },
        ssh: {
          status: 'running',
          port: 22,
          connectionString: `ssh user@${instance.network.externalIp}`
        }
      }
    };
    
    return createSuccessResponse({ instance: instanceDetails });
  } catch (error) {
    logger.error(`Failed to get swarm instance ${params.instanceId}`, error);
    
    return createErrorResponse(
      `Failed to get swarm instance: ${error.message}`,
      'GET_INSTANCE_ERROR',
      { instanceId: params.instanceId, originalError: error.toString() }
    );
  }
}

/**
 * Create a new swarm instance
 * @param {Object} params - Tool parameters
 * @param {string} params.name - Instance name
 * @param {string} params.image - Container image
 * @param {string} params.workspacePath - Workspace path
 * @param {Object} [params.resources] - Resource configuration
 * @param {Object} [params.network] - Network configuration
 * @param {Array<string>} [params.extensions] - Extensions to install
 * @param {string} [params.provider] - Provider type
 * @param {string} [params.region] - Provider region
 * @param {Object} [params.tags] - Instance tags
 * @param {string} [params.description] - Instance description
 * @returns {Promise<Object>} - Created instance
 */
async function createSwarmInstance(params) {
  try {
    logMockWarning();
    
    // Validate parameters
    if (!params.name) {
      return createErrorResponse(
        'Instance name is required',
        'MISSING_REQUIRED_PARAMETER',
        { parameter: 'name' }
      );
    }
    
    if (!params.workspacePath) {
      return createErrorResponse(
        'Workspace path is required',
        'MISSING_REQUIRED_PARAMETER',
        { parameter: 'workspacePath' }
      );
    }
    
    // Check if name is already in use
    if (mockInstances.some(instance => instance.name === params.name)) {
      return createErrorResponse(
        `Instance name '${params.name}' is already in use`,
        'INSTANCE_NAME_CONFLICT',
        { name: params.name }
      );
    }
    
    const now = new Date();
    const instanceId = `instance-${Date.now()}`;
    
    // Create a new mock instance with enhanced details
    const newInstance = {
      id: instanceId,
      name: params.name,
      providerType: params.provider || ProviderType.DOCKER,
      status: InstanceStatus.CREATING,
      createdAt: now,
      updatedAt: now,
      network: params.network || {
        externalIp: '127.0.0.1',
        urls: [`http://localhost:${8080 + mockInstances.length}`],
        securityGroups: ['default'],
        firewallRules: [
          { port: 22, protocol: 'tcp', description: 'SSH access' },
          { port: 80, protocol: 'tcp', description: 'HTTP access' },
          { port: 443, protocol: 'tcp', description: 'HTTPS access' }
        ]
      },
      resources: params.resources || {
        cpu: 2,
        memory: '2048m',
        storage: 10
      },
      metadata: {
        environment: params.environment || 'development',
        workspacePath: params.workspacePath,
        image: params.image,
        extensions: params.extensions || [],
        region: params.region || 'default',
        zone: params.zone || 'default',
        tags: params.tags || {},
        description: params.description || '',
        owner: params.owner || 'system',
        statusHistory: [
          {
            status: InstanceStatus.CREATING,
            timestamp: now,
            reason: 'User initiated creation'
          }
        ],
        configuration: {
          autoStart: params.autoStart || false,
          autoStop: params.autoStop !== undefined ? params.autoStop : true,
          idleTimeout: params.idleTimeout || 30,
          backupEnabled: params.backupEnabled !== undefined ? params.backupEnabled : true,
          backupSchedule: params.backupSchedule || 'daily'
        }
      }
    };
    
    // Add to mock instances
    mockInstances.push(newInstance);
    
    // Simulate async creation
    setTimeout(() => {
      const instance = mockInstances.find(i => i.id === newInstance.id);
      if (instance) {
        instance.status = InstanceStatus.RUNNING;
        instance.updatedAt = new Date();
        
        // Update status history
        if (instance.metadata && instance.metadata.statusHistory) {
          instance.metadata.statusHistory.push({
            status: InstanceStatus.RUNNING,
            timestamp: new Date(),
            reason: 'Instance creation completed'
          });
        }
      }
    }, 1000);
    
    return createSuccessResponse({
      instance: {
        id: newInstance.id,
        name: newInstance.name,
        provider: {
          type: newInstance.providerType,
          region: newInstance.metadata.region,
          zone: newInstance.metadata.zone
        },
        status: {
          current: newInstance.status,
          message: 'Instance is being created',
          progress: 0
        },
        timing: {
          createdAt: newInstance.createdAt,
          estimatedReadyAt: new Date(now.getTime() + 60000) // 1 minute from now
        },
        network: {
          externalIp: newInstance.network.externalIp,
          urls: newInstance.network.urls
        },
        resources: newInstance.resources,
        metadata: {
          workspacePath: newInstance.metadata.workspacePath,
          image: newInstance.metadata.image,
          extensions: newInstance.metadata.extensions,
          tags: newInstance.metadata.tags,
          description: newInstance.metadata.description
        }
      },
      action: 'create',
      message: `Instance '${params.name}' creation started successfully`
    });
  } catch (error) {
    logger.error('Failed to create swarm instance', error);
    
    return createErrorResponse(
      `Failed to create instance: ${error.message}`,
      'CREATE_INSTANCE_ERROR',
      { originalError: error.toString() }
    );
  }
}

/**
 * Start a swarm instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @param {boolean} [params.force] - Force start even if instance is in an error state
 * @returns {Promise<Object>} - Started instance
 */
async function startSwarmInstance(params) {
  try {
    logMockWarning();
    
    // Find instance
    const instance = mockInstances.find(instance => instance.id === params.instanceId);
    
    if (!instance) {
      return createErrorResponse(
        `Instance ${params.instanceId} not found`,
        'INSTANCE_NOT_FOUND',
        { instanceId: params.instanceId }
      );
    }
    
    // Check if instance can be started
    if (instance.status === InstanceStatus.RUNNING) {
      return createErrorResponse(
        `Instance ${params.instanceId} is already running`,
        'INSTANCE_ALREADY_RUNNING',
        { instanceId: params.instanceId }
      );
    }
    
    if (instance.status === InstanceStatus.ERROR && !params.force) {
      return createErrorResponse(
        `Instance ${params.instanceId} is in an error state. Use force=true to start anyway.`,
        'INSTANCE_IN_ERROR_STATE',
        { instanceId: params.instanceId }
      );
    }
    
    const now = new Date();
    
    // Update instance status
    instance.status = InstanceStatus.RUNNING;
    instance.updatedAt = now;
    
    // Update metadata
    if (!instance.metadata) {
      instance.metadata = {};
    }
    
    instance.metadata.lastStartedAt = now;
    
    if (!instance.metadata.statusHistory) {
      instance.metadata.statusHistory = [];
    }
    
    instance.metadata.statusHistory.push({
      status: InstanceStatus.RUNNING,
      timestamp: now,
      reason: 'User initiated start'
    });
    
    return createSuccessResponse({
      instance: {
        id: instance.id,
        name: instance.name,
        provider: instance.providerType,
        status: instance.status,
        startedAt: now,
        network: instance.network,
        urls: instance.network.urls,
        action: 'start',
        message: `Instance ${instance.name} started successfully`
      }
    });
  } catch (error) {
    logger.error(`Failed to start swarm instance ${params.instanceId}`, error);
    
    return createErrorResponse(
      `Failed to start instance: ${error.message}`,
      'START_INSTANCE_ERROR',
      { instanceId: params.instanceId, originalError: error.toString() }
    );
  }
}

/**
 * Stop a swarm instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @param {boolean} [params.force] - Force stop
 * @returns {Promise<Object>} - Stopped instance
 */
async function stopSwarmInstance(params) {
  try {
    logMockWarning();
    
    // Find instance
    const instance = mockInstances.find(instance => instance.id === params.instanceId);
    
    if (!instance) {
      return createErrorResponse(
        `Instance ${params.instanceId} not found`,
        'INSTANCE_NOT_FOUND',
        { instanceId: params.instanceId }
      );
    }
    
    // Check if instance can be stopped
    if (instance.status === InstanceStatus.STOPPED) {
      return createErrorResponse(
        `Instance ${params.instanceId} is already stopped`,
        'INSTANCE_ALREADY_STOPPED',
        { instanceId: params.instanceId }
      );
    }
    
    const now = new Date();
    
    // Update instance status
    instance.status = InstanceStatus.STOPPED;
    instance.updatedAt = now;
    
    // Update metadata
    if (!instance.metadata) {
      instance.metadata = {};
    }
    
    instance.metadata.lastStoppedAt = now;
    
    if (!instance.metadata.statusHistory) {
      instance.metadata.statusHistory = [];
    }
    
    instance.metadata.statusHistory.push({
      status: InstanceStatus.STOPPED,
      timestamp: now,
      reason: params.force ? 'User initiated forced stop' : 'User initiated stop'
    });
    
    return createSuccessResponse({
      instance: {
        id: instance.id,
        name: instance.name,
        provider: instance.providerType,
        status: instance.status,
        stoppedAt: now,
        action: 'stop',
        forced: !!params.force,
        message: `Instance ${instance.name} stopped successfully${params.force ? ' (forced)' : ''}`
      }
    });
  } catch (error) {
    logger.error(`Failed to stop swarm instance ${params.instanceId}`, error);
    
    return createErrorResponse(
      `Failed to stop instance: ${error.message}`,
      'STOP_INSTANCE_ERROR',
      { instanceId: params.instanceId, originalError: error.toString() }
    );
  }
}

/**
 * Delete a swarm instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @param {boolean} [params.force] - Force deletion even if instance is running
 * @returns {Promise<Object>} - Result
 */
async function deleteSwarmInstance(params) {
  try {
    logMockWarning();
    
    // Find instance
    const instanceIndex = mockInstances.findIndex(instance => instance.id === params.instanceId);
    
    if (instanceIndex === -1) {
      return createErrorResponse(
        `Instance ${params.instanceId} not found`,
        'INSTANCE_NOT_FOUND',
        { instanceId: params.instanceId }
      );
    }
    
    const instance = mockInstances[instanceIndex];
    
    // Check if instance can be deleted
    if (instance.status === InstanceStatus.RUNNING && !params.force) {
      return createErrorResponse(
        `Cannot delete running instance ${params.instanceId}. Stop the instance first or use force=true.`,
        'CANNOT_DELETE_RUNNING_INSTANCE',
        { instanceId: params.instanceId }
      );
    }
    
    const now = new Date();
    const instanceDetails = {
      id: instance.id,
      name: instance.name,
      provider: instance.providerType,
      status: instance.status,
      createdAt: instance.createdAt,
      deletedAt: now
    };
    
    // Remove instance
    mockInstances.splice(instanceIndex, 1);
    
    return createSuccessResponse({
      instance: instanceDetails,
      action: 'delete',
      forced: !!params.force,
      message: `Instance ${instance.name} deleted successfully${params.force ? ' (forced)' : ''}`
    });
  } catch (error) {
    logger.error(`Failed to delete swarm instance ${params.instanceId}`, error);
    
    return createErrorResponse(
      `Failed to delete instance: ${error.message}`,
      'DELETE_INSTANCE_ERROR',
      { instanceId: params.instanceId, originalError: error.toString() }
    );
  }
}

/**
 * Get instance health
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @returns {Promise<Object>} - Instance health
 */
async function getInstanceHealth(params) {
  try {
    logMockWarning();
    
    // Find instance
    const instance = mockInstances.find(instance => instance.id === params.instanceId);
    
    if (!instance) {
      return createErrorResponse(
        `Instance ${params.instanceId} not found`,
        'INSTANCE_NOT_FOUND',
        { instanceId: params.instanceId }
      );
    }
    
    // Generate mock health data with enhanced details
    const now = new Date();
    const healthData = {
      summary: {
        status: instance.status === InstanceStatus.RUNNING ? HealthStatus.HEALTHY : HealthStatus.UNKNOWN,
        score: instance.status === InstanceStatus.RUNNING ? Math.floor(80 + Math.random() * 20) : 0,
        lastChecked: now,
        checkHistory: [
          { timestamp: new Date(now.getTime() - 3600000), status: HealthStatus.HEALTHY, score: 95 },
          { timestamp: new Date(now.getTime() - 7200000), status: HealthStatus.HEALTHY, score: 92 },
          { timestamp: new Date(now.getTime() - 10800000), status: HealthStatus.HEALTHY, score: 90 }
        ]
      },
      metrics: {
        cpu: {
          usage: Math.random() * 100,
          limit: instance.resources.cpu * 100,
          trend: [-2, 5, -1, 3, 2, -3, 4].map(v => Math.max(0, Math.min(100, 50 + v * 10))),
          alerts: []
        },
        memory: {
          usage: Math.floor(Math.random() * 1024),
          usageFormatted: Math.floor(Math.random() * 1024) + 'MB',
          limit: parseInt(instance.resources.memory),
          limitFormatted: instance.resources.memory,
          trend: [45, 48, 52, 49, 47, 51, 50].map(v => v * 10),
          alerts: []
        },
        disk: {
          usage: Math.floor(Math.random() * 80),
          usageFormatted: Math.floor(Math.random() * 80) + '%',
          limit: instance.resources.storage,
          limitFormatted: instance.resources.storage + 'GB',
          trend: [60, 62, 65, 68, 70, 72, 75].map(v => v / 100 * instance.resources.storage),
          alerts: []
        },
        network: {
          bytesIn: Math.floor(Math.random() * 1024 * 1024),
          bytesOut: Math.floor(Math.random() * 1024 * 1024),
          connectionsCount: Math.floor(Math.random() * 100),
          latency: Math.floor(Math.random() * 100),
          alerts: []
        }
      },
      services: {
        web: {
          status: 'running',
          uptime: Math.floor(Math.random() * 86400),
          uptimeFormatted: Math.floor(Math.random() * 86400) + 's',
          responseTime: Math.floor(Math.random() * 500),
          responseTimeFormatted: Math.floor(Math.random() * 500) + 'ms',
          requestsPerMinute: Math.floor(Math.random() * 100),
          lastError: null
        },
        ssh: {
          status: 'running',
          uptime: Math.floor(Math.random() * 86400),
          uptimeFormatted: Math.floor(Math.random() * 86400) + 's',
          activeConnections: Math.floor(Math.random() * 5),
          lastError: null
        },
        database: {
          status: 'running',
          uptime: Math.floor(Math.random() * 86400),
          uptimeFormatted: Math.floor(Math.random() * 86400) + 's',
          connections: Math.floor(Math.random() * 20),
          queriesPerSecond: Math.floor(Math.random() * 50),
          lastError: null
        }
      },
      alerts: [],
      recommendations: [
        {
          type: 'performance',
          priority: 'low',
          message: 'Consider upgrading memory for better performance',
          details: 'Memory usage has been consistently high over the past 24 hours'
        }
      ]
    };
    
    // Add some conditional alerts based on resource usage
    if (healthData.metrics.cpu.usage > 80) {
      healthData.metrics.cpu.alerts.push({
        severity: 'warning',
        message: 'CPU usage is high',
        timestamp: now
      });
      
      healthData.alerts.push({
        type: 'resource',
        severity: 'warning',
        resource: 'cpu',
        message: 'CPU usage is high',
        timestamp: now,
        value: healthData.metrics.cpu.usage.toFixed(2) + '%'
      });
    }
    
    if (healthData.metrics.disk.usage > 70) {
      healthData.metrics.disk.alerts.push({
        severity: 'warning',
        message: 'Disk usage is high',
        timestamp: now
      });
      
      healthData.alerts.push({
        type: 'resource',
        severity: 'warning',
        resource: 'disk',
        message: 'Disk usage is high',
        timestamp: now,
        value: healthData.metrics.disk.usageFormatted
      });
    }
    
    return createSuccessResponse({ health: healthData });
  } catch (error) {
    logger.error(`Failed to get health for instance ${params.instanceId}`, error);
    
    return createErrorResponse(
      `Failed to get instance health: ${error.message}`,
      'GET_HEALTH_ERROR',
      { instanceId: params.instanceId, originalError: error.toString() }
    );
  }
}

/**
 * Trigger a health check for an instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @param {Array<string>} [params.checkTypes] - Specific checks to run
 * @returns {Promise<Object>} - Health check result
 */
async function triggerHealthCheck(params) {
  try {
    logMockWarning();
    
    // Find instance
    const instance = mockInstances.find(instance => instance.id === params.instanceId);
    
    if (!instance) {
      return createErrorResponse(
        `Instance ${params.instanceId} not found`,
        'INSTANCE_NOT_FOUND',
        { instanceId: params.instanceId }
      );
    }
    
    // Generate mock health data with enhanced details
    const now = new Date();
    const checkTypes = params.checkTypes || ['system', 'services', 'connectivity', 'security'];
    
    // Generate detailed check results
    const checks = [];
    
    if (checkTypes.includes('system')) {
      checks.push(
        {
          type: 'system',
          name: 'cpu_load',
          status: 'passed',
          message: 'CPU load is within acceptable limits',
          value: (Math.random() * 2).toFixed(2),
          threshold: '4.0',
          timestamp: now
        },
        {
          type: 'system',
          name: 'memory_usage',
          status: 'passed',
          message: 'Memory usage is within acceptable limits',
          value: Math.floor(Math.random() * 80) + '%',
          threshold: '90%',
          timestamp: now
        },
        {
          type: 'system',
          name: 'disk_usage',
          status: 'passed',
          message: 'Disk usage is within acceptable limits',
          value: Math.floor(Math.random() * 70) + '%',
          threshold: '85%',
          timestamp: now
        },
        {
          type: 'system',
          name: 'swap_usage',
          status: 'passed',
          message: 'Swap usage is within acceptable limits',
          value: Math.floor(Math.random() * 30) + '%',
          threshold: '50%',
          timestamp: now
        }
      );
    }
    
    if (checkTypes.includes('services')) {
      checks.push(
        {
          type: 'service',
          name: 'http',
          status: 'passed',
          message: 'HTTP endpoint is responding',
          responseTime: Math.floor(Math.random() * 200) + 'ms',
          timestamp: now
        },
        {
          type: 'service',
          name: 'ssh',
          status: 'passed',
          message: 'SSH service is available',
          responseTime: Math.floor(Math.random() * 100) + 'ms',
          timestamp: now
        },
        {
          type: 'service',
          name: 'database',
          status: 'passed',
          message: 'Database service is running',
          responseTime: Math.floor(Math.random() * 50) + 'ms',
          timestamp: now
        }
      );
    }
    
    if (checkTypes.includes('connectivity')) {
      checks.push(
        {
          type: 'connectivity',
          name: 'internet_access',
          status: 'passed',
          message: 'Instance has internet access',
          details: 'Successfully pinged external endpoints',
          timestamp: now
        },
        {
          type: 'connectivity',
          name: 'dns_resolution',
          status: 'passed',
          message: 'DNS resolution is working',
          details: 'Successfully resolved domain names',
          timestamp: now
        }
      );
    }
    
    if (checkTypes.includes('security')) {
      checks.push(
        {
          type: 'security',
          name: 'firewall',
          status: 'passed',
          message: 'Firewall is properly configured',
          details: 'All required ports are open, unnecessary ports are closed',
          timestamp: now
        },
        {
          type: 'security',
          name: 'updates',
          status: 'passed',
          message: 'System is up to date',
          details: 'All security updates are installed',
          timestamp: now
        }
      );
    }
    
    // Randomly add a warning or failure for demonstration
    if (Math.random() > 0.7) {
      const randomCheck = checks[Math.floor(Math.random() * checks.length)];
      randomCheck.status = Math.random() > 0.5 ? 'warning' : 'failed';
      randomCheck.message = randomCheck.status === 'warning'
        ? `${randomCheck.name} is approaching critical threshold`
        : `${randomCheck.name} has exceeded critical threshold`;
    }
    
    // Calculate overall health status
    const failedChecks = checks.filter(check => check.status === 'failed').length;
    const warningChecks = checks.filter(check => check.status === 'warning').length;
    
    let overallStatus = HealthStatus.HEALTHY;
    if (failedChecks > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (warningChecks > 0) {
      overallStatus = 'degraded';
    }
    
    const healthData = {
      summary: {
        status: overallStatus,
        score: 100 - (failedChecks * 20) - (warningChecks * 5),
        passedChecks: checks.length - failedChecks - warningChecks,
        warningChecks: warningChecks,
        failedChecks: failedChecks,
        totalChecks: checks.length,
        checkTypes: checkTypes,
        startTime: now,
        endTime: new Date(now.getTime() + Math.floor(Math.random() * 5000)),
        triggeredBy: 'api'
      },
      checks: checks,
      recommendations: []
    };
    
    // Add recommendations based on check results
    if (failedChecks > 0 || warningChecks > 0) {
      const failedOrWarningChecks = checks.filter(check =>
        check.status === 'failed' || check.status === 'warning'
      );
      
      failedOrWarningChecks.forEach(check => {
        healthData.recommendations.push({
          type: check.type,
          priority: check.status === 'failed' ? 'high' : 'medium',
          message: `Address ${check.name} issue`,
          details: check.message,
          actionable: true,
          suggestedAction: `Investigate ${check.type} ${check.name}`
        });
      });
    }
    
    // Update instance metadata with last health check
    if (instance.metadata) {
      instance.metadata.lastHealthCheck = {
        timestamp: now,
        status: overallStatus,
        score: healthData.summary.score
      };
    }
    
    return createSuccessResponse({
      health: healthData,
      instance: {
        id: instance.id,
        name: instance.name,
        status: instance.status
      }
    });
  } catch (error) {
    logger.error(`Failed to trigger health check for instance ${params.instanceId}`, error);
    
    return createErrorResponse(
      `Failed to trigger health check: ${error.message}`,
      'HEALTH_CHECK_ERROR',
      { instanceId: params.instanceId, originalError: error.toString() }
    );
  }
}

// Mock migrations
const mockMigrations = new Map();

/**
 * Plan migration of an instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @param {string} params.targetProvider - Target provider type
 * @param {string} [params.targetRegion] - Target region
 * @param {Object} [params.options] - Migration options
 * @param {boolean} [params.options.force] - Force migration
 * @param {boolean} [params.options.keepSource] - Keep source instance
 * @param {boolean} [params.options.startTarget] - Start target instance
 * @param {number} [params.options.maxDowntimeMs] - Maximum downtime in milliseconds
 * @returns {Promise<Object>} - Migration plan
 */
async function planMigration(params) {
  try {
    logMockWarning();
    
    // Find instance
    const instance = mockInstances.find(instance => instance.id === params.instanceId);
    
    if (!instance) {
      return createErrorResponse(
        `Instance ${params.instanceId} not found`,
        'INSTANCE_NOT_FOUND',
        { instanceId: params.instanceId }
      );
    }
    
    const options = params.options || {};
    
    // Create enhanced migration plan
    const now = new Date();
    const plan = {
      id: `plan-${Date.now()}`,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
      source: {
        instanceId: params.instanceId,
        name: instance.name,
        provider: instance.providerType,
        region: instance.metadata?.region || 'default',
        resources: instance.resources
      },
      target: {
        provider: params.targetProvider,
        region: params.targetRegion || 'us-west',
        estimatedResources: {
          cpu: instance.resources.cpu,
          memory: instance.resources.memory,
          storage: instance.resources.storage
        }
      },
      options: {
        force: options.force || false,
        keepSource: options.keepSource || false,
        startTarget: options.startTarget !== undefined ? options.startTarget : true,
        maxDowntimeMs: options.maxDowntimeMs || 5000
      },
      timing: {
        estimatedDuration: 300000, // 5 minutes in ms
        estimatedDurationFormatted: '5m',
        estimatedDowntime: 30000, // 30 seconds in ms
        estimatedDowntimeFormatted: '30s',
        earliestStartTime: now,
        latestStartTime: new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 hours from now
      },
      steps: [
        {
          id: 'prepare',
          name: 'Prepare',
          description: 'Prepare source instance for migration',
          estimatedDuration: 60000, // 1 minute in ms
          estimatedDurationFormatted: '1m',
          actions: [
            'Validate source instance',
            'Check resource availability in target region',
            'Prepare migration environment'
          ]
        },
        {
          id: 'snapshot',
          name: 'Snapshot',
          description: 'Create snapshot of source instance',
          estimatedDuration: 120000, // 2 minutes in ms
          estimatedDurationFormatted: '2m',
          actions: [
            'Freeze filesystem',
            'Create disk snapshot',
            'Create configuration snapshot',
            'Unfreeze filesystem'
          ]
        },
        {
          id: 'transfer',
          name: 'Transfer',
          description: 'Transfer snapshot to target region',
          estimatedDuration: 60000, // 1 minute in ms
          estimatedDurationFormatted: '1m',
          actions: [
            'Compress snapshot data',
            'Transfer data to target region',
            'Verify data integrity'
          ]
        },
        {
          id: 'restore',
          name: 'Restore',
          description: 'Restore instance from snapshot',
          estimatedDuration: 60000, // 1 minute in ms
          estimatedDurationFormatted: '1m',
          actions: [
            'Provision target instance',
            'Restore configuration',
            'Restore data',
            'Start services'
          ]
        }
      ],
      compatibility: {
        compatible: true,
        warnings: [],
        blockers: []
      },
      cost: {
        estimatedCost: '0.00',
        currency: 'USD',
        breakdown: [
          { item: 'Data transfer', cost: '0.00' },
          { item: 'Storage', cost: '0.00' },
          { item: 'Compute', cost: '0.00' }
        ]
      }
    };
    
    // Add some compatibility warnings based on provider
    if (instance.providerType !== params.targetProvider) {
      plan.compatibility.warnings.push({
        type: 'provider_difference',
        message: `Migration between different providers (${instance.providerType} to ${params.targetProvider}) may have limitations`,
        impact: 'Some provider-specific features may not be available after migration'
      });
    }
    
    return createSuccessResponse({ plan });
  } catch (error) {
    logger.error(`Failed to plan migration for instance ${params.instanceId}`, error);
    
    return createErrorResponse(
      `Failed to plan migration: ${error.message}`,
      'PLAN_MIGRATION_ERROR',
      { instanceId: params.instanceId, originalError: error.toString() }
    );
  }
}

/**
 * Start a migration
 * @param {Object} params - Tool parameters
 * @param {string} params.planId - Migration plan ID
 * @returns {Promise<Object>} - Migration ID
 */
async function startMigration(params) {
  try {
    logMockWarning();
    
    // Create migration with enhanced details
    const now = new Date();
    const migrationId = `migration-${Date.now()}`;
    
    // Store migration with enhanced details
    mockMigrations.set(migrationId, {
      id: migrationId,
      planId: params.planId,
      status: MigrationStatus.IN_PROGRESS,
      startedAt: now,
      updatedAt: now,
      estimatedCompletionTime: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes from now
      progress: 0,
      currentStep: 'prepare',
      steps: [
        {
          id: 'prepare',
          name: 'Prepare',
          status: MigrationStatus.IN_PROGRESS,
          startedAt: now,
          estimatedCompletionTime: new Date(now.getTime() + 1 * 60 * 1000), // 1 minute from now
          progress: 0,
          details: 'Preparing source instance for migration',
          logs: [
            { timestamp: now, level: 'info', message: 'Starting preparation phase' },
            { timestamp: now, level: 'info', message: 'Validating source instance' }
          ]
        },
        {
          id: 'snapshot',
          name: 'Snapshot',
          status: 'pending',
          progress: 0,
          details: 'Waiting to create snapshot',
          logs: []
        },
        {
          id: 'transfer',
          name: 'Transfer',
          status: 'pending',
          progress: 0,
          details: 'Waiting to transfer snapshot',
          logs: []
        },
        {
          id: 'restore',
          name: 'Restore',
          status: 'pending',
          progress: 0,
          details: 'Waiting to restore instance',
          logs: []
        }
      ],
      metrics: {
        dataTransferred: 0,
        dataTransferRate: 0,
        downtime: 0
      },
      logs: [
        { timestamp: now, level: 'info', message: 'Migration started' },
        { timestamp: now, level: 'info', message: `Plan ID: ${params.planId}` }
      ]
    });
    
    // Simulate migration progress
    simulateMigrationProgress(migrationId);
    
    return createSuccessResponse({
      migration: {
        id: migrationId,
        status: MigrationStatus.IN_PROGRESS,
        startedAt: now,
        estimatedCompletionTime: new Date(now.getTime() + 5 * 60 * 1000)
      }
    });
  } catch (error) {
    logger.error('Failed to start migration', error);
    
    return createErrorResponse(
      `Failed to start migration: ${error.message}`,
      'START_MIGRATION_ERROR',
      { planId: params.planId, originalError: error.toString() }
    );
  }
}

/**
 * Simulate migration progress
 * @param {string} migrationId - Migration ID
 */
function simulateMigrationProgress(migrationId) {
  const migration = mockMigrations.get(migrationId);
  
  if (!migration || migration.status !== MigrationStatus.IN_PROGRESS) {
    return;
  }
  
  // Update progress
  const steps = ['prepare', 'snapshot', 'transfer', 'restore'];
  const currentStepIndex = steps.indexOf(migration.currentStep);
  
  // Update current step progress
  const currentStep = migration.steps.find(step => step.id === migration.currentStep);
  currentStep.progress += 20;
  
  // Add a log entry
  const now = new Date();
  currentStep.logs.push({
    timestamp: now,
    level: 'info',
    message: `Progress: ${currentStep.progress}%`
  });
  
  migration.logs.push({
    timestamp: now,
    level: 'info',
    message: `Step '${currentStep.name}' progress: ${currentStep.progress}%`
  });
  
  // Update step details based on progress
  if (currentStep.progress < 30) {
    currentStep.details = `Starting ${currentStep.name.toLowerCase()} process`;
  } else if (currentStep.progress < 70) {
    currentStep.details = `${currentStep.name} in progress`;
  } else {
    currentStep.details = `Finalizing ${currentStep.name.toLowerCase()} process`;
  }
  
  if (currentStep.progress >= 100) {
    // Complete current step
    currentStep.status = MigrationStatus.COMPLETED;
    currentStep.completedAt = now;
    currentStep.details = `${currentStep.name} completed successfully`;
    
    currentStep.logs.push({
      timestamp: now,
      level: 'info',
      message: `${currentStep.name} step completed`
    });
    
    migration.logs.push({
      timestamp: now,
      level: 'info',
      message: `Step '${currentStep.name}' completed`
    });
    
    // Move to next step
    if (currentStepIndex < steps.length - 1) {
      const nextStep = migration.steps.find(step => step.id === steps[currentStepIndex + 1]);
      nextStep.status = MigrationStatus.IN_PROGRESS;
      nextStep.startedAt = now;
      nextStep.estimatedCompletionTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now
      
      migration.currentStep = steps[currentStepIndex + 1];
      
      nextStep.logs.push({
        timestamp: now,
        level: 'info',
        message: `Starting ${nextStep.name} step`
      });
      
      migration.logs.push({
        timestamp: now,
        level: 'info',
        message: `Starting step '${nextStep.name}'`
      });
    } else {
      // Migration completed
      migration.status = MigrationStatus.COMPLETED;
      migration.completedAt = now;
      
      migration.logs.push({
        timestamp: now,
        level: 'info',
        message: 'Migration completed successfully'
      });
      
      // Add some final metrics
      migration.metrics.dataTransferred = Math.floor(Math.random() * 1024) + 'MB';
      migration.metrics.dataTransferRate = Math.floor(Math.random() * 100) + 'MB/s';
      migration.metrics.downtime = Math.floor(Math.random() * 30) + 's';
      
      return;
    }
  }
  
  // Update overall progress
  migration.progress = Math.floor(
    (currentStepIndex * 100 + currentStep.progress) / steps.length
  );
  
  // Update metrics
  if (migration.currentStep === 'transfer') {
    migration.metrics.dataTransferred = Math.floor((migration.progress / 100) * 1024) + 'MB';
    migration.metrics.dataTransferRate = Math.floor(Math.random() * 100) + 'MB/s';
  }
  
  if (migration.currentStep === 'restore') {
    migration.metrics.downtime = Math.floor((migration.progress / 100) * 30) + 's';
  }
  
  migration.updatedAt = now;
  
  // Update estimated completion time based on progress
  const remainingSteps = steps.length - currentStepIndex;
  const remainingProgress = 100 - currentStep.progress;
  const totalRemaining = (remainingSteps - 1) * 100 + remainingProgress;
  const percentComplete = (steps.length * 100 - totalRemaining) / (steps.length * 100);
  
  // If we're making good progress, adjust the estimated completion time
  if (percentComplete > 0) {
    const elapsedTime = now.getTime() - migration.startedAt.getTime();
    const estimatedTotalTime = elapsedTime / percentComplete;
    const estimatedRemainingTime = estimatedTotalTime - elapsedTime;
    
    migration.estimatedCompletionTime = new Date(now.getTime() + estimatedRemainingTime);
  }
  
  // Schedule next update
  setTimeout(() => simulateMigrationProgress(migrationId), 1000);
}

/**
 * Get migration status
 * @param {Object} params - Tool parameters
 * @param {string} params.migrationId - Migration ID
 * @param {boolean} [params.includeLogs] - Whether to include detailed logs
 * @returns {Promise<Object>} - Migration status
 */
async function getMigrationStatus(params) {
  try {
    logMockWarning();
    
    // Get migration
    const migration = mockMigrations.get(params.migrationId);
    
    if (!migration) {
      return createErrorResponse(
        `Migration ${params.migrationId} not found`,
        'MIGRATION_NOT_FOUND',
        { migrationId: params.migrationId }
      );
    }
    
    // Create a response with the appropriate level of detail
    const migrationStatus = {
      id: migration.id,
      planId: migration.planId,
      status: migration.status,
      progress: migration.progress,
      currentStep: migration.currentStep,
      timing: {
        startedAt: migration.startedAt,
        updatedAt: migration.updatedAt,
        estimatedCompletionTime: migration.estimatedCompletionTime,
        completedAt: migration.completedAt,
        elapsedTime: `${Math.floor((new Date() - migration.startedAt) / 1000)}s`,
        remainingTime: migration.status === MigrationStatus.IN_PROGRESS
          ? `${Math.floor((migration.estimatedCompletionTime - new Date()) / 1000)}s`
          : '0s'
      },
      steps: migration.steps.map(step => ({
        id: step.id,
        name: step.name,
        status: step.status,
        progress: step.progress,
        details: step.details,
        timing: {
          startedAt: step.startedAt,
          estimatedCompletionTime: step.estimatedCompletionTime,
          completedAt: step.completedAt,
          elapsedTime: step.startedAt
            ? `${Math.floor((new Date() - step.startedAt) / 1000)}s`
            : '0s'
        }
      })),
      metrics: migration.metrics
    };
    
    // Include logs if requested
    if (params.includeLogs) {
      migrationStatus.logs = migration.logs;
      migrationStatus.steps = migration.steps.map(step => ({
        ...migrationStatus.steps.find(s => s.id === step.id),
        logs: step.logs
      }));
    }
    
    return createSuccessResponse({ migration: migrationStatus });
  } catch (error) {
    logger.error(`Failed to get status for migration ${params.migrationId}`, error);
    
    return createErrorResponse(
      `Failed to get migration status: ${error.message}`,
      'GET_MIGRATION_STATUS_ERROR',
      { migrationId: params.migrationId, originalError: error.toString() }
    );
  }
}

/**
 * Cancel a migration
 * @param {Object} params - Tool parameters
 * @param {string} params.migrationId - Migration ID
 * @param {string} [params.reason] - Cancellation reason
 * @returns {Promise<Object>} - Result
 */
async function cancelMigration(params) {
  try {
    logMockWarning();
    
    // Get migration
    const migration = mockMigrations.get(params.migrationId);
    
    if (!migration) {
      return createErrorResponse(
        `Migration ${params.migrationId} not found`,
        'MIGRATION_NOT_FOUND',
        { migrationId: params.migrationId }
      );
    }
    
    // Check if migration can be cancelled
    if (migration.status !== MigrationStatus.IN_PROGRESS) {
      return createErrorResponse(
        `Migration ${params.migrationId} cannot be cancelled because it is ${migration.status}`,
        'MIGRATION_CANNOT_BE_CANCELLED',
        {
          migrationId: params.migrationId,
          currentStatus: migration.status,
          allowedStatus: MigrationStatus.IN_PROGRESS
        }
      );
    }
    
    const now = new Date();
    
    // Cancel migration
    migration.status = MigrationStatus.CANCELLED;
    migration.updatedAt = now;
    migration.cancelledAt = now;
    migration.cancellationReason = params.reason || 'User requested cancellation';
    
    // Update current step
    const currentStep = migration.steps.find(step => step.id === migration.currentStep);
    if (currentStep) {
      currentStep.status = 'cancelled';
      currentStep.details = 'Step cancelled due to migration cancellation';
      
      currentStep.logs.push({
        timestamp: now,
        level: 'warning',
        message: `${currentStep.name} step cancelled`
      });
    }
    
    // Add log entries
    migration.logs.push(
      {
        timestamp: now,
        level: 'warning',
        message: 'Migration cancelled by user'
      },
      {
        timestamp: now,
        level: 'info',
        message: `Reason: ${migration.cancellationReason}`
      }
    );
    
    return createSuccessResponse({
      migration: {
        id: migration.id,
        status: migration.status,
        cancelledAt: migration.cancelledAt,
        cancellationReason: migration.cancellationReason
      }
    });
  } catch (error) {
    logger.error(`Failed to cancel migration ${params.migrationId}`, error);
    
    return createErrorResponse(
      `Failed to cancel migration: ${error.message}`,
      'CANCEL_MIGRATION_ERROR',
      { migrationId: params.migrationId, originalError: error.toString() }
    );
  }
}

/**
 * Get swarm status
 * @returns {Promise<Object>} - Swarm status
 */
async function getSwarmStatus() {
  try {
    logMockWarning();
    
    const now = new Date();
    const startTime = new Date(now.getTime() - Math.floor(Math.random() * 86400000)); // Random start time within the last 24 hours
    const uptime = now.getTime() - startTime.getTime();
    
    // Generate enhanced mock swarm status
    const status = {
      system: {
        version: '1.0.0',
        buildNumber: '20250427.1',
        startTime: startTime,
        uptime: uptime,
        uptimeFormatted: formatDuration(uptime),
        status: 'healthy',
        environment: 'production',
        nodeId: 'swarm-controller-01',
        clusterId: 'vscode-remote-cluster-main'
      },
      instances: {
        summary: {
          total: mockInstances.length,
          byStatus: {
            running: mockInstances.filter(i => i.status === InstanceStatus.RUNNING).length,
            stopped: mockInstances.filter(i => i.status === InstanceStatus.STOPPED).length,
            creating: mockInstances.filter(i => i.status === InstanceStatus.CREATING).length,
            deleting: mockInstances.filter(i => i.status === InstanceStatus.DELETING).length,
            error: mockInstances.filter(i => i.status === InstanceStatus.ERROR).length
          },
          byProvider: {
            [ProviderType.DOCKER]: mockInstances.filter(i => i.providerType === ProviderType.DOCKER).length,
            [ProviderType.FLYIO]: mockInstances.filter(i => i.providerType === ProviderType.FLYIO).length
          }
        },
        recentActivity: [
          {
            action: 'create',
            instanceId: 'instance-recent-1',
            instanceName: 'vscode-recent-1',
            timestamp: new Date(now.getTime() - 300000), // 5 minutes ago
            status: 'success'
          },
          {
            action: 'stop',
            instanceId: 'instance-recent-2',
            instanceName: 'vscode-recent-2',
            timestamp: new Date(now.getTime() - 600000), // 10 minutes ago
            status: 'success'
          }
        ]
      },
      migrations: {
        summary: {
          total: mockMigrations.size,
          byStatus: {
            inProgress: Array.from(mockMigrations.values()).filter(m => m.status === MigrationStatus.IN_PROGRESS).length,
            completed: Array.from(mockMigrations.values()).filter(m => m.status === MigrationStatus.COMPLETED).length,
            failed: Array.from(mockMigrations.values()).filter(m => m.status === MigrationStatus.FAILED).length,
            cancelled: Array.from(mockMigrations.values()).filter(m => m.status === MigrationStatus.CANCELLED).length,
            planned: Array.from(mockMigrations.values()).filter(m => m.status === MigrationStatus.PLANNED).length
          }
        },
        recentActivity: [
          {
            action: 'start',
            migrationId: 'migration-recent-1',
            sourceInstanceId: 'instance-1',
            targetProvider: ProviderType.FLYIO,
            timestamp: new Date(now.getTime() - 1800000), // 30 minutes ago
            status: MigrationStatus.COMPLETED
          }
        ],
        activeCount: Array.from(mockMigrations.values()).filter(m => m.status === MigrationStatus.IN_PROGRESS).length
      },
      providers: {
        available: [
          {
            id: ProviderType.DOCKER,
            name: 'Docker',
            status: 'available',
            version: '24.0.5',
            regions: ['local'],
            instanceCount: mockInstances.filter(i => i.providerType === ProviderType.DOCKER).length,
            capabilities: ['start', 'stop', 'delete', 'snapshot', 'restore'],
            limits: {
              maxInstances: 50,
              maxCpuPerInstance: 8,
              maxMemoryPerInstance: '16GB',
              maxStoragePerInstance: '100GB'
            },
            metrics: {
              availabilityLastHour: 100,
              availabilityLast24Hours: 99.9,
              averageStartTime: '5s',
              averageStopTime: '3s'
            }
          },
          {
            id: ProviderType.FLYIO,
            name: 'Fly.io',
            status: 'available',
            version: '1.0.0',
            regions: ['us-west', 'us-east', 'eu-west'],
            instanceCount: mockInstances.filter(i => i.providerType === ProviderType.FLYIO).length,
            capabilities: ['start', 'stop', 'delete', 'snapshot', 'restore', 'scale'],
            limits: {
              maxInstances: 100,
              maxCpuPerInstance: 16,
              maxMemoryPerInstance: '32GB',
              maxStoragePerInstance: '200GB'
            },
            metrics: {
              availabilityLastHour: 100,
              availabilityLast24Hours: 99.8,
              averageStartTime: '8s',
              averageStopTime: '5s'
            }
          }
        ],
        unavailable: []
      },
      resources: {
        cpu: {
          total: 16,
          used: mockInstances.reduce((sum, i) => sum + (i.resources.cpu || 0), 0),
          available: 16 - mockInstances.reduce((sum, i) => sum + (i.resources.cpu || 0), 0),
          utilization: Math.floor((mockInstances.reduce((sum, i) => sum + (i.resources.cpu || 0), 0) / 16) * 100) + '%'
        },
        memory: {
          total: 32 * 1024,
          totalFormatted: '32GB',
          used: mockInstances.reduce((sum, i) => {
            const memory = i.resources.memory || '0';
            return sum + parseInt(memory);
          }, 0),
          usedFormatted: mockInstances.reduce((sum, i) => {
            const memory = i.resources.memory || '0';
            return sum + parseInt(memory);
          }, 0) + 'MB',
          available: (32 * 1024 - mockInstances.reduce((sum, i) => {
            const memory = i.resources.memory || '0';
            return sum + parseInt(memory);
          }, 0)),
          availableFormatted: (32 * 1024 - mockInstances.reduce((sum, i) => {
            const memory = i.resources.memory || '0';
            return sum + parseInt(memory);
          }, 0)) + 'MB',
          utilization: Math.floor((mockInstances.reduce((sum, i) => {
            const memory = i.resources.memory || '0';
            return sum + parseInt(memory);
          }, 0) / (32 * 1024)) * 100) + '%'
        },
        storage: {
          total: 1000,
          totalFormatted: '1TB',
          used: mockInstances.reduce((sum, i) => sum + (i.resources.storage || 0), 0),
          usedFormatted: mockInstances.reduce((sum, i) => sum + (i.resources.storage || 0), 0) + 'GB',
          available: 1000 - mockInstances.reduce((sum, i) => sum + (i.resources.storage || 0), 0),
          availableFormatted: (1000 - mockInstances.reduce((sum, i) => sum + (i.resources.storage || 0), 0)) + 'GB',
          utilization: Math.floor((mockInstances.reduce((sum, i) => sum + (i.resources.storage || 0), 0) / 1000) * 100) + '%'
        }
      },
      health: {
        status: 'healthy',
        lastChecked: now,
        components: {
          api: { status: 'healthy', message: 'API is responding normally' },
          database: { status: 'healthy', message: 'Database connections are stable' },
          scheduler: { status: 'healthy', message: 'Scheduler is processing jobs' },
          providers: { status: 'healthy', message: 'All providers are available' }
        },
        alerts: []
      },
      metrics: {
        apiRequests: {
          total: 12500,
          lastHour: 250,
          byEndpoint: {
            '/instances': 5000,
            '/migrations': 2500,
            '/health': 3000,
            '/status': 2000
          }
        },
        instanceOperations: {
          total: 500,
          create: 150,
          start: 200,
          stop: 100,
          delete: 50
        },
        responseTime: {
          average: '120ms',
          p95: '250ms',
          p99: '500ms'
        }
      }
    };
    
    // Add some random alerts if needed
    if (Math.random() > 0.7) {
      status.health.alerts.push({
        severity: 'warning',
        message: 'High CPU utilization detected',
        timestamp: new Date(now.getTime() - 1800000), // 30 minutes ago
        component: 'resources',
        details: 'CPU utilization has been above 80% for the last 30 minutes'
      });
      
      status.health.components.resources = {
        status: 'degraded',
        message: 'High resource utilization'
      };
    }
    
    return createSuccessResponse({ status });
  } catch (error) {
    logger.error('Failed to get swarm status', error);
    
    return createErrorResponse(
      `Failed to get swarm status: ${error.message}`,
      'GET_SWARM_STATUS_ERROR',
      { originalError: error.toString() }
    );
  }
}

/**
 * Format duration in milliseconds to a human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration string
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Export tools
module.exports = {
  list_swarm_instances: listSwarmInstances,
  get_swarm_instance: getSwarmInstance,
  create_swarm_instance: createSwarmInstance,
  start_swarm_instance: startSwarmInstance,
  stop_swarm_instance: stopSwarmInstance,
  delete_swarm_instance: deleteSwarmInstance,
  get_instance_health: getInstanceHealth,
  trigger_health_check: triggerHealthCheck,
  plan_migration: planMigration,
  start_migration: startMigration,
  get_migration_status: getMigrationStatus,
  cancel_migration: cancelMigration,
  get_swarm_status: getSwarmStatus
};