# Setup Guide

This guide provides detailed instructions for setting up the Remote VS Code with Roo Extension container.

## Prerequisites

- Docker 19.03 or later
- Docker Compose 1.25 or later
- 2GB RAM minimum (4GB recommended)
- Modern web browser

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/remote-vscode-roo.git
cd remote-vscode-roo
```

### 2. Configure the Environment

The default configuration should work for most users. However, you may want to modify the following:

1. Open `docker-compose.yml` and change the default password
2. Add any additional extensions you want to install
3. Adjust port mappings if needed

### 3. Build and Start the Container

```bash
docker-compose up -d
```

This will build the Docker image and start the container in detached mode.

### 4. Verify Installation

Run the test scripts to verify everything is working:

```bash
chmod +x tests/*.sh
./tests/test_installation.sh
./tests/test_roo_extension.sh
```

## Customization

### Change Authentication Method

You can modify the authentication method by updating the `entrypoint.sh` file and rebuilding the container.

### Add Custom Extensions

Add the extension IDs to the `EXTENSIONS` environment variable in `docker-compose.yml`, separated by commas:

```yaml
environment:
  - EXTENSIONS=ms-python.python,ms-azuretools.vscode-docker
```

### Persistent Storage

The container uses Docker volumes for persistent storage:

- `vscode-data`: Stores VS Code settings
- `vscode-extensions`: Stores installed extensions
- `./workspace`: Maps to your local workspace directory

## Updating

To update the container to the latest version:

```bash
docker-compose down
git pull
docker-compose up -d --build
```

## Troubleshooting

### Container Won't Start

Check Docker logs:

```bash
docker-compose logs vscode-roo
```

### Can't Access VS Code in Browser

Verify the port mapping:

```bash
docker-compose ps
```

### Roo Extension Issues

Check if the extension is installed:

```bash
docker-compose exec vscode-roo code-server --list-extensions