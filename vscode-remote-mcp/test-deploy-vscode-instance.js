/**
 * Test script for deploy_vscode_instance tool
 * 
 * This script tests the port availability checking and response format
 * of the deploy_vscode_instance tool.
 */

const deployVSCodeInstance = require('./src/tools/deploy_vscode_instance');
const path = require('path');

async function runTests() {
  console.log('Testing deploy_vscode_instance tool...');
  
  // Test 1: Missing required parameters
  console.log('\nTest 1: Missing required parameters');
  const result1 = await deployVSCodeInstance({});
  console.log('Result:', JSON.stringify(result1, null, 2));
  
  // Test 2: Invalid workspace path
  console.log('\nTest 2: Invalid workspace path');
  const result2 = await deployVSCodeInstance({
    name: 'test-instance',
    workspace_path: '/path/that/does/not/exist'
  });
  console.log('Result:', JSON.stringify(result2, null, 2));
  
  // Test 3: Port conflict simulation
  // We'll use a port that's likely to be in use (like 8080)
  console.log('\nTest 3: Port conflict simulation');
  const result3 = await deployVSCodeInstance({
    name: 'test-instance',
    workspace_path: path.resolve('./workspace'),
    port: 8080 // Commonly used port, likely to be in use
  });
  console.log('Result:', JSON.stringify(result3, null, 2));
  
  // Test 4: Valid parameters with auto port selection
  // This test might actually create a container, so we'll comment it out
  // Uncomment to test actual deployment
  /*
  console.log('\nTest 4: Valid parameters with auto port selection');
  const result4 = await deployVSCodeInstance({
    name: 'test-instance',
    workspace_path: path.resolve('./workspace')
  });
  console.log('Result:', JSON.stringify(result4, null, 2));
  */
}

runTests().catch(error => {
  console.error('Test failed:', error);
});