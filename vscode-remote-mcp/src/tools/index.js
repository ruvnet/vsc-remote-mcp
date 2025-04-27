/**
 * MCP Tools Registry
 * 
 * This file exports all available tools and their schemas.
 */

// Import tools
const analyzeCode = require('./analyze_code');
const modifyCode = require('./modify_code');
const searchCode = require('./search_code');
const deployVSCodeInstance = require('./deploy_vscode_instance');
const listVSCodeInstances = require('./list_vscode_instances');
const stopVSCodeInstance = require('./stop_vscode_instance');
const manageJobResources = require('./manage_job_resources');
const swarmManagement = require('./manage_swarm');

// Tool schemas
const toolSchemas = {
  analyze_code: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file to analyze'
      },
      include_metrics: {
        type: 'boolean',
        description: 'Whether to include complexity metrics',
        default: true
      },
      include_structure: {
        type: 'boolean',
        description: 'Whether to include structure analysis',
        default: true
      },
      include_issues: {
        type: 'boolean',
        description: 'Whether to include potential issues',
        default: true
      }
    },
    required: ['file_path'],
    additionalProperties: false
  },
  
  modify_code: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file to modify'
      },
      operation: {
        type: 'string',
        enum: ['add', 'update', 'remove', 'replace'],
        description: 'Operation to perform'
      },
      position: {
        type: 'object',
        properties: {
          line: {
            type: 'integer',
            description: 'Line number (1-based)'
          },
          column: {
            type: 'integer',
            description: 'Column number (1-based)'
          }
        },
        required: ['line'],
        additionalProperties: false
      },
      content: {
        type: 'string',
        description: 'Content to add or update'
      },
      pattern: {
        type: 'string',
        description: 'Pattern to match for update or remove operations'
      },
      range: {
        type: 'object',
        properties: {
          start_line: {
            type: 'integer',
            description: 'Start line number (1-based)'
          },
          end_line: {
            type: 'integer',
            description: 'End line number (1-based)'
          }
        },
        required: ['start_line', 'end_line'],
        additionalProperties: false
      }
    },
    required: ['file_path', 'operation'],
    additionalProperties: false
  },
  
  search_code: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Pattern to search for'
      },
      directory: {
        type: 'string',
        description: 'Directory to search in',
        default: '.'
      },
      file_pattern: {
        type: 'string',
        description: 'File pattern to match',
        default: '*'
      },
      context_lines: {
        type: 'integer',
        description: 'Number of context lines to include',
        default: 2
      },
      max_results: {
        type: 'integer',
        description: 'Maximum number of results to return',
        default: 100
      },
      ignore_case: {
        type: 'boolean',
        description: 'Whether to ignore case',
        default: false
      },
      use_regex: {
        type: 'boolean',
        description: 'Whether to use regex',
        default: true
      }
    },
    required: ['pattern'],
    additionalProperties: false
  },
  
  deploy_vscode_instance: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Instance name'
      },
      workspace_path: {
        type: 'string',
        description: 'Path to workspace directory'
      },
      port: {
        type: 'integer',
        description: 'Port to expose'
      },
      password: {
        type: 'string',
        description: 'Password for authentication'
      },
      extensions: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Extensions to install'
      },
      cpu_limit: {
        type: 'number',
        description: 'CPU limit'
      },
      memory_limit: {
        type: 'string',
        description: 'Memory limit'
      },
      environment: {
        type: 'object',
        additionalProperties: {
          type: 'string'
        },
        description: 'Environment variables'
      }
    },
    required: ['name', 'workspace_path'],
    additionalProperties: false
  },
  
  list_vscode_instances: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        description: 'Filter instances by name'
      },
      status: {
        type: 'string',
        enum: ['running', 'stopped', 'all'],
        description: 'Filter instances by status',
        default: 'all'
      }
    },
    additionalProperties: false
  },
  
  stop_vscode_instance: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Instance name'
      },
      force: {
        type: 'boolean',
        description: 'Force stop',
        default: false
      }
    },
    required: ['name'],
    additionalProperties: false
  },
  
  manage_job_resources: {
    type: 'object',
    properties: {
      job_id: {
        type: 'string',
        description: 'Job ID'
      },
      operation: {
        type: 'string',
        enum: ['allocate', 'deallocate', 'update', 'status'],
        description: 'Operation to perform'
      },
      resources: {
        type: 'object',
        properties: {
          cpu: {
            type: 'number',
            description: 'CPU allocation'
          },
          memory: {
            type: 'string',
            description: 'Memory allocation'
          },
          disk: {
            type: 'string',
            description: 'Disk allocation'
          }
        },
        additionalProperties: false
      }
    },
    required: ['job_id', 'operation'],
    additionalProperties: false
  }
};

// Add swarm management tool schemas
toolSchemas.manage_swarm_status = {
  type: 'object',
  properties: {},
  additionalProperties: false
};

toolSchemas.manage_swarm_list_instances = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      description: 'Filter by status'
    },
    namePattern: {
      type: 'string',
      description: 'Filter by name pattern'
    },
    createdAfter: {
      type: 'string',
      description: 'Filter by creation date (ISO string)'
    },
    createdBefore: {
      type: 'string',
      description: 'Filter by creation date (ISO string)'
    },
    tags: {
      type: 'object',
      description: 'Filter by tags',
      additionalProperties: {
        type: 'string'
      }
    },
    limit: {
      type: 'number',
      description: 'Maximum number of results'
    },
    offset: {
      type: 'number',
      description: 'Result offset'
    }
  },
  additionalProperties: false
};

toolSchemas.manage_swarm_get_instance = {
  type: 'object',
  properties: {
    instanceId: {
      type: 'string',
      description: 'Instance ID'
    }
  },
  required: ['instanceId'],
  additionalProperties: false
};

toolSchemas.manage_swarm_start_instance = {
  type: 'object',
  properties: {
    instanceId: {
      type: 'string',
      description: 'Instance ID'
    }
  },
  required: ['instanceId'],
  additionalProperties: false
};

toolSchemas.manage_swarm_stop_instance = {
  type: 'object',
  properties: {
    instanceId: {
      type: 'string',
      description: 'Instance ID'
    },
    force: {
      type: 'boolean',
      description: 'Force stop',
      default: false
    }
  },
  required: ['instanceId'],
  additionalProperties: false
};

toolSchemas.manage_swarm_delete_instance = {
  type: 'object',
  properties: {
    instanceId: {
      type: 'string',
      description: 'Instance ID'
    }
  },
  required: ['instanceId'],
  additionalProperties: false
};

toolSchemas.manage_swarm_get_instance_health = {
  type: 'object',
  properties: {
    instanceId: {
      type: 'string',
      description: 'Instance ID'
    }
  },
  required: ['instanceId'],
  additionalProperties: false
};

toolSchemas.manage_swarm_plan_migration = {
  type: 'object',
  properties: {
    instanceId: {
      type: 'string',
      description: 'Instance ID'
    },
    targetProvider: {
      type: 'string',
      description: 'Target provider type'
    },
    targetRegion: {
      type: 'string',
      description: 'Target region'
    },
    options: {
      type: 'object',
      description: 'Migration options',
      properties: {
        force: {
          type: 'boolean',
          description: 'Whether to force migration'
        },
        maxDowntimeMs: {
          type: 'number',
          description: 'Maximum downtime in milliseconds'
        },
        keepSource: {
          type: 'boolean',
          description: 'Whether to keep source instance'
        }
      },
      additionalProperties: false
    }
  },
  required: ['instanceId', 'targetProvider'],
  additionalProperties: false
};

toolSchemas.manage_swarm_start_migration = {
  type: 'object',
  properties: {
    planId: {
      type: 'string',
      description: 'Migration plan ID'
    }
  },
  required: ['planId'],
  additionalProperties: false
};

toolSchemas.manage_swarm_get_migration_status = {
  type: 'object',
  properties: {
    migrationId: {
      type: 'string',
      description: 'Migration ID'
    }
  },
  required: ['migrationId'],
  additionalProperties: false
};

toolSchemas.manage_swarm_cancel_migration = {
  type: 'object',
  properties: {
    migrationId: {
      type: 'string',
      description: 'Migration ID'
    }
  },
  required: ['migrationId'],
  additionalProperties: false
};

// Export tools and schemas
module.exports = {
  tools: {
    analyze_code: analyzeCode,
    modify_code: modifyCode,
    search_code: searchCode,
    deploy_vscode_instance: deployVSCodeInstance,
    list_vscode_instances: listVSCodeInstances,
    stop_vscode_instance: stopVSCodeInstance,
    manage_job_resources: manageJobResources,
    manage_swarm_status: swarmManagement.get_swarm_status,
    manage_swarm_list_instances: swarmManagement.list_swarm_instances,
    manage_swarm_get_instance: swarmManagement.get_swarm_instance,
    manage_swarm_start_instance: swarmManagement.start_swarm_instance,
    manage_swarm_stop_instance: swarmManagement.stop_swarm_instance,
    manage_swarm_delete_instance: swarmManagement.delete_swarm_instance,
    manage_swarm_get_instance_health: swarmManagement.get_instance_health,
    manage_swarm_plan_migration: swarmManagement.plan_migration,
    manage_swarm_start_migration: swarmManagement.start_migration,
    manage_swarm_get_migration_status: swarmManagement.get_migration_status,
    manage_swarm_cancel_migration: swarmManagement.cancel_migration
  },
  toolSchemas
};