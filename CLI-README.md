# VS Code Remote CLI Tools

This repository contains command-line tools for interacting with a remote VS Code Docker instance.

## Tools Included

1. **vscode-remote-cli.sh** - Main CLI tool for managing the VS Code Docker container
2. **set-env-from-file.sh** - Helper script for setting environment variables from a file

## Quick Start

### Check Container Status

```bash
./vscode-remote-cli.sh status
```

### Set Environment Variables

```bash
# Set a single variable
./vscode-remote-cli.sh set-env API_KEY=my-secret-key

# Set multiple variables from a file
./set-env-from-file.sh -f vscode-env.txt
```

### Install Extensions

```bash
./vscode-remote-cli.sh install-ext ms-python.python
```

### View Container Logs

```bash
./vscode-remote-cli.sh logs
```

## Documentation

For detailed usage instructions, see [docs/CLI-USAGE.md](docs/CLI-USAGE.md).

## Features

- Container management (start, stop, restart)
- Environment variable management
- Extension installation and management
- Command execution inside the container
- Log viewing and container information
- Password management

## Requirements

- Docker and Docker Compose
- Bash shell environment
- The VS Code Docker container set up and deployed

## License

MIT