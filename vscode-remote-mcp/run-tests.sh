#!/bin/bash

# Run all MCP server tests

echo "Running MCP server tests..."
echo "============================"

# Run initialize test
echo -e "\nRunning initialize test..."
node test-initialize.js

# Run discovery test
echo -e "\nRunning discovery test..."
node test-discovery.js

# Run TypeScript server test
echo -e "\nRunning TypeScript server test..."
node test-typescript-server.js

# Run multi-step test
echo -e "\nRunning multi-step test..."
node test-multi-step.js

echo -e "\nAll tests completed!"