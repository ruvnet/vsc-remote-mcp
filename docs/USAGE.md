# Usage Guide

This guide explains how to use the Remote VS Code with Roo Extension.

## Accessing VS Code

1. Start the container (if not already running):

```bash
docker-compose up -d
```

2. Open your web browser and navigate to:

```
http://localhost:8080
```

3. Enter the password when prompted (default is "changeme" unless you modified it)

## Working with the Roo Extension

The Roo extension (rooveterinaryinc.roo-cline) is pre-installed in the container.

### Using Roo

1. Open a workspace or folder in VS Code
2. Access Roo using the command palette (Ctrl+Shift+P or Cmd+Shift+P)
3. Type "Roo" to see available commands

### Roo Configuration

If Roo requires additional configuration:

1. Navigate to Settings in VS Code (File > Preferences > Settings)
2. Search for "Roo" to find relevant settings
3. Adjust settings as needed

## Workspace Management

Your workspace directory is mounted at `/home/coder/workspace` inside the container. This corresponds to the `./workspace` directory in your project folder.

Any files you create in VS Code will be stored in this directory and persist between container restarts.

## Extension Management

### Installing Additional Extensions

You can install additional extensions in two ways:

1. Using the Extensions view in VS Code
2. By adding them to the `EXTENSIONS` environment variable in `docker-compose.yml`

For example:

```yaml
environment:
  - EXTENSIONS=ms-python.python,ms-azuretools.vscode-docker
```

Then restart the container:

```bash
docker-compose down
docker-compose up -d
```

## Remote Access

By default, the VS Code Server is only accessible from your local machine. To enable remote access:

1. Modify `docker-compose.yml` to expose the port to all interfaces:

```yaml
ports:
  - "0.0.0.0:8080:8080"
```

2. Set a strong password in `docker-compose.yml`

3. Consider setting up HTTPS for secure access

## Sharing Your Workspace

To collaborate with others:

1. Ensure remote access is configured (see above)
2. Share your IP address and port with collaborators
3. Provide the password for authentication

## Performance Considerations

- The container requires at least 2GB of RAM to function properly
- For large projects, consider increasing the resources allocated to Docker
- Extensions can significantly impact performance, install only what you need