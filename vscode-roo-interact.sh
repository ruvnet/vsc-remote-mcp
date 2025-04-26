#!/bin/bash
# VS Code Roo Extension Interaction Script
# This script allows you to interact with the Roo extension in the VS Code Docker instance

set -e

# Default values
CONTAINER_NAME="vscode-vscode-roo-1"
HOST_PORT="8080"
CLI_TOOL="./vscode-remote-cli.sh"
INTERACT_TOOL="./vscode-remote-interact.sh"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help message
show_help() {
  echo -e "${BLUE}VS Code Roo Extension Interaction Script${NC}"
  echo
  echo "Usage: $0 [command] [options]"
  echo
  echo "Commands:"
  echo "  ask PROMPT                  Ask Roo a question or give it a task"
  echo "  explain FILE                Ask Roo to explain a file"
  echo "  optimize FILE               Ask Roo to optimize a file"
  echo "  refactor FILE INSTRUCTIONS  Ask Roo to refactor a file with specific instructions"
  echo "  generate DESCRIPTION        Ask Roo to generate code based on a description"
  echo "  test FILE                   Ask Roo to generate tests for a file"
  echo "  debug FILE ERROR            Ask Roo to debug a file with a specific error"
  echo "  document FILE               Ask Roo to document a file"
  echo "  setup-roo                   Set up Roo extension configuration"
  echo "  check-roo                   Check if Roo extension is working properly"
  echo "  help                        Show this help message"
  echo
  echo "Options:"
  echo "  --container NAME            Specify container name (default: $CONTAINER_NAME)"
  echo "  --port PORT                 Specify host port (default: $HOST_PORT)"
  echo "  --cli TOOL                  Specify CLI tool path (default: $CLI_TOOL)"
  echo "  --interact TOOL             Specify interaction tool path (default: $INTERACT_TOOL)"
  echo
  echo "Examples:"
  echo "  $0 ask \"How do I create a React component?\""
  echo "  $0 explain app.js"
  echo "  $0 optimize main.py"
  echo "  $0 refactor index.js \"Convert to arrow functions\""
  echo "  $0 generate \"Create a function that sorts an array of objects by a property\""
}

# Check if the CLI tool exists
check_tools() {
  if [ ! -f "$CLI_TOOL" ]; then
    echo -e "${RED}Error: CLI tool '$CLI_TOOL' not found${NC}"
    echo -e "Specify the correct path with ${YELLOW}--cli${NC} option"
    exit 1
  fi
  
  if [ ! -f "$INTERACT_TOOL" ]; then
    echo -e "${RED}Error: Interaction tool '$INTERACT_TOOL' not found${NC}"
    echo -e "Specify the correct path with ${YELLOW}--interact${NC} option"
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
      --cli)
        CLI_TOOL="$2"
        shift 2
        ;;
      --interact)
        INTERACT_TOOL="$2"
        shift 2
        ;;
      *)
        break
        ;;
    esac
  done
}

# Create a keybindings.json file to trigger Roo commands
create_keybindings() {
  check_tools
  
  echo -e "Creating keybindings for Roo commands..."
  
  $CLI_TOOL exec "mkdir -p /home/coder/.config/Code/User"
  
  $CLI_TOOL exec "cat > /home/coder/.config/Code/User/keybindings.json << 'EOL'
[
  {
    \"key\": \"ctrl+shift+a\",
    \"command\": \"roo.ask\"
  },
  {
    \"key\": \"ctrl+shift+e\",
    \"command\": \"roo.explain\"
  },
  {
    \"key\": \"ctrl+shift+o\",
    \"command\": \"roo.optimize\"
  },
  {
    \"key\": \"ctrl+shift+r\",
    \"command\": \"roo.refactor\"
  },
  {
    \"key\": \"ctrl+shift+g\",
    \"command\": \"roo.generate\"
  },
  {
    \"key\": \"ctrl+shift+t\",
    \"command\": \"roo.test\"
  },
  {
    \"key\": \"ctrl+shift+d\",
    \"command\": \"roo.debug\"
  }
]
EOL"
  
  echo -e "${GREEN}Keybindings created successfully${NC}"
}

# Create a settings.json file to configure Roo
create_settings() {
  check_tools
  
  echo -e "Creating settings for Roo extension..."
  
  $CLI_TOOL exec "mkdir -p /home/coder/.config/Code/User"
  
  $CLI_TOOL exec "cat > /home/coder/.config/Code/User/settings.json << 'EOL'
{
  \"roo.apiKey\": \"${ROO_API_KEY:-}\",
  \"roo.model\": \"claude-3-7-sonnet-latest\",
  \"roo.enableAutoComplete\": true,
  \"roo.enableInlineChat\": true,
  \"roo.enableCodeLens\": true,
  \"roo.showWelcomeOnStartup\": true,
  \"roo.telemetryLevel\": \"error\",
  \"editor.formatOnSave\": true,
  \"editor.tabSize\": 2
}
EOL"
  
  echo -e "${GREEN}Settings created successfully${NC}"
}

# Create a JavaScript file to interact with Roo via the VS Code API
create_roo_interaction_script() {
  check_tools
  
  echo -e "Creating Roo interaction script..."
  
  $CLI_TOOL exec "mkdir -p /home/coder/workspace/roo-scripts"
  
  $CLI_TOOL exec "cat > /home/coder/workspace/roo-scripts/roo-interact.js << 'EOL'
// This script uses the VS Code API to interact with the Roo extension
const vscode = require('vscode');

/**
 * Interacts with the Roo extension
 * @param {string} command - The Roo command to execute
 * @param {string} input - The input for the command
 * @returns {Promise<string>} - The result of the command
 */
async function interactWithRoo(command, input) {
  try {
    // Check if Roo extension is available
    const rooExtension = vscode.extensions.getExtension('rooveterinaryinc.roo-cline');
    if (!rooExtension) {
      return 'Roo extension is not installed or not activated';
    }
    
    // Make sure the extension is activated
    if (!rooExtension.isActive) {
      await rooExtension.activate();
    }
    
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;
    if (!editor && ['explain', 'optimize', 'refactor', 'test', 'debug', 'document'].includes(command)) {
      return 'No active text editor';
    }
    
    // Execute the appropriate command based on the input
    switch (command) {
      case 'ask':
        await vscode.commands.executeCommand('roo.ask', input);
        return 'Asked Roo: ' + input;
        
      case 'explain':
        if (editor) {
          await vscode.commands.executeCommand('roo.explain');
          return 'Asked Roo to explain the current file';
        }
        return 'No active text editor';
        
      case 'optimize':
        if (editor) {
          await vscode.commands.executeCommand('roo.optimize');
          return 'Asked Roo to optimize the current file';
        }
        return 'No active text editor';
        
      case 'refactor':
        if (editor) {
          await vscode.commands.executeCommand('roo.refactor', input);
          return 'Asked Roo to refactor the current file with instructions: ' + input;
        }
        return 'No active text editor';
        
      case 'generate':
        await vscode.commands.executeCommand('roo.generate', input);
        return 'Asked Roo to generate code based on: ' + input;
        
      case 'test':
        if (editor) {
          await vscode.commands.executeCommand('roo.test');
          return 'Asked Roo to generate tests for the current file';
        }
        return 'No active text editor';
        
      case 'debug':
        if (editor) {
          await vscode.commands.executeCommand('roo.debug', input);
          return 'Asked Roo to debug the current file with error: ' + input;
        }
        return 'No active text editor';
        
      case 'document':
        if (editor) {
          await vscode.commands.executeCommand('roo.document');
          return 'Asked Roo to document the current file';
        }
        return 'No active text editor';
        
      default:
        return 'Unknown command: ' + command;
    }
  } catch (error) {
    return 'Error: ' + error.message;
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];
const input = args[1] || '';

// Execute the command and print the result
interactWithRoo(command, input)
  .then(result => console.log(result))
  .catch(error => console.error('Error:', error));
EOL"
  
  echo -e "${GREEN}Roo interaction script created successfully${NC}"
}

# Create a VS Code extension to run the Roo interaction script
create_roo_extension() {
  check_tools
  
  echo -e "Creating VS Code extension for Roo interaction..."
  
  $CLI_TOOL exec "mkdir -p /home/coder/workspace/roo-extension/src"
  
  # Create package.json
  $CLI_TOOL exec "cat > /home/coder/workspace/roo-extension/package.json << 'EOL'
{
  \"name\": \"roo-extension-runner\",
  \"displayName\": \"Roo Extension Runner\",
  \"description\": \"Run Roo extension commands from the command line\",
  \"version\": \"0.1.0\",
  \"engines\": {
    \"vscode\": \"^1.60.0\"
  },
  \"categories\": [
    \"Other\"
  ],
  \"activationEvents\": [
    \"onCommand:rooExtensionRunner.runCommand\"
  ],
  \"main\": \"./src/extension.js\",
  \"contributes\": {
    \"commands\": [
      {
        \"command\": \"rooExtensionRunner.runCommand\",
        \"title\": \"Run Roo Command\"
      }
    ]
  },
  \"scripts\": {
    \"lint\": \"eslint .\",
    \"pretest\": \"npm run lint\",
    \"test\": \"node ./test/runTest.js\"
  },
  \"devDependencies\": {
    \"@types/vscode\": \"^1.60.0\",
    \"eslint\": \"^8.1.0\"
  }
}
EOL"
  
  # Create extension.js
  $CLI_TOOL exec "cat > /home/coder/workspace/roo-extension/src/extension.js << 'EOL'
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('rooExtensionRunner.runCommand', async (command, input) => {
    try {
      // Check if Roo extension is available
      const rooExtension = vscode.extensions.getExtension('rooveterinaryinc.roo-cline');
      if (!rooExtension) {
        vscode.window.showErrorMessage('Roo extension is not installed or not activated');
        return;
      }
      
      // Make sure the extension is activated
      if (!rooExtension.isActive) {
        await rooExtension.activate();
      }
      
      // Execute the command
      switch (command) {
        case 'ask':
          await vscode.commands.executeCommand('roo.ask', input);
          break;
        case 'explain':
          await vscode.commands.executeCommand('roo.explain');
          break;
        case 'optimize':
          await vscode.commands.executeCommand('roo.optimize');
          break;
        case 'refactor':
          await vscode.commands.executeCommand('roo.refactor', input);
          break;
        case 'generate':
          await vscode.commands.executeCommand('roo.generate', input);
          break;
        case 'test':
          await vscode.commands.executeCommand('roo.test');
          break;
        case 'debug':
          await vscode.commands.executeCommand('roo.debug', input);
          break;
        case 'document':
          await vscode.commands.executeCommand('roo.document');
          break;
        default:
          vscode.window.showErrorMessage('Unknown command: ' + command);
      }
    } catch (error) {
      vscode.window.showErrorMessage('Error: ' + error.message);
    }
  });
  
  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
EOL"
  
  echo -e "${GREEN}Roo extension created successfully${NC}"
}

# Set up Roo extension configuration
setup_roo() {
  check_tools
  
  echo -e "Setting up Roo extension configuration..."
  
  # Create keybindings
  create_keybindings
  
  # Create settings
  create_settings
  
  # Create interaction script
  create_roo_interaction_script
  
  # Create extension
  create_roo_extension
  
  echo -e "${GREEN}Roo extension setup completed successfully${NC}"
  echo -e "You can now use the Roo extension in VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
}

# Check if Roo extension is working properly
check_roo() {
  check_tools
  
  echo -e "Checking if Roo extension is installed and working..."
  
  # Check if Roo extension is installed
  RESULT=$($CLI_TOOL list-ext | grep -q "rooveterinaryinc.roo-cline" && echo "yes" || echo "no")
  
  if [ "$RESULT" = "yes" ]; then
    echo -e "${GREEN}Roo extension is installed${NC}"
  else
    echo -e "${RED}Roo extension is not installed${NC}"
    echo -e "Installing Roo extension..."
    $CLI_TOOL install-ext "rooveterinaryinc.roo-cline"
  fi
  
  # Create a test file to interact with Roo
  echo -e "Creating a test file to interact with Roo..."
  
  $INTERACT_TOOL run-terminal "mkdir -p /home/coder/workspace/roo-test"
  
  $INTERACT_TOOL run-terminal "cat > /home/coder/workspace/roo-test/test-roo.js << 'EOL'
/**
 * A simple function to test Roo's capabilities
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} - Sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * This function needs optimization
 */
function inefficientFunction() {
  let result = 0;
  for (let i = 0; i < 1000; i++) {
    for (let j = 0; j < 1000; j++) {
      result += i * j;
    }
  }
  return result;
}

// This code has a bug
function buggyFunction(arr) {
  let sum = 0;
  for (let i = 0; i <= arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

// This function needs documentation
function undocumentedFunction(x, y, z) {
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    throw new Error('All parameters must be numbers');
  }
  
  const result = Math.sqrt(x * x + y * y + z * z);
  return result.toFixed(2);
}

module.exports = {
  add,
  inefficientFunction,
  buggyFunction,
  undocumentedFunction
};
EOL"
  
  echo -e "${GREEN}Test file created successfully${NC}"
  echo -e "You can now interact with Roo using this file at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "Open the file at /home/coder/workspace/roo-test/test-roo.js and use Roo commands"
}

# Ask Roo a question or give it a task
ask_roo() {
  check_tools
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No prompt specified${NC}"
    echo -e "Usage: $0 ask PROMPT"
    exit 1
  fi
  
  PROMPT="$1"
  
  echo -e "Asking Roo: ${BLUE}$PROMPT${NC}"
  
  # Create a temporary file with the prompt
  $INTERACT_TOOL run-terminal "mkdir -p /home/coder/workspace/roo-prompts"
  $INTERACT_TOOL run-terminal "echo '$PROMPT' > /home/coder/workspace/roo-prompts/prompt.txt"
  
  echo -e "${GREEN}Prompt saved to /home/coder/workspace/roo-prompts/prompt.txt${NC}"
  echo -e "To interact with Roo:"
  echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "2. Open the Command Palette (Ctrl+Shift+P)"
  echo -e "3. Type 'Roo: Ask' and press Enter"
  echo -e "4. Paste the prompt or type your question"
}

# Ask Roo to explain a file
explain_file() {
  check_tools
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No file specified${NC}"
    echo -e "Usage: $0 explain FILE"
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
  
  echo -e "To ask Roo to explain file ${BLUE}$FILE${NC}:"
  echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "2. Open the file $FILE"
  echo -e "3. Open the Command Palette (Ctrl+Shift+P)"
  echo -e "4. Type 'Roo: Explain' and press Enter"
}

# Ask Roo to optimize a file
optimize_file() {
  check_tools
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No file specified${NC}"
    echo -e "Usage: $0 optimize FILE"
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
  
  echo -e "To ask Roo to optimize file ${BLUE}$FILE${NC}:"
  echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "2. Open the file $FILE"
  echo -e "3. Open the Command Palette (Ctrl+Shift+P)"
  echo -e "4. Type 'Roo: Optimize' and press Enter"
}

# Ask Roo to refactor a file with specific instructions
refactor_file() {
  check_tools
  
  if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: File or instructions not specified${NC}"
    echo -e "Usage: $0 refactor FILE INSTRUCTIONS"
    exit 1
  fi
  
  FILE="$1"
  INSTRUCTIONS="$2"
  WORKSPACE_PATH="/home/coder/workspace"
  FILE_PATH="$WORKSPACE_PATH/$FILE"
  
  # Check if file exists
  if ! $CLI_TOOL exec "[ -f '$FILE_PATH' ]" &>/dev/null; then
    echo -e "${RED}Error: File '$FILE' does not exist${NC}"
    exit 1
  fi
  
  # Create a temporary file with the instructions
  $INTERACT_TOOL run-terminal "mkdir -p /home/coder/workspace/roo-prompts"
  $INTERACT_TOOL run-terminal "echo '$INSTRUCTIONS' > /home/coder/workspace/roo-prompts/refactor.txt"
  
  echo -e "To ask Roo to refactor file ${BLUE}$FILE${NC} with instructions: ${BLUE}$INSTRUCTIONS${NC}"
  echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "2. Open the file $FILE"
  echo -e "3. Open the Command Palette (Ctrl+Shift+P)"
  echo -e "4. Type 'Roo: Refactor' and press Enter"
  echo -e "5. Enter the instructions from /home/coder/workspace/roo-prompts/refactor.txt"
}

# Ask Roo to generate code based on a description
generate_code() {
  check_tools
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No description specified${NC}"
    echo -e "Usage: $0 generate DESCRIPTION"
    exit 1
  fi
  
  DESCRIPTION="$1"
  
  # Create a temporary file with the description
  $INTERACT_TOOL run-terminal "mkdir -p /home/coder/workspace/roo-prompts"
  $INTERACT_TOOL run-terminal "echo '$DESCRIPTION' > /home/coder/workspace/roo-prompts/generate.txt"
  
  echo -e "To ask Roo to generate code based on description: ${BLUE}$DESCRIPTION${NC}"
  echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "2. Open the Command Palette (Ctrl+Shift+P)"
  echo -e "3. Type 'Roo: Generate' and press Enter"
  echo -e "4. Enter the description from /home/coder/workspace/roo-prompts/generate.txt"
}

# Ask Roo to generate tests for a file
test_file() {
  check_tools
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No file specified${NC}"
    echo -e "Usage: $0 test FILE"
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
  
  echo -e "To ask Roo to generate tests for file ${BLUE}$FILE${NC}:"
  echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "2. Open the file $FILE"
  echo -e "3. Open the Command Palette (Ctrl+Shift+P)"
  echo -e "4. Type 'Roo: Test' and press Enter"
}

# Ask Roo to debug a file with a specific error
debug_file() {
  check_tools
  
  if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: File or error not specified${NC}"
    echo -e "Usage: $0 debug FILE ERROR"
    exit 1
  fi
  
  FILE="$1"
  ERROR="$2"
  WORKSPACE_PATH="/home/coder/workspace"
  FILE_PATH="$WORKSPACE_PATH/$FILE"
  
  # Check if file exists
  if ! $CLI_TOOL exec "[ -f '$FILE_PATH' ]" &>/dev/null; then
    echo -e "${RED}Error: File '$FILE' does not exist${NC}"
    exit 1
  fi
  
  # Create a temporary file with the error
  $INTERACT_TOOL run-terminal "mkdir -p /home/coder/workspace/roo-prompts"
  $INTERACT_TOOL run-terminal "echo '$ERROR' > /home/coder/workspace/roo-prompts/debug.txt"
  
  echo -e "To ask Roo to debug file ${BLUE}$FILE${NC} with error: ${BLUE}$ERROR${NC}"
  echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "2. Open the file $FILE"
  echo -e "3. Open the Command Palette (Ctrl+Shift+P)"
  echo -e "4. Type 'Roo: Debug' and press Enter"
  echo -e "5. Enter the error from /home/coder/workspace/roo-prompts/debug.txt"
}

# Ask Roo to document a file
document_file() {
  check_tools
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No file specified${NC}"
    echo -e "Usage: $0 document FILE"
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
  
  echo -e "To ask Roo to document file ${BLUE}$FILE${NC}:"
  echo -e "1. Open VS Code at ${BLUE}http://localhost:$HOST_PORT${NC}"
  echo -e "2. Open the file $FILE"
  echo -e "3. Open the Command Palette (Ctrl+Shift+P)"
  echo -e "4. Type 'Roo: Document' and press Enter"
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
    ask)
      ask_roo "$1"
      ;;
    explain)
      explain_file "$1"
      ;;
    optimize)
      optimize_file "$1"
      ;;
    refactor)
      refactor_file "$1" "$2"
      ;;
    generate)
      generate_code "$1"
      ;;
    test)
      test_file "$1"
      ;;
    debug)
      debug_file "$1" "$2"
      ;;
    document)
      document_file "$1"
      ;;
    setup-roo)
      setup_roo
      ;;
    check-roo)
      check_roo
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