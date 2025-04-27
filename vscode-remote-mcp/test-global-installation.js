#!/usr/bin/env node

/**
 * Test script for simulating global installation
 * 
 * This script tests the vsc-remote package to ensure it works correctly
 * when installed globally by simulating the global installation environment.
 */

const path = require('path');
const fs = require('fs');

// Simulate global installation by setting environment variables
process.env.NODE_PATH = path.resolve(__dirname);
process.env.MCP_DEBUG = '1';

// Create a temporary global installation helper file
const globalHelperPath = path.join(__dirname, 'vsc-remote', 'global-install-path.js');
const helperContent = `/**
 * Global Installation Path Helper
 * 
 * This file helps the package locate resources when installed globally.
 */

module.exports = {
  installPath: '${path.resolve(__dirname, 'vsc-remote').replace(/\\/g, '\\\\')}',
  isGlobalInstall: true
};`;

fs.writeFileSync(globalHelperPath, helperContent, 'utf8');
console.log(`Created temporary global installation helper at ${globalHelperPath}`);

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
      console.log('Tool execution successful');
      
      // Clean up the temporary file
      fs.unlinkSync(globalHelperPath);
      console.log(`Removed temporary global installation helper`);
      
      console.log('Test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Tool execution failed:', error);
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(globalHelperPath);
        console.log(`Removed temporary global installation helper`);
      } catch (cleanupError) {
        console.error('Failed to clean up temporary file:', cleanupError);
      }
      
      process.exit(1);
    });
} catch (error) {
  console.error('Test failed:', error);
  
  // Clean up the temporary file
  try {
    fs.unlinkSync(globalHelperPath);
    console.log(`Removed temporary global installation helper`);
  } catch (cleanupError) {
    console.error('Failed to clean up temporary file:', cleanupError);
  }
  
  process.exit(1);
}