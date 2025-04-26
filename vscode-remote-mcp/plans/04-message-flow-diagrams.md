# VSCode Remote MCP System: Message Flow Diagrams

This document provides visual representations of the key message flows in the VSCode Remote MCP system, illustrating how clients and the server communicate during different operations.

## Connection Establishment

This diagram shows the flow of messages when a client connects to the MCP server.

```
Client                                Server
  |                                     |
  |------- connection message --------->|
  |                                     | (validates client)
  |<------ connection_ack message ------|
  |                                     |
  |-------- heartbeat message --------->|
  |                                     |
  |<-------- heartbeat message ----------|
  |                                     |
```

### Description

1. The client sends a `connection` message with its client ID, workspace ID, and capabilities.
2. The server validates the client and responds with a `connection_ack` message.
3. Periodic heartbeat messages are exchanged to maintain the connection.

## Session Creation and Joining

This diagram shows how a collaboration session is created by one client and joined by another.

```
Client A                 Server                  Client B
  |                        |                        |
  |-- session_create -->   |                        |
  |                        |                        |
  |<- session_create_ack --|                        |
  |                        |                        |
  |                        |<-- session_join -------|
  |                        |                        |
  |                        |-- session_join_ack --->|
  |                        |                        |
  |<- notification of new participant -|            |
  |                        |                        |
```

### Description

1. Client A sends a `session_create` message to create a new collaboration session.
2. The server acknowledges the session creation with a `session_create_ack` message.
3. Client B sends a `session_join` message to join the session.
4. The server acknowledges the join request with a `session_join_ack` message.
5. The server notifies Client A that a new participant has joined the session.

## Collaborative Editing

This diagram illustrates how editor changes and cursor positions are shared between clients.

```
Client A                 Server                  Client B
  |                        |                        |
  |---- editor message --->|                        |
  |  (document changes)    |                        |
  |                        |-- editor message ----->|
  |                        |   (forwarded)          |
  |                        |                        |
  |                        |<--- editor message ----|
  |                        |  (cursor position)     |
  |<--- editor message ----|                        |
  |    (forwarded)         |                        |
  |                        |                        |
```

### Description

1. Client A makes changes to a document and sends an `editor` message with the changes.
2. The server forwards the changes to Client B.
3. Client B updates its cursor position and sends an `editor` message with the new position.
4. The server forwards the cursor position to Client A.

## Terminal Sharing

This diagram shows how terminal data is shared between clients in a session.

```
Client A                 Server                  Client B
  |                        |                        |
  |--- terminal message -->|                        |
  |   (command input)      |                        |
  |                        |-- terminal message --->|
  |                        |   (forwarded)          |
  |                        |                        |
  |<-- terminal message ---|                        |
  |   (command output)     |                        |
  |                        |-- terminal message --->|
  |                        |   (forwarded)          |
  |                        |                        |
```

### Description

1. Client A enters a command in the terminal and sends a `terminal` message with the command.
2. The server forwards the command to Client B.
3. The terminal produces output, which is captured by Client A and sent as a `terminal` message.
4. The server forwards the output to Client B.

## Extension State Synchronization

This diagram illustrates how extension state is synchronized between clients.

```
Client A                 Server                  Client B
  |                        |                        |
  |-- extension message -->|                        |
  |  (state update)        |                        |
  |                        |-- extension message -->|
  |                        |   (forwarded)          |
  |                        |                        |
  |<-- extension message --|                        |
  |  (state update from B) |                        |
  |                        |<- extension message ---|
  |                        |  (state update)        |
  |                        |                        |
```

### Description

1. Client A updates an extension's state and sends an `extension` message with the new state.
2. The server forwards the state update to Client B.
3. Client B updates another extension's state and sends an `extension` message.
4. The server forwards the state update to Client A.

## Disconnection and Session Cleanup

This diagram shows the message flow when a client disconnects and leaves a session.

```
Client A                 Server                  Client B
  |                        |                        |
  |-- disconnection msg -->|                        |
  |                        |                        |
  |                        |-- notification ------->|
  |                        | (participant left)     |
  |                        |                        |
  |                        |<-- session_leave ------|
  |                        |                        |
  |                        |-- server_shutdown ---->|
  |                        | (if server stops)      |
  |                        |                        |
```

### Description

1. Client A sends a `disconnection` message to the server.
2. The server notifies Client B that Client A has left the session.
3. Client B decides to leave the session and sends a `session_leave` message.
4. If the server is shutting down, it sends a `server_shutdown` message to all connected clients.

## Authentication Flow

This diagram shows the authentication flow when a client connects to the server.

```
Client                                Server
  |                                     |
  |-- connection (with token hash) ---->|
  |                                     | (validates token)
  |<-- connection_ack or error ---------|
  |                                     |
```

### Description

1. The client sends a `connection` message that includes a hashed authentication token.
2. The server validates the token.
3. If the token is valid, the server responds with a `connection_ack` message.
4. If the token is invalid, the server responds with an `error` message.

## Token Refresh Flow

This diagram illustrates how authentication tokens are refreshed for long-running sessions.

```
Client                                Server
  |                                     |
  |-- token_refresh (with new hash) --->|
  |                                     | (validates new token)
  |<-- token_refresh_ack ---------------|
  |                                     |
```

### Description

1. The client sends a `token_refresh` message with a new hashed token.
2. The server validates the new token.
3. The server responds with a `token_refresh_ack` message indicating whether the token was accepted.

## Error Handling Flow

This diagram shows how errors are handled in the system.

```
Client                                Server
  |                                     |
  |-------- invalid message ----------->|
  |                                     | (detects error)
  |<-------- error message -------------|
  |                                     |
  | (implements recovery action)        |
  |                                     |
  |-------- corrected message --------->|
  |                                     |
```

### Description

1. The client sends an invalid or malformed message.
2. The server detects the error and responds with an `error` message.
3. The client implements a recovery action based on the error.
4. The client sends a corrected message.

## Reconnection Strategy

This diagram illustrates the reconnection strategy when a connection is lost or a fatal error occurs.

```
Client                                Server
  |                                     |
  | (connection lost)                   |
  |                                     |
  |-------- connection (retry) -------->|
  |                                     |
  |<-------- connection_ack ------------|
  |                                     |
  |-------- session_join -------------->|
  |         (with previous session ID)  |
  |                                     |
  |<-------- session_join_ack ----------|
  |         (with restored state)       |
  |                                     |
```

### Description

1. The connection between the client and server is lost.
2. The client attempts to reconnect by sending a new `connection` message.
3. The server acknowledges the connection with a `connection_ack` message.
4. The client attempts to rejoin its previous session by sending a `session_join` message with the previous session ID.
5. If the session still exists, the server responds with a `session_join_ack` message that includes the restored session state.

## Next Steps

For information on the client state model that governs these message flows, see [Client State Model](05-client-state-model.md).