/**
 * Swarm Management Tools
 * MCP tools for managing the VSCode Remote Swarm system
 */

const { SwarmController } = require('../swarm/swarm-controller');
const { loadSwarmConfigFromEnv } = require('../swarm/config');
const { ProviderFactory } = require('../providers/core/provider-factory');
const { ProviderType } = require('../providers/core/provider-types');
const logger = require('../utils/logger');

// Singleton swarm controller instance
let swarmController = null;

/**
 * Initialize the swarm controller if not already initialized
 * @returns {Promise<SwarmController>} Swarm controller instance
 */
async function getSwarmController() {
  if (!swarmController) {
    try {
      logger.info('Initializing swarm controller for MCP tools');
      
      // Load configuration
      const config = loadSwarmConfigFromEnv();
      
      // Create swarm controller
      swarmController = new SwarmController(config);
      
      // Initialize swarm controller
      await swarmController.initialize();
      
      logger.info('Swarm controller initialized for MCP tools');
    } catch (error) {
      logger.error('Failed to initialize swarm controller for MCP tools', error);
      throw error;
    }
  }
  
  return swarmController;
}

/**
 * Get swarm status
 * @param {Object} params Parameters
 * @returns {Promise<Object>} Swarm status
 */
async function getSwarmStatus(params) {
  try {
    logger.info('MCP tool: get_swarm_status');
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Get swarm status
    const status = await controller.getSwarmStatus();
    
    return {
      success: true,
      status
    };
  } catch (error) {
    logger.error('Failed to get swarm status', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Get provider status
 * @param {Object} params Parameters
 * @param {string} params.providerType Provider type
 * @returns {Promise<Object>} Provider status
 */
async function getProviderStatus(params) {
  try {
    logger.info(`MCP tool: get_provider_status for ${params.providerType}`);
    
    // Validate parameters
    if (!params.providerType) {
      throw new Error('Provider type is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Get provider status
    const status = await controller.getProviderStatus(params.providerType);
    
    return {
      success: true,
      status
    };
  } catch (error) {
    logger.error(`Failed to get provider status for ${params.providerType}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * List instances with filtering
 * @param {Object} params Parameters
 * @param {string} [params.providerType] Provider type filter
 * @param {string} [params.status] Status filter
 * @param {string} [params.region] Region filter
 * @param {string} [params.userId] User ID filter
 * @param {string} [params.namePattern] Name pattern filter
 * @returns {Promise<Object>} List of instances
 */
async function listInstances(params) {
  try {
    logger.info('MCP tool: list_instances with filters', params);
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Create filter from params
    const filter = {
      providerType: params.providerType,
      status: params.status,
      region: params.region,
      userId: params.userId,
      namePattern: params.namePattern
    };
    
    // Remove undefined values
    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined) {
        delete filter[key];
      }
    });
    
    // List instances
    const instances = await controller.listInstances(Object.keys(filter).length > 0 ? filter : undefined);
    
    return {
      success: true,
      instances
    };
  } catch (error) {
    logger.error('Failed to list instances', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Get instance details
 * @param {Object} params Parameters
 * @param {string} params.instanceId Instance ID
 * @returns {Promise<Object>} Instance details
 */
async function getInstance(params) {
  try {
    logger.info(`MCP tool: get_instance for ${params.instanceId}`);
    
    // Validate parameters
    if (!params.instanceId) {
      throw new Error('Instance ID is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Get instance
    const instance = await controller.getInstance(params.instanceId);
    
    if (!instance) {
      throw new Error(`Instance ${params.instanceId} not found`);
    }
    
    return {
      success: true,
      instance
    };
  } catch (error) {
    logger.error(`Failed to get instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Get instance health
 * @param {Object} params Parameters
 * @param {string} params.instanceId Instance ID
 * @returns {Promise<Object>} Instance health
 */
async function getInstanceHealth(params) {
  try {
    logger.info(`MCP tool: get_instance_health for ${params.instanceId}`);
    
    // Validate parameters
    if (!params.instanceId) {
      throw new Error('Instance ID is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Get instance health
    const health = await controller.getInstanceHealth(params.instanceId);
    
    return {
      success: true,
      health
    };
  } catch (error) {
    logger.error(`Failed to get instance health for ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Create a new instance
 * @param {Object} params Parameters
 * @param {string} [params.providerType] Provider type
 * @param {string} [params.name] Instance name
 * @param {Object} [params.resources] Resource configuration
 * @param {Object} [params.metadata] Instance metadata
 * @returns {Promise<Object>} Created instance
 */
async function createInstance(params) {
  try {
    logger.info('MCP tool: create_instance', params);
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Create instance config
    const config = {
      name: params.name,
      resources: params.resources || {},
      metadata: params.metadata || {}
    };
    
    // Create instance
    const instance = await controller.createInstance(
      config,
      params.providerType
    );
    
    return {
      success: true,
      instance
    };
  } catch (error) {
    logger.error('Failed to create instance', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Start an instance
 * @param {Object} params Parameters
 * @param {string} params.instanceId Instance ID
 * @returns {Promise<Object>} Result
 */
async function startInstance(params) {
  try {
    logger.info(`MCP tool: start_instance for ${params.instanceId}`);
    
    // Validate parameters
    if (!params.instanceId) {
      throw new Error('Instance ID is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Start instance
    await controller.startInstance(params.instanceId);
    
    return {
      success: true
    };
  } catch (error) {
    logger.error(`Failed to start instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Stop an instance
 * @param {Object} params Parameters
 * @param {string} params.instanceId Instance ID
 * @returns {Promise<Object>} Result
 */
async function stopInstance(params) {
  try {
    logger.info(`MCP tool: stop_instance for ${params.instanceId}`);
    
    // Validate parameters
    if (!params.instanceId) {
      throw new Error('Instance ID is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Stop instance
    await controller.stopInstance(params.instanceId);
    
    return {
      success: true
    };
  } catch (error) {
    logger.error(`Failed to stop instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Delete an instance
 * @param {Object} params Parameters
 * @param {string} params.instanceId Instance ID
 * @returns {Promise<Object>} Result
 */
async function deleteInstance(params) {
  try {
    logger.info(`MCP tool: delete_instance for ${params.instanceId}`);
    
    // Validate parameters
    if (!params.instanceId) {
      throw new Error('Instance ID is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Delete instance
    await controller.deleteInstance(params.instanceId);
    
    return {
      success: true
    };
  } catch (error) {
    logger.error(`Failed to delete instance ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Plan instance migration
 * @param {Object} params Parameters
 * @param {string} params.instanceId Instance ID
 * @param {string} params.targetProviderType Target provider type
 * @param {string} [params.targetRegion] Target region
 * @param {boolean} [params.force] Force migration
 * @param {boolean} [params.keepSource] Keep source instance
 * @returns {Promise<Object>} Migration plan
 */
async function planMigration(params) {
  try {
    logger.info(`MCP tool: plan_migration for ${params.instanceId} to ${params.targetProviderType}`);
    
    // Validate parameters
    if (!params.instanceId) {
      throw new Error('Instance ID is required');
    }
    
    if (!params.targetProviderType) {
      throw new Error('Target provider type is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Create migration options
    const options = {
      force: params.force === true,
      keepSource: params.keepSource === true
    };
    
    // Plan migration
    const plan = await controller.planMigration(
      params.instanceId,
      params.targetProviderType,
      params.targetRegion,
      options
    );
    
    return {
      success: true,
      plan
    };
  } catch (error) {
    logger.error(`Failed to plan migration for ${params.instanceId}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Start instance migration
 * @param {Object} params Parameters
 * @param {string} params.planId Migration plan ID
 * @returns {Promise<Object>} Migration result
 */
async function startMigration(params) {
  try {
    logger.info(`MCP tool: start_migration for plan ${params.planId}`);
    
    // Validate parameters
    if (!params.planId) {
      throw new Error('Migration plan ID is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Get migration plan
    const plan = await controller.getMigrationPlan(params.planId);
    
    if (!plan) {
      throw new Error(`Migration plan ${params.planId} not found`);
    }
    
    // Start migration
    const migrationId = await controller.startMigration(plan);
    
    return {
      success: true,
      migrationId
    };
  } catch (error) {
    logger.error(`Failed to start migration for plan ${params.planId}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Get migration status
 * @param {Object} params Parameters
 * @param {string} params.migrationId Migration ID
 * @returns {Promise<Object>} Migration status
 */
async function getMigrationStatus(params) {
  try {
    logger.info(`MCP tool: get_migration_status for ${params.migrationId}`);
    
    // Validate parameters
    if (!params.migrationId) {
      throw new Error('Migration ID is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Get migration status
    const status = await controller.getMigrationStatus(params.migrationId);
    
    if (!status) {
      throw new Error(`Migration ${params.migrationId} not found`);
    }
    
    return {
      success: true,
      status
    };
  } catch (error) {
    logger.error(`Failed to get migration status for ${params.migrationId}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Cancel migration
 * @param {Object} params Parameters
 * @param {string} params.migrationId Migration ID
 * @returns {Promise<Object>} Result
 */
async function cancelMigration(params) {
  try {
    logger.info(`MCP tool: cancel_migration for ${params.migrationId}`);
    
    // Validate parameters
    if (!params.migrationId) {
      throw new Error('Migration ID is required');
    }
    
    // Get swarm controller
    const controller = await getSwarmController();
    
    // Cancel migration
    const cancelled = await controller.cancelMigration(params.migrationId);
    
    return {
      success: true,
      cancelled
    };
  } catch (error) {
    logger.error(`Failed to cancel migration ${params.migrationId}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

// Export tools
module.exports = {
  get_swarm_status: getSwarmStatus,
  get_provider_status: getProviderStatus,
  list_swarm_instances: listInstances,
  get_swarm_instance: getInstance,
  get_instance_health: getInstanceHealth,
  create_swarm_instance: createInstance,
  start_swarm_instance: startInstance,
  stop_swarm_instance: stopInstance,
  delete_swarm_instance: deleteInstance,
  plan_instance_migration: planMigration,
  start_instance_migration: startMigration,
  get_migration_status: getMigrationStatus,
  cancel_migration: cancelMigration
};