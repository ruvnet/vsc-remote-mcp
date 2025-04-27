/**
 * CLI Argument Parsing Tests
 * 
 * This module tests the CLI argument parsing and command routing functionality
 * of the vsc-remote CLI tool.
 */

// Mock the command modules before importing the CLI
jest.mock('../src/cli/commands/start', () => require('./mocks/cli-commands'));
jest.mock('../src/cli/commands/analyze-code', () => require('./mocks/cli-commands'));
jest.mock('../src/cli/commands/search-code', () => require('./mocks/cli-commands'));
jest.mock('../src/cli/commands/modify-code', () => require('./mocks/cli-commands'));
jest.mock('../src/cli/commands/deploy-vscode-instance', () => require('./mocks/cli-commands'));
jest.mock('../src/cli/commands/list-vscode-instances', () => require('./mocks/cli-commands'));
jest.mock('../src/cli/commands/stop-vscode-instance', () => require('./mocks/cli-commands'));
jest.mock('../src/cli/commands/manage-job-resources', () => require('./mocks/cli-commands'));

// Import the mocked command functions
const {
  executeStartCommand,
  executeAnalyzeCodeCommand,
  executeSearchCodeCommand,
  executeModifyCodeCommand,
  executeDeployVSCodeInstanceCommand,
  executeListVSCodeInstancesCommand,
  executeStopVSCodeInstanceCommand,
  executeManageJobResourcesCommand,
  resetAllMocks
} = require('./mocks/cli-commands');

describe('CLI Argument Parsing', () => {
  // Save original process.argv and exit
  const originalArgv = process.argv;
  const originalExit = process.exit;
  
  // Mock process.exit
  beforeAll(() => {
    process.exit = jest.fn();
  });
  
  // Restore original process.argv and exit
  afterAll(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
  });
  
  // Reset mocks before each test
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
    // Reset process.argv to minimal state
    process.argv = ['node', 'vsc-remote'];
  });
  
  test('should route to start command with default options', () => {
    // Set up CLI arguments
    process.argv = ['node', 'vsc-remote', 'start'];
    
    // Load the CLI (this will parse arguments and execute the command)
    jest.isolateModules(() => {
      require('../bin/vsc-remote');
    });
    
    // Verify the start command was called with default options
    expect(executeStartCommand).toHaveBeenCalledTimes(1);
    expect(executeStartCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        debug: undefined,
        port: undefined,
        mode: 'stdio'
      })
    );
  });
  
  test('should route to start command with custom options', () => {
    // Set up CLI arguments
    process.argv = ['node', 'vsc-remote', 'start', '--debug', '--port', '4000', '--mode', 'websocket'];
    
    // Load the CLI
    jest.isolateModules(() => {
      require('../bin/vsc-remote');
    });
    
    // Verify the start command was called with custom options
    expect(executeStartCommand).toHaveBeenCalledTimes(1);
    expect(executeStartCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        debug: true,
        port: '4000',
        mode: 'websocket'
      })
    );
  });
  
  test('should route to analyze-code command', () => {
    // Set up CLI arguments
    process.argv = ['node', 'vsc-remote', 'analyze-code', 'test.js', '--no-metrics'];
    
    // Load the CLI
    jest.isolateModules(() => {
      require('../bin/vsc-remote');
    });
    
    // Verify the analyze-code command was called with correct arguments
    expect(executeAnalyzeCodeCommand).toHaveBeenCalledTimes(1);
    expect(executeAnalyzeCodeCommand).toHaveBeenCalledWith(
      'test.js',
      expect.objectContaining({
        metrics: false
      })
    );
  });
  
  test('should route to search-code command', () => {
    // Set up CLI arguments
    process.argv = ['node', 'vsc-remote', 'search-code', 'pattern', '--directory', 'src', '--ignore-case'];
    
    // Load the CLI
    jest.isolateModules(() => {
      require('../bin/vsc-remote');
    });
    
    // Verify the search-code command was called with correct arguments
    expect(executeSearchCodeCommand).toHaveBeenCalledTimes(1);
    expect(executeSearchCodeCommand).toHaveBeenCalledWith(
      'pattern',
      expect.objectContaining({
        directory: 'src',
        ignoreCase: true
      })
    );
  });
  
  test('should route to modify-code command', () => {
    // Set up CLI arguments
    process.argv = [
      'node', 'vsc-remote', 'modify-code', 'test.js',
      '--operation', 'add',
      '--position', '10,1',
      '--content', 'console.log("test");'
    ];
    
    // Load the CLI
    jest.isolateModules(() => {
      require('../bin/vsc-remote');
    });
    
    // Verify the modify-code command was called with correct arguments
    expect(executeModifyCodeCommand).toHaveBeenCalledTimes(1);
    expect(executeModifyCodeCommand).toHaveBeenCalledWith(
      'test.js',
      expect.objectContaining({
        operation: 'add',
        position: '10,1',
        content: 'console.log("test");'
      })
    );
  });
  
  test('should route to deploy-vscode-instance command', () => {
    // Set up CLI arguments
    process.argv = [
      'node', 'vsc-remote', 'deploy-vscode-instance',
      '--name', 'test-instance',
      '--workspace-path', '/path/to/workspace'
    ];
    
    // Load the CLI
    jest.isolateModules(() => {
      require('../bin/vsc-remote');
    });
    
    // Verify the deploy-vscode-instance command was called with correct arguments
    expect(executeDeployVSCodeInstanceCommand).toHaveBeenCalledTimes(1);
    expect(executeDeployVSCodeInstanceCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-instance',
        workspacePath: '/path/to/workspace'
      })
    );
  });
  
  test('should route to list-vscode-instances command', () => {
    // Set up CLI arguments
    process.argv = ['node', 'vsc-remote', 'list-vscode-instances', '--status', 'running'];
    
    // Load the CLI
    jest.isolateModules(() => {
      require('../bin/vsc-remote');
    });
    
    // Verify the list-vscode-instances command was called with correct arguments
    expect(executeListVSCodeInstancesCommand).toHaveBeenCalledTimes(1);
    expect(executeListVSCodeInstancesCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'running'
      })
    );
  });
  
  test('should route to stop-vscode-instance command', () => {
    // Set up CLI arguments
    process.argv = ['node', 'vsc-remote', 'stop-vscode-instance', '--name', 'test-instance', '--force'];
    
    // Load the CLI
    jest.isolateModules(() => {
      require('../bin/vsc-remote');
    });
    
    // Verify the stop-vscode-instance command was called with correct arguments
    expect(executeStopVSCodeInstanceCommand).toHaveBeenCalledTimes(1);
    expect(executeStopVSCodeInstanceCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-instance',
        force: true
      })
    );
  });
  
  test('should route to manage-job-resources command', () => {
    // Set up CLI arguments
    process.argv = [
      'node', 'vsc-remote', 'manage-job-resources', 'job-123',
      '--operation', 'allocate',
      '--cpu', '2',
      '--memory', '2GB'
    ];
    
    // Load the CLI
    jest.isolateModules(() => {
      require('../bin/vsc-remote');
    });
    
    // Verify the manage-job-resources command was called with correct arguments
    expect(executeManageJobResourcesCommand).toHaveBeenCalledTimes(1);
    expect(executeManageJobResourcesCommand).toHaveBeenCalledWith(
      'job-123',
      expect.objectContaining({
        operation: 'allocate',
        cpu: '2',
        memory: '2GB'
      })
    );
  });
});