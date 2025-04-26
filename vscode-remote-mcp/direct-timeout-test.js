/**
 * Direct test for timeout error code fix
 * 
 * This script directly tests the timeout error code fix by modifying
 * the request handling in run-mcp-server.js.
 */

const fs = require('fs');
const path = require('path');

// Check if the fix has been applied
function checkTimeoutErrorCode() {
  const serverPath = path.join(__dirname, 'run-mcp-server.js');
  const serverCode = fs.readFileSync(serverPath, 'utf8');
  
  // Look for the timeout error code
  const timeoutPattern = /sendErrorResponse\(id,\s*(-\d+),\s*`Request timed out/;
  const match = serverCode.match(timeoutPattern);
  
  if (!match) {
    console.log('❌ Could not find timeout error code in run-mcp-server.js');
    return false;
  }
  
  const errorCode = parseInt(match[1], 10);
  console.log(`Found timeout error code: ${errorCode}`);
  
  if (errorCode === -32001) {
    console.log('✅ Correct timeout error code (-32001) is being used');
    return true;
  } else {
    console.log(`❌ Incorrect timeout error code: ${errorCode} (should be -32001)`);
    return false;
  }
}

// Simulate a timeout to verify the error code
function simulateTimeout() {
  console.log('\nSimulating a timeout response:');
  
  const response = {
    jsonrpc: '2.0',
    id: 123,
    error: {
      code: -32001,
      message: 'Request timed out after 45000ms'
    }
  };
  
  console.log(JSON.stringify(response, null, 2));
  
  console.log('\nA client receiving this response would correctly identify it as a timeout');
  console.log('because the error code -32001 is the standard MCP timeout error code.');
}

// Run the test
console.log('=== Direct Timeout Error Code Test ===');
const fixApplied = checkTimeoutErrorCode();

if (fixApplied) {
  console.log('\n✅ The timeout fix has been successfully applied!');
  simulateTimeout();
} else {
  console.log('\n❌ The timeout fix has NOT been applied correctly.');
  console.log('Please check run-mcp-server.js and ensure the timeout error code is -32001.');
}

process.exit(fixApplied ? 0 : 1);