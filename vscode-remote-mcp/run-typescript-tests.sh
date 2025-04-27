#!/bin/bash

# Script to run TypeScript tests

echo "Installing TypeScript test dependencies..."
npm run setup:test

echo "Running TypeScript tests..."
npm run test:ts

# Exit with the status of the test command
exit $?