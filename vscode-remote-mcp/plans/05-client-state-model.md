# VSCode Remote MCP System: Client State Model

This document defines the state model that governs client behavior in the VSCode Remote MCP system. The client maintains several state machines that track its connection status, session participation, and document collaboration activities.

## Client Connection States

The client connection state machine tracks the connection status between a client and the MCP server.

```
┌─────────────┐     connect()      ┌──────────────┐
│ Disconnected │ ─────────────────> │  Connecting  │
└─────────────┘                    └──────────────┘
       ^                                  │
       │                                  │ connection_ack received
       │                                  ▼
       │                           ┌──────────────┐
       │ disconnect() or error     │   Connected  │
       └───────────────────────────┴──────────────┘
```

### State Descriptions

#### Disconnected

- Initial state when the client starts
- No active connection to the server
- Cannot send or receive messages
- Can transition to Connecting state via the connect() method

#### Connecting

- Connection request has been sent to the server
- Waiting for connection acknowledgment
- Can transition to Connected state upon receiving connection_ack
- Can transition to Disconnected state if connection fails or times out

#### Connected

- Active connection established with the server
- Can send and receive messages
- Maintains connection with periodic heartbeat messages
- Can transition to Disconnected state via the disconnect() method or if an error occurs

### State Transitions

| Current State | Trigger | Next State | Actions |
|---------------|---------|------------|---------|
| Disconnected | connect() | Connecting | Send connection message |
| Connecting | connection_ack received | Connected | Start heartbeat timer |
| Connecting | timeout or error | Disconnected | Log error, notify user |
| Connected | disconnect() | Disconnected | Send disconnection message, clean up resources |
| Connected | error or server_shutdown | Disconnected | Log error, attempt reconnection if appropriate |

## Session Participation States

The session participation state machine tracks the client's involvement in collaboration sessions.

```
┌───────────────┐    createSession()    ┌──────────────────────┐
│ Not In Session │ ───────────────────> │ Creating Session     │
└───────────────┘                       └──────────────────────┘
       ^                                          │
       │                                          │ session_create_ack
       │                                          ▼
       │                                 ┌──────────────────────┐
       │                                 │ Session Owner        │
       │                                 └──────────────────────┘
       │                                          │
       │                                          │ session_leave
       │                                          ▼
       │                                 ┌──────────────────────┐
┌───────────────┐     joinSession()     │ Joining Session      │
│ Not In Session │ ───────────────────> └──────────────────────┘
└───────────────┘                                 │
       ^                                          │ session_join_ack
       │                                          ▼
       │                                 ┌──────────────────────┐
       │ session_leave                   │ Session Participant  │
       └─────────────────────────────────┴──────────────────────┘
```

### State Descriptions

#### Not In Session

- Client is not participating in any collaboration session
- Can create a new session or join an existing one
- Initial state when a client connects to the server

#### Creating Session

- Client has requested to create a new session
- Waiting for session creation acknowledgment
- Can transition to Session Owner state upon receiving session_create_ack
- Can transition back to Not In Session if session creation fails

#### Session Owner

- Client owns a collaboration session
- Can invite other clients to join
- Can modify session properties
- Can transition to Not In Session by leaving the session

#### Joining Session

- Client has requested to join an existing session
- Waiting for join acknowledgment
- Can transition to Session Participant upon receiving session_join_ack
- Can transition back to Not In Session if join request is rejected

#### Session Participant

- Client is participating in a session owned by another client
- Can collaborate with other participants
- Can transition to Not In Session by leaving the session

### State Transitions

| Current State | Trigger | Next State | Actions |
|---------------|---------|------------|---------|
| Not In Session | createSession() | Creating Session | Send session_create message |
| Creating Session | session_create_ack | Session Owner | Initialize session resources |
| Creating Session | error or timeout | Not In Session | Log error, notify user |
| Session Owner | session_leave | Not In Session | Send session_leave message, clean up session resources |
| Not In Session | joinSession() | Joining Session | Send session_join message |
| Joining Session | session_join_ack (joined) | Session Participant | Initialize session resources |
| Joining Session | session_join_ack (rejected) or error | Not In Session | Log error, notify user |
| Session Participant | session_leave | Not In Session | Send session_leave message, clean up session resources |

## Document Collaboration States

The document collaboration state machine tracks the client's interaction with shared documents.

```
┌───────────────┐    openDocument()     ┌──────────────────────┐
│ No Active Doc │ ───────────────────> │ Document Active      │
└───────────────┘                       └──────────────────────┘
       ^                                          │
       │                                          │ makeEdit()
       │                                          ▼
       │                                 ┌──────────────────────┐
       │ closeDocument()                 │ Editing Document     │
       └─────────────────────────────────┴──────────────────────┘
```

### State Descriptions

#### No Active Document

- No document is currently being edited in the collaboration session
- Initial state when joining a session
- Can transition to Document Active by opening a document

#### Document Active

- A document is open and can be viewed
- Changes from other clients are being applied
- Can transition to Editing Document by making edits
- Can transition back to No Active Document by closing the document

#### Editing Document

- Client is actively making changes to the document
- Changes are being sent to the server and other clients
- Can transition back to Document Active when edits are complete
- Can transition to No Active Document by closing the document

### State Transitions

| Current State | Trigger | Next State | Actions |
|---------------|---------|------------|---------|
| No Active Document | openDocument() | Document Active | Send document open notification, initialize document view |
| Document Active | makeEdit() | Editing Document | Send editor message with changes |
| Editing Document | editComplete() | Document Active | Update local document state |
| Document Active | closeDocument() | No Active Document | Send document close notification, clean up document resources |
| Editing Document | closeDocument() | No Active Document | Send document close notification, clean up document resources |

## Terminal Sharing States

The terminal sharing state machine tracks the client's interaction with shared terminals.

```
┌───────────────┐    startTerminal()    ┌──────────────────────┐
│ No Terminal   │ ───────────────────> │ Terminal Active      │
└───────────────┘                       └──────────────────────┘
       ^                                          │
       │                                          │ sendCommand()
       │                                          ▼
       │                                 ┌──────────────────────┐
       │ closeTerminal()                 │ Terminal Command     │
       └─────────────────────────────────┴──────────────────────┘
```

### State Descriptions

#### No Terminal

- No terminal is currently being shared in the session
- Initial state when joining a session
- Can transition to Terminal Active by starting a terminal

#### Terminal Active

- A terminal is active and can be viewed
- Output from other clients is being displayed
- Can transition to Terminal Command by sending a command
- Can transition back to No Terminal by closing the terminal

#### Terminal Command

- Client is actively sending a command to the terminal
- Command is being sent to the server and other clients
- Can transition back to Terminal Active when command execution completes
- Can transition to No Terminal by closing the terminal

### State Transitions

| Current State | Trigger | Next State | Actions |
|---------------|---------|------------|---------|
| No Terminal | startTerminal() | Terminal Active | Send terminal start notification, initialize terminal view |
| Terminal Active | sendCommand() | Terminal Command | Send terminal message with command |
| Terminal Command | commandComplete() | Terminal Active | Update terminal display with output |
| Terminal Active | closeTerminal() | No Terminal | Send terminal close notification, clean up terminal resources |
| Terminal Command | closeTerminal() | No Terminal | Send terminal close notification, clean up terminal resources |

## State Coordination

The various state machines described above do not operate in isolation. They coordinate with each other to ensure consistent behavior:

1. **Connection Prerequisite**: Session participation requires an active connection. If the connection state transitions to Disconnected, all session participation states should reset to Not In Session.

2. **Session Prerequisite**: Document collaboration and terminal sharing require participation in a session. If the session participation state transitions to Not In Session, all document and terminal states should reset to their initial states.

3. **Reconnection Handling**: If a connection is lost and later reestablished, the client should attempt to restore its previous session, document, and terminal states.

## Implementation Considerations

When implementing the client state model, consider the following:

1. **State Persistence**: Store session IDs and other critical state information to enable recovery after disconnections.

2. **Transition Validation**: Validate state transitions to prevent invalid state combinations.

3. **Error Handling**: Implement appropriate error handling for each state to ensure graceful degradation.

4. **UI Feedback**: Update the user interface to reflect the current state and provide appropriate feedback during transitions.

5. **Timeout Handling**: Implement timeouts for states that involve waiting for server responses to prevent indefinite waiting.

## Next Steps

For information on how authentication is handled in the VSCode Remote MCP system, see [Authentication Flow](06-authentication-flow.md).