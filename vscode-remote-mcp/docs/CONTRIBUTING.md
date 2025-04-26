# Contributing to VSCode Remote MCP

Thank you for your interest in contributing to the VSCode Remote MCP project! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Development Setup

### Prerequisites

- Node.js 14 or later
- npm 6 or later
- Visual Studio Code

### Setting Up the Development Environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/vscode-remote-mcp.git
   cd vscode-remote-mcp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```
   MCP_PORT=3001
   MCP_HOST=localhost
   MCP_AUTH_ENABLED=false
   MCP_LOG_LEVEL=debug
   MCP_MAX_CLIENTS=10
   MCP_TOKEN_EXPIRATION=3600
   ```

   Alternatively, you can set these variables in your environment.

4. **Run the server in development mode**

   ```bash
   node run-mcp-server.js
   ```

5. **Run tests**

   ```bash
   npm test
   ```

## Project Structure

The project is organized as follows:

```
vscode-remote-mcp/
├── config/                  # Configuration files
├── docs/                    # Documentation
├── src/                     # Source code
│   ├── utils/               # Utility functions
│   │   ├── message-validator.js  # Message validation
│   │   ├── connection-manager.js # Connection management
│   │   └── server-manager.js     # Server management
│   └── index.js             # Main entry point
├── tests/                   # Test files
├── run-mcp-server.js        # Server startup script
├── test-mcp-client.js       # Client test script
├── package.json             # Project metadata and dependencies
└── README.md                # Project overview
```

## Coding Guidelines

### Code Style

This project follows JavaScript Standard Style with some modifications:

- Use 2 spaces for indentation
- Use semicolons at the end of statements
- Use single quotes for strings
- Use ES6 features where appropriate
- Add JSDoc comments for all functions and classes

### Naming Conventions

- Use camelCase for variable and function names
- Use PascalCase for class names
- Use UPPER_CASE for constants
- Use descriptive names that reflect the purpose of the variable or function

### Example

```javascript
/**
 * Validates a message against the MCP protocol schema
 * @param {Object} message - The message to validate
 * @returns {boolean} True if the message is valid
 * @throws {Error} If the message is invalid
 */
function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('Message must be an object');
  }
  
  if (!message.type || typeof message.type !== 'string') {
    throw new Error('Message must have a type property of type string');
  }
  
  if (!message.payload || typeof message.payload !== 'object') {
    throw new Error('Message must have a payload property of type object');
  }
  
  return true;
}
```

### Code Quality Tools

The project uses the following tools to ensure code quality:

- **ESLint**: For static code analysis
- **Prettier**: For code formatting
- **Jest**: For testing

Run the linter:

```bash
npm run lint
```

Format your code:

```bash
npm run format
```

## Testing

### Testing Philosophy

The VSCode Remote MCP project follows a test-driven development approach. All new features and bug fixes should include tests that verify the functionality.

### Types of Tests

- **Unit Tests**: Test individual functions and classes in isolation
- **Integration Tests**: Test the interaction between different components
- **End-to-End Tests**: Test the entire system from client to server

### Writing Tests

Tests are written using Jest. Each test file should be placed in the `tests` directory and named with the `.test.js` suffix.

Example test:

```javascript
const { validateMessage } = require('../src/utils/message-validator');

describe('Message Validator', () => {
  test('should validate a valid message', () => {
    const message = {
      type: 'connection',
      payload: {
        clientId: 'test-client',
        workspaceId: 'test-workspace'
      }
    };
    
    expect(() => validateMessage(message)).not.toThrow();
  });
  
  test('should throw an error for a message without a type', () => {
    const message = {
      payload: {
        clientId: 'test-client',
        workspaceId: 'test-workspace'
      }
    };
    
    expect(() => validateMessage(message)).toThrow('Message must have a type property');
  });
});
```

### Running Tests

Run all tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests in watch mode (useful during development):

```bash
npm run test:watch
```

### Test Coverage

The project aims to maintain a test coverage of at least 80%. You can check the current coverage by running:

```bash
npm run test:coverage
```

## Pull Request Process

### Before Creating a Pull Request

1. Ensure your code follows the project's coding guidelines
2. Add or update tests to cover your changes
3. Ensure all tests pass
4. Update documentation if necessary
5. Make sure your code is properly formatted

### Creating a Pull Request

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Commit your changes with a clear and descriptive commit message
5. Push your branch to your fork
6. Create a pull request against the main repository's `main` branch

### Pull Request Template

When creating a pull request, please use the following template:

```markdown
## Description

[Describe the changes you've made]

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

[Describe the tests you ran to verify your changes]

## Checklist:

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Code Review Process

All pull requests will be reviewed by at least one maintainer. The review process may include:

1. Automated checks (linting, tests, etc.)
2. Code review by maintainers
3. Feedback and requested changes
4. Final approval and merge

## Documentation

### Documentation Guidelines

- Keep documentation up-to-date with code changes
- Use clear and concise language
- Include examples where appropriate
- Use Markdown for all documentation files

### API Documentation

When adding or modifying API endpoints, update the [API.md](API.md) file with:

- Message type
- Payload structure
- Example request/response
- Any special considerations

## Issue Reporting

### Bug Reports

When reporting a bug, please include:

1. A clear and descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Environment information (OS, Node.js version, etc.)
6. Any relevant logs or error messages

### Feature Requests

When requesting a feature, please include:

1. A clear and descriptive title
2. A detailed description of the feature
3. The problem it solves
4. Any alternative solutions you've considered
5. Any additional context or screenshots

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.