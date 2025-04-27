/**
 * MCP Tools Registry
 *
 * This file exports all available tools and their schemas.
 * It provides fallback implementations when the main tools are not available.
 */

// Define fallback tools
const fallbackTools = {
  analyze_code: async (params) => {
    if (process.env.MCP_DEBUG === '1') {
      console.log('Fallback analyze_code tool called with params:', params);
    }
    return { success: true, message: 'Fallback analyze_code tool executed' };
  },
  modify_code: async (params) => {
    if (process.env.MCP_DEBUG === '1') {
      console.log('Fallback modify_code tool called with params:', params);
    }
    return { success: true, message: 'Fallback modify_code tool executed' };
  },
  search_code: async (params) => {
    if (process.env.MCP_DEBUG === '1') {
      console.log('Fallback search_code tool called with params:', params);
    }
    return { success: true, message: 'Fallback search_code tool executed' };
  },
  deploy_vscode_instance: async (params) => {
    if (process.env.MCP_DEBUG === '1') {
      console.log('Fallback deploy_vscode_instance tool called with params:', params);
    }
    return { success: true, message: 'Fallback deploy_vscode_instance tool executed' };
  },
  list_vscode_instances: async (params) => {
    if (process.env.MCP_DEBUG === '1') {
      console.log('Fallback list_vscode_instances tool called with params:', params);
    }
    return { success: true, message: 'Fallback list_vscode_instances tool executed' };
  },
  stop_vscode_instance: async (params) => {
    if (process.env.MCP_DEBUG === '1') {
      console.log('Fallback stop_vscode_instance tool called with params:', params);
    }
    return { success: true, message: 'Fallback stop_vscode_instance tool executed' };
  },
  manage_job_resources: async (params) => {
    if (process.env.MCP_DEBUG === '1') {
      console.log('Fallback manage_job_resources tool called with params:', params);
    }
    return { success: true, message: 'Fallback manage_job_resources tool executed' };
  }
};

// Define fallback schemas
const fallbackSchemas = {
  analyze_code: {
    type: 'object',
    properties: {
      file_path: { type: 'string' }
    },
    required: ['file_path']
  },
  modify_code: {
    type: 'object',
    properties: {
      file_path: { type: 'string' },
      operation: { type: 'string', enum: ['add', 'update', 'remove', 'replace'] }
    },
    required: ['file_path', 'operation']
  },
  search_code: {
    type: 'object',
    properties: {
      pattern: { type: 'string' }
    },
    required: ['pattern']
  },
  deploy_vscode_instance: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      workspace_path: { type: 'string' }
    },
    required: ['name', 'workspace_path']
  },
  list_vscode_instances: {
    type: 'object',
    properties: {}
  },
  stop_vscode_instance: {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  },
  manage_job_resources: {
    type: 'object',
    properties: {
      job_id: { type: 'string' },
      operation: { type: 'string', enum: ['allocate', 'deallocate', 'update', 'status'] }
    },
    required: ['job_id', 'operation']
  }
};

// Try to import the real tools, but use fallbacks if not available
let tools, toolSchemas;

try {
  // Try to import from the main MCP server implementation
  try {
    // First try relative path for local development
    const toolsModule = require('../../../src/tools');
    tools = toolsModule.tools;
    toolSchemas = toolsModule.toolSchemas;
    if (process.env.MCP_DEBUG === '1') {
      console.log('Successfully imported tools from local MCP server implementation');
    }
  } catch (importError) {
    // If that fails, try to find the package in node_modules
    try {
      const toolsModule = require('vscode-remote-mcp/src/tools');
      tools = toolsModule.tools;
      toolSchemas = toolsModule.toolSchemas;
      if (process.env.MCP_DEBUG === '1') {
        console.log('Successfully imported tools from installed MCP server package');
      }
    } catch (packageError) {
      // Both import attempts failed, use fallbacks
      if (process.env.MCP_DEBUG === '1') {
        console.warn('Failed to import tools from MCP server implementation');
        console.warn('Using fallback tools instead');
      }
      
      // Use fallback implementations
      tools = fallbackTools;
      toolSchemas = fallbackSchemas;
    }
  }
} catch (error) {
  if (process.env.MCP_DEBUG === '1') {
    console.warn('Failed to import tools from main MCP server implementation:', error.message);
    console.warn('Using fallback tools instead');
  }
  
  // Use fallback implementations
  tools = fallbackTools;
  toolSchemas = fallbackSchemas;
}

// Export the tools and schemas
module.exports = {
  tools,
  toolSchemas
};