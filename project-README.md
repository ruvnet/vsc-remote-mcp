# Remote VS Code with Roo Extension

This project provides a Docker-based setup for running Visual Studio Code as a server with the Roo extension pre-installed. It allows you to access VS Code through a web browser, making it perfect for remote development scenarios.

## Features

- VS Code Server accessible through a web browser
- Roo extension (rooveterinaryinc.roo-cline) pre-installed and configured
- Persistent workspaces and settings
- Secure authentication
- Customizable extensions

## Quick Start

1. Make sure you have Docker and Docker Compose installed
2. Clone this repository
3. Start the container:

```bash
docker-compose up -d
```

4. Access VS Code in your browser: http://localhost:8080
5. Use the password set in docker-compose.yml (default: "changeme")

For detailed instructions, see [SETUP.md](docs/SETUP.md) and [USAGE.md](docs/USAGE.md).

## Configuration

You can customize the setup by modifying the environment variables in `docker-compose.yml`:

- `PASSWORD`: Set the authentication password
- `EXTENSIONS`: Comma-separated list of additional VS Code extensions to install

## Requirements

- Docker 19.03 or later
- Docker Compose 1.25 or later
- 2GB RAM minimum (4GB recommended)
- Modern web browser

## How It Works

This project uses the code-server project to run VS Code in the browser. The Docker container includes:

1. VS Code Server running on port 8080
2. The Roo extension pre-installed
3. A persistent workspace volume
4. Authentication for secure access

## License

MIT