# VSCode Remote MCP System: Request/Response Schemas

This document defines the request/response patterns used in the VSCode Remote MCP system. These patterns enable reliable communication between clients and the server.

## Request/Response Pattern

The VSCode Remote MCP system uses a request-response pattern for certain operations. These are correlated using the optional `id` field in the message. When a client sends a request message with an `id`, the server responds with a message of the corresponding acknowledgment type, including the same `id` to allow the client to match the response to its request.

### General Pattern

```typescript
// Request
{
  type: "some_request_type",
  id: "unique-request-id",
  payload: {
    // Request-specific payload
  }
}

// Response
{
  type: "some_request_type_ack",
  id: "unique-request-id",  // Same ID as in the request
  payload: {
    // Response-specific payload
  }
}
```

## Common Request/Response Pairs

### Connection Request/Response

Used to establish a connection between a client and the server.

```typescript
// Request
{
  type: "connection",
  id: "conn-123",
  payload: {
    clientId: "client-abc",
    workspaceId: "workspace-xyz",
    capabilities: ["terminal", "editor", "extensions"]
  }
}

// Response
{
  type: "connection_ack",
  id: "conn-123",
  payload: {
    status: "connected",
    serverTime: "2025-04-04T22:30:00Z",
    connectedClients: 3
  }
}
```

### Session Creation Request/Response

Used to create a new collaboration session.

```typescript
// Request
{
  type: "session_create",
  id: "sess-456",
  payload: {
    sessionId: "session-def",
    createdBy: "client-abc",
    workspaceId: "workspace-xyz",
    sessionName: "Collaborative Debug Session"
  }
}

// Response
{
  type: "session_create_ack",
  id: "sess-456",
  payload: {
    sessionId: "session-def",
    status: "created",
    createdAt: "2025-04-04T22:35:00Z"
  }
}
```

### Session Join Request/Response

Used to join an existing collaboration session.

```typescript
// Request
{
  type: "session_join",
  id: "join-789",
  payload: {
    sessionId: "session-def",
    clientId: "client-ghi",
    workspaceId: "workspace-uvw"
  }
}

// Response
{
  type: "session_join_ack",
  id: "join-789",
  payload: {
    sessionId: "session-def",
    status: "joined",
    participants: ["client-abc", "client-ghi"],
    activeDocument: "file:///workspace/project/src/main.ts"
  }
}
```

### Token Refresh Request/Response

Used to refresh an authentication token.

```typescript
// Request
{
  type: "token_refresh",
  id: "token-012",
  payload: {
    clientId: "client-abc",
    newToken: "hashed-token-value"
  }
}

// Response
{
  type: "token_refresh_ack",
  id: "token-012",
  payload: {
    status: "accepted",
    validUntil: "2025-04-05T22:30:00Z"
  }
}
```

## Handling Request Timeouts

Clients should implement timeout handling for requests that expect a response. If a response is not received within a reasonable time frame (e.g., 5 seconds), the client should consider the request as failed and may retry or report an error to the user.

Example client-side timeout handling:

```typescript
function sendRequest(message: MCPMessage, timeoutMs: number = 5000): Promise<MCPMessage> {
  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      // Remove response handler
      responseHandlers.delete(message.id);
      reject(new Error(`Request timed out after ${timeoutMs}ms: ${message.type}`));
    }, timeoutMs);
    
    // Set up response handler
    responseHandlers.set(message.id, (response) => {
      clearTimeout(timeoutId);
      resolve(response);
    });
    
    // Send the message
    sendMessage(message);
  });
}
```

## Error Responses

When a request cannot be fulfilled, the server may respond with an error message instead of the expected acknowledgment. The error message will include the same `id` as the original request to allow the client to correlate the error with its request.

```typescript
// Error response to a request
{
  type: "error",
  id: "sess-456",  // Same ID as in the original request
  payload: {
    code: "SESSION_CREATION_FAILED",
    message: "Failed to create session: session ID already exists",
    relatedTo: "session_create"
  }
}
```

## Asynchronous Notifications

In addition to request/response pairs, the system also uses asynchronous notifications that do not expect a response. These messages typically do not include an `id` field, or if they do, it's used for logging and debugging purposes rather than for correlation.

Examples of asynchronous notifications:

- Terminal data updates
- Editor changes
- Cursor position updates
- Server shutdown notifications
- Participant join/leave notifications

## Sequence Diagrams

### Successful Request/Response Flow

```
Client                                Server
  |                                     |
  |-- Request (with ID) --------------->|
  |                                     | (processes request)
  |<-- Response (with same ID) ---------|
  |                                     |
```

### Request with Error Response

```
Client                                Server
  |                                     |
  |-- Request (with ID) --------------->|
  |                                     | (encounters error)
  |<-- Error (with same ID) ------------|
  |                                     |
```

### Request with Timeout

```
Client                                Server
  |                                     |
  |-- Request (with ID) --------------->|
  |                                     | (request lost or server unresponsive)
  |    (timeout period)                 |
  |    (client detects timeout)         |
  |                                     |
  |-- Request retry (new ID) ---------->|
  |                                     |
```

## Next Steps

For information on how these request/response patterns are used in specific message flows, see [Message Flow Diagrams](04-message-flow-diagrams.md).