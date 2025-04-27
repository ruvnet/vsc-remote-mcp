#!/usr/bin/env node

/**
 * Test script for global installation
 * 
 * This script tests the vsc-remote package to ensure it works correctly
 * when installed globally, with proper error handling and path resolution.
 */

// Set debug mode for verbose output during testing
process.env.MCP_DEBUG = '1';

// Import the package
try {
  const VSCodeRemoteMcpServer = require('./vsc-remote/src/mcp-sdk-server');
  console.log('Successfully imported VSCodeRemoteMcpServer');
  
  // Create a server instance
  const server = new VSCodeRemoteMcpServer({
    mode: 'stdio',
    debug: true
  });
  
  console.log('Successfully created server instance');
  
  // Test importing tools
  const { tools, toolSchemas } = require('./vsc-remote/src/tools');
  console.log('Successfully imported tools');
  console.log(`Available tools: ${Object.keys(tools).join(', ')}`);
  
  // Test a tool
  console.log('Testing analyze_code tool...');
  tools.analyze_code({ file_path: __filename })
    .then(result => {
      console.log('Tool execution successful:', result);
      console.log('Test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Tool execution failed:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Test failed:', error);
  process.exit(1);
}