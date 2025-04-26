#!/bin/bash
set -e

echo "Verifying Docker setup for VS Code Server with Roo extension..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed or not in PATH"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "Error: Docker daemon is not running"
    exit 1
fi

# Check if we can build the image
echo "Testing Docker build..."
if ! docker-compose build --no-cache &> /dev/null; then
    echo "Error: Failed to build Docker image"
    exit 1
fi

echo "Docker setup verification completed successfully!"
echo "You can now run 'docker-compose up -d' to start the VS Code Server."
exit 0