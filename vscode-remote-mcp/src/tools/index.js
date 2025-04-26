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

// Export tools and schemas
module.exports = {
  tools: {
    analyze_code: analyzeCode,
    modify_code: modifyCode,
    search_code: searchCode,
    deploy_vscode_instance: deployVSCodeInstance,
    list_vscode_instances: listVSCodeInstances,
    stop_vscode_instance: stopVSCodeInstance,
    manage_job_resources: manageJobResources
  },
  toolSchemas
};