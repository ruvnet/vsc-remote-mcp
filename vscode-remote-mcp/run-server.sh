#!/bin/bash
# Run the VSCode Remote MCP Server

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to run this server."
    exit 1
fi

# Check if required files exist
if [ ! -f "run-mcp-server.js" ]; then
    echo "Error: run-mcp-server.js not found. Make sure you're in the correct directory."
    exit 1
fi

# Check if src/tools directory exists
if [ ! -d "src/tools" ]; then
    echo "Error: src/tools directory not found. Make sure the project is set up correctly."
    exit 1
fi

# Load environment variables if .env file exists
if [ -f ".env" ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Create vscode-instances directory if it doesn't exist
mkdir -p vscode-instances

# Start the server
echo "Starting VSCode Remote MCP Server..."
node run-mcp-server.js