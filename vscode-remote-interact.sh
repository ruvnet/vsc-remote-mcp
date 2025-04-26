#!/bin/bash
# VS Code Remote Interaction Script
# This script allows you to remotely interact with VS Code capabilities in a Docker instance

set -e

# Default values
CONTAINER_NAME="vscode-vscode-roo-1"
HOST_PORT="8080"
PASSWORD="changeme"
CLI_TOOL="./vscode-remote-cli.sh"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help message
show_help() {
  echo -e "${BLUE}VS Code Remote Interaction Script${NC}"
  echo
  echo "Usage: $0 [command] [options]"
  echo
  echo "Commands:"
  echo "  edit FILE                  Create or edit a file in the workspace"
  echo "  run-terminal COMMAND       Run a command in the terminal"
  echo "  create-project TYPE NAME   Create a new project (types: node, python, html)"
  echo "  install-extension EXT      Install a VS Code extension"
  echo "  run-task NAME              Run a predefined task"
  echo "  debug FILE                 Start debugging a file"
  echo "  git COMMAND                Run a git command in the workspace"
  echo "  search PATTERN             Search for a pattern in workspace files"
  echo "  open-browser URL           Open a URL in the container's browser"
  echo "  help                       Show this help message"
  echo
  echo "Options:"
  echo "  --container NAME           Specify container name (default: $CONTAINER_NAME)"
  echo "  --port PORT                Specify host port (default: $HOST_PORT)"
  echo "  --password PASS            Specify password (default: $PASSWORD)"
  echo "  --cli TOOL                 Specify CLI tool path (default: $CLI_TOOL)"
  echo
  echo "Examples:"
  echo "  $0 edit app.js"
  echo "  $0 run-terminal 'npm install express'"
  echo "  $0 create-project node my-app"
  echo "  $0 install-extension ms-python.python"
}

# Check if the CLI tool exists
check_cli_tool() {
  if [ ! -f "$CLI_TOOL" ]; then
    echo -e "${RED}Error: CLI tool '$CLI_TOOL' not found${NC}"
    echo -e "Specify the correct path with ${YELLOW}--cli${NC} option"
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
      --password)
        PASSWORD="$2"
        shift 2
        ;;
      --cli)
        CLI_TOOL="$2"
        shift 2
        ;;
      *)
        break
        ;;
    esac
  done
}

# Edit a file
edit_file() {
  check_cli_tool
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No file specified${NC}"
    echo -e "Usage: $0 edit FILE"
    exit 1
  fi
  
  FILE="$1"
  WORKSPACE_PATH="/home/coder/workspace"
  FILE_PATH="$WORKSPACE_PATH/$FILE"
  
  # Check if file exists
  if $CLI_TOOL exec "[ -f '$FILE_PATH' ]" &>/dev/null; then
    echo -e "File ${BLUE}$FILE${NC} exists. Opening for editing..."
    
    # Get current content
    CONTENT=$($CLI_TOOL exec "cat '$FILE_PATH'")
    
    # Create a temporary file for editing
    TMP_FILE=$(mktemp)
    echo "$CONTENT" > "$TMP_FILE"
    
    # Open the file in the default editor
    ${EDITOR:-nano} "$TMP_FILE"
    
    # Update the file in the container
    NEW_CONTENT=$(cat "$TMP_FILE")
    $CLI_TOOL exec "cat > '$FILE_PATH' << 'EOL'
$NEW_CONTENT
EOL"
    
    # Clean up
    rm "$TMP_FILE"
    
    echo -e "${GREEN}File updated successfully${NC}"
  else
    echo -e "File ${BLUE}$FILE${NC} does not exist. Creating new file..."
    
    # Create a temporary file for editing
    TMP_FILE=$(mktemp)
    
    # Open the file in the default editor
    ${EDITOR:-nano} "$TMP_FILE"
    
    # Create the file in the container
    NEW_CONTENT=$(cat "$TMP_FILE")
    $CLI_TOOL exec "mkdir -p '$(dirname "$FILE_PATH")' && cat > '$FILE_PATH' << 'EOL'
$NEW_CONTENT
EOL"
    
    # Clean up
    rm "$TMP_FILE"
    
    echo -e "${GREEN}File created successfully${NC}"
  fi
  
  # Open the file in VS Code
  echo -e "You can access this file in VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "After logging in, the file will be in the workspace directory"
}

# Run a command in the terminal
run_terminal() {
  check_cli_tool
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No command specified${NC}"
    echo -e "Usage: $0 run-terminal COMMAND"
    exit 1
  fi
  
  COMMAND="$1"
  
  echo -e "Running command in terminal: ${BLUE}$COMMAND${NC}"
  RESULT=$($CLI_TOOL exec "cd /home/coder/workspace && $COMMAND")
  
  echo -e "${GREEN}Command output:${NC}"
  echo "$RESULT"
}

# Create a new project
create_project() {
  check_cli_tool
  
  if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: Project type or name not specified${NC}"
    echo -e "Usage: $0 create-project TYPE NAME"
    echo -e "Available types: node, python, html"
    exit 1
  fi
  
  TYPE="$1"
  NAME="$2"
  WORKSPACE_PATH="/home/coder/workspace"
  PROJECT_PATH="$WORKSPACE_PATH/$NAME"
  
  # Check if project already exists
  if $CLI_TOOL exec "[ -d '$PROJECT_PATH' ]" &>/dev/null; then
    echo -e "${RED}Error: Project '$NAME' already exists${NC}"
    exit 1
  fi
  
  echo -e "Creating ${BLUE}$TYPE${NC} project: ${BLUE}$NAME${NC}"
  
  case "$TYPE" in
    node)
      # Create Node.js project
      $CLI_TOOL exec "mkdir -p '$PROJECT_PATH' && cd '$PROJECT_PATH' && npm init -y"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo 'console.log(\"Hello from $NAME\");' > index.js"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo 'node_modules\n.env\n*.log' > .gitignore"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo '# $NAME\n\nA Node.js project created with VS Code Remote.' > README.md"
      
      echo -e "${GREEN}Node.js project created successfully${NC}"
      echo -e "Main file: ${BLUE}$NAME/index.js${NC}"
      echo -e "To run the project: ${YELLOW}$0 run-terminal 'cd $NAME && node index.js'${NC}"
      ;;
      
    python)
      # Create Python project
      $CLI_TOOL exec "mkdir -p '$PROJECT_PATH' && cd '$PROJECT_PATH'"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo 'def main():\n    print(\"Hello from $NAME\")\n\nif __name__ == \"__main__\":\n    main()' > main.py"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo 'venv/\n__pycache__/\n*.pyc\n.env' > .gitignore"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo '# $NAME\n\nA Python project created with VS Code Remote.' > README.md"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && python3 -m venv venv || echo 'Virtual environment creation failed (non-critical)'"
      
      echo -e "${GREEN}Python project created successfully${NC}"
      echo -e "Main file: ${BLUE}$NAME/main.py${NC}"
      echo -e "To run the project: ${YELLOW}$0 run-terminal 'cd $NAME && python3 main.py'${NC}"
      ;;
      
    html)
      # Create HTML project
      $CLI_TOOL exec "mkdir -p '$PROJECT_PATH/css' '$PROJECT_PATH/js' '$PROJECT_PATH/images'"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>$NAME</title>\n    <link rel=\"stylesheet\" href=\"css/style.css\">\n</head>\n<body>\n    <h1>Welcome to $NAME</h1>\n    <p>This is a project created with VS Code Remote.</p>\n    <script src=\"js/main.js\"></script>\n</body>\n</html>' > index.html"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    line-height: 1.6;\n}' > css/style.css"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo 'console.log(\"Script loaded\");' > js/main.js"
      $CLI_TOOL exec "cd '$PROJECT_PATH' && echo '# $NAME\n\nA web project created with VS Code Remote.' > README.md"
      
      echo -e "${GREEN}HTML project created successfully${NC}"
      echo -e "Main file: ${BLUE}$NAME/index.html${NC}"
      echo -e "To view the project, access VS Code at ${BLUE}http://localhost:$HOST_PORT${NC} and open the HTML file"
      ;;
      
    *)
      echo -e "${RED}Error: Unknown project type '$TYPE'${NC}"
      echo -e "Available types: node, python, html"
      exit 1
      ;;
  esac
  
  # Create VS Code settings
  $CLI_TOOL exec "mkdir -p '$PROJECT_PATH/.vscode'"
  $CLI_TOOL exec "cd '$PROJECT_PATH' && echo '{\n    \"editor.formatOnSave\": true,\n    \"editor.tabSize\": 2\n}' > .vscode/settings.json"
  
  echo -e "Project is available in VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
}

# Install a VS Code extension
install_extension() {
  check_cli_tool
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No extension specified${NC}"
    echo -e "Usage: $0 install-extension EXTENSION_ID"
    exit 1
  fi
  
  EXTENSION="$1"
  
  echo -e "Installing VS Code extension: ${BLUE}$EXTENSION${NC}"
  $CLI_TOOL install-ext "$EXTENSION"
  
  echo -e "Extension will be available after you refresh VS Code in your browser"
}

# Run a predefined task
run_task() {
  check_cli_tool
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No task specified${NC}"
    echo -e "Usage: $0 run-task NAME"
    echo -e "Available tasks: lint, test, build, serve"
    exit 1
  fi
  
  TASK="$1"
  
  echo -e "Running task: ${BLUE}$TASK${NC}"
  
  case "$TASK" in
    lint)
      run_terminal "cd /home/coder/workspace && find . -name '*.js' -not -path '*/node_modules/*' -exec eslint {} \\; || echo 'Linting completed with warnings'"
      ;;
    test)
      run_terminal "cd /home/coder/workspace && find . -name 'package.json' -exec sh -c 'cd \\$(dirname {}) && npm test' \\; || echo 'Tests completed with errors'"
      ;;
    build)
      run_terminal "cd /home/coder/workspace && find . -name 'package.json' -exec sh -c 'cd \\$(dirname {}) && npm run build' \\; || echo 'Build completed with errors'"
      ;;
    serve)
      # This will start a server in the background
      $CLI_TOOL exec "cd /home/coder/workspace && python3 -m http.server 3000 > /dev/null 2>&1 &"
      echo -e "${GREEN}Server started on port 3000${NC}"
      echo -e "You can access it through VS Code's port forwarding at ${BLUE}http://localhost:$HOST_PORT${NC}"
      ;;
    *)
      echo -e "${RED}Error: Unknown task '$TASK'${NC}"
      echo -e "Available tasks: lint, test, build, serve"
      exit 1
      ;;
  esac
}

# Start debugging a file
debug_file() {
  check_cli_tool
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No file specified${NC}"
    echo -e "Usage: $0 debug FILE"
    exit 1
  fi
  
  FILE="$1"
  WORKSPACE_PATH="/home/coder/workspace"
  FILE_PATH="$WORKSPACE_PATH/$FILE"
  
  # Check if file exists
  if ! $CLI_TOOL exec "[ -f '$FILE_PATH' ]" &>/dev/null; then
    echo -e "${RED}Error: File '$FILE' does not exist${NC}"
    exit 1
  fi
  
  # Determine file type and appropriate debug command
  FILE_EXT="${FILE##*.}"
  
  case "$FILE_EXT" in
    js|ts)
      # Create launch.json for Node.js debugging if it doesn't exist
      $CLI_TOOL exec "mkdir -p '$WORKSPACE_PATH/.vscode'"
      $CLI_TOOL exec "[ -f '$WORKSPACE_PATH/.vscode/launch.json' ] || echo '{
  \"version\": \"0.2.0\",
  \"configurations\": [
    {
      \"type\": \"node\",
      \"request\": \"launch\",
      \"name\": \"Debug Current File\",
      \"program\": \"\${file}\",
      \"skipFiles\": [\"<node_internals>/**\"]
    }
  ]
}' > '$WORKSPACE_PATH/.vscode/launch.json'"
      
      echo -e "${GREEN}Debug configuration created for Node.js${NC}"
      echo -e "To start debugging:"
      echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
      echo -e "2. Open the file $FILE"
      echo -e "3. Press F5 or click the Debug icon in the sidebar"
      ;;
      
    py)
      # Create launch.json for Python debugging if it doesn't exist
      $CLI_TOOL exec "mkdir -p '$WORKSPACE_PATH/.vscode'"
      $CLI_TOOL exec "[ -f '$WORKSPACE_PATH/.vscode/launch.json' ] || echo '{
  \"version\": \"0.2.0\",
  \"configurations\": [
    {
      \"name\": \"Python: Current File\",
      \"type\": \"python\",
      \"request\": \"launch\",
      \"program\": \"\${file}\",
      \"console\": \"integratedTerminal\"
    }
  ]
}' > '$WORKSPACE_PATH/.vscode/launch.json'"
      
      echo -e "${GREEN}Debug configuration created for Python${NC}"
      echo -e "To start debugging:"
      echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
      echo -e "2. Open the file $FILE"
      echo -e "3. Press F5 or click the Debug icon in the sidebar"
      ;;
      
    *)
      echo -e "${YELLOW}Warning: No specific debug configuration for .$FILE_EXT files${NC}"
      echo -e "Creating a generic launch.json"
      
      $CLI_TOOL exec "mkdir -p '$WORKSPACE_PATH/.vscode'"
      $CLI_TOOL exec "[ -f '$WORKSPACE_PATH/.vscode/launch.json' ] || echo '{
  \"version\": \"0.2.0\",
  \"configurations\": [
    {
      \"type\": \"node\",
      \"request\": \"launch\",
      \"name\": \"Debug Current File\",
      \"program\": \"\${file}\",
      \"skipFiles\": [\"<node_internals>/**\"]
    }
  ]
}' > '$WORKSPACE_PATH/.vscode/launch.json'"
      
      echo -e "To start debugging:"
      echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
      echo -e "2. Open the file $FILE"
      echo -e "3. Press F5 or click the Debug icon in the sidebar"
      ;;
  esac
}

# Run a git command
run_git() {
  check_cli_tool
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No git command specified${NC}"
    echo -e "Usage: $0 git COMMAND"
    echo -e "Examples: status, add ., commit -m \"message\", push"
    exit 1
  fi
  
  GIT_COMMAND="$1"
  
  echo -e "Running git command: ${BLUE}git $GIT_COMMAND${NC}"
  RESULT=$($CLI_TOOL exec "cd /home/coder/workspace && git $GIT_COMMAND")
  
  echo -e "${GREEN}Command output:${NC}"
  echo "$RESULT"
}

# Search for a pattern in workspace files
search_pattern() {
  check_cli_tool
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No search pattern specified${NC}"
    echo -e "Usage: $0 search PATTERN"
    exit 1
  fi
  
  PATTERN="$1"
  
  echo -e "Searching for pattern: ${BLUE}$PATTERN${NC}"
  RESULT=$($CLI_TOOL exec "cd /home/coder/workspace && grep -r '$PATTERN' --include='*.{js,py,html,css,json,md}' . 2>/dev/null || echo 'No matches found'")
  
  echo -e "${GREEN}Search results:${NC}"
  echo "$RESULT"
}

# Open a URL in the container's browser
open_browser() {
  check_cli_tool
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No URL specified${NC}"
    echo -e "Usage: $0 open-browser URL"
    exit 1
  fi
  
  URL="$1"
  
  echo -e "To access the URL ${BLUE}$URL${NC} from the container:"
  echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "2. Open a terminal in VS Code"
  echo -e "3. Run: ${YELLOW}curl $URL${NC} or use the browser extension if installed"
  
  # For demonstration, we'll fetch the URL content
  echo -e "\n${GREEN}Fetching URL content:${NC}"
  RESULT=$($CLI_TOOL exec "curl -s '$URL' | head -n 20")
  
  echo -e "${YELLOW}First 20 lines of content:${NC}"
  echo "$RESULT"
  echo -e "${YELLOW}[...]${NC}"
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
    edit)
      edit_file "$1"
      ;;
    run-terminal)
      run_terminal "$1"
      ;;
    create-project)
      create_project "$1" "$2"
      ;;
    install-extension)
      install_extension "$1"
      ;;
    run-task)
      run_task "$1"
      ;;
    debug)
      debug_file "$1"
      ;;
    git)
      run_git "$1"
      ;;
    search)
      search_pattern "$1"
      ;;
    open-browser)
      open_browser "$1"
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