/**
 * Tools Mocks
 * 
 * This module provides mock implementations of MCP tools
 * for testing purposes.
 */

// Mock tool implementations
const analyze_code = jest.fn().mockResolvedValue({
  success: true,
  metrics: { complexity: 5, lines: 100 },
  structure: { functions: 10, classes: 2 },
  issues: [{ type: 'warning', message: 'Unused variable', line: 42 }]
});

const search_code = jest.fn().mockResolvedValue({
  success: true,
  matches: [
    { file: 'test.js', line: 10, content: 'const test = "test";', context: ['// Context line'] }
  ]
});

const modify_code = jest.fn().mockResolvedValue({
  success: true,
  modified: true,
  file: 'test.js'
});

const deploy_vscode_instance = jest.fn().mockResolvedValue({
  success: true,
  instance: { id: 'test-instance', status: 'running' }
});

const list_vscode_instances = jest.fn().mockResolvedValue({
  success: true,
  instances: [
    { id: 'test-instance-1', status: 'running' },
    { id: 'test-instance-2', status: 'stopped' }
  ]
});

const stop_vscode_instance = jest.fn().mockResolvedValue({
  success: true,
  instance: { id: 'test-instance', status: 'stopped' }
});

const manage_job_resources = jest.fn().mockResolvedValue({
  success: true,
  job: { id: 'test-job', resources: { cpu: 2, memory: '2GB' } }
});

// Tool schemas (simplified for testing)
const toolSchemas = {
  analyze_code: { type: 'object', properties: {} },
  search_code: { type: 'object', properties: {} },
  modify_code: { type: 'object', properties: {} },
  deploy_vscode_instance: { type: 'object', properties: {} },
  list_vscode_instances: { type: 'object', properties: {} },
  stop_vscode_instance: { type: 'object', properties: {} },
  manage_job_resources: { type: 'object', properties: {} }
};

// Export tools and schemas
const tools = {
  analyze_code,
  search_code,
  modify_code,
  deploy_vscode_instance,
  list_vscode_instances,
  stop_vscode_instance,
  manage_job_resources
};

// Reset all mocks
function resetAllMocks() {
  analyze_code.mockClear();
  search_code.mockClear();
  modify_code.mockClear();
  deploy_vscode_instance.mockClear();
  list_vscode_instances.mockClear();
  stop_vscode_instance.mockClear();
  manage_job_resources.mockClear();
}

module.exports = {
  tools,
  toolSchemas,
  resetAllMocks
};