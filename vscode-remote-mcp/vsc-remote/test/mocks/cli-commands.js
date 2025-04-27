/**
 * CLI Commands Mocks
 * 
 * This module provides mock implementations of CLI command execution functions
 * for testing purposes.
 */

// Mock command execution functions
const executeStartCommand = jest.fn().mockResolvedValue({ success: true });
const executeAnalyzeCodeCommand = jest.fn().mockResolvedValue({ success: true });
const executeSearchCodeCommand = jest.fn().mockResolvedValue({ success: true });
const executeModifyCodeCommand = jest.fn().mockResolvedValue({ success: true });
const executeDeployVSCodeInstanceCommand = jest.fn().mockResolvedValue({ success: true });
const executeListVSCodeInstancesCommand = jest.fn().mockResolvedValue({ success: true });
const executeStopVSCodeInstanceCommand = jest.fn().mockResolvedValue({ success: true });
const executeManageJobResourcesCommand = jest.fn().mockResolvedValue({ success: true });

// Reset all mocks
function resetAllMocks() {
  executeStartCommand.mockClear();
  executeAnalyzeCodeCommand.mockClear();
  executeSearchCodeCommand.mockClear();
  executeModifyCodeCommand.mockClear();
  executeDeployVSCodeInstanceCommand.mockClear();
  executeListVSCodeInstancesCommand.mockClear();
  executeStopVSCodeInstanceCommand.mockClear();
  executeManageJobResourcesCommand.mockClear();
}

module.exports = {
  executeStartCommand,
  executeAnalyzeCodeCommand,
  executeSearchCodeCommand,
  executeModifyCodeCommand,
  executeDeployVSCodeInstanceCommand,
  executeListVSCodeInstancesCommand,
  executeStopVSCodeInstanceCommand,
  executeManageJobResourcesCommand,
  resetAllMocks
};