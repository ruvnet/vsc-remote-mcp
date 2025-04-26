/**
 * A simple function to test Roo's capabilities
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} - Sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * This function needs optimization
 */
function inefficientFunction() {
  let result = 0;
  for (let i = 0; i < 1000; i++) {
    for (let j = 0; j < 1000; j++) {
      result += i * j;
    }
  }
  return result;
}

// This code has a bug
function buggyFunction(arr) {
  let sum = 0;
  for (let i = 0; i <= arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

// This function needs documentation
function undocumentedFunction(x, y, z) {
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    throw new Error('All parameters must be numbers');
  }
  
  const result = Math.sqrt(x * x + y * y + z * z);
  return result.toFixed(2);
}

module.exports = {
  add,
  inefficientFunction,
  buggyFunction,
  undocumentedFunction
};
