# Timeout Handling in VSCode Remote MCP

## Issue Resolution

The MCP server was experiencing timeout issues with the error message "MCP error -32001: Request timed out". This document explains the fix and provides guidance for future timeout handling.

### Root Cause

The server was using an incorrect error code for timeout responses:
- Using: `-32603` (Internal error)
- Expected: `-32001` (Request timeout)

This mismatch caused clients to not properly recognize timeout errors, leading to confusion and potential hanging requests.

### Solution Implemented

1. Updated the error code in `run-mcp-server.js` to use the correct MCP error code for timeouts:
   ```javascript
   sendErrorResponse(id, -32001, `Request timed out after ${REQUEST_TIMEOUT}ms`);
   ```

2. Maintained the existing timeout handling mechanism:
   - Setting timeouts for each request
   - Clearing timeouts when responses are received
   - Removing requests from the active requests map when completed

## Timeout Configuration

The server uses the following timeout configuration:

```javascript
// Configuration from environment variables
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '45000', 10);
```

You can adjust the timeout duration by:
1. Setting the `REQUEST_TIMEOUT` environment variable
2. Modifying the default value in the code (currently 45 seconds)

## Comprehensive Timeout Strategy

### 1. Multi-Level Timeout Configuration

For robust timeout handling, configure timeouts at multiple levels:

```javascript
// Server-level configuration
const SERVER_TIMEOUT = parseInt(process.env.SERVER_TIMEOUT || '300000', 10); // 5 minutes

// Request-level configuration (per tool)
const TOOL_TIMEOUTS = {
  'execute_command': parseInt(process.env.COMMAND_TIMEOUT || '60000', 10), // 1 minute
  'analyze_code': parseInt(process.env.ANALYZE_TIMEOUT || '120000', 10),   // 2 minutes
  'default': parseInt(process.env.REQUEST_TIMEOUT || '45000', 10)          // 45 seconds
};

// Get appropriate timeout for a tool
function getToolTimeout(toolName) {
  return TOOL_TIMEOUTS[toolName] || TOOL_TIMEOUTS.default;
}
```

### 2. Keep-Alive Mechanisms

Implement heartbeat/keep-alive mechanisms to maintain connections:

```javascript
// Send heartbeat periodically
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '10000', 10);
setInterval(() => {
  sendResponse({
    jsonrpc: '2.0',
    method: 'mcp.heartbeat',
    params: {
      timestamp: new Date().toISOString()
    }
  });
}, HEARTBEAT_INTERVAL);
```

### 3. Progress Updates for Long-Running Operations

For long-running operations, send progress updates:

```javascript
async function executeCommand(args, id) {
  // Set up progress reporting
  const progressInterval = setInterval(() => {
    sendResponse({
      jsonrpc: '2.0',
      method: 'mcp.progress',
      params: {
        id,
        progress: {
          message: 'Command still running...'
        }
      }
    });
  }, 5000); // Send progress every 5 seconds
  
  try {
    // Execute command...
    return result;
  } finally {
    clearInterval(progressInterval);
  }
}
```

## Best Practices for Timeout Handling

1. **Use Correct Error Codes**:
   - `-32001` for request timeouts
   - Follow the MCP protocol error code standards

2. **Clean Up Resources**:
   - Always clear timeouts when operations complete
   - Remove requests from tracking maps/collections
   - Ensure no memory leaks from abandoned requests

3. **Appropriate Timeout Values**:
   - Consider operation complexity when setting timeouts
   - Long-running operations may need longer timeouts
   - Critical operations may need shorter timeouts with retry logic

4. **Client-Side Handling**:
   - Clients should properly handle timeout errors
   - Implement retry logic where appropriate
   - Provide clear feedback to users when timeouts occur

5. **Transport Configuration**:
   - Configure transport-level timeouts to match application timeouts
   - Use keep-alive mechanisms for long-lived connections
   - Consider proxy and network constraints

## Testing Timeout Handling

The `test-timeout-handling.js` script can be used to verify timeout handling:

```bash
node test-timeout-handling.js
```

This script:
1. Tests discovery endpoints to ensure they respond quickly
2. Sends a request that will time out (sleep command)
3. Verifies that the timeout error is properly returned with code -32001
4. Tests that the server remains responsive after a timeout

## Troubleshooting Common Timeout Issues

1. **Proxy Interference**:
   - Check for proxy configurations that might be terminating connections
   - Ensure keep-alive packets can pass through network infrastructure
   - Consider using SSE transport instead of stdio for better proxy compatibility

2. **Resource Constraints**:
   - Monitor CPU and memory usage during operations
   - Ensure the server has sufficient resources to handle requests
   - Consider implementing resource limits for operations

3. **Initialization Delays**:
   - Ensure server initialization completes quickly
   - Send immediate acknowledgment for initialization requests
   - Log server startup stages for debugging

## Future Improvements

Consider implementing:

1. **Adaptive Timeouts**: Adjust timeout duration based on operation type and historical performance
2. **Timeout Monitoring**: Track and log timeout patterns to identify problematic operations
3. **Graceful Cancellation**: Allow long-running operations to be gracefully cancelled when timeouts occur
4. **Retry Policies**: Implement configurable retry policies for different types of operations
5. **Circuit Breakers**: Add circuit breakers to prevent cascading failures from timeout issues