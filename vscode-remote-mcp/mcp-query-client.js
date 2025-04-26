/**
 * MCP Query Client
 * This script allows you to run queries against the MCP server
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Start the MCP server if it's not already running
console.log('Starting MCP server...');
const server = spawn('node', ['run-mcp-server.js'], {
  stdio: ['ignore', 'pipe', process.stderr]
});

let serverReady = false;
let serverOutput = '';

server.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('Server output:', output.trim());
  
  if (output.includes('Server is ready') || output.includes('MCP Server started successfully')) {
    serverReady = true;
    console.log('\nMCP Server is ready to accept commands');
    showCommandMenu();
  }
});

server.on('error', (err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`MCP server process exited with code ${code}`);
  process.exit(0);
});

/**
 * Show the command menu
 */
function showCommandMenu() {
  console.log('\n=== MCP Command Menu ===');
  console.log('1. Execute terminal command');
  console.log('2. List files in directory');
  console.log('3. Read file content');
  console.log('4. Search code');
  console.log('5. Exit');
  
  rl.question('\nEnter command number: ', (answer) => {
    switch (answer) {
      case '1':
        rl.question('Enter terminal command: ', (cmd) => {
          executeCommand(cmd);
        });
        break;
      case '2':
        rl.question('Enter directory path: ', (path) => {
          listFiles(path);
        });
        break;
      case '3':
        rl.question('Enter file path: ', (path) => {
          readFile(path);
        });
        break;
      case '4':
        rl.question('Enter search query: ', (query) => {
          searchCode(query);
        });
        break;
      case '5':
        console.log('Shutting down...');
        server.kill();
        rl.close();
        process.exit(0);
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
function executeCommand(command) {
  console.log(`Executing command: ${command}`);
  
  const client = spawn('node', ['test-mcp-client.js', 'execute', command], {
    stdio: ['ignore', 'pipe', process.stderr]
  });
  
  let output = '';
  
  client.stdout.on('data', (data) => {
    output += data.toString();
    console.log(data.toString().trim());
  });
  
  client.on('close', (code) => {
    console.log(`Command execution completed with code ${code}`);
    
    // Wait a moment before showing the menu again
    setTimeout(() => {
      showCommandMenu();
    }, 1000);
  });
}

/**
 * List files in a directory
 * @param {string} path - The directory path
 */
function listFiles(path) {
  console.log(`Listing files in: ${path}`);
  
  const client = spawn('node', ['test-mcp-client.js', 'list', path], {
    stdio: ['ignore', 'pipe', process.stderr]
  });
  
  let output = '';
  
  client.stdout.on('data', (data) => {
    output += data.toString();
    console.log(data.toString().trim());
  });
  
  client.on('close', (code) => {
    console.log(`List files completed with code ${code}`);
    
    // Wait a moment before showing the menu again
    setTimeout(() => {
      showCommandMenu();
    }, 1000);
  });
}

/**
 * Read file content
 * @param {string} path - The file path
 */
function readFile(path) {
  console.log(`Reading file: ${path}`);
  
  const client = spawn('node', ['test-mcp-client.js', 'read', path], {
    stdio: ['ignore', 'pipe', process.stderr]
  });
  
  let output = '';
  
  client.stdout.on('data', (data) => {
    output += data.toString();
    console.log(data.toString().trim());
  });
  
  client.on('close', (code) => {
    console.log(`Read file completed with code ${code}`);
    
    // Wait a moment before showing the menu again
    setTimeout(() => {
      showCommandMenu();
    }, 1000);
  });
}

/**
 * Search code
 * @param {string} query - The search query
 */
function searchCode(query) {
  console.log(`Searching for: ${query}`);
  
  const client = spawn('node', ['test-mcp-client.js', 'search', query], {
    stdio: ['ignore', 'pipe', process.stderr]
  });
  
  let output = '';
  
  client.stdout.on('data', (data) => {
    output += data.toString();
    console.log(data.toString().trim());
  });
  
  client.on('close', (code) => {
    console.log(`Search completed with code ${code}`);
    
    // Wait a moment before showing the menu again
    setTimeout(() => {
      showCommandMenu();
    }, 1000);
  });
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down...');
  server.kill();
  rl.close();
  process.exit(0);
});