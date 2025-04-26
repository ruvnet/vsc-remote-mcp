#!/bin/bash
set -e

echo "Testing VS Code Server installation..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running"
  exit 1
fi

# Check if the container is running
if ! docker-compose ps | grep -q "vscode-roo.*Up"; then
  echo "Error: VS Code Server container is not running"
  exit 1
fi

# Check if the service is responding
CONTAINER_ID=$(docker-compose ps -q vscode-roo)
HOST_PORT=$(docker port $CONTAINER_ID 8080 | cut -d: -f2)

echo "Checking if VS Code Server is responding on port $HOST_PORT..."
if ! curl -s --max-time 10 http://localhost:$HOST_PORT > /dev/null; then
  echo "Error: VS Code Server is not responding"
  exit 1
fi

echo "VS Code Server is running and accessible!"
exit 0