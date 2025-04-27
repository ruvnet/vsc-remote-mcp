# VSC-Remote Tests

This directory contains tests for the vsc-remote NPX package. The tests are written using Jest and focus on unit testing the core functionality of the package.

## Test Structure

The tests are organized into the following files:

- `cli-argument-parsing.test.js`: Tests for CLI argument parsing and command routing
- `server-startup.test.js`: Tests for server startup in both stdio and WebSocket modes
- `tool-execution.test.js`: Tests for tool execution through CLI adapters

## Mocks

The `mocks` directory contains mock implementations of various components used in the tests:

- `cli-commands.js`: Mocks for CLI command execution functions
- `mcp-server.js`: Mock for the VSCodeRemoteMcpServer class
- `tools.js`: Mocks for MCP tools

## Running Tests

To run the tests, use the following command from the vsc-remote directory:

```bash
npm test
```

This will run all tests and generate a coverage report.

To run a specific test file, use:

```bash
npx jest test/cli-argument-parsing.test.js
```

## Test Coverage

The tests aim to cover the following aspects of the vsc-remote package:

### CLI Argument Parsing and Command Routing

- Verifies that the CLI correctly parses command-line arguments
- Ensures that commands are routed to the appropriate execution functions
- Tests that options are correctly passed to the execution functions

### Server Startup

- Tests server initialization with correct capabilities
- Verifies server startup in stdio mode
- Verifies server startup in WebSocket mode with custom port
- Tests graceful shutdown functionality

### Tool Execution

- Tests that CLI adapters correctly transform command options to tool parameters
- Verifies that tools are executed with the correct parameters
- Tests error handling during tool execution

## Adding New Tests

When adding new functionality to the vsc-remote package, please add corresponding tests to maintain test coverage. Follow these guidelines:

1. Create a new test file if the functionality doesn't fit into existing test categories
2. Add mocks for any new dependencies in the `mocks` directory
3. Use Jest's mocking capabilities to isolate the code being tested
4. Ensure that tests are independent and don't rely on external state

## Test Configuration

The Jest configuration is defined in `jest.config.js` in the root of the vsc-remote directory. The configuration includes:

- Test matching patterns
- Coverage reporting
- Test environment
- Timeout settings

## Continuous Integration

These tests are run as part of the CI/CD pipeline to ensure that changes to the codebase don't break existing functionality.