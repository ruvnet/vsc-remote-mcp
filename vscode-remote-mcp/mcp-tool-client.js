/**
 * MCP Tool Client
 * This script allows you to run commands against the MCP server
 * 
 * Usage:
 *   node mcp-tool-client.js <command> [arguments]
 * 
 * Commands:
 *   execute <command>     - Execute a terminal command
 *   list <path>           - List files in a directory
 *   read <path>           - Read file content
 *   search <query>        - Search code for a pattern
 *   help                  - Show this help message
 */

const net = require('net');
const crypto = require('crypto');

// Generate random IDs
const generateId = () => crypto.randomBytes(4).toString('hex');
const clientId = `mcp-client-${generateId()}`;
const workspaceId = `mcp-workspace-${generateId()}`;
const sessionId = `mcp-session-${generateId()}`;

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const commandArgs = args.slice(1);

// Show help immediately if requested
if (!command || command === 'help') {
  showHelp();
  process.exit(0);
}

// Connection state
let isConnected = false;
let isSessionCreated = false;
let pendingRequests = new Map();

// Connect to the MCP server
const client = net.createConnection({ port: 3001, host: 'localhost' }, () => {
  console.log('Connected to MCP server');
  isConnected = true;
  
  // Send connection request
  const connectionId = generateId();
  sendMessage({
    type: 'connection',
    id: connectionId,
    payload: {
      clientId,
      workspaceId,
      clientVersion: '1.0.0'
    }
  });
  
  // Track this request
  pendingRequests.set(connectionId, {
    type: 'connection',
    callback: (response) => {
      if (response.payload.status === 'connected') {
        console.log('Connection established');
        createSession();
      } else {
        console.error('Connection failed:', response.payload);
        client.end();
        process.exit(1);
      }
    }
  });
});

// Handle data from the server
client.on('data', (data) => {
  const messages = parseMessages(data.toString());
  
  messages.forEach(message => {
    if (message) {
      handleMessage(message);
    }
  });
});

// Handle connection close
client.on('end', () => {
  console.log('Disconnected from server');
  isConnected = false;
  process.exit(0);
});

// Handle errors
client.on('error', (err) => {
  console.error('Connection error:', err);
  isConnected = false;
  process.exit(1);
});

/**
 * Send a message to the server
 * @param {Object} message - The message to send
 */
function sendMessage(message) {
  if (process.env.DEBUG) {
    console.log(`Sending: ${message.type}`);
  }
  client.write(JSON.stringify(message) + '\n');
}

/**
 * Parse messages from the server
 * @param {string} data - The data received from the server
 * @returns {Array} Array of parsed messages
 */
function parseMessages(data) {
  return data.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (err) {
        if (process.env.DEBUG) {
          console.error('Error parsing message:', err);
        }
        return null;
      }
    })
    .filter(message => message !== null);
}

/**
 * Handle a message from the server
 * @param {Object} message - The message to handle
 */
function handleMessage(message) {
  if (process.env.DEBUG) {
    console.log(`Received: ${message.type}`);
  }
  
  // Check if this is a response to a pending request
  if (message.id && pendingRequests.has(message.id)) {
    const request = pendingRequests.get(message.id);
    pendingRequests.delete(message.id);
    request.callback(message);
    return;
  }
  
  // Handle specific message types
  switch (message.type) {
    case 'tool_response':
      handleToolResponse(message);
      break;
    case 'error':
      console.error('Error from server:', message.payload);
      break;
    default:
      // Ignore other message types
      break;
  }
}

/**
 * Handle a tool response from the server
 * @param {Object} message - The tool response message
 */
function handleToolResponse(message) {
  const { tool, method, result } = message.payload;
  
  console.log(`\nTool Response: ${tool}.${method}`);
  
  if (result.error) {
    console.error('Error:', result.error);
  } else {
    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));
  }
  
  // Exit after receiving the tool response
  setTimeout(() => {
    disconnect();
  }, 500);
}

/**
 * Create a session
 */
function createSession() {
  const sessionCreateId = generateId();
  
  sendMessage({
    type: 'session_create',
    id: sessionCreateId,
    payload: {
      sessionId,
      createdBy: clientId,
      workspaceId
    }
  });
  
  // Track this request
  pendingRequests.set(sessionCreateId, {
    type: 'session_create',
    callback: (response) => {
      if (response.payload.status === 'created') {
        console.log('Session created');
        isSessionCreated = true;
        executeCommand();
      } else {
        console.error('Session creation failed:', response.payload);
        client.end();
        process.exit(1);
      }
    }
  });
}

/**
 * Execute the requested command
 */
function executeCommand() {
  switch (command) {
    case 'execute':
      if (commandArgs.length === 0) {
        console.error('Error: No command specified');
        disconnect();
        return;
      }
      executeTerminalCommand(commandArgs.join(' '));
      break;
    case 'list':
      if (commandArgs.length === 0) {
        console.error('Error: No path specified');
        disconnect();
        return;
      }
      listFiles(commandArgs[0]);
      break;
    case 'read':
      if (commandArgs.length === 0) {
        console.error('Error: No path specified');
        disconnect();
        return;
      }
      readFile(commandArgs[0]);
      break;
    case 'search':
      if (commandArgs.length === 0) {
        console.error('Error: No query specified');
        disconnect();
        return;
      }
      searchCode(commandArgs.join(' '));
      break;
    default:
      console.error(`Error: Unknown command '${command}'`);
      disconnect();
      break;
  }
}

/**
 * Execute a terminal command
 * @param {string} command - The command to execute
 */
function executeTerminalCommand(command) {
  console.log(`Executing command: ${command}`);
  
  const toolId = generateId();
  sendMessage({
    type: 'tool_invoke',
    id: toolId,
    payload: {
      tool: 'terminal',
      method: 'execute_command',
      parameters: {
        command,
        cwd: '.'
      },
      sessionId
    }
  });
}

/**
 * List files in a directory
 * @param {string} path - The directory path
 */
function listFiles(path) {
  console.log(`Listing files in: ${path}`);
  
  const toolId = generateId();
  sendMessage({
    type: 'tool_invoke',
    id: toolId,
    payload: {
      tool: 'filesystem',
      method: 'list_files',
      parameters: {
        path,
        recursive: false
      },
      sessionId
    }
  });
}

/**
 * Read file content
 * @param {string} path - The file path
 */
function readFile(path) {
  console.log(`Reading file: ${path}`);
  
  const toolId = generateId();
  sendMessage({
    type: 'tool_invoke',
    id: toolId,
    payload: {
      tool: 'filesystem',
      method: 'read_file',
      parameters: {
        path
      },
      sessionId
    }
  });
}

/**
 * Search code
 * @param {string} query - The search query
 */
function searchCode(query) {
  console.log(`Searching for: ${query}`);
  
  const toolId = generateId();
  sendMessage({
    type: 'tool_invoke',
    id: toolId,
    payload: {
      tool: 'search',
      method: 'search_code',
      parameters: {
        query,
        caseSensitive: false,
        useRegex: false
      },
      sessionId
    }
  });
}

/**
 * Disconnect from the server
 */
function disconnect() {
  if (!isConnected) {
    process.exit(0);
    return;
  }
  
  console.log('Disconnecting from server...');
  
  const disconnectId = generateId();
  sendMessage({
    type: 'disconnect',
    id: disconnectId,
    payload: {
      clientId,
      reason: 'Command completed'
    }
  });
  
  // Close the connection after sending disconnect
  setTimeout(() => {
    client.end();
  }, 500);
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
MCP Tool Client
This script allows you to run commands against the MCP server

Usage:
  node mcp-tool-client.js <command> [arguments]

Commands:
  execute <command>     - Execute a terminal command
  list <path>           - List files in a directory
  read <path>           - Read file content
  search <query>        - Search code for a pattern
  help                  - Show this help message
`);
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, disconnecting...');
  disconnect();
});