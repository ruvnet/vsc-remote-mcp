/**
 * Test file for modify_code tool
 */


function greet(name) {
  return `Hello, ${name || 'MCP World'}!`;
}


// Export the function
module.exports = greet;