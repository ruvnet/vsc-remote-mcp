#!/bin/bash
set -e

echo "Testing Roo extension installation..."

# Check if the container is running
if ! docker-compose ps | grep -q "vscode-roo.*Up"; then
  echo "Error: VS Code Server container is not running"
  exit 1
fi

# Get container ID
CONTAINER_ID=$(docker-compose ps -q vscode-roo)

# Check if Roo extension is installed
echo "Verifying Roo extension installation..."
if ! docker exec $CONTAINER_ID code-server --list-extensions | grep -q "rooveterinaryinc.roo-cline"; then
  echo "Error: Roo extension is not installed"
  exit 1
fi

echo "Roo extension is properly installed!"
exit 0