/**
 * Test script for the search_code tool
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Connect to the MCP server
const ws = new WebSocket('ws://localhost:3001');

// Handle connection open
ws.on('open', () => {
  console.log('Connected to MCP server');
  
  // Send a request to use the search_code tool
  const request = {
    id: uuidv4(),
    type: 'tool_request',
    timestamp: Date.now(),
    payload: {
      tool: 'search_code',
      params: {
        pattern: 'function',
        directory: 'src/tools',
        file_pattern: '*.js',
        context_lines: 2
      }
    }
  };
  
  console.log('Sending request:', JSON.stringify(request, null, 2));
  ws.send(JSON.stringify(request));
});

// Handle messages
ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received response:', JSON.stringify(message, null, 2));
  
  // Check if the response has the content array
  if (message.payload && message.payload.result) {
    if (Array.isArray(message.payload.result.content)) {
      console.log('SUCCESS: Response contains content array');
    } else {
      console.error('ERROR: Response does not contain content array');
    }
  }
  
  // Close the connection after receiving the response
  ws.close();
});

// Handle errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle connection close
ws.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});