/**
 * Interactive MCP Client
 * This script allows you to send commands to the MCP server and see the responses
 */

const net = require('net');
const crypto = require('crypto');
const readline = require('readline');

// Generate random IDs
const generateId = () => crypto.randomBytes(4).toString('hex');
const clientId = `mcp-client-${generateId()}`;
const workspaceId = `mcp-workspace-${generateId()}`;
const sessionId = `mcp-session-${generateId()}`;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connection state
let isConnected = false;
let isSessionCreated = false;

// Connect to the MCP server
const client = net.createConnection({ port: 3001, host: 'localhost' }, () => {
  console.log('Connected to MCP server');
  isConnected = true;
  
  // Send connection request
  sendMessage({
    type: 'connection',
    id: generateId(),
    payload: {
      clientId,
      workspaceId,
      clientVersion: '1.0.0'
    }
  });
});

// Handle data from the server
client.on('data', (data) => {
  const messages = parseMessages(data.toString());
  
  messages.forEach(message => {
    if (message) {
      console.log(`\nReceived: ${message.type}`);
      console.log(JSON.stringify(message, null, 2));
      
      if (message.type === 'connection_ack') {
        console.log('\nConnection acknowledged, creating session');
        
        // Create a session
        sendMessage({
          type: 'session_create',
          id: generateId(),
          payload: {
            sessionId,
            createdBy: clientId,
            workspaceId
          }
        });
      } 
      else if (message.type === 'session_create_ack') {
        console.log('\nSession created successfully');
        isSessionCreated = true;
        showCommandMenu();
      }
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
  console.log(`\nSending: ${message.type}`);
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
        console.error('Error parsing message:', err);
        return null;
      }
    })
    .filter(message => message !== null);
}

/**
 * Show the command menu
 */
function showCommandMenu() {
  console.log('\n=== MCP Command Menu ===');
  console.log('1. Execute terminal command (ls -la)');
  console.log('2. Execute custom terminal command');
  console.log('3. List files in directory');
  console.log('4. Read file content');
  console.log('5. Disconnect');
  
  rl.question('\nEnter command number: ', (answer) => {
    switch (answer) {
      case '1':
        executeTerminalCommand('ls -la');
        break;
      case '2':
        rl.question('Enter terminal command: ', (cmd) => {
          executeTerminalCommand(cmd);
        });
        break;
      case '3':
        rl.question('Enter directory path: ', (path) => {
          listFiles(path);
        });
        break;
      case '4':
        rl.question('Enter file path: ', (path) => {
          readFile(path);
        });
        break;
      case '5':
        disconnect();
        break;
      default:
        console.log('Invalid command');
        showCommandMenu();
        break;
    }
  });
}

/**
 * Execute a terminal command
 * @param {string} command - The command to execute
 */
function executeTerminalCommand(command) {
  console.log(`Executing command: ${command}`);
  
  sendMessage({
    type: 'tool_invoke',
    id: generateId(),
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
  
  // Wait for response before showing menu again
  setTimeout(() => {
    showCommandMenu();
  }, 1000);
}

/**
 * List files in a directory
 * @param {string} path - The directory path
 */
function listFiles(path) {
  console.log(`Listing files in: ${path}`);
  
  sendMessage({
    type: 'tool_invoke',
    id: generateId(),
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
  
  // Wait for response before showing menu again
  setTimeout(() => {
    showCommandMenu();
  }, 1000);
}

/**
 * Read file content
 * @param {string} path - The file path
 */
function readFile(path) {
  console.log(`Reading file: ${path}`);
  
  sendMessage({
    type: 'tool_invoke',
    id: generateId(),
    payload: {
      tool: 'filesystem',
      method: 'read_file',
      parameters: {
        path
      },
      sessionId
    }
  });
  
  // Wait for response before showing menu again
  setTimeout(() => {
    showCommandMenu();
  }, 1000);
}

/**
 * Disconnect from the server
 */
function disconnect() {
  console.log('Disconnecting from server...');
  
  sendMessage({
    type: 'disconnect',
    id: generateId(),
    payload: {
      clientId,
      reason: 'User requested disconnect'
    }
  });
  
  // Close the connection after sending disconnect
  setTimeout(() => {
    client.end();
    rl.close();
  }, 500);
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, disconnecting...');
  if (isConnected) {
    disconnect();
  } else {
    process.exit(0);
  }
});