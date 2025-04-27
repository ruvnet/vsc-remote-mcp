/**
 * MCP Server Mock
 * 
 * This module provides a mock implementation of the VSCodeRemoteMcpServer
 * for testing purposes.
 */

class MockVSCodeRemoteMcpServer {
  constructor() {
    this.serve = jest.fn().mockResolvedValue(undefined);
    this.shutdown = jest.fn().mockResolvedValue(undefined);
    this.setupRequestHandlers = jest.fn();
    this.server = {
      onToolUse: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined)
    };
  }

  // Reset all mocks
  resetAllMocks() {
    this.serve.mockClear();
    this.shutdown.mockClear();
    this.setupRequestHandlers.mockClear();
    this.server.onToolUse.mockClear();
    this.server.connect.mockClear();
    this.server.disconnect.mockClear();
  }
}

module.exports = MockVSCodeRemoteMcpServer;