# Integration Tests for vsc-remote NPX Package

This directory contains integration tests for the vsc-remote NPX package. These tests verify the end-to-end functionality of the package, including installation, CLI commands, server startup, and tool execution.

## Running the Tests

To run the integration tests, use the following command from the project root:

```bash
cd vsc-remote
npm run test:integration
```

Or run the script directly:

```bash
bash tests/integration/run-integration-tests.sh
```

## Test Coverage

The integration tests cover the following functionality:

1. **Package Installation**
   - Verifies that the package can be installed globally
   - Checks that the package is accessible from the command line

2. **CLI Commands**
   - Tests the help command
   - Tests the version command

3. **Server Startup**
   - Tests server startup in stdio mode
   - Tests server startup in websocket mode

4. **Tool Execution**
   - Tests the analyze-code tool
   - Tests the search-code tool

5. **Error Handling**
   - Tests handling of invalid commands
   - Tests handling of missing required arguments
   - Tests handling of invalid file paths

## Test Files

- `integration-test.js`: The main integration test script
- `run-integration-tests.sh`: Shell script to run the integration tests
- `fix-sdk-imports.js`: Script to fix SDK import paths in the source files
- `test-report.md`: Report of issues found and fixes implemented

## Adding New Tests

To add new tests, follow these steps:

1. Add a new test function to `integration-test.js`
2. Add the test to the `runAllTests` function
3. Run the tests to verify that the new test works correctly

## Troubleshooting

If the tests fail, check the following:

1. Make sure the package is properly installed
2. Check that the SDK import paths are correct
3. Verify that the test environment is set up correctly

For more detailed information, see the test report in `test-report.md`.