#!/bin/bash
# Script to set environment variables from a file using the VS Code Remote CLI

set -e

# Default values
ENV_FILE="vscode-env.txt"
CLI_TOOL="./vscode-remote-cli.sh"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help message
show_help() {
  echo -e "${BLUE}Set Environment Variables From File${NC}"
  echo
  echo "Usage: $0 [options]"
  echo
  echo "Options:"
  echo "  -f, --file FILE       Specify environment file (default: $ENV_FILE)"
  echo "  -c, --cli TOOL        Specify CLI tool path (default: $CLI_TOOL)"
  echo "  -h, --help            Show this help message"
  echo
  echo "Example environment file format:"
  echo "API_KEY=my-secret-key"
  echo "DEBUG_MODE=true"
  echo "PROJECT_PATH=/path/to/project"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--file)
      ENV_FILE="$2"
      shift 2
      ;;
    -c|--cli)
      CLI_TOOL="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option '$1'${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Check if the environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: Environment file '$ENV_FILE' not found${NC}"
  echo -e "Create the file or specify a different file with ${YELLOW}-f${NC} option"
  exit 1
fi

# Check if the CLI tool exists
if [ ! -f "$CLI_TOOL" ]; then
  echo -e "${RED}Error: CLI tool '$CLI_TOOL' not found${NC}"
  echo -e "Specify the correct path with ${YELLOW}-c${NC} option"
  exit 1
fi

# Count the number of variables in the file
VAR_COUNT=$(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$' | wc -l)

echo -e "Setting ${BLUE}$VAR_COUNT${NC} environment variables from ${YELLOW}$ENV_FILE${NC}..."

# Process each line in the environment file
while IFS= read -r line; do
  # Skip comments and empty lines
  if [[ "$line" =~ ^\s*# ]] || [[ -z "${line// }" ]]; then
    continue
  fi
  
  # Extract key and value
  if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
    KEY="${BASH_REMATCH[1]}"
    VALUE="${BASH_REMATCH[2]}"
    
    # Remove surrounding quotes if present
    VALUE="${VALUE#\"}"
    VALUE="${VALUE%\"}"
    VALUE="${VALUE#\'}"
    VALUE="${VALUE%\'}"
    
    echo -e "Setting ${BLUE}$KEY${NC}..."
    "$CLI_TOOL" set-env "$KEY=$VALUE"
    echo
  else
    echo -e "${YELLOW}Warning: Skipping invalid line: $line${NC}"
  fi
done < "$ENV_FILE"

echo -e "${GREEN}All environment variables have been set successfully!${NC}"
echo -e "You can verify them with: ${BLUE}$CLI_TOOL list-env${NC}"