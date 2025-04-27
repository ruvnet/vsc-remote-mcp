/**
 * Server Startup Tests
 * 
 * This module tests the server startup functionality in both stdio and WebSocket modes.
 */

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    onToolUse: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    // Mock stdio transport methods if needed
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/websocket.js', () => ({
  WebSocketServerTransport: jest.fn().mockImplementation(() => ({
    // Mock WebSocket transport methods if needed
  }))
}));

// Mock the tools
jest.mock('../src/tools', () => require('./mocks/tools'));

// Import the server class
const VSCodeRemoteMcpServer = require('../src/mcp-sdk-server');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { WebSocketServerTransport } = require('@modelcontextprotocol/sdk/server/websocket.js');
const { tools, resetAllMocks } = require('./mocks/tools');

describe('Server Startup', () => {
  // Save original process.env
  const originalEnv = process.env;
  
  // Reset mocks and env before each test
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
    process.env = { ...originalEnv };
    // Clear any MCP-specific env vars
    delete process.env.MCP_MODE;
    delete process.env.MCP_PORT;
    delete process.env.MCP_DEBUG;
  });
  
  // Restore original process.env after all tests
  afterAll(() => {
    process.env = originalEnv;
  });
  
  test('should create server with correct capabilities', () => {
    // Create a new server instance
    const server = new VSCodeRemoteMcpServer();
    
    // Verify the Server constructor was called with correct parameters
    expect(Server).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'sparc2-mcp',
        version: '1.0.0',
      }),
      expect.objectContaining({
        capabilities: {
          tools: {
            analyze_code: true,
            modify_code: true,
            search_code: true,
            deploy_vscode_instance: true,
            list_vscode_instances: true,
            stop_vscode_instance: true,
            manage_job_resources: true
          },
        },
      })
    );
  });
  
  test('should register tool handlers', () => {
    // Create a new server instance
    const server = new VSCodeRemoteMcpServer();
    
    // Get the mock Server instance
    const mockServer = Server.mock.results[0].value;
    
    // Verify onToolUse was called for each tool
    expect(mockServer.onToolUse).toHaveBeenCalledTimes(Object.keys(tools).length);
    
    // Verify onToolUse was called for each specific tool
    Object.keys(tools).forEach(toolName => {
      expect(mockServer.onToolUse).toHaveBeenCalledWith(
        toolName,
        expect.any(Function)
      );
    });
  });
  
  test('should start server in stdio mode by default', async () => {
    // Create a new server instance
    const server = new VSCodeRemoteMcpServer();
    
    // Start the server
    await server.serve();
    
    // Verify StdioServerTransport was used
    expect(StdioServerTransport).toHaveBeenCalledTimes(1);
    
    // Verify WebSocketServerTransport was not used
    expect(WebSocketServerTransport).not.toHaveBeenCalled();
    
    // Verify server.connect was called with the transport
    const mockServer = Server.mock.results[0].value;
    expect(mockServer.connect).toHaveBeenCalledTimes(1);
    expect(mockServer.connect).toHaveBeenCalledWith(
      expect.any(Object) // The StdioServerTransport instance
    );
  });
  
  test('should start server in WebSocket mode when specified', async () => {
    // Set environment variable for WebSocket mode
    process.env.MCP_MODE = 'websocket';
    process.env.MCP_PORT = '4000';
    
    // Create a new server instance
    const server = new VSCodeRemoteMcpServer();
    
    // Start the server
    await server.serve();
    
    // Verify WebSocketServerTransport was used with correct port
    expect(WebSocketServerTransport).toHaveBeenCalledTimes(1);
    expect(WebSocketServerTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: '4000'
      })
    );
    
    // Verify StdioServerTransport was not used
    expect(StdioServerTransport).not.toHaveBeenCalled();
    
    // Verify server.connect was called with the transport
    const mockServer = Server.mock.results[0].value;
    expect(mockServer.connect).toHaveBeenCalledTimes(1);
    expect(mockServer.connect).toHaveBeenCalledWith(
      expect.any(Object) // The WebSocketServerTransport instance
    );
  });
  
  test('should use default port 3001 for WebSocket mode if not specified', async () => {
    // Set environment variable for WebSocket mode without port
    process.env.MCP_MODE = 'websocket';
    
    // Create a new server instance
    const server = new VSCodeRemoteMcpServer();
    
    // Start the server
    await server.serve();
    
    // Verify WebSocketServerTransport was used with default port
    expect(WebSocketServerTransport).toHaveBeenCalledTimes(1);
    expect(WebSocketServerTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 3001
      })
    );
  });
  
  test('should handle server shutdown gracefully', async () => {
    // Create a new server instance
    const server = new VSCodeRemoteMcpServer();
    
    // Start the server
    await server.serve();
    
    // Shutdown the server
    await server.shutdown();
    
    // Verify server.disconnect was called
    const mockServer = Server.mock.results[0].value;
    expect(mockServer.disconnect).toHaveBeenCalledTimes(1);
  });
  
  test('should set up signal handlers for graceful shutdown', async () => {
    // Spy on process.on
    const processOnSpy = jest.spyOn(process, 'on');
    
    // Create a new server instance
    const server = new VSCodeRemoteMcpServer();
    
    // Start the server
    await server.serve();
    
    // Verify process.on was called for SIGINT and SIGTERM
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    
    // Restore the original process.on
    processOnSpy.mockRestore();
  });
});