/**
 * Jest setup file for TypeScript tests
 * 
 * This file is used to configure Jest for TypeScript tests.
 * It's referenced in the jest.config.js file.
 */

// Make TypeScript Jest types available globally
global.jest = jest;
global.expect = expect;
global.describe = describe;
global.it = it;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;