# VSCode Remote MCP System: Message Types and Payloads

This document defines the various message types used in the VSCode Remote MCP system and their corresponding payload structures.

## Core Message Types

The following table summarizes the core message types used in the system:

| Message Type | Direction | Description |
|--------------|-----------|-------------|
| `connection` | Client → Server | Establishes a new client connection |
| `connection_ack` | Server → Client | Acknowledges a successful connection |
| `disconnection` | Client → Server | Notifies server of client disconnection |
| `session_create` | Client → Server | Creates a new collaboration session |
| `session_create_ack` | Server → Client | Acknowledges session creation |
| `session_join` | Client → Server | Requests to join an existing session |
| `session_join_ack` | Server → Client | Acknowledges session join request |
| `session_leave` | Client → Server | Notifies server of session departure |
| `terminal` | Bidirectional | Shares terminal data between clients |
| `editor` | Bidirectional | Shares editor changes and cursor positions |
| `extension` | Bidirectional | Synchronizes extension state |
| `heartbeat` | Bidirectional | Confirms connection is still active |
| `error` | Server → Client | Reports an error condition |
| `server_shutdown` | Server → Client | Notifies clients of server shutdown |
| `token_refresh` | Client → Server | Requests to refresh authentication token |
| `token_refresh_ack` | Server → Client | Acknowledges token refresh request |

## Message Payload Definitions

### Connection Messages

These messages handle client connection establishment and termination.

#### `connection`

Sent by a client to establish a connection with the server.

```typescript
{
  type: "connection",
  payload: {
    clientId: string;           // Unique client identifier
    workspaceId: string;        // Workspace identifier
    capabilities: string[];     // Supported features (e.g., ["terminal", "editor"])
    clientVersion?: string;     // Optional client version information
    authToken?: string;         // Hashed authentication token (if authentication is required)
  }
}
```

#### `connection_ack`

Sent by the server to acknowledge a successful connection.

```typescript
{
  type: "connection_ack",
  payload: {
    status: "connected";        // Connection status
    serverTime: string;         // ISO timestamp from server
    connectedClients: number;   // Number of active clients
    serverId?: string;          // Optional server identifier
    serverVersion?: string;     // Optional server version
  }
}
```

#### `disconnection`

Sent by a client to notify the server of intentional disconnection.

```typescript
{
  type: "disconnection",
  payload: {
    clientId: string;           // Client identifier
    reason?: string;            // Optional reason for disconnection
  }
}
```

### Session Management Messages

These messages handle the creation, joining, and management of collaboration sessions.

#### `session_create`

Sent by a client to create a new collaboration session.

```typescript
{
  type: "session_create",
  payload: {
    sessionId: string;          // Unique session identifier
    createdBy: string;          // Client ID of session creator
    workspaceId: string;        // Workspace identifier
    sessionName?: string;       // Optional friendly session name
    sessionOptions?: {          // Optional session configuration
      allowEditing: boolean;    // Whether to allow collaborative editing
      allowTerminal: boolean;   // Whether to allow terminal sharing
      isPrivate: boolean;       // Whether session requires explicit join approval
    }
  }
}
```

#### `session_create_ack`

Sent by the server to acknowledge session creation.

```typescript
{
  type: "session_create_ack",
  payload: {
    sessionId: string;          // Session identifier
    status: "created";          // Session status
    createdAt: string;          // ISO timestamp of creation
  }
}
```

#### `session_join`

Sent by a client to join an existing session.

```typescript
{
  type: "session_join",
  payload: {
    sessionId: string;          // Session identifier
    clientId: string;           // Client identifier
    workspaceId: string;        // Workspace identifier
  }
}
```

#### `session_join_ack`

Sent by the server to acknowledge a session join request.

```typescript
{
  type: "session_join_ack",
  payload: {
    sessionId: string;          // Session identifier
    status: "joined" | "rejected"; // Join status
    participants: string[];     // List of participant client IDs
    activeDocument?: string;    // Currently active document URI (if any)
    sharedTerminal?: string;    // Terminal ID (if any)
  }
}
```

#### `session_leave`

Sent by a client to leave a session.

```typescript
{
  type: "session_leave",
  payload: {
    sessionId: string;          // Session identifier
    clientId: string;           // Client identifier
    reason?: string;            // Optional reason for leaving
  }
}
```

### Collaboration Messages

These messages enable real-time collaboration between clients.

#### `terminal`

Used to share terminal data between clients.

```typescript
{
  type: "terminal",
  payload: {
    sessionId: string;          // Session identifier
    data: string;               // Terminal data/commands
    sourceClientId: string;     // Source client identifier
    terminalId?: string;        // Optional terminal identifier (for multiple terminals)
  }
}
```

#### `editor`

Used to share editor changes and cursor positions.

```typescript
{
  type: "editor",
  payload: {
    sessionId: string;          // Session identifier
    documentUri: string;        // Document URI
    edit?: {                    // Optional edit information
      range: {                  // Edit range
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
      },
      text: string;             // New text
      version: number;          // Document version
    },
    cursorPosition?: {          // Optional cursor position
      line: number;
      column: number;
    },
    selection?: {               // Optional selection range
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
    },
    sourceClientId: string;     // Source client identifier
  }
}
```

#### `extension`

Used to synchronize extension state between clients.

```typescript
{
  type: "extension",
  payload: {
    extensionId: string;        // Extension identifier
    state: any;                 // Extension state (serializable object)
    sourceClientId: string;     // Source client identifier
    scope?: "session" | "global"; // Scope of state change (default: global)
    sessionId?: string;         // Session ID (required if scope is "session")
  }
}
```

### System Messages

These messages handle system-level operations and status updates.

#### `heartbeat`

Used to confirm that a connection is still active.

```typescript
{
  type: "heartbeat",
  payload: {
    clientId?: string;          // Client identifier (in client→server direction)
    timestamp: string;          // ISO timestamp
  }
}
```

#### `error`

Sent by the server to report an error condition.

```typescript
{
  type: "error",
  payload: {
    code: string;               // Error code
    message: string;            // Human-readable error message
    relatedTo?: string;         // Optional reference to related message ID
    fatal?: boolean;            // Whether error is fatal to the connection
    details?: any;              // Optional additional error details
  }
}
```

#### `server_shutdown`

Sent by the server to notify clients of server shutdown.

```typescript
{
  type: "server_shutdown",
  payload: {
    reason: string;             // Reason for shutdown
    time: string;               // ISO timestamp
    plannedRestart?: boolean;   // Whether server plans to restart
    estimatedDowntime?: number; // Estimated downtime in seconds (if restart planned)
  }
}
```

### Authentication Messages

These messages handle authentication token management.

#### `token_refresh`

Sent by a client to refresh its authentication token.

```typescript
{
  type: "token_refresh",
  payload: {
    clientId: string;           // Client identifier
    newToken: string;           // New hashed authentication token
  }
}
```

#### `token_refresh_ack`

Sent by the server to acknowledge a token refresh request.

```typescript
{
  type: "token_refresh_ack",
  payload: {
    status: "accepted" | "rejected"; // Token refresh status
    validUntil?: string;             // ISO timestamp of token expiration
  }
}
```

## Message Type Categories

The message types can be categorized into the following functional groups:

1. **Connection Management**: `connection`, `connection_ack`, `disconnection`, `heartbeat`
2. **Session Management**: `session_create`, `session_create_ack`, `session_join`, `session_join_ack`, `session_leave`
3. **Collaboration**: `terminal`, `editor`, `extension`
4. **System**: `error`, `server_shutdown`
5. **Authentication**: `token_refresh`, `token_refresh_ack`

## Next Steps

For information on how these messages are used in request/response patterns, see [Request/Response Schemas](03-request-response-schemas.md).