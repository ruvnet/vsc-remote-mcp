#!/usr/bin/env node
/**
 * Verify Package Script
 * 
 * This script performs pre-publishing checks to ensure the package is ready for npm.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const packageJson = require('../package.json');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Log with color
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Log success message
function success(message) {
  log(`✓ ${message}`, colors.green);
}

// Log warning message
function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Log error message
function error(message) {
  log(`✗ ${message}`, colors.red);
}

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

// Check if a directory exists
function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// Run a command and return the output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (err) {
    error(`Command failed: ${command}`);
    error(err.message);
    return null;
  }
}

// Main verification function
async function verifyPackage() {
  log('\n🔍 Verifying package before publishing...', colors.cyan);
  
  let hasErrors = false;
  
  // Check package.json
  log('\n📦 Checking package.json...', colors.blue);
  
  // Check name
  if (!packageJson.name) {
    error('Package name is missing');
    hasErrors = true;
  } else {
    success(`Package name: ${packageJson.name}`);
  }
  
  // Check version
  if (!packageJson.version) {
    error('Package version is missing');
    hasErrors = true;
  } else {
    success(`Package version: ${packageJson.version}`);
  }
  
  // Check description
  if (!packageJson.description) {
    warning('Package description is missing');
  } else {
    success(`Package has a description`);
  }
  
  // Check main entry point
  if (!packageJson.main) {
    error('Main entry point is missing');
    hasErrors = true;
  } else if (!fileExists(path.join(__dirname, '..', packageJson.main))) {
    error(`Main entry point file not found: ${packageJson.main}`);
    hasErrors = true;
  } else {
    success(`Main entry point: ${packageJson.main}`);
  }
  
  // Check bin entry
  if (!packageJson.bin) {
    error('Bin entry is missing');
    hasErrors = true;
  } else {
    const binFile = typeof packageJson.bin === 'string' 
      ? packageJson.bin 
      : packageJson.bin[packageJson.name];
    
    if (!binFile) {
      error('Bin file is missing');
      hasErrors = true;
    } else if (!fileExists(path.join(__dirname, '..', binFile))) {
      error(`Bin file not found: ${binFile}`);
      hasErrors = true;
    } else {
      success(`Bin file: ${binFile}`);
    }
  }
  
  // Check required files
  log('\n📄 Checking required files...', colors.blue);
  
  const requiredFiles = [
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    '.npmignore'
  ];
  
  for (const file of requiredFiles) {
    if (!fileExists(path.join(__dirname, '..', file))) {
      error(`Required file not found: ${file}`);
      hasErrors = true;
    } else {
      success(`Found ${file}`);
    }
  }
  
  // Check dependencies
  log('\n🔗 Checking dependencies...', colors.blue);
  
  if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
    warning('No dependencies found');
  } else {
    success(`Found ${Object.keys(packageJson.dependencies).length} dependencies`);
  }
  
  // Check scripts
  log('\n📜 Checking scripts...', colors.blue);
  
  const requiredScripts = ['test', 'lint', 'build'];
  
  for (const script of requiredScripts) {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      warning(`Script not found: ${script}`);
    } else {
      success(`Found script: ${script}`);
    }
  }
  
  // Run npm pack dry run
  log('\n📦 Running npm pack dry run...', colors.blue);
  
  const packOutput = runCommand('npm pack --dry-run');
  if (packOutput) {
    success('npm pack dry run successful');
    log(packOutput, colors.white);
  } else {
    error('npm pack dry run failed');
    hasErrors = true;
  }
  
  // Final result
  log('\n🏁 Verification complete!', colors.cyan);
  
  if (hasErrors) {
    error('Package has errors that need to be fixed before publishing');
    process.exit(1);
  } else {
    success('Package is ready for publishing');
  }
}

// Run the verification
verifyPackage().catch(err => {
  error(`Verification failed: ${err.message}`);
  process.exit(1);
});