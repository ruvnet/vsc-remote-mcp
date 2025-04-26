# VSCode Remote MCP System: Overview and Message Format

This document provides an overview of the VSCode Remote MCP (Model Context Protocol) system and defines the basic message format used for communication.

## Introduction

The VSCode Remote MCP system enables collaborative development across multiple VSCode instances using a STDIO communication transport layer. It allows developers to share terminals, synchronize editor states, and collaborate in real-time regardless of their physical location or development environment.

Key features of the VSCode Remote MCP system include:

- Real-time collaborative editing
- Terminal sharing across workspaces
- Extension state synchronization
- Session-based collaboration
- Secure authentication
- Robust error handling and recovery

## System Architecture

The MCP system consists of several key components:

1. **MCP Server**: A centralized server that handles message routing and state synchronization
2. **Client Connections**: Multiple VSCode instances connecting to the server
3. **STDIO Transport Layer**: The communication mechanism between clients and server
4. **Extension Modules**: Components that provide specific collaborative features

## Basic Message Format

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

### Message Direction

Messages can flow in different directions:

- **Client → Server**: Messages sent from a VSCode client to the MCP server
- **Server → Client**: Messages sent from the MCP server to a VSCode client
- **Bidirectional**: Message types that can be sent in either direction

## Message Processing

When a message is received, it is processed according to its `type`. The general flow is:

1. Message is received over STDIO
2. Message is parsed from JSON to an object
3. Message type is identified
4. Appropriate handler is called based on the message type
5. Handler processes the message payload
6. If a response is required, a response message is created and sent

## Next Steps

The following documents provide detailed information about specific aspects of the VSCode Remote MCP system:

- [Message Types and Payloads](02-message-types-and-payloads.md)
- [Request/Response Schemas](03-request-response-schemas.md)
- [Message Flow Diagrams](04-message-flow-diagrams.md)
- [Client State Model](05-client-state-model.md)
- [Authentication Flow](06-authentication-flow.md)
- [Error Handling Patterns](07-error-handling-patterns.md)