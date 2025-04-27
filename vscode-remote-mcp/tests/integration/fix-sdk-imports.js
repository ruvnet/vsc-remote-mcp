#!/usr/bin/env node

/**
 * Fix SDK Imports
 * 
 * This script fixes the import statements in the MCP SDK server files to use the correct paths.
 */

const fs = require('fs');
const path = require('path');

// Paths to files that need to be fixed
const filesToFix = [
  path.join(__dirname, '../../vsc-remote/src/mcp-sdk-server.js'),
  path.join(__dirname, '../../vsc-remote/src/index.js'),
  path.join(__dirname, '../../vsc-remote/src/cli/index.js'),
  // Add any other files that might import the SDK
];

console.log('Starting SDK import fixes...');

// Process each file
filesToFix.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`Fixing imports in ${filePath}...`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the import statements
  content = content.replace(
    /const \{ Server \} = require\('@modelcontextprotocol\/sdk'\);/g,
    "const { Server } = require('@modelcontextprotocol/sdk/dist/cjs/server');"
  );
  
  content = content.replace(
    /const \{ StdioServerTransport \} = require\('@modelcontextprotocol\/sdk'\);/g,
    "const { StdioServerTransport } = require('@modelcontextprotocol/sdk/dist/cjs/server/stdio');"
  );
  
  content = content.replace(
    /const \{ WebSocketServerTransport \} = require\('@modelcontextprotocol\/sdk'\);/g,
    "const { WebSocketServerTransport } = require('@modelcontextprotocol/sdk/dist/cjs/server/websocket');"
  );
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log(`Fixed imports in ${filePath}`);
});

console.log('All imports fixed successfully');