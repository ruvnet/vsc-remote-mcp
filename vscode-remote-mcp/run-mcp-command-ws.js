/**
 * Script to run a command against the MCP server using WebSockets
 */

const WebSocket = require('ws');
const crypto = require('crypto');

// Generate random IDs
const generateId = () => crypto.randomBytes(4).toString('hex');
const clientId = `mcp-client-${generateId()}`;
const workspaceId = `mcp-workspace-${generateId()}`;
const sessionId = `mcp-session-${generateId()}`;

console.log('Connecting to MCP server via WebSocket...');

// Connect to the MCP server
const ws = new WebSocket('ws://localhost:3001');

// Handle connection open
ws.on('open', () => {
  console.log('Connected to MCP server');
  
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

// Handle messages from the server
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log(`Received: ${message.type}`);
    
    if (message.type === 'connection_ack') {
      console.log('Connection acknowledged, creating session');
      
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
      console.log('Session created, executing command');
      
      // Execute a terminal command
      executeTerminalCommand('ls -la');
    }
    else if (message.type === 'error') {
      console.error(`Error: ${message.payload.message}`);
    }
    else if (message.type === 'command_result') {
      console.log('Command result:');
      console.log(message.payload.output);
      
      // Disconnect after receiving the command result
      console.log('Disconnecting...');
      sendMessage({
        type: 'disconnect',
        id: generateId(),
        payload: {
          clientId,
          reason: 'Command execution complete'
        }
      });
      
      // Close the connection after sending disconnect
      setTimeout(() => ws.close(), 500);
    }
  } catch (err) {
    console.error('Error parsing message:', err);
  }
});

// Handle connection close
ws.on('close', () => {
  console.log('Disconnected from server');
  process.exit(0);
});

// Handle errors
ws.on('error', (err) => {
  console.error('WebSocket error:', err);
  process.exit(1);
});

/**
 * Send a message to the server
 * @param {Object} message - The message to send
 */
function sendMessage(message) {
  console.log(`Sending: ${message.type}`);
  ws.send(JSON.stringify(message));
}

/**
 * Execute a terminal command via MCP
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
      }
    }
  });
}

// Set a timeout to exit if we don't get a response
setTimeout(() => {
  console.log('Timeout reached, exiting...');
  process.exit(1);
}, 10000);