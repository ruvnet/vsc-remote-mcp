#!/bin/bash

# Integration Tests for vsc-remote NPX Package
# This script runs the integration tests for the vsc-remote package

# Set up colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo -e "${GREEN}=== vsc-remote NPX Package Integration Tests ===${NC}"
echo "Project root: $PROJECT_ROOT"

# Check if required dependencies are installed
echo "Checking dependencies..."

# Fix SDK imports in the source files
echo "Fixing SDK imports..."
node "$PROJECT_ROOT/tests/integration/fix-sdk-imports.js"

# Run the integration tests
echo "Running integration tests..."
node "$PROJECT_ROOT/tests/integration/integration-test.js"

# Check the exit code
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All integration tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some integration tests failed!${NC}"
  exit 1
fi