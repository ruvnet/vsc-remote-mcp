# VS Code Roo Extension Interaction Guide

This guide explains how to interact with the Roo extension in the VS Code Docker instance.

## Overview

The VS Code Roo Extension Interaction Script (`vscode-roo-interact.sh`) allows you to:

- Ask Roo questions or give it tasks
- Have Roo explain, optimize, or refactor code
- Generate code based on descriptions
- Create tests for your code
- Debug code with specific errors
- Document your code
- Set up and configure the Roo extension

## Prerequisites

- The VS Code Docker container set up and deployed
- The VS Code Remote CLI tool (`vscode-remote-cli.sh`) installed
- The VS Code Remote Interaction tool (`vscode-remote-interact.sh`) installed
- Roo extension installed in the VS Code Docker instance

## Basic Usage

```bash
./vscode-roo-interact.sh [command] [options]
```

## Available Commands

### Roo Interactions

| Command | Description | Example |
|---------|-------------|---------|
| `ask PROMPT` | Ask Roo a question or give it a task | `./vscode-roo-interact.sh ask "How do I create a React component?"` |
| `explain FILE` | Ask Roo to explain a file | `./vscode-roo-interact.sh explain app.js` |
| `optimize FILE` | Ask Roo to optimize a file | `./vscode-roo-interact.sh optimize main.py` |
| `refactor FILE INSTRUCTIONS` | Ask Roo to refactor a file with specific instructions | `./vscode-roo-interact.sh refactor index.js "Convert to arrow functions"` |
| `generate DESCRIPTION` | Ask Roo to generate code based on a description | `./vscode-roo-interact.sh generate "Create a function that sorts an array"` |
| `test FILE` | Ask Roo to generate tests for a file | `./vscode-roo-interact.sh test app.js` |
| `debug FILE ERROR` | Ask Roo to debug a file with a specific error | `./vscode-roo-interact.sh debug app.js "TypeError: Cannot read property"` |
| `document FILE` | Ask Roo to document a file | `./vscode-roo-interact.sh document app.js` |

### Roo Setup and Configuration

| Command | Description | Example |
|---------|-------------|---------|
| `setup-roo` | Set up Roo extension configuration | `./vscode-roo-interact.sh setup-roo` |
| `check-roo` | Check if Roo extension is working properly | `./vscode-roo-interact.sh check-roo` |

### Help

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Show help message | `./vscode-roo-interact.sh help` |

## Global Options

| Option | Description | Example |
|--------|-------------|---------|
| `--container NAME` | Specify container name | `./vscode-roo-interact.sh --container my-container ask "How do I create a React component?"` |
| `--port PORT` | Specify host port | `./vscode-roo-interact.sh --port 8081 ask "How do I create a React component?"` |
| `--cli TOOL` | Specify CLI tool path | `./vscode-roo-interact.sh --cli /path/to/cli.sh ask "How do I create a React component?"` |
| `--interact TOOL` | Specify interaction tool path | `./vscode-roo-interact.sh --interact /path/to/interact.sh ask "How do I create a React component?"` |

## Examples

### Asking Roo a Question

```bash
./vscode-roo-interact.sh ask "What is the difference between let and const in JavaScript?"
```

This will save the prompt to a file and provide instructions on how to access it in VS Code.

### Explaining Code

```bash
./vscode-roo-interact.sh explain app.js
```

This will provide instructions on how to use Roo to explain the code in app.js.

### Optimizing Code

```bash
./vscode-roo-interact.sh optimize slow-function.js
```

This will provide instructions on how to use Roo to optimize the code in slow-function.js.

### Refactoring Code

```bash
./vscode-roo-interact.sh refactor old-code.js "Convert to modern ES6 syntax and use async/await"
```

This will save the refactoring instructions to a file and provide guidance on how to use Roo to refactor the code.

### Generating Code

```bash
./vscode-roo-interact.sh generate "Create a React component that displays a list of items fetched from an API"
```

This will save the code generation description to a file and provide instructions on how to use Roo to generate the code.

### Creating Tests

```bash
./vscode-roo-interact.sh test utils.js
```

This will provide instructions on how to use Roo to generate tests for utils.js.

### Debugging Code

```bash
./vscode-roo-interact.sh debug buggy.js "ReferenceError: x is not defined"
```

This will save the error message to a file and provide instructions on how to use Roo to debug the code.

### Documenting Code

```bash
./vscode-roo-interact.sh document undocumented.js
```

This will provide instructions on how to use Roo to add documentation to undocumented.js.

## Setting Up Roo

The `setup-roo` command performs several important tasks:

1. Creates keybindings for Roo commands
2. Sets up Roo extension settings
3. Creates a JavaScript file to interact with Roo via the VS Code API
4. Creates a VS Code extension for Roo interaction

```bash
./vscode-roo-interact.sh setup-roo
```

After running this command, you can access VS Code at http://localhost:8080 and use the Roo extension with the configured settings and keybindings.

## Checking Roo Installation

The `check-roo` command verifies that the Roo extension is installed and creates a test file to interact with Roo:

```bash
./vscode-roo-interact.sh check-roo
```

This creates a test JavaScript file with functions that can be used to test various Roo capabilities:
- A simple function to test basic functionality
- An inefficient function that can be optimized
- A buggy function that can be debugged
- An undocumented function that can be documented

## Workflow Example

Here's a complete workflow example:

1. Check if Roo is installed and set it up:
   ```bash
   ./vscode-roo-interact.sh check-roo
   ./vscode-roo-interact.sh setup-roo
   ```

2. Create a new project:
   ```bash
   ./vscode-remote-interact.sh create-project node my-app
   ```

3. Ask Roo to generate some code:
   ```bash
   ./vscode-roo-interact.sh generate "Create a Node.js server with Express"
   ```

4. Optimize the generated code:
   ```bash
   ./vscode-roo-interact.sh optimize my-app/index.js
   ```

5. Generate tests for the code:
   ```bash
   ./vscode-roo-interact.sh test my-app/index.js
   ```

6. Document the code:
   ```bash
   ./vscode-roo-interact.sh document my-app/index.js
   ```

## Troubleshooting

If you encounter issues with the Roo interaction script:

1. Make sure the VS Code Docker container is running
2. Verify the Roo extension is installed
3. Check if the file paths are relative to the workspace directory
4. Try running the `setup-roo` command again to reconfigure the extension

For more detailed information about the Roo extension, use:

```bash
./vscode-remote-cli.sh exec "code-server --list-extensions --show-versions | grep roo"