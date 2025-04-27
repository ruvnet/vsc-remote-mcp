/**
 * Swarm Management Tool
 * Provides MCP tools for managing the VSCode Remote Swarm
 */

const { SwarmController } = require('../swarm/swarm-controller');
const { ProviderType } = require('../providers/core/provider-types');
const logger = require('../utils/logger');

// Initialize swarm controller
let swarmController = null;

/**
 * Initialize the swarm controller
 * @returns {Promise<void>}
 */
async function initializeSwarmController() {
  if (!swarmController) {
    swarmController = new SwarmController();
    await swarmController.initialize();
  }
}

/**
 * List swarm instances
 * @param {Object} params - Tool parameters
 * @param {string} [params.status] - Filter by instance status
 * @param {string} [params.provider] - Filter by provider type
 * @param {string} [params.name] - Filter by instance name
 * @returns {Promise<Object>} - List of instances
 */
async function listSwarmInstances(params) {
  try {
    await initializeSwarmController();
    
    // Create filter
    const filter = {};
    
    if (params.status) {
      filter.status = params.status;
    }
    
    if (params.provider) {
      filter.providerType = params.provider;
    }
    
    if (params.name) {
      filter.name = params.name;
    }
    
    // List instances
    const instances = await swarmController.listInstances(filter);
    
    return {
      success: true,
      instances: instances.map(instance => ({
        id: instance.id,
        name: instance.name,
        provider: instance.providerType,
        status: instance.status,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
        network: {
          externalIp: instance.network.externalIp,
          urls: instance.network.urls
        },
        resources: {
          cpu: instance.resources.cpu,
          memory: instance.resources.memory,
          storage: instance.resources.storage
        }
      }))
    };
  } catch (error) {
    logger.error('Failed to list swarm instances', error);
    
    return {
      success: false,
      error: error.message
    };
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
    await initializeSwarmController();
    
    // Get instance
    const instance = await swarmController.getInstance(params.instanceId);
    
    if (!instance) {
      return {
        success: false,
        error: `Instance ${params.instanceId} not found`
      };
    }
    
    return {
      success: true,
      instance: {
        id: instance.id,
        name: instance.name,
        provider: instance.providerType,
        status: instance.status,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
        network: instance.network,
        resources: instance.resources,
        config: instance.config,
        metadata: instance.metadata
      }
    };
  } catch (error) {
    logger.error(`Failed to get swarm instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message
    };
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
 * @returns {Promise<Object>} - Created instance
 */
async function createSwarmInstance(params) {
  try {
    await initializeSwarmController();
    
    // Create instance config
    const config = {
      name: params.name,
      image: params.image,
      workspacePath: params.workspacePath,
      resources: params.resources || {
        cpu: {
          cores: 2
        },
        memory: {
          min: 2048
        }
      },
      network: params.network || {},
      extensions: params.extensions
    };
    
    // Create instance
    const instance = await swarmController.createInstance(
      config,
      params.provider ? params.provider : undefined
    );
    
    return {
      success: true,
      instance: {
        id: instance.id,
        name: instance.name,
        provider: instance.providerType,
        status: instance.status,
        network: instance.network
      }
    };
  } catch (error) {
    logger.error('Failed to create swarm instance', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Start a swarm instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @returns {Promise<Object>} - Started instance
 */
async function startSwarmInstance(params) {
  try {
    await initializeSwarmController();
    
    // Start instance
    const instance = await swarmController.startInstance(params.instanceId);
    
    return {
      success: true,
      instance: {
        id: instance.id,
        name: instance.name,
        provider: instance.providerType,
        status: instance.status,
        network: instance.network
      }
    };
  } catch (error) {
    logger.error(`Failed to start swarm instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Stop a swarm instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @returns {Promise<Object>} - Stopped instance
 */
async function stopSwarmInstance(params) {
  try {
    await initializeSwarmController();
    
    // Stop instance
    const instance = await swarmController.stopInstance(params.instanceId);
    
    return {
      success: true,
      instance: {
        id: instance.id,
        name: instance.name,
        provider: instance.providerType,
        status: instance.status
      }
    };
  } catch (error) {
    logger.error(`Failed to stop swarm instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a swarm instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @returns {Promise<Object>} - Result
 */
async function deleteSwarmInstance(params) {
  try {
    await initializeSwarmController();
    
    // Delete instance
    const deleted = await swarmController.deleteInstance(params.instanceId);
    
    return {
      success: deleted,
      message: deleted ? `Instance ${params.instanceId} deleted` : `Failed to delete instance ${params.instanceId}`
    };
  } catch (error) {
    logger.error(`Failed to delete swarm instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message
    };
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
    await initializeSwarmController();
    
    // Get instance health
    const health = swarmController.getInstanceHealth(params.instanceId);
    
    if (!health) {
      return {
        success: false,
        error: `Health information for instance ${params.instanceId} not found`
      };
    }
    
    return {
      success: true,
      health
    };
  } catch (error) {
    logger.error(`Failed to get health for instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Trigger a health check for an instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @returns {Promise<Object>} - Health check result
 */
async function triggerHealthCheck(params) {
  try {
    await initializeSwarmController();
    
    // Trigger health check
    const health = await swarmController.triggerHealthCheck(params.instanceId);
    
    return {
      success: true,
      health
    };
  } catch (error) {
    logger.error(`Failed to trigger health check for instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Plan migration of an instance
 * @param {Object} params - Tool parameters
 * @param {string} params.instanceId - Instance ID
 * @param {string} params.targetProvider - Target provider type
 * @param {string} [params.targetRegion] - Target region
 * @param {boolean} [params.force] - Force migration
 * @param {boolean} [params.keepSource] - Keep source instance
 * @param {boolean} [params.startTarget] - Start target instance
 * @returns {Promise<Object>} - Migration plan
 */
async function planMigration(params) {
  try {
    await initializeSwarmController();
    
    // Create migration options
    const options = {
      force: params.force,
      keepSource: params.keepSource,
      startTarget: params.startTarget
    };
    
    // Plan migration
    const plan = await swarmController.planMigration(
      params.instanceId,
      params.targetProvider,
      params.targetRegion,
      options
    );
    
    return {
      success: true,
      plan
    };
  } catch (error) {
    logger.error(`Failed to plan migration for instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Start a migration
 * @param {Object} params - Tool parameters
 * @param {Object} params.plan - Migration plan
 * @returns {Promise<Object>} - Migration ID
 */
async function startMigration(params) {
  try {
    await initializeSwarmController();
    
    // Start migration
    const migrationId = await swarmController.startMigration(params.plan);
    
    return {
      success: true,
      migrationId
    };
  } catch (error) {
    logger.error('Failed to start migration', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get migration status
 * @param {Object} params - Tool parameters
 * @param {string} params.migrationId - Migration ID
 * @returns {Promise<Object>} - Migration status
 */
async function getMigrationStatus(params) {
  try {
    await initializeSwarmController();
    
    // Get migration status
    const status = swarmController.getMigrationStatus(params.migrationId);
    
    if (!status) {
      return {
        success: false,
        error: `Migration ${params.migrationId} not found`
      };
    }
    
    return {
      success: true,
      status
    };
  } catch (error) {
    logger.error(`Failed to get status for migration ${params.migrationId}`, error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cancel a migration
 * @param {Object} params - Tool parameters
 * @param {string} params.migrationId - Migration ID
 * @returns {Promise<Object>} - Result
 */
async function cancelMigration(params) {
  try {
    await initializeSwarmController();
    
    // Cancel migration
    const cancelled = await swarmController.cancelMigration(params.migrationId);
    
    return {
      success: true,
      cancelled,
      message: cancelled ? `Migration ${params.migrationId} cancelled` : `Migration ${params.migrationId} could not be cancelled`
    };
  } catch (error) {
    logger.error(`Failed to cancel migration ${params.migrationId}`, error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get swarm status
 * @returns {Promise<Object>} - Swarm status
 */
async function getSwarmStatus() {
  try {
    await initializeSwarmController();
    
    // Get swarm status
    const status = swarmController.getSwarmStatus();
    
    return {
      success: true,
      status
    };
  } catch (error) {
    logger.error('Failed to get swarm status', error);
    
    return {
      success: false,
      error: error.message
    };
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