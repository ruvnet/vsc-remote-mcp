/**
 * Script to run a command against the MCP server
 */

const net = require('net');
const crypto = require('crypto');

// Generate random IDs
const generateId = () => crypto.randomBytes(4).toString('hex');
const clientId = `mcp-client-${generateId()}`;
const workspaceId = `mcp-workspace-${generateId()}`;
const sessionId = `mcp-session-${generateId()}`;

// Connect to the MCP server
const client = net.createConnection({ port: 3001, host: 'localhost' }, () => {
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

// Handle data from the server
client.on('data', (data) => {
  const messages = parseMessages(data.toString());
  
  messages.forEach(message => {
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
  });
});

// Handle connection close
client.on('end', () => {
  console.log('Disconnected from server');
});

// Handle errors
client.on('error', (err) => {
  console.error('Connection error:', err);
});

/**
 * Send a message to the server
 * @param {Object} message - The message to send
 */
function sendMessage(message) {
  console.log(`Sending: ${message.type}`);
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
 * Execute a terminal command via MCP
 * @param {string} command - The command to execute
 */
function executeTerminalCommand(command) {
  console.log(`Executing command: ${command}`);
  
  sendMessage({
    type: 'execute_command',
    id: generateId(),
    payload: {
      command,
      cwd: '.',
      tool: 'terminal'
    }
  });
  
  // Disconnect after a short delay
  setTimeout(() => {
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
    setTimeout(() => client.end(), 500);
  }, 2000);
}