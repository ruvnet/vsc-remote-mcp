# Contributing to VSC-Remote

Thank you for your interest in contributing to the VSC-Remote project! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Release Process](#release-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Development Setup

### Prerequisites

- Node.js 14 or later
- npm 6 or later
- Docker (for VSCode instance deployment features)
- Git

### Setting Up the Development Environment

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/yourusername/vsc-remote.git
   cd vsc-remote
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```
   MCP_DEBUG=1
   MCP_MODE=stdio
   MCP_PORT=3001
   MCP_LOG_LEVEL=debug
   MCP_VSCODE_INSTANCES_DIR=./vscode-instances
   ```

4. **Run the CLI in development mode**

   ```bash
   # Run the CLI directly
   node bin/vsc-remote.js --help
   
   # Or use npm script
   npm start -- --help
   ```

5. **Run tests**

   ```bash
   npm test
   ```

## Project Structure

The VSC-Remote project follows this structure:

```
vsc-remote/
├── bin/                      # Binary executable files
│   └── vsc-remote.js         # Main CLI entry point
├── src/
│   ├── cli/                  # CLI-specific code
│   │   ├── index.js          # CLI command router
│   │   ├── commands/         # Command implementations
│   │   └── utils/            # CLI utilities
│   ├── config/               # Configuration
│   ├── tools/                # MCP tools implementation
│   └── utils/                # Utility functions
├── test/                     # Tests
├── docs/                     # Documentation
├── package.json              # Package configuration
├── README.md                 # Documentation
└── LICENSE                   # License file
```

### Key Components

- **bin/vsc-remote.js**: The main entry point for the CLI, handling command-line arguments and routing to the appropriate commands.
- **src/cli/index.js**: Implements the CLI functionality, including the server start command and tool execution.
- **src/mcp-sdk-server.js**: The MCP server implementation that supports both stdio and WebSocket modes.
- **src/tools/**: Contains the implementation of each tool (analyze_code, search_code, etc.).

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
 * Executes a tool with the given name and arguments
 * @param {string} toolName - The name of the tool to execute
 * @param {Object} args - The arguments for the tool
 * @returns {Promise<Object>} The result of the tool execution
 * @throws {Error} If the tool execution fails
 */
async function runTool(toolName, args) {
  if (!tools[toolName]) {
    throw new Error(`Tool not found: ${toolName}`);
  }
  
  try {
    const result = await tools[toolName](args);
    return result;
  } catch (error) {
    console.error(`Error running ${toolName}:`, error);
    throw error;
  }
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

### Git Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types include:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

Example:
```
feat(cli): add support for custom file patterns in search-code command

- Added --file-pattern option to search-code command
- Updated documentation to reflect new option
- Added tests for the new functionality

Closes #123
```

## Testing

### Testing Philosophy

The VSC-Remote project follows a test-driven development approach. All new features and bug fixes should include tests that verify the functionality.

### Types of Tests

- **Unit Tests**: Test individual functions and classes in isolation
- **Integration Tests**: Test the interaction between different components
- **CLI Tests**: Test the command-line interface functionality

### Writing Tests

Tests are written using Jest. Each test file should be placed in the `test` directory and named with the `.test.js` suffix.

Example test:

```javascript
const { runTool } = require('../src/cli');
const { tools } = require('../src/tools');

// Mock the tools
jest.mock('../src/tools', () => ({
  tools: {
    test_tool: jest.fn().mockResolvedValue({ success: true })
  }
}));

describe('CLI Tool Execution', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should execute a tool with arguments', async () => {
    const args = { param1: 'value1' };
    const result = await runTool('test_tool', args);
    
    expect(tools.test_tool).toHaveBeenCalledWith(args);
    expect(result).toEqual({ success: true });
  });
  
  test('should throw an error for non-existent tool', async () => {
    await expect(runTool('non_existent_tool', {}))
      .rejects
      .toThrow('Tool not found: non_existent_tool');
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
4. Commit your changes with a clear and descriptive commit message following the commit guidelines
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

### Documentation Structure

The project documentation is organized as follows:

- **README.md**: Project overview, installation, and basic usage
- **docs/CLI-USAGE.md**: Detailed CLI command documentation
- **docs/API.md**: Programmatic API documentation
- **docs/CONTRIBUTING.md**: Contribution guidelines (this file)

### Updating Documentation

When making changes to the code, please update the relevant documentation:

1. For CLI changes, update `docs/CLI-USAGE.md`
2. For API changes, update `docs/API.md`
3. For significant changes, update the main `README.md`

## Release Process

### Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backward-compatible manner
- **PATCH** version when you make backward-compatible bug fixes

### Release Steps

1. **Update version**: Update the version in `package.json`
2. **Update changelog**: Update the `CHANGELOG.md` file with the changes in the new version
3. **Create release commit**: Commit the version and changelog changes
4. **Create tag**: Create a git tag for the new version
5. **Push changes**: Push the commit and tag to GitHub
6. **Publish to npm**: Run `npm publish`

### Release Checklist

Before releasing a new version, ensure:

- All tests pass
- Documentation is up-to-date
- CHANGELOG.md is updated
- Version is updated in package.json
- All changes are committed and pushed

## Community

### Getting Help

If you have questions or need help, you can:

- Open an issue on GitHub
- Join our [Discord community](https://discord.gg/vsc-remote)
- Check the [documentation](https://github.com/yourusername/vsc-remote/docs)

### Reporting Bugs

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