#!/usr/bin/env node

/**
 * Script to compile TypeScript files before running the MCP server
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if TypeScript is installed
try {
  console.log('Checking TypeScript installation...');
  execSync('npx tsc --version', { stdio: 'inherit' });
} catch (error) {
  console.error('TypeScript is not installed. Installing...');
  try {
    execSync('npm install --save-dev typescript', { stdio: 'inherit' });
  } catch (installError) {
    console.error('Failed to install TypeScript:', installError.message);
    process.exit(1);
  }
}

// Compile TypeScript files
console.log('Compiling TypeScript files...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('TypeScript compilation completed successfully.');
} catch (error) {
  console.error('Failed to compile TypeScript files:', error.message);
  process.exit(1);
}

// Check if build directory exists and contains the required files
const buildDir = path.resolve(__dirname, 'build');
const swarmControllerPath = path.resolve(buildDir, 'swarm/swarm-controller.js');
const providerTypesPath = path.resolve(buildDir, 'providers/core/provider-types.js');

if (!fs.existsSync(swarmControllerPath)) {
  console.error(`Error: ${swarmControllerPath} not found after compilation`);
  process.exit(1);
}

if (!fs.existsSync(providerTypesPath)) {
  console.error(`Error: ${providerTypesPath} not found after compilation`);
  process.exit(1);
}

console.log('Build directory verified. TypeScript files compiled successfully.');