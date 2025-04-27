# Testing in vscode-remote-mcp

This directory contains tests for the vscode-remote-mcp project. The project supports both JavaScript and TypeScript tests.

## Test Structure

- Tests are organized by module in subdirectories
- Both `.js` and `.ts` test files are supported
- TypeScript tests use ts-jest for compilation and execution

## Running Tests

You can run tests using the following npm scripts:

```bash
# Run all tests (both JS and TS)
npm test

# Run only JavaScript tests
npm run test:js

# Run only TypeScript tests
npm run test:ts

# Run SDK tests
npm run test:sdk
```

## Setting Up TypeScript Tests

If you're adding new TypeScript tests, make sure you have the required dependencies:

```bash
# Install TypeScript testing dependencies
npm run setup:test
```

This will install:
- `@types/jest` - TypeScript type definitions for Jest
- `ts-jest` - TypeScript preprocessor for Jest
- `@babel/preset-typescript` - Babel preset for TypeScript

## Test Configuration

The Jest configuration is in `jest.config.js` at the project root. It's set up to:

1. Transform JavaScript files with babel-jest
2. Transform TypeScript files with ts-jest
3. Collect coverage information
4. Use the Node.js test environment
5. Load setup files that provide global Jest functions

## Writing TypeScript Tests

When writing TypeScript tests:

1. Import the necessary types from the modules you're testing
2. Use the reference directive `/// <reference types="jest" />` at the top of your test file
3. Use standard Jest functions (`describe`, `it`, `expect`, etc.)
4. Mock dependencies using `jest.mock()`

Example:

```typescript
/**
 * Example TypeScript test
 */

/// <reference types="jest" />

import { MyModule } from '../../src/my-module';

describe('MyModule', () => {
  it('should do something', () => {
    const result = MyModule.doSomething();
    expect(result).toBe(true);
  });
});
```

## Troubleshooting

If you encounter issues with TypeScript tests:

1. Make sure you have all required dependencies installed
2. Check that your tsconfig.json includes the test directory
3. Verify that Jest is configured correctly for TypeScript
4. Try running tests with the `--no-cache` flag to clear Jest's cache