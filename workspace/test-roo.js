// This is a test file for the Roo extension
console.log("Hello from the VS Code Server with Roo extension!");

/**
 * A simple function to test Roo's code analysis capabilities
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} - Sum of a and b
 */
function add(a, b) {
  return a + b;
}

// Test the function
const result = add(5, 7);
console.log(`The result is: ${result}`);

// This file can be used to test if Roo can analyze and provide suggestions
// for JavaScript code running in the remote VS Code instance.