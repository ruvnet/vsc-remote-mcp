# VS Code Remote CLI Usage Guide

This document explains how to use the VS Code Remote CLI tool to interact with your remote VS Code Docker instance.

## Overview

The VS Code Remote CLI (`vscode-remote-cli.sh`) is a command-line tool that allows you to:

- Check the status of your VS Code Docker container
- Start, stop, and restart the container
- Set and retrieve environment variables
- Install and list VS Code extensions
- Execute commands inside the container
- View container logs and information
- Change the VS Code access password

## Prerequisites

- Docker and Docker Compose installed
- The VS Code Docker container set up and deployed
- Bash shell environment

## Basic Usage

```bash
./vscode-remote-cli.sh [command] [options]
```

## Available Commands

### Container Management

| Command | Description | Example |
|---------|-------------|---------|
| `status` | Check the status of the VS Code container | `./vscode-remote-cli.sh status` |
| `start` | Start the VS Code container | `./vscode-remote-cli.sh start` |
| `stop` | Stop the VS Code container | `./vscode-remote-cli.sh stop` |
| `restart` | Restart the VS Code container | `./vscode-remote-cli.sh restart` |

### Environment Variables

| Command | Description | Example |
|---------|-------------|---------|
| `set-env KEY=VALUE` | Set an environment variable | `./vscode-remote-cli.sh set-env API_KEY=my-secret-key` |
| `get-env KEY` | Get the value of an environment variable | `./vscode-remote-cli.sh get-env API_KEY` |
| `list-env` | List all environment variables | `./vscode-remote-cli.sh list-env` |

### Extensions Management

| Command | Description | Example |
|---------|-------------|---------|
| `install-ext EXTENSION` | Install a VS Code extension | `./vscode-remote-cli.sh install-ext ms-python.python` |
| `list-ext` | List installed extensions | `./vscode-remote-cli.sh list-ext` |

### Container Operations

| Command | Description | Example |
|---------|-------------|---------|
| `exec COMMAND` | Execute a command in the container | `./vscode-remote-cli.sh exec 'echo $HOME'` |
| `logs [--follow]` | Show container logs | `./vscode-remote-cli.sh logs --follow` |
| `info` | Show container information | `./vscode-remote-cli.sh info` |
| `password NEW_PASSWORD` | Change the password for VS Code access | `./vscode-remote-cli.sh password my-new-password` |

### Help

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Show help message | `./vscode-remote-cli.sh help` |

## Global Options

| Option | Description | Example |
|--------|-------------|---------|
| `--container NAME` | Specify container name | `./vscode-remote-cli.sh --container my-container status` |
| `--port PORT` | Specify host port | `./vscode-remote-cli.sh --port 8081 status` |

## Examples

### Check Container Status

```bash
./vscode-remote-cli.sh status
```

This will show if the container is running, the uptime, and whether the VS Code Server is accessible.

### Set an API Key for an Extension

```bash
./vscode-remote-cli.sh set-env OPENAI_API_KEY=sk-your-api-key-here
```

This sets the `OPENAI_API_KEY` environment variable, which can be used by extensions that require API authentication.

### Install a New Extension

```bash
./vscode-remote-cli.sh install-ext ms-python.python
```

This installs the Python extension in the VS Code container.

### Execute a Command

```bash
./vscode-remote-cli.sh exec 'ls -la /home/coder/workspace'
```

This lists the contents of the workspace directory inside the container.

### Change the Password

```bash
./vscode-remote-cli.sh password my-secure-password
```

This changes the password used to access the VS Code Server through the browser.

## Setting Environment Variables from a File

We've included a helper script (`set-env-from-file.sh`) that allows you to set multiple environment variables from a file:

### Usage

```bash
./set-env-from-file.sh [options]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `-f, --file FILE` | Specify environment file (default: vscode-env.txt) | `./set-env-from-file.sh -f my-env.txt` |
| `-c, --cli TOOL` | Specify CLI tool path (default: ./vscode-remote-cli.sh) | `./set-env-from-file.sh -c /path/to/cli.sh` |
| `-h, --help` | Show help message | `./set-env-from-file.sh -h` |

### Environment File Format

The environment file should contain one variable per line in the format `KEY=VALUE`:

```
# Comments are supported
API_KEY=my-secret-key
DEBUG_MODE=true
PROJECT_PATH=/path/to/project
```

### Example

1. Create an environment file named `vscode-env.txt`:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
GITHUB_TOKEN=ghp-your-github-token-here
DEBUG_MODE=true
```

2. Run the script:

```bash
./set-env-from-file.sh
```

3. Verify the variables were set:

```bash
./vscode-remote-cli.sh list-env | grep -E 'OPENAI_API_KEY|GITHUB_TOKEN|DEBUG_MODE'
```

## Troubleshooting

If you encounter issues with the CLI tool:

1. Make sure Docker is running
2. Verify the container name is correct (default is `vscode-vscode-roo-1`)
3. Check if the container is running with `docker ps`
4. View the container logs with `./vscode-remote-cli.sh logs`

For more detailed information about the container, use:

```bash
./vscode-remote-cli.sh info
```

This will show the container configuration, network settings, and mounted volumes.