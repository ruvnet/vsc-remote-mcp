/**
 * Run Jest tests individually
 * 
 * This script runs each Jest test file individually to isolate test execution
 * and prevent interference between tests.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert fs functions to Promise-based
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test results tracking
const results = {
  passed: [],
  failed: [],
  skipped: []
};

/**
 * Find all test files recursively in a directory
 * @param {string} dir - Directory to search
 * @param {RegExp} pattern - Pattern to match test files
 * @returns {Promise<string[]>} - Array of test file paths
 */
async function findTestFiles(dir, pattern) {
  const files = await readdir(dir);
  const testFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      const nestedFiles = await findTestFiles(filePath, pattern);
      testFiles.push(...nestedFiles);
    } else if (pattern.test(file)) {
      testFiles.push(filePath);
    }
  }

  return testFiles;
}

/**
 * Run a single Jest test file
 * @param {string} testFile - Path to test file
 * @returns {Promise<boolean>} - True if test passed, false otherwise
 */
function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`${colors.bright}${colors.cyan}Running test: ${colors.yellow}${path.basename(testFile)}${colors.reset}`);
    console.log(`${colors.dim}${'-'.repeat(80)}${colors.reset}`);

    const jest = spawn('npx', ['jest', testFile, '--config', path.join(__dirname, 'jest.config.js')]);
    
    let output = '';
    
    jest.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    jest.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(text);
    });
    
    jest.on('close', (code) => {
      console.log(`${colors.dim}${'-'.repeat(80)}${colors.reset}`);
      
      if (code === 0) {
        console.log(`${colors.green}✓ Test passed: ${path.basename(testFile)}${colors.reset}`);
        results.passed.push(path.basename(testFile));
        resolve(true);
      } else {
        console.log(`${colors.red}✗ Test failed: ${path.basename(testFile)}${colors.reset}`);
        results.failed.push(path.basename(testFile));
        resolve(false);
      }
    });
  });
}

/**
 * Print test summary
 */
function printSummary() {
  console.log(`\n${colors.bright}${colors.white}Test Summary:${colors.reset}`);
  console.log(`${colors.dim}${'-'.repeat(80)}${colors.reset}`);
  
  console.log(`${colors.green}Passed: ${results.passed.length} tests${colors.reset}`);
  results.passed.forEach(test => console.log(`  ${colors.green}✓ ${test}${colors.reset}`));
  
  console.log(`${colors.red}Failed: ${results.failed.length} tests${colors.reset}`);
  results.failed.forEach(test => console.log(`  ${colors.red}✗ ${test}${colors.reset}`));
  
  console.log(`${colors.yellow}Skipped: ${results.skipped.length} tests${colors.reset}`);
  results.skipped.forEach(test => console.log(`  ${colors.yellow}- ${test}${colors.reset}`));
  
  console.log(`${colors.dim}${'-'.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.white}Total: ${results.passed.length + results.failed.length + results.skipped.length} tests${colors.reset}`);
}

/**
 * Main function to run all tests individually
 */
async function main() {
  try {
    console.log(`${colors.bright}${colors.white}Running Jest tests individually...${colors.reset}`);
    
    // Find all test files
    const testsDir = path.join(__dirname, 'tests');
    const testPattern = /\.test\.js$/;
    const testFiles = await findTestFiles(testsDir, testPattern);
    
    console.log(`${colors.bright}${colors.white}Found ${testFiles.length} test files${colors.reset}`);
    
    // Run each test file individually
    for (const testFile of testFiles) {
      await runTest(testFile);
    }
    
    // Print summary
    printSummary();
    
    // Exit with error code if any tests failed
    if (results.failed.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the main function
main();