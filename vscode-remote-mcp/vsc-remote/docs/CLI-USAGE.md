# VSC-Remote CLI Usage Guide

This document provides detailed information about the command-line interface (CLI) for the vsc-remote package, including all available commands, options, and usage examples.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Server Commands](#server-commands)
  - [start](#start)
- [Code Analysis Commands](#code-analysis-commands)
  - [analyze-code](#analyze-code)
  - [search-code](#search-code)
- [Code Modification Commands](#code-modification-commands)
  - [modify-code](#modify-code)
- [VSCode Instance Management Commands](#vscode-instance-management-commands)
  - [deploy-vscode-instance](#deploy-vscode-instance)
  - [list-vscode-instances](#list-vscode-instances)
  - [stop-vscode-instance](#stop-vscode-instance)
- [Resource Management Commands](#resource-management-commands)
  - [manage-job-resources](#manage-job-resources)
- [Environment Variables](#environment-variables)
- [Exit Codes](#exit-codes)
- [Troubleshooting](#troubleshooting)

## Installation

You can use vsc-remote without installation via npx:

```bash
npx vsc-remote <command>
```

Or install it globally:

```bash
npm install -g vsc-remote
vsc-remote <command>
```

## Basic Usage

The general syntax for vsc-remote commands is:

```bash
vsc-remote [command] [options]
```

To see the list of available commands:

```bash
vsc-remote --help
```

To see help for a specific command:

```bash
vsc-remote [command] --help
```

## Server Commands

### start

Starts the MCP server in either stdio or WebSocket mode.

**Usage:**

```bash
vsc-remote start [options]
```

**Options:**

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--debug` | `-d` | Enable debug mode | `false` |
| `--port <port>` | `-p` | Port to run the server on (for WebSocket mode) | `3001` |
| `--mode <mode>` | `-m` | Server mode (stdio or websocket) | `stdio` |

**Examples:**

Start in stdio mode (default):
```bash
vsc-remote start
```

Start in WebSocket mode:
```bash
vsc-remote start --mode websocket --port 3001
```

Start with debug logging:
```bash
vsc-remote start --debug
```

## Code Analysis Commands

### analyze-code

Analyzes code files and provides insights about their structure, complexity, and potential issues.

**Usage:**

```bash
vsc-remote analyze-code <file-path> [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--no-metrics` | Disable complexity metrics | Metrics enabled |
| `--no-structure` | Disable structure analysis | Structure analysis enabled |
| `--no-issues` | Disable issues detection | Issues detection enabled |

**Examples:**

Analyze a JavaScript file with all features enabled:
```bash
vsc-remote analyze-code src/index.js
```

Analyze a file without complexity metrics:
```bash
vsc-remote analyze-code src/index.js --no-metrics
```

### search-code

Searches for patterns in code files and returns matching results with context.

**Usage:**

```bash
vsc-remote search-code <pattern> [options]
```

**Options:**

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--directory <dir>` | `-d` | Directory to search in | `.` (current directory) |
| `--file-pattern <pattern>` | `-f` | File pattern to match | `*` (all files) |
| `--context-lines <lines>` | `-c` | Number of context lines | `2` |
| `--max-results <count>` | `-m` | Maximum number of results | `100` |
| `--ignore-case` | `-i` | Ignore case | `false` |
| `--no-regex` | | Disable regex | Regex enabled |

**Examples:**

Search for a function in all files:
```bash
vsc-remote search-code "function"
```

Search for a pattern in JavaScript files with more context:
```bash
vsc-remote search-code "function" --directory src --file-pattern "*.js" --context-lines 3
```

Case-insensitive search:
```bash
vsc-remote search-code "error" --ignore-case
```

Literal string search (no regex):
```bash
vsc-remote search-code "function()" --no-regex
```

## Code Modification Commands

### modify-code

Modifies code files with various operations like adding, updating, or removing code segments.

**Usage:**

```bash
vsc-remote modify-code <file-path> [options]
```

**Options:**

| Option | Description | Required |
|--------|-------------|----------|
| `--operation <op>` | Operation type (add, update, remove, replace) | Yes |
| `--position <line>` | Line number for add operation | For add operation |
| `--pattern <pattern>` | Pattern to match for update/remove operations | For update/remove operations |
| `--range <start,end>` | Line range for replace operation | For replace operation |
| `--content <text>` | New content to add/update/replace | For add/update/replace operations |

**Examples:**

Add a comment at line 10:
```bash
vsc-remote modify-code src/index.js --operation add --position 10 --content "// New code here"
```

Update a function name:
```bash
vsc-remote modify-code src/index.js --operation update --pattern "oldFunction" --content "newFunction"
```

Remove console.log statements:
```bash
vsc-remote modify-code src/index.js --operation remove --pattern "console.log"
```

Replace a block of code:
```bash
vsc-remote modify-code src/index.js --operation replace --range 10,20 --content "// New code block"
```

## VSCode Instance Management Commands

### deploy-vscode-instance

Deploys a new VSCode instance using Docker.

**Usage:**

```bash
vsc-remote deploy-vscode-instance [options]
```

**Options:**

| Option | Description | Required |
|--------|-------------|----------|
| `--name <name>` | Instance name | Yes |
| `--workspace-path <path>` | Path to workspace directory | Yes |
| `--port <port>` | Port to expose VSCode on | No (auto-assigned) |
| `--password <password>` | Password for authentication | No (auto-generated) |
| `--cpu <limit>` | CPU limit (e.g., "1" for 1 core) | No |
| `--memory <limit>` | Memory limit (e.g., "2Gi") | No |
| `--disk <limit>` | Disk space limit (e.g., "10Gi") | No |

**Examples:**

Deploy a basic instance:
```bash
vsc-remote deploy-vscode-instance --name my-instance --workspace-path /path/to/workspace
```

Deploy with custom resources and port:
```bash
vsc-remote deploy-vscode-instance --name my-instance --workspace-path /path/to/workspace --port 8080 --password mypassword --cpu 2 --memory 4Gi
```

### list-vscode-instances

Lists all deployed VSCode instances and their status.

**Usage:**

```bash
vsc-remote list-vscode-instances [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--status <status>` | Filter by status (running, stopped, all) | `all` |
| `--format <format>` | Output format (json, table) | `table` |

**Examples:**

List all instances:
```bash
vsc-remote list-vscode-instances
```

List only running instances:
```bash
vsc-remote list-vscode-instances --status running
```

Get JSON output:
```bash
vsc-remote list-vscode-instances --format json
```

### stop-vscode-instance

Stops a running VSCode instance.

**Usage:**

```bash
vsc-remote stop-vscode-instance [options]
```

**Options:**

| Option | Description | Required |
|--------|-------------|----------|
| `--name <name>` | Instance name | Yes |
| `--force` | Force stop without confirmation | No |

**Examples:**

Stop an instance:
```bash
vsc-remote stop-vscode-instance --name my-instance
```

Force stop an instance:
```bash
vsc-remote stop-vscode-instance --name my-instance --force
```

## Resource Management Commands

### manage-job-resources

Manages resources for VSCode instances and associated jobs.

**Usage:**

```bash
vsc-remote manage-job-resources <job-id> [options]
```

**Options:**

| Option | Description | Required |
|--------|-------------|----------|
| `--operation <op>` | Operation (status, update, pause, resume) | Yes |
| `--cpu <limit>` | CPU limit for update operation | For update operation |
| `--memory <limit>` | Memory limit for update operation | For update operation |
| `--disk <limit>` | Disk limit for update operation | For update operation |

**Examples:**

Check job status:
```bash
vsc-remote manage-job-resources job-123 --operation status
```

Update resource limits:
```bash
vsc-remote manage-job-resources job-123 --operation update --cpu 2 --memory 4Gi
```

Pause a job:
```bash
vsc-remote manage-job-resources job-123 --operation pause
```

Resume a job:
```bash
vsc-remote manage-job-resources job-123 --operation resume
```

## Environment Variables

You can configure the behavior of vsc-remote using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_DEBUG` | Enable debug mode (1 = enabled, 0 = disabled) | `0` |
| `MCP_MODE` | Server mode (stdio or websocket) | `stdio` |
| `MCP_PORT` | Port for WebSocket mode | `3001` |
| `MCP_LOG_LEVEL` | Log level (error, warn, info, debug) | `info` |
| `MCP_VSCODE_INSTANCES_DIR` | Directory for VSCode instance configurations | `./vscode-instances` |
| `MCP_VSCODE_DOCKER_IMAGE` | Docker image for VSCode instances | `codercom/code-server:latest` |
| `MCP_DEFAULT_CPU_LIMIT` | Default CPU limit for VSCode instances | `1` |
| `MCP_DEFAULT_MEMORY_LIMIT` | Default memory limit for VSCode instances | `2Gi` |
| `MCP_DEFAULT_DISK_LIMIT` | Default disk limit for VSCode instances | `5Gi` |

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments |
| `3` | Connection error |
| `4` | Authentication error |
| `5` | Resource error |

## Troubleshooting

### Common Issues

#### Connection Refused

If you get a "Connection refused" error when using WebSocket mode:

1. Check if the port is already in use
2. Verify firewall settings
3. Ensure the server is running

#### Authentication Failures

If you experience authentication issues:

1. Check if your authentication token is valid
2. Verify that environment variables are set correctly
3. Try regenerating the token

#### Permission Denied

If you get "Permission denied" errors when deploying VSCode instances:

1. Check if Docker is installed and running
2. Verify that you have sufficient permissions
3. Check if the workspace path exists and is accessible

### Logging

To enable detailed logging:

```bash
export MCP_LOG_LEVEL=debug
vsc-remote start
```

### Getting Help

If you encounter issues not covered in this guide, please:

1. Check the [GitHub repository](https://github.com/yourusername/vsc-remote) for known issues
2. Join our [Discord community](https://discord.gg/vsc-remote) for real-time help
3. Open an issue on GitHub with detailed information about your problem