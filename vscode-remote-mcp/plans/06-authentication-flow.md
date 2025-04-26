# VSCode Remote MCP System: Authentication Flow

This document describes the authentication mechanism used in the VSCode Remote MCP system to ensure secure communication between clients and the server.

## Authentication Overview

The VSCode Remote MCP system uses a token-based authentication mechanism to verify client identities and control access to the server. This approach provides several benefits:

1. **Security**: Prevents unauthorized access to the collaboration server
2. **Accountability**: Associates actions with specific authenticated clients
3. **Access Control**: Enables fine-grained control over who can join specific sessions
4. **Auditability**: Provides a record of who accessed the system and when

## Token Configuration

Authentication tokens are configured in the `.vscode/mcp.json` file and provided to the server via environment variables.

### Server Configuration

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "server-token",
      "description": "Authentication Token for MCP Server",
      "password": true
    }
  ],
  "servers": {
    "CollabMCPServer": {
      "type": "stdio",
      "command": "node",
      "args": ["./dist/server.js"],
      "env": {
        "SERVER_TOKEN": "${input:server-token}",
        "SERVER_PORT": "3000",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Token Security Practices

To maintain security:

1. Tokens are never stored in plain text in the codebase
2. Tokens are transmitted as hashed values, not as plain text
3. Tokens can be rotated periodically for long-running sessions
4. Different tokens can be used for different collaboration sessions

## Connection Authentication Flow

The authentication process occurs during the initial connection establishment:

```
Client                                Server
  |                                     |
  |-- connection (with token hash) ---->|
  |                                     | (validates token)
  |<-- connection_ack or error ---------|
  |                                     |
```

### Authentication Steps

1. **Token Acquisition**: The client obtains an authentication token through the VSCode input mechanism or from a stored secure location.

2. **Token Hashing**: The client hashes the token before transmission to prevent exposure of the raw token value.

3. **Connection Request**: The client includes the hashed token in the connection message:

   ```typescript
   {
     type: "connection",
     payload: {
       clientId: "client-abc",
       workspaceId: "workspace-xyz",
       capabilities: ["terminal", "editor", "extensions"],
       authToken: "hashed-token-value"
     }
   }
   ```

4. **Token Validation**: The server validates the token by:
   - Hashing the expected token using the same algorithm
   - Comparing the received hash with the expected hash
   - Checking if the token has expired (if token expiration is implemented)

5. **Authentication Result**: The server responds with either:
   - A `connection_ack` message if authentication succeeds
   - An `error` message with code `AUTH_FAILED` if authentication fails

## Token Refresh for Long-Running Sessions

For long-running sessions, tokens may need to be refreshed to maintain security:

```
Client                                Server
  |                                     |
  |-- token_refresh (with new hash) --->|
  |                                     | (validates new token)
  |<-- token_refresh_ack ---------------|
  |                                     |
```

### Token Refresh Steps

1. **New Token Generation**: A new token is generated or obtained.

2. **Token Refresh Request**: The client sends a token refresh message:

   ```typescript
   {
     type: "token_refresh",
     payload: {
       clientId: "client-abc",
       newToken: "new-hashed-token-value"
     }
   }
   ```

3. **Token Validation**: The server validates the new token.

4. **Refresh Result**: The server responds with a token refresh acknowledgment:

   ```typescript
   {
     type: "token_refresh_ack",
     payload: {
       status: "accepted" | "rejected",
       validUntil: "2025-04-05T22:30:00Z"  // Optional expiration time
     }
   }
   ```

## Session-Level Authentication

In addition to server-level authentication, the system can implement session-level authentication to control who can join specific collaboration sessions.

### Private Sessions

Sessions can be created with a `isPrivate` flag set to `true`, requiring explicit approval for join requests:

```typescript
{
  type: "session_create",
  payload: {
    sessionId: "session-def",
    createdBy: "client-abc",
    workspaceId: "workspace-xyz",
    sessionOptions: {
      isPrivate: true
    }
  }
}
```

### Join Approval Flow

For private sessions, join requests require approval from the session owner:

```
Client B                 Server                  Client A (Owner)
  |                        |                        |
  |-- session_join ------->|                        |
  |                        |-- join_request ------->|
  |                        |                        |
  |                        |<-- join_approval ------|
  |                        |                        |
  |<-- session_join_ack ---|                        |
  |                        |                        |
```

## Authentication Error Handling

### Authentication Failure

If authentication fails, the server responds with an error message:

```typescript
{
  type: "error",
  payload: {
    code: "AUTH_FAILED",
    message: "Authentication failed: Invalid token",
    fatal: true
  }
}
```

### Handling Authentication Errors

Clients should handle authentication errors by:

1. Notifying the user of the authentication failure
2. Providing an option to retry with a different token
3. Implementing a backoff strategy for repeated failures to prevent brute force attacks

## Implementation Considerations

When implementing authentication in the VSCode Remote MCP system, consider the following:

### Token Storage

- Use VSCode's secure storage API to store tokens when possible
- Avoid storing tokens in plain text configuration files
- Consider integrating with platform keychain services

### Token Generation

- Use cryptographically secure random generators for token creation
- Consider time-based tokens for enhanced security
- Implement token rotation policies for long-lived servers

### Secure Communication

- Consider adding TLS for transport security if not using VSCode's built-in security
- Implement message signing for critical operations
- Consider adding nonce values to prevent replay attacks

## Authentication Configuration Example

Here's an example of how authentication might be configured in a client implementation:

```typescript
// Client-side authentication configuration
class MCPAuthManager {
  private tokenStore: Map<string, string> = new Map();
  
  async getToken(serverId: string): Promise<string> {
    // Check if we have a cached token
    if (this.tokenStore.has(serverId)) {
      return this.tokenStore.get(serverId)!;
    }
    
    // Request token from user
    const token = await vscode.window.showInputBox({
      prompt: `Enter authentication token for ${serverId}`,
      password: true
    });
    
    if (!token) {
      throw new Error('Authentication cancelled by user');
    }
    
    // Hash the token before storing or transmitting
    const hashedToken = await this.hashToken(token);
    this.tokenStore.set(serverId, hashedToken);
    
    return hashedToken;
  }
  
  private async hashToken(token: string): Promise<string> {
    // Use a secure hashing algorithm
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
  
  async refreshToken(serverId: string): Promise<string> {
    // Clear cached token and request a new one
    this.tokenStore.delete(serverId);
    return this.getToken(serverId);
  }
}
```

## Next Steps

For information on how errors are handled in the VSCode Remote MCP system, see [Error Handling Patterns](07-error-handling-patterns.md).