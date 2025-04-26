#!/bin/bash
# VS Code Remote CLI - A tool to interact with remote VS Code Docker instances
# Usage: ./vscode-remote-cli.sh [command] [options]

set -e

# Default values
CONTAINER_NAME="vscode-vscode-roo-1"
HOST_PORT="8080"
DEFAULT_PASSWORD="changeme"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help message
show_help() {
  echo -e "${BLUE}VS Code Remote CLI${NC} - Interact with remote VS Code Docker instances"
  echo
  echo "Usage: $0 [command] [options]"
  echo
  echo "Commands:"
  echo "  status                Check the status of the VS Code container"
  echo "  start                 Start the VS Code container"
  echo "  stop                  Stop the VS Code container"
  echo "  restart               Restart the VS Code container"
  echo "  set-env KEY=VALUE     Set an environment variable in the container"
  echo "  get-env KEY           Get the value of an environment variable"
  echo "  list-env              List all environment variables"
  echo "  install-ext EXTENSION Install a VS Code extension"
  echo "  list-ext              List installed extensions"
  echo "  exec COMMAND          Execute a command in the container"
  echo "  logs [--follow]       Show container logs (with optional follow)"
  echo "  info                  Show container information"
  echo "  password NEW_PASSWORD Change the password for VS Code access"
  echo "  help                  Show this help message"
  echo
  echo "Options:"
  echo "  --container NAME      Specify container name (default: $CONTAINER_NAME)"
  echo "  --port PORT           Specify host port (default: $HOST_PORT)"
  echo
  echo "Examples:"
  echo "  $0 status"
  echo "  $0 set-env API_KEY=my-secret-key"
  echo "  $0 install-ext ms-python.python"
  echo "  $0 exec 'echo \$HOME'"
  echo "  $0 logs --follow"
}

# Check if Docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
  fi
}

# Check if the container exists
check_container_exists() {
  if ! docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}Error: Container '$CONTAINER_NAME' does not exist${NC}"
    echo -e "Run ${YELLOW}docker-compose up -d${NC} to create and start the container"
    exit 1
  fi
}

# Check if the container is running
check_container_running() {
  if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}Error: Container '$CONTAINER_NAME' is not running${NC}"
    echo -e "Run ${YELLOW}$0 start${NC} to start the container"
    exit 1
  fi
}

# Parse command line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --container)
        CONTAINER_NAME="$2"
        shift 2
        ;;
      --port)
        HOST_PORT="$2"
        shift 2
        ;;
      *)
        break
        ;;
    esac
  done
}

# Get container status
get_status() {
  check_docker
  
  if docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${GREEN}Container '$CONTAINER_NAME' is running${NC}"
    
    # Check if the service is responding
    if curl -s --max-time 5 "http://localhost:$HOST_PORT" > /dev/null; then
      echo -e "${GREEN}VS Code Server is accessible at http://localhost:$HOST_PORT${NC}"
    else
      echo -e "${YELLOW}Warning: VS Code Server is not responding on port $HOST_PORT${NC}"
    fi
    
    # Show uptime
    UPTIME=$(docker inspect --format='{{.State.StartedAt}}' "$CONTAINER_NAME" | xargs -I{} date -d {} +%s)
    NOW=$(date +%s)
    UPTIME_SECONDS=$((NOW - UPTIME))
    
    DAYS=$((UPTIME_SECONDS / 86400))
    HOURS=$(( (UPTIME_SECONDS % 86400) / 3600 ))
    MINUTES=$(( (UPTIME_SECONDS % 3600) / 60 ))
    
    echo -e "Uptime: ${BLUE}$DAYS days, $HOURS hours, $MINUTES minutes${NC}"
  elif docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo -e "${YELLOW}Container '$CONTAINER_NAME' exists but is not running${NC}"
    echo -e "Run ${BLUE}$0 start${NC} to start the container"
  else
    echo -e "${RED}Container '$CONTAINER_NAME' does not exist${NC}"
    echo -e "Run ${BLUE}docker-compose up -d${NC} to create and start the container"
  fi
}

# Start the container
start_container() {
  check_docker
  
  if docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${YELLOW}Container '$CONTAINER_NAME' is already running${NC}"
  elif docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo -e "Starting container '$CONTAINER_NAME'..."
    docker start "$CONTAINER_NAME"
    echo -e "${GREEN}Container started successfully${NC}"
    echo -e "VS Code Server is accessible at ${BLUE}http://localhost:$HOST_PORT${NC}"
  else
    echo -e "${YELLOW}Container '$CONTAINER_NAME' does not exist${NC}"
    echo -e "Run ${BLUE}docker-compose up -d${NC} to create and start the container"
  fi
}

# Stop the container
stop_container() {
  check_docker
  check_container_exists
  
  if docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "Stopping container '$CONTAINER_NAME'..."
    docker stop "$CONTAINER_NAME"
    echo -e "${GREEN}Container stopped successfully${NC}"
  else
    echo -e "${YELLOW}Container '$CONTAINER_NAME' is not running${NC}"
  fi
}

# Restart the container
restart_container() {
  check_docker
  check_container_exists
  
  echo -e "Restarting container '$CONTAINER_NAME'..."
  docker restart "$CONTAINER_NAME"
  echo -e "${GREEN}Container restarted successfully${NC}"
  echo -e "VS Code Server is accessible at ${BLUE}http://localhost:$HOST_PORT${NC}"
}

# Set environment variable
set_env_var() {
  check_docker
  check_container_running
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No environment variable specified${NC}"
    echo -e "Usage: $0 set-env KEY=VALUE"
    exit 1
  fi
  
  # Parse KEY=VALUE format
  KEY=$(echo "$1" | cut -d= -f1)
  VALUE=$(echo "$1" | cut -d= -f2-)
  
  if [ -z "$KEY" ] || [ -z "$VALUE" ]; then
    echo -e "${RED}Error: Invalid format. Use KEY=VALUE${NC}"
    exit 1
  fi
  
  echo -e "Setting environment variable ${BLUE}$KEY${NC}..."
  
  # Add to .bashrc for persistence across logins
  docker exec "$CONTAINER_NAME" bash -c "echo 'export $KEY=\"$VALUE\"' >> /home/coder/.bashrc"
  
  # Add to /etc/environment for system-wide availability
  docker exec "$CONTAINER_NAME" bash -c "sudo sh -c 'echo \"$KEY=$VALUE\" >> /etc/environment'"
  
  # Export in the current environment
  docker exec -e "$KEY=$VALUE" "$CONTAINER_NAME" bash -c "export $KEY=\"$VALUE\""
  
  # Create a .env file in the workspace directory
  docker exec "$CONTAINER_NAME" bash -c "echo '$KEY=$VALUE' >> /home/coder/workspace/.env"
  
  # Verify the variable was set
  RESULT=$(docker exec "$CONTAINER_NAME" bash -c "source /home/coder/.bashrc && echo \$$KEY")
  
  if [ -n "$RESULT" ]; then
    echo -e "${GREEN}Environment variable set successfully: $KEY=$RESULT${NC}"
  else
    echo -e "${YELLOW}Warning: Variable set but not immediately available. It will be available after container restart.${NC}"
    echo -e "Would you like to restart the container now? (y/n)"
    read -r RESTART
    if [[ "$RESTART" =~ ^[Yy]$ ]]; then
      restart_container
    else
      echo -e "Note: The variable will be available after the next container restart or in new terminal sessions."
    fi
  fi
}

# Get environment variable
get_env_var() {
  check_docker
  check_container_running
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No environment variable specified${NC}"
    echo -e "Usage: $0 get-env KEY"
    exit 1
  fi
  
  KEY="$1"
  
  echo -e "Getting value of environment variable ${BLUE}$KEY${NC}..."
  
  # Try multiple sources to get the variable
  VALUE=$(docker exec "$CONTAINER_NAME" bash -c "source /home/coder/.bashrc && echo \$$KEY")
  
  if [ -z "$VALUE" ]; then
    # Try from /etc/environment
    VALUE=$(docker exec "$CONTAINER_NAME" bash -c "grep -E \"^$KEY=\" /etc/environment 2>/dev/null | cut -d= -f2- | tr -d '\"' || echo ''")
  fi
  
  if [ -z "$VALUE" ]; then
    # Try from .env file
    VALUE=$(docker exec "$CONTAINER_NAME" bash -c "grep -E \"^$KEY=\" /home/coder/workspace/.env 2>/dev/null | cut -d= -f2- || echo ''")
  fi
  
  if [ -z "$VALUE" ]; then
    # Try from environment
    VALUE=$(docker exec "$CONTAINER_NAME" bash -c "printenv $KEY || echo ''")
  fi
  
  if [ -z "$VALUE" ]; then
    echo -e "${YELLOW}Environment variable '$KEY' is not set or is empty${NC}"
  else
    echo -e "${GREEN}$KEY=${NC}$VALUE"
  fi
}

# List all environment variables
list_env_vars() {
  check_docker
  check_container_running
  
  echo -e "Listing environment variables in container ${BLUE}$CONTAINER_NAME${NC}..."
  docker exec "$CONTAINER_NAME" bash -c "printenv | sort"
  
  echo -e "\n${BLUE}Custom environment variables from .bashrc:${NC}"
  docker exec "$CONTAINER_NAME" bash -c "grep -E '^export [A-Za-z0-9_]+=' /home/coder/.bashrc 2>/dev/null || echo 'None found'"
  
  echo -e "\n${BLUE}Custom environment variables from /etc/environment:${NC}"
  docker exec "$CONTAINER_NAME" bash -c "cat /etc/environment 2>/dev/null | grep -v '^PATH=' || echo 'None found'"
  
  echo -e "\n${BLUE}Custom environment variables from workspace/.env:${NC}"
  docker exec "$CONTAINER_NAME" bash -c "cat /home/coder/workspace/.env 2>/dev/null || echo 'None found'"
}

# Install VS Code extension
install_extension() {
  check_docker
  check_container_running
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No extension specified${NC}"
    echo -e "Usage: $0 install-ext EXTENSION_ID"
    exit 1
  fi
  
  EXTENSION="$1"
  
  echo -e "Installing VS Code extension ${BLUE}$EXTENSION${NC}..."
  docker exec "$CONTAINER_NAME" code-server --install-extension "$EXTENSION"
  
  # Verify installation
  if docker exec "$CONTAINER_NAME" code-server --list-extensions | grep -q "$EXTENSION"; then
    echo -e "${GREEN}Extension installed successfully${NC}"
  else
    echo -e "${RED}Failed to install extension${NC}"
    exit 1
  fi
}

# List installed extensions
list_extensions() {
  check_docker
  check_container_running
  
  echo -e "Listing installed VS Code extensions in container ${BLUE}$CONTAINER_NAME${NC}..."
  docker exec "$CONTAINER_NAME" code-server --list-extensions
}

# Execute command in container
exec_command() {
  check_docker
  check_container_running
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No command specified${NC}"
    echo -e "Usage: $0 exec COMMAND"
    exit 1
  fi
  
  COMMAND="$1"
  
  echo -e "Executing command in container ${BLUE}$CONTAINER_NAME${NC}..."
  docker exec "$CONTAINER_NAME" bash -c "$COMMAND"
}

# Show container logs
show_logs() {
  check_docker
  check_container_exists
  
  if [ "$1" = "--follow" ]; then
    echo -e "Showing logs for container ${BLUE}$CONTAINER_NAME${NC} (press Ctrl+C to exit)..."
    docker logs -f "$CONTAINER_NAME"
  else
    echo -e "Showing logs for container ${BLUE}$CONTAINER_NAME${NC}..."
    docker logs "$CONTAINER_NAME"
  fi
}

# Show container information
show_info() {
  check_docker
  check_container_exists
  
  echo -e "Information for container ${BLUE}$CONTAINER_NAME${NC}:"
  docker inspect "$CONTAINER_NAME" | jq '.[0] | {
    Name: .Name,
    Image: .Config.Image,
    Status: .State.Status,
    StartedAt: .State.StartedAt,
    Ports: .NetworkSettings.Ports,
    Mounts: .Mounts,
    Environment: .Config.Env
  }'
}

# Change password
change_password() {
  check_docker
  check_container_running
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No password specified${NC}"
    echo -e "Usage: $0 password NEW_PASSWORD"
    exit 1
  fi
  
  NEW_PASSWORD="$1"
  
  echo -e "Changing VS Code access password..."
  docker exec -e PASSWORD="$NEW_PASSWORD" "$CONTAINER_NAME" bash -c 'echo "export PASSWORD=\"$PASSWORD\"" >> /home/coder/.bashrc'
  
  # Restart the container to apply the new password
  echo -e "Restarting container to apply the new password..."
  docker restart "$CONTAINER_NAME"
  
  echo -e "${GREEN}Password changed successfully${NC}"
  echo -e "You can now access VS Code at ${BLUE}http://localhost:$HOST_PORT${NC} with the new password"
}

# Main function
main() {
  # Parse global options first
  parse_args "$@"
  shift $((OPTIND-1))
  
  # No command provided
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  # Process command
  COMMAND="$1"
  shift
  
  case "$COMMAND" in
    status)
      get_status
      ;;
    start)
      start_container
      ;;
    stop)
      stop_container
      ;;
    restart)
      restart_container
      ;;
    set-env)
      set_env_var "$1"
      ;;
    get-env)
      get_env_var "$1"
      ;;
    list-env)
      list_env_vars
      ;;
    install-ext)
      install_extension "$1"
      ;;
    list-ext)
      list_extensions
      ;;
    exec)
      exec_command "$1"
      ;;
    logs)
      show_logs "$1"
      ;;
    info)
      show_info
      ;;
    password)
      change_password "$1"
      ;;
    help)
      show_help
      ;;
    *)
      echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
      show_help
      exit 1
      ;;
  esac
}

# Run the main function
main "$@"