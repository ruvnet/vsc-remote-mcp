/**
 * Test script for the modify_code tool
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

// Create a temporary test file
async function createTestFile() {
  const testDir = path.join(__dirname, 'test-temp');
  const testFile = path.join(testDir, 'test-modify.js');
  
  try {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFile, 'function testFunction() {\n  return "Hello, World!";\n}\n');
    return testFile;
  } catch (error) {
    console.error('Error creating test file:', error);
    process.exit(1);
  }
}

// Connect to the MCP server and test the modify_code tool
async function testModifyCode() {
  const testFile = await createTestFile();
  console.log(`Created test file: ${testFile}`);
  
  // Connect to the MCP server
  const ws = new WebSocket('ws://localhost:3001');
  
  // Handle connection open
  ws.on('open', () => {
    console.log('Connected to MCP server');
    
    // Send a request to use the modify_code tool
    const request = {
      id: uuidv4(),
      type: 'tool_request',
      timestamp: Date.now(),
      payload: {
        tool: 'modify_code',
        params: {
          file_path: testFile,
          operation: 'add',
          position: {
            line: 3
          },
          content: '  console.log("Modified!");\n'
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
  ws.on('close', async () => {
    console.log('Connection closed');
    
    // Read the modified file
    try {
      const content = await fs.readFile(testFile, 'utf8');
      console.log('Modified file content:');
      console.log(content);
      
      // Clean up
      await fs.unlink(testFile);
      await fs.rmdir(path.dirname(testFile), { recursive: true });
      console.log('Test file cleaned up');
    } catch (error) {
      console.error('Error reading or cleaning up test file:', error);
    }
    
    process.exit(0);
  });
}

// Run the test
testModifyCode();