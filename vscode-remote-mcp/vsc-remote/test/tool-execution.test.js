/**
 * Tool Execution Tests
 * 
 * This module tests the execution of tools through CLI adapters.
 */

// Mock the CLI module
jest.mock('../src/cli/index', () => ({
  runTool: jest.fn().mockImplementation((toolName, args) => {
    // Return a mock result based on the tool name
    return Promise.resolve({ success: true, toolName, args });
  }),
  startServer: jest.fn().mockResolvedValue(undefined)
}));

// Mock the tools
jest.mock('../src/tools', () => require('./mocks/tools'));

// Import the CLI module and tool commands
const { runTool } = require('../src/cli/index');
const { executeAnalyzeCodeCommand } = require('../src/cli/commands/analyze-code');
const { executeSearchCodeCommand } = require('../src/cli/commands/search-code');
const { executeModifyCodeCommand } = require('../src/cli/commands/modify-code');
const { executeDeployVSCodeInstanceCommand } = require('../src/cli/commands/deploy-vscode-instance');
const { executeListVSCodeInstancesCommand } = require('../src/cli/commands/list-vscode-instances');
const { executeStopVSCodeInstanceCommand } = require('../src/cli/commands/stop-vscode-instance');
const { executeManageJobResourcesCommand } = require('../src/cli/commands/manage-job-resources');

describe('Tool Execution', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should execute analyze-code command with correct parameters', async () => {
    // Execute the command
    const filePath = 'test.js';
    const options = {
      metrics: true,
      structure: false,
      issues: true
    };
    
    await executeAnalyzeCodeCommand(filePath, options);
    
    // Verify runTool was called with correct parameters
    expect(runTool).toHaveBeenCalledTimes(1);
    expect(runTool).toHaveBeenCalledWith('analyze_code', {
      file_path: filePath,
      include_metrics: true,
      include_structure: false,
      include_issues: true
    });
  });
  
  test('should execute search-code command with correct parameters', async () => {
    // Execute the command
    const pattern = 'function test';
    const options = {
      directory: 'src',
      filePattern: '*.js',
      contextLines: '5',
      maxResults: '10',
      ignoreCase: true,
      regex: true
    };
    
    await executeSearchCodeCommand(pattern, options);
    
    // Verify runTool was called with correct parameters
    expect(runTool).toHaveBeenCalledTimes(1);
    expect(runTool).toHaveBeenCalledWith('search_code', {
      pattern,
      directory: 'src',
      file_pattern: '*.js',
      context_lines: 5, // Should be converted to number
      max_results: 10, // Should be converted to number
      ignore_case: true,
      use_regex: true
    });
  });
  
  test('should execute modify-code command with correct parameters', async () => {
    // Execute the command
    const filePath = 'test.js';
    const options = {
      operation: 'add',
      position: '10,5',
      content: 'console.log("test");',
      pattern: null,
      range: null
    };
    
    await executeModifyCodeCommand(filePath, options);
    
    // Verify runTool was called with correct parameters
    expect(runTool).toHaveBeenCalledTimes(1);
    expect(runTool).toHaveBeenCalledWith('modify_code', {
      file_path: filePath,
      operation: 'add',
      position: {
        line: 10,
        column: 5
      },
      content: 'console.log("test");'
    });
  });
  
  test('should execute modify-code command with range parameter', async () => {
    // Execute the command
    const filePath = 'test.js';
    const options = {
      operation: 'replace',
      position: null,
      content: 'console.log("test");',
      pattern: null,
      range: '5,10'
    };
    
    await executeModifyCodeCommand(filePath, options);
    
    // Verify runTool was called with correct parameters
    expect(runTool).toHaveBeenCalledTimes(1);
    expect(runTool).toHaveBeenCalledWith('modify_code', {
      file_path: filePath,
      operation: 'replace',
      range: {
        start_line: 5,
        end_line: 10
      },
      content: 'console.log("test");'
    });
  });
  
  test('should execute deploy-vscode-instance command with correct parameters', async () => {
    // Execute the command
    const options = {
      name: 'test-instance',
      workspacePath: '/path/to/workspace',
      port: '8080',
      password: 'password123',
      extensions: 'ext1,ext2',
      cpuLimit: '2',
      memoryLimit: '2GB',
      environment: '{"VAR1":"value1","VAR2":"value2"}'
    };
    
    await executeDeployVSCodeInstanceCommand(options);
    
    // Verify runTool was called with correct parameters
    expect(runTool).toHaveBeenCalledTimes(1);
    expect(runTool).toHaveBeenCalledWith('deploy_vscode_instance', {
      name: 'test-instance',
      workspace_path: '/path/to/workspace',
      port: 8080, // Should be converted to number
      password: 'password123',
      extensions: ['ext1', 'ext2'], // Should be converted to array
      cpu_limit: 2, // Should be converted to number
      memory_limit: '2GB',
      environment: {
        VAR1: 'value1',
        VAR2: 'value2'
      } // Should be parsed from JSON string
    });
  });
  
  test('should execute list-vscode-instances command with correct parameters', async () => {
    // Execute the command
    const options = {
      filter: 'test',
      status: 'running'
    };
    
    await executeListVSCodeInstancesCommand(options);
    
    // Verify runTool was called with correct parameters
    expect(runTool).toHaveBeenCalledTimes(1);
    expect(runTool).toHaveBeenCalledWith('list_vscode_instances', {
      filter: 'test',
      status: 'running'
    });
  });
  
  test('should execute stop-vscode-instance command with correct parameters', async () => {
    // Execute the command
    const options = {
      name: 'test-instance',
      force: true
    };
    
    await executeStopVSCodeInstanceCommand(options);
    
    // Verify runTool was called with correct parameters
    expect(runTool).toHaveBeenCalledTimes(1);
    expect(runTool).toHaveBeenCalledWith('stop_vscode_instance', {
      name: 'test-instance',
      force: true
    });
  });
  
  test('should execute manage-job-resources command with correct parameters', async () => {
    // Execute the command
    const jobId = 'job-123';
    const options = {
      operation: 'allocate',
      cpu: '2',
      memory: '2GB',
      disk: '10GB'
    };
    
    await executeManageJobResourcesCommand(jobId, options);
    
    // Verify runTool was called with correct parameters
    expect(runTool).toHaveBeenCalledTimes(1);
    expect(runTool).toHaveBeenCalledWith('manage_job_resources', {
      job_id: jobId,
      operation: 'allocate',
      resources: {
        cpu: 2, // Should be converted to number
        memory: '2GB',
        disk: '10GB'
      }
    });
  });
  
  test('should handle errors during tool execution', async () => {
    // Mock runTool to throw an error
    runTool.mockRejectedValueOnce(new Error('Tool execution failed'));
    
    // Execute the command
    const filePath = 'test.js';
    const options = {
      metrics: true,
      structure: true,
      issues: true
    };
    
    // Expect the command to reject
    await expect(executeAnalyzeCodeCommand(filePath, options)).rejects.toThrow('Tool execution failed');
    
    // Verify runTool was called
    expect(runTool).toHaveBeenCalledTimes(1);
  });
});