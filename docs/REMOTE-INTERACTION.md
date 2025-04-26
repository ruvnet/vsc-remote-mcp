# VS Code Remote Interaction Guide

This guide explains how to remotely interact with VS Code capabilities in the Docker instance, including extensions, terminal, and code editing.

## Overview

The VS Code Remote Interaction Script (`vscode-remote-interact.sh`) allows you to:

- Create and edit files in the workspace
- Run commands in the terminal
- Create new projects (Node.js, Python, HTML)
- Install VS Code extensions
- Run predefined tasks
- Set up debugging configurations
- Run git commands
- Search for patterns in workspace files
- Access URLs from the container

## Prerequisites

- The VS Code Docker container set up and deployed
- The VS Code Remote CLI tool (`vscode-remote-cli.sh`) installed
- Bash shell environment

## Basic Usage

```bash
./vscode-remote-interact.sh [command] [options]
```

## Available Commands

### File Operations

| Command | Description | Example |
|---------|-------------|---------|
| `edit FILE` | Create or edit a file in the workspace | `./vscode-remote-interact.sh edit app.js` |
| `search PATTERN` | Search for a pattern in workspace files | `./vscode-remote-interact.sh search "function main"` |

### Terminal and Command Execution

| Command | Description | Example |
|---------|-------------|---------|
| `run-terminal COMMAND` | Run a command in the terminal | `./vscode-remote-interact.sh run-terminal 'npm install express'` |
| `git COMMAND` | Run a git command in the workspace | `./vscode-remote-interact.sh git "status"` |

### Project Management

| Command | Description | Example |
|---------|-------------|---------|
| `create-project TYPE NAME` | Create a new project | `./vscode-remote-interact.sh create-project node my-app` |
| `run-task NAME` | Run a predefined task | `./vscode-remote-interact.sh run-task lint` |
| `debug FILE` | Start debugging a file | `./vscode-remote-interact.sh debug app.js` |

### Extensions and Browser

| Command | Description | Example |
|---------|-------------|---------|
| `install-extension EXT` | Install a VS Code extension | `./vscode-remote-interact.sh install-extension ms-python.python` |
| `open-browser URL` | Open a URL in the container's browser | `./vscode-remote-interact.sh open-browser https://example.com` |

### Help

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Show help message | `./vscode-remote-interact.sh help` |

## Global Options

| Option | Description | Example |
|--------|-------------|---------|
| `--container NAME` | Specify container name | `./vscode-remote-interact.sh --container my-container edit app.js` |
| `--port PORT` | Specify host port | `./vscode-remote-interact.sh --port 8081 edit app.js` |
| `--password PASS` | Specify password | `./vscode-remote-interact.sh --password mypass edit app.js` |
| `--cli TOOL` | Specify CLI tool path | `./vscode-remote-interact.sh --cli /path/to/cli.sh edit app.js` |

## Examples

### Creating and Editing Files

```bash
# Create a new file
./vscode-remote-interact.sh edit new-file.js

# Edit an existing file
./vscode-remote-interact.sh edit workspace/index.html
```

This will open the file in your default editor (or nano if not set), and after saving, the changes will be applied to the file in the container.

### Running Terminal Commands

```bash
# Install a Node.js package
./vscode-remote-interact.sh run-terminal "npm install express"

# List files in the workspace
./vscode-remote-interact.sh run-terminal "ls -la"
```

### Creating Projects

```bash
# Create a Node.js project
./vscode-remote-interact.sh create-project node my-node-app

# Create a Python project
./vscode-remote-interact.sh create-project python my-python-app

# Create an HTML project
./vscode-remote-interact.sh create-project html my-web-app
```

Each project type comes with a basic structure and starter files.

### Installing Extensions

```bash
# Install the Python extension
./vscode-remote-interact.sh install-extension ms-python.python

# Install the ESLint extension
./vscode-remote-interact.sh install-extension dbaeumer.vscode-eslint
```

### Running Tasks

```bash
# Run linting
./vscode-remote-interact.sh run-task lint

# Run tests
./vscode-remote-interact.sh run-task test

# Build the project
./vscode-remote-interact.sh run-task build

# Start a server
./vscode-remote-interact.sh run-task serve
```

### Setting Up Debugging

```bash
# Set up debugging for a JavaScript file
./vscode-remote-interact.sh debug app.js

# Set up debugging for a Python file
./vscode-remote-interact.sh debug main.py
```

This creates the necessary debug configuration files and provides instructions on how to start debugging in VS Code.

### Running Git Commands

```bash
# Check git status
./vscode-remote-interact.sh git "status"

# Add files
./vscode-remote-interact.sh git "add ."

# Commit changes
./vscode-remote-interact.sh git "commit -m 'Initial commit'"
```

### Searching in Files

```bash
# Search for a function definition
./vscode-remote-interact.sh search "function main"

# Search for HTML tags
./vscode-remote-interact.sh search "<div"
```

### Accessing URLs

```bash
# Fetch content from a URL
./vscode-remote-interact.sh open-browser "https://example.com"
```

## Combining with Environment Variables

You can combine this script with the environment variable management script:

```bash
# Set environment variables
./set-env-from-file.sh

# Create a project that uses those variables
./vscode-remote-interact.sh create-project node api-project

# Edit a file to use the environment variables
./vscode-remote-interact.sh edit api-project/index.js
```

## Troubleshooting

If you encounter issues with the interaction script:

1. Make sure the VS Code Docker container is running
2. Verify the CLI tool path is correct
3. Check if the file paths are relative to the workspace directory
4. For terminal commands, ensure they are properly quoted

For more detailed information about the container, use:

```bash
./vscode-remote-cli.sh info