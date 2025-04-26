# VSCode Remote MCP System: Error Handling Patterns

This document describes the error handling patterns used in the VSCode Remote MCP system to ensure robust and resilient operation even when issues occur.

## Error Message Format

Error messages in the VSCode Remote MCP system follow a standardized format:

```typescript
{
  type: "error",
  id?: string,              // Optional: ID of the message that caused the error
  payload: {
    code: string;           // Error code (e.g., "AUTH_FAILED", "INVALID_MESSAGE")
    message: string;        // Human-readable error message
    relatedTo?: string;     // Optional: Message type that caused the error
    fatal?: boolean;        // Whether error is fatal to the connection (default: false)
    details?: any;          // Optional: Additional error details
    recoveryAction?: string; // Optional: Suggested recovery action
  }
}
```

## Error Categories

Errors in the VSCode Remote MCP system are categorized into several types:

### 1. Protocol Errors

These errors occur when messages violate the protocol format or rules.

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `INVALID_MESSAGE_FORMAT` | Message does not conform to the expected format | No | Resend with correct format |
| `UNKNOWN_MESSAGE_TYPE` | Message type is not recognized | No | Check message type spelling |
| `MISSING_REQUIRED_FIELD` | A required field is missing from the message | No | Resend with all required fields |
| `INVALID_FIELD_VALUE` | A field contains an invalid value | No | Resend with valid field value |

Example error message:

```json
{
  "type": "error",
  "id": "msg-123",
  "payload": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "Required field 'clientId' is missing from connection message",
    "relatedTo": "connection",
    "fatal": false,
    "recoveryAction": "Resend connection message with clientId field"
  }
}
```

### 2. Authentication Errors

These errors occur when authentication fails.

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `AUTH_FAILED` | Authentication token is invalid | Yes | Retry with valid token |
| `AUTH_EXPIRED` | Authentication token has expired | Yes | Refresh token and reconnect |
| `AUTH_REQUIRED` | Authentication is required but no token was provided | Yes | Provide authentication token |
| `AUTH_INSUFFICIENT_PERMISSIONS` | Token lacks required permissions | Yes | Request token with appropriate permissions |

Example error message:

```json
{
  "type": "error",
  "payload": {
    "code": "AUTH_EXPIRED",
    "message": "Authentication token has expired",
    "fatal": true,
    "recoveryAction": "Refresh token and reconnect"
  }
}
```

### 3. Session Errors

These errors occur during session management operations.

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `SESSION_NOT_FOUND` | Requested session does not exist | No | Check session ID or create new session |
| `SESSION_ALREADY_EXISTS` | Attempted to create a session with an existing ID | No | Use a different session ID |
| `SESSION_JOIN_REJECTED` | Request to join a session was rejected | No | Request permission from session owner |
| `SESSION_FULL` | Session has reached maximum number of participants | No | Wait for a participant to leave or join another session |

Example error message:

```json
{
  "type": "error",
  "id": "join-456",
  "payload": {
    "code": "SESSION_JOIN_REJECTED",
    "message": "Join request was rejected by the session owner",
    "relatedTo": "session_join",
    "fatal": false
  }
}
```

### 4. Resource Errors

These errors occur when operations fail due to resource constraints or availability issues.

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `RESOURCE_NOT_FOUND` | Requested resource does not exist | No | Check resource identifier |
| `RESOURCE_LOCKED` | Resource is locked by another client | No | Wait and retry later |
| `RESOURCE_LIMIT_EXCEEDED` | Operation would exceed a resource limit | No | Free up resources or reduce scope |
| `RESOURCE_CONFLICT` | Conflicting changes to a resource | No | Resolve conflict and retry |

Example error message:

```json
{
  "type": "error",
  "id": "edit-789",
  "payload": {
    "code": "RESOURCE_CONFLICT",
    "message": "Edit conflicts with changes made by another user",
    "relatedTo": "editor",
    "details": {
      "documentUri": "file:///workspace/project/src/main.ts",
      "conflictingVersion": 42
    },
    "recoveryAction": "Refresh document and reapply changes"
  }
}
```

### 5. Server Errors

These errors occur due to server-side issues.

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `SERVER_ERROR` | Generic server error | Maybe | Retry operation |
| `SERVER_OVERLOADED` | Server is too busy to process the request | No | Wait and retry with backoff |
| `SERVER_MAINTENANCE` | Server is in maintenance mode | Yes | Reconnect later |
| `SERVER_SHUTTING_DOWN` | Server is shutting down | Yes | Reconnect when server is available |

Example error message:

```json
{
  "type": "error",
  "payload": {
    "code": "SERVER_OVERLOADED",
    "message": "Server is currently overloaded, please try again later",
    "fatal": false,
    "recoveryAction": "Retry with exponential backoff"
  }
}
```

## Error Handling Strategies

### Client-Side Error Handling

Clients should implement the following error handling strategies:

#### 1. Graceful Degradation

When non-fatal errors occur, clients should degrade functionality gracefully rather than failing completely:

```typescript
function handleError(error: ErrorMessage): void {
  if (error.payload.fatal) {
    // Handle fatal error (disconnect, show error to user, etc.)
    disconnectAndNotifyUser(error);
  } else {
    // Handle non-fatal error (retry, show warning, etc.)
    logWarningAndContinue(error);
    
    // Implement recovery action if provided
    if (error.payload.recoveryAction) {
      implementRecoveryAction(error.payload.recoveryAction, error);
    }
  }
}
```

#### 2. Retry with Backoff

For transient errors, implement a retry mechanism with exponential backoff:

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  initialDelayMs: number = 100
): Promise<T> {
  let retries = 0;
  let delay = initialDelayMs;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (retries >= maxRetries || (error.payload && error.payload.fatal)) {
        throw error;
      }
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}
```

#### 3. Reconnection Strategy

Implement a reconnection strategy for handling connection losses:

```typescript
class ConnectionManager {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms
  
  async handleDisconnection(reason: string): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Connection lost: ${reason}. Reconnecting in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
      this.reconnectAttempts = 0; // Reset on successful reconnection
    } catch (error) {
      await this.handleDisconnection(`Reconnection failed: ${error.message}`);
    }
  }
}
```

### Server-Side Error Handling

Servers should implement the following error handling strategies:

#### 1. Input Validation

Validate all incoming messages before processing:

```typescript
function validateMessage(message: any): boolean {
  if (!message.type || typeof message.type !== 'string') {
    sendError(message.id, 'INVALID_MESSAGE_FORMAT', 'Message type must be a string');
    return false;
  }
  
  if (!messageHandlers.has(message.type)) {
    sendError(message.id, 'UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${message.type}`);
    return false;
  }
  
  // Validate payload based on message type
  const validator = messageValidators.get(message.type);
  if (validator && !validator(message.payload)) {
    sendError(message.id, 'INVALID_PAYLOAD', `Invalid payload for message type: ${message.type}`);
    return false;
  }
  
  return true;
}
```

#### 2. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
class RateLimiter {
  private requestCounts: Map<string, number> = new Map();
  private readonly maxRequestsPerMinute: number = 100;
  
  isRateLimited(clientId: string): boolean {
    const count = this.requestCounts.get(clientId) || 0;
    if (count >= this.maxRequestsPerMinute) {
      return true;
    }
    
    this.requestCounts.set(clientId, count + 1);
    return false;
  }
  
  // Reset counts every minute
  startResetInterval(): void {
    setInterval(() => {
      this.requestCounts.clear();
    }, 60000);
  }
}
```

#### 3. Graceful Shutdown

Implement graceful shutdown to notify clients:

```typescript
async function shutdownGracefully(): Promise<void> {
  // Notify all clients
  for (const client of connectedClients.values()) {
    client.send({
      type: 'server_shutdown',
      payload: {
        reason: 'Server is shutting down for maintenance',
        time: new Date().toISOString(),
        plannedRestart: true,
        estimatedDowntime: 300 // 5 minutes
      }
    });
  }
  
  // Wait for messages to be sent
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Close all connections
  for (const client of connectedClients.values()) {
    client.disconnect();
  }
  
  // Perform cleanup
  // ...
  
  process.exit(0);
}
```

## Error Logging and Monitoring

To facilitate debugging and improve system reliability, implement comprehensive error logging:

```typescript
function logError(error: ErrorMessage, context: any = {}): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    errorCode: error.payload.code,
    message: error.payload.message,
    relatedMessageId: error.id,
    relatedMessageType: error.payload.relatedTo,
    fatal: error.payload.fatal || false,
    context
  };
  
  console.error('ERROR:', JSON.stringify(logEntry));
  
  // In a production system, send to a logging service
  if (loggingService) {
    loggingService.logError(logEntry);
  }
}
```

## Next Steps

This concludes the API contract specification for the VSCode Remote MCP system. The documents in this series provide a comprehensive reference for implementing the system:

1. [Overview and Message Format](01-overview-and-message-format.md)
2. [Message Types and Payloads](02-message-types-and-payloads.md)
3. [Request/Response Schemas](03-request-response-schemas.md)
4. [Message Flow Diagrams](04-message-flow-diagrams.md)
5. [Client State Model](05-client-state-model.md)
6. [Authentication Flow](06-authentication-flow.md)
7. [Error Handling Patterns](07-error-handling-patterns.md)

For implementation details, refer to the source code and additional documentation in the project repository.