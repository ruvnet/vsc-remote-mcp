# VSCode Remote MCP API Reference

This document provides a comprehensive reference for the VSCode Remote MCP (Model Context Protocol) API, including message types, payload formats, request/response patterns, error handling, and authentication flow.

## Table of Contents

- [Message Format](#message-format)
- [Message Types](#message-types)
- [Request/Response Patterns](#requestresponse-patterns)
- [Authentication Flow](#authentication-flow)
- [Error Handling](#error-handling)

## Message Format

All communication in the VSCode Remote MCP system follows a standardized message format. Each message is a JSON object with the following structure:

```typescript
interface MCPMessage {
  type: string;       // The message type identifier
  payload: any;       // The message payload (type varies by message type)
  id?: string;        // Optional message ID for request-response correlation
  timestamp?: string; // ISO timestamp of when the message was created
}
```

### Message Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Identifies the message type and determines how it will be processed |
| `payload` | object | Yes | Contains the data specific to the message type |
| `id` | string | No | Used to correlate request and response messages |
| `timestamp` | string | No | ISO 8601 timestamp indicating when the message was created |

### Message Serialization

Messages are serialized as JSON strings for transmission over the STDIO transport layer. For example:

```json
{
  "type": "connection",
  "id": "conn-123",
  "payload": {
    "clientId": "client-abc",
    "workspaceId": "workspace-xyz",
    "capabilities": ["terminal", "editor", "extensions"]
  },
  "timestamp": "2025-04-04T22:30:00Z"
}
```

## Message Types

The VSCode Remote MCP system defines several message types for different operations. These message types are categorized into functional groups.

### Connection Management

#### `connection`

Sent by a client to establish a connection with the server.

**Direction:** Client → Server

**Payload:**

```typescript
{
  clientId: string;           // Unique client identifier
  workspaceId: string;        // Workspace identifier
  capabilities: string[];     // Supported features (e.g., ["terminal", "editor"])
  clientVersion?: string;     // Optional client version information
  authToken?: string;         // Hashed authentication token (if authentication is required)
}
```

**Example:**

```json
{
  "type": "connection",
  "id": "conn-123",
  "payload": {
    "clientId": "client-abc",
    "workspaceId": "workspace-xyz",
    "capabilities": ["terminal", "editor", "extensions"],
    "clientVersion": "1.0.0",
    "authToken": "hashed-token-value"
  }
}
```

#### `connection_ack`

Sent by the server to acknowledge a successful connection.

**Direction:** Server → Client

**Payload:**

```typescript
{
  status: "connected";        // Connection status
  serverTime: string;         // ISO timestamp from server
  connectedClients: number;   // Number of active clients
  serverId?: string;          // Optional server identifier
  serverVersion?: string;     // Optional server version
  tokenValidUntil?: string;   // Optional token expiration time
}
```

**Example:**

```json
{
  "type": "connection_ack",
  "id": "conn-123",
  "payload": {
    "status": "connected",
    "serverTime": "2025-04-04T22:30:05Z",
    "connectedClients": 3,
    "serverVersion": "0.1.0",
    "tokenValidUntil": "2025-04-04T23:30:05Z"
  }
}
```

#### `disconnect`

Sent by a client to notify the server of intentional disconnection.

**Direction:** Client → Server

**Payload:**

```typescript
{
  clientId?: string;          // Client identifier
  reason?: string;            // Optional reason for disconnection
}
```

**Example:**

```json
{
  "type": "disconnect",
  "id": "disc-456",
  "payload": {
    "clientId": "client-abc",
    "reason": "User closed VSCode"
  }
}
```

#### `disconnect_ack`

Sent by the server to acknowledge a disconnection.

**Direction:** Server → Client

**Payload:**

```typescript
{
  status: "disconnected";     // Disconnection status
  serverTime: string;         // ISO timestamp from server
}
```

**Example:**

```json
{
  "type": "disconnect_ack",
  "id": "disc-456",
  "payload": {
    "status": "disconnected",
    "serverTime": "2025-04-04T22:35:10Z"
  }
}
```

### Session Management

#### `session_create`

Sent by a client to create a new collaboration session.

**Direction:** Client → Server

**Payload:**

```typescript
{
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
```

**Example:**

```json
{
  "type": "session_create",
  "id": "sess-create-789",
  "payload": {
    "sessionId": "session-def",
    "createdBy": "client-abc",
    "workspaceId": "workspace-xyz",
    "sessionName": "Team Collaboration",
    "sessionOptions": {
      "allowEditing": true,
      "allowTerminal": true,
      "isPrivate": false
    }
  }
}
```

#### `session_create_ack`

Sent by the server to acknowledge session creation.

**Direction:** Server → Client

**Payload:**

```typescript
{
  sessionId: string;          // Session identifier
  status: "created";          // Session status
  createdAt: string;          // ISO timestamp of creation
}
```

**Example:**

```json
{
  "type": "session_create_ack",
  "id": "sess-create-789",
  "payload": {
    "sessionId": "session-def",
    "status": "created",
    "createdAt": "2025-04-04T22:40:00Z"
  }
}
```

#### `session_join`

Sent by a client to join an existing session.

**Direction:** Client → Server

**Payload:**

```typescript
{
  sessionId: string;          // Session identifier
  clientId: string;           // Client identifier
  workspaceId: string;        // Workspace identifier
}
```

**Example:**

```json
{
  "type": "session_join",
  "id": "sess-join-101",
  "payload": {
    "sessionId": "session-def",
    "clientId": "client-xyz",
    "workspaceId": "workspace-abc"
  }
}
```

#### `session_join_ack`

Sent by the server to acknowledge a session join request.

**Direction:** Server → Client

**Payload:**

```typescript
{
  sessionId: string;          // Session identifier
  status: "joined" | "rejected"; // Join status
  participants: string[];     // List of participant client IDs
  activeDocument?: string;    // Currently active document URI (if any)
  sharedTerminal?: string;    // Terminal ID (if any)
  message?: string;           // Optional status message
}
```

**Example:**

```json
{
  "type": "session_join_ack",
  "id": "sess-join-101",
  "payload": {
    "sessionId": "session-def",
    "status": "joined",
    "message": "Joined session successfully",
    "participants": ["client-abc", "client-xyz"],
    "activeDocument": "file:///workspace/project/src/main.ts"
  }
}
```

### Collaboration Messages

#### `terminal`

Used to share terminal data between clients.

**Direction:** Bidirectional

**Payload:**

```typescript
{
  sessionId: string;          // Session identifier
  data: string;               // Terminal data/commands
  sourceClientId: string;     // Source client identifier
  terminalId?: string;        // Optional terminal identifier (for multiple terminals)
}
```

**Example:**

```json
{
  "type": "terminal",
  "payload": {
    "sessionId": "session-def",
    "data": "ls -la\n",
    "sourceClientId": "client-abc",
    "terminalId": "term-1"
  }
}
```

#### `editor`

Used to share editor changes and cursor positions.

**Direction:** Bidirectional

**Payload:**

```typescript
{
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
```

**Example:**

```json
{
  "type": "editor",
  "payload": {
    "sessionId": "session-def",
    "documentUri": "file:///workspace/project/src/main.ts",
    "edit": {
      "range": {
        "startLine": 10,
        "startColumn": 5,
        "endLine": 10,
        "endColumn": 15
      },
      "text": "newFunction",
      "version": 42
    },
    "cursorPosition": {
      "line": 10,
      "column": 16
    },
    "sourceClientId": "client-abc"
  }
}
```

### Authentication Messages

#### `token_refresh`

Sent by a client to refresh its authentication token.

**Direction:** Client → Server

**Payload:**

```typescript
{
  clientId: string;           // Client identifier
  newToken: string;           // New hashed authentication token
}
```

**Example:**

```json
{
  "type": "token_refresh",
  "id": "token-123",
  "payload": {
    "clientId": "client-abc",
    "newToken": "new-hashed-token-value"
  }
}
```

#### `token_refresh_ack`

Sent by the server to acknowledge a token refresh request.

**Direction:** Server → Client

**Payload:**

```typescript
{
  status: "accepted" | "rejected"; // Token refresh status
  validUntil?: string;             // ISO timestamp of token expiration
}
```

**Example:**

```json
{
  "type": "token_refresh_ack",
  "id": "token-123",
  "payload": {
    "status": "accepted",
    "validUntil": "2025-04-05T00:30:00Z"
  }
}
```

### System Messages

#### `heartbeat`

Used to confirm that a connection is still active.

**Direction:** Bidirectional

**Payload:**

```typescript
{
  clientId?: string;          // Client identifier (in client→server direction)
  timestamp: string;          // ISO timestamp
}
```

**Example:**

```json
{
  "type": "heartbeat",
  "payload": {
    "clientId": "client-abc",
    "timestamp": "2025-04-04T22:45:00Z"
  }
}
```

#### `error`

Sent by the server to report an error condition.

**Direction:** Server → Client

**Payload:**

```typescript
{
  code: string;               // Error code
  message: string;            // Human-readable error message
  relatedTo?: string;         // Optional reference to related message type
  fatal?: boolean;            // Whether error is fatal to the connection
  details?: any;              // Optional additional error details
  recoveryAction?: string;    // Optional suggested recovery action
}
```

**Example:**

```json
{
  "type": "error",
  "id": "err-456",
  "payload": {
    "code": "SESSION_NOT_FOUND",
    "message": "The requested session does not exist",
    "relatedTo": "session_join",
    "fatal": false,
    "recoveryAction": "Check session ID or create a new session"
  }
}
```

#### `server_shutdown`

Sent by the server to notify clients of server shutdown.

**Direction:** Server → Client

**Payload:**

```typescript
{
  reason: string;             // Reason for shutdown
  time: string;               // ISO timestamp
  plannedRestart?: boolean;   // Whether server plans to restart
  estimatedDowntime?: number; // Estimated downtime in seconds (if restart planned)
}
```

**Example:**

```json
{
  "type": "server_shutdown",
  "payload": {
    "reason": "Server is shutting down for maintenance",
    "time": "2025-04-04T23:00:00Z",
    "plannedRestart": true,
    "estimatedDowntime": 300
  }
}
```

## Request/Response Patterns

The VSCode Remote MCP system uses a request/response pattern for many operations. This pattern involves:

1. Client sends a request message with a unique `id`
2. Server processes the request
3. Server sends a response message with the same `id`

### Example: Connection Sequence

```
Client                                Server
  |                                     |
  |-- connection (id: "conn-123") ----->|
  |                                     | (processes connection)
  |<-- connection_ack (id: "conn-123") -|
  |                                     |
```

### Example: Session Creation and Join

```
Client A                             Server                              Client B
  |                                     |                                     |
  |-- session_create ---------------->|                                     |
  |                                     | (creates session)                   |
  |<-- session_create_ack --------------|                                     |
  |                                     |                                     |
  |                                     |<-- session_join --------------------|
  |                                     | (adds client to session)            |
  |                                     |--- session_join_ack --------------->|
  |                                     |                                     |
```

### Example: Error Response

```
Client                                Server
  |                                     |
  |-- invalid_message ---------------->|
  |                                     | (detects error)
  |<-- error ---------------------------|
  |                                     |
```

## Authentication Flow

The VSCode Remote MCP system uses a token-based authentication mechanism to verify client identities and control access to the server.

### Connection Authentication

```
Client                                Server
  |                                     |
  |-- connection (with token hash) ---->|
  |                                     | (validates token)
  |<-- connection_ack or error ---------|
  |                                     |
```

### Token Refresh

For long-running sessions, tokens may need to be refreshed:

```
Client                                Server
  |                                     |
  |-- token_refresh (with new hash) --->|
  |                                     | (validates new token)
  |<-- token_refresh_ack ---------------|
  |                                     |
```

### Authentication Steps

1. **Token Acquisition**: The client obtains an authentication token through the VSCode input mechanism or from a stored secure location.

2. **Token Hashing**: The client hashes the token before transmission to prevent exposure of the raw token value.

3. **Connection Request**: The client includes the hashed token in the connection message.

4. **Token Validation**: The server validates the token by comparing the received hash with the expected hash.

5. **Authentication Result**: The server responds with either a `connection_ack` message if authentication succeeds or an `error` message if authentication fails.

## Error Handling

The VSCode Remote MCP system uses a standardized error handling mechanism to report and handle error conditions.

### Error Message Format

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

### Error Categories

#### Protocol Errors

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `INVALID_MESSAGE_FORMAT` | Message does not conform to the expected format | No | Resend with correct format |
| `UNKNOWN_MESSAGE_TYPE` | Message type is not recognized | No | Check message type spelling |
| `MISSING_REQUIRED_FIELD` | A required field is missing from the message | No | Resend with all required fields |
| `INVALID_FIELD_VALUE` | A field contains an invalid value | No | Resend with valid field value |

#### Authentication Errors

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `AUTH_FAILED` | Authentication token is invalid | Yes | Retry with valid token |
| `AUTH_EXPIRED` | Authentication token has expired | Yes | Refresh token and reconnect |
| `AUTH_REQUIRED` | Authentication is required but no token was provided | Yes | Provide authentication token |
| `AUTH_INSUFFICIENT_PERMISSIONS` | Token lacks required permissions | Yes | Request token with appropriate permissions |

#### Session Errors

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `SESSION_NOT_FOUND` | Requested session does not exist | No | Check session ID or create new session |
| `SESSION_ALREADY_EXISTS` | Attempted to create a session with an existing ID | No | Use a different session ID |
| `SESSION_JOIN_REJECTED` | Request to join a session was rejected | No | Request permission from session owner |
| `SESSION_FULL` | Session has reached maximum number of participants | No | Wait for a participant to leave or join another session |

#### Resource Errors

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `RESOURCE_NOT_FOUND` | Requested resource does not exist | No | Check resource identifier |
| `RESOURCE_LOCKED` | Resource is locked by another client | No | Wait and retry later |
| `RESOURCE_LIMIT_EXCEEDED` | Operation would exceed a resource limit | No | Free up resources or reduce scope |
| `RESOURCE_CONFLICT` | Conflicting changes to a resource | No | Resolve conflict and retry |

#### Server Errors

| Error Code | Description | Fatal | Recovery Action |
|------------|-------------|-------|----------------|
| `SERVER_ERROR` | Generic server error | Maybe | Retry operation |
| `SERVER_OVERLOADED` | Server is too busy to process the request | No | Wait and retry with backoff |
| `SERVER_MAINTENANCE` | Server is in maintenance mode | Yes | Reconnect later |
| `SERVER_SHUTTING_DOWN` | Server is shutting down | Yes | Reconnect when server is available |

### Error Handling Strategies

Clients should implement the following error handling strategies:

1. **Graceful Degradation**: When non-fatal errors occur, degrade functionality gracefully rather than failing completely.
2. **Retry with Backoff**: For transient errors, implement a retry mechanism with exponential backoff.
3. **Reconnection Strategy**: Implement a reconnection strategy for handling connection losses.