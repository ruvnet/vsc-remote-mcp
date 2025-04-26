/**
 * Tests for message flow validation in the VSCode Remote MCP system
 * Based on the message flow diagrams defined in 04-message-flow-diagrams.md
 */

// Import the validation functions we'll need to test
const {
  validateMessageType,
  validateMessage
} = require('../src/utils/message-validator');

const {
  validateRequestResponsePair
} = require('../src/utils/request-response-validator');

// We'll need to create a message flow validator module
// This is a TDD approach, so we're writing tests for functions that don't exist yet
// We'll implement these functions after the tests are written

// Import the message flow validator functions (to be implemented)
const {
  validateMessageSequence,
  validateConnectionFlow,
  validateSessionCreationFlow,
  validateSessionJoinFlow,
  validateCollaborativeEditingFlow,
  validateTerminalSharingFlow,
  validateExtensionSyncFlow,
  validateDisconnectionFlow,
  validateAuthenticationFlow,
  validateTokenRefreshFlow,
  validateErrorHandlingFlow,
  validateReconnectionFlow
} = require('../src/utils/message-flow-validator');

describe('Message Flow Validation', () => {
  describe('Message Sequence Validation', () => {
    it('should validate a valid message sequence', () => {
      const validSequence = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions']
          }
        },
        {
          type: 'connection_ack',
          id: 'conn-123',
          payload: {
            status: 'connected',
            serverTime: '2023-01-01T12:00:00Z',
            connectedClients: 1
          }
        }
      ];
      
      expect(() => validateMessageSequence(validSequence)).not.toThrow();
    });
    
    it('should reject an empty message sequence', () => {
      const emptySequence = [];
      
      expect(() => validateMessageSequence(emptySequence)).toThrow('Message sequence cannot be empty');
    });
    
    it('should reject a sequence with invalid message', () => {
      const invalidSequence = [
        {
          // Missing type
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions']
          }
        },
        {
          type: 'connection_ack',
          id: 'conn-123',
          payload: {
            status: 'connected',
            serverTime: '2023-01-01T12:00:00Z',
            connectedClients: 1
          }
        }
      ];
      
      expect(() => validateMessageSequence(invalidSequence)).toThrow('Message must have a valid type');
    });
  });
  
  describe('Connection Flow', () => {
    it('should validate a valid connection flow', () => {
      const validConnectionFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions']
          }
        },
        {
          type: 'connection_ack',
          id: 'conn-123',
          payload: {
            status: 'connected',
            serverTime: '2023-01-01T12:00:00Z',
            connectedClients: 1
          }
        },
        {
          type: 'heartbeat',
          id: 'hb-123',
          payload: {
            timestamp: '2023-01-01T12:00:10Z'
          }
        },
        {
          type: 'heartbeat',
          id: 'hb-124',
          payload: {
            timestamp: '2023-01-01T12:00:20Z'
          }
        }
      ];
      
      expect(() => validateConnectionFlow(validConnectionFlow)).not.toThrow();
    });
    
    it('should reject a connection flow with missing connection_ack', () => {
      const invalidConnectionFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions']
          }
        },
        // Missing connection_ack
        {
          type: 'heartbeat',
          id: 'hb-123',
          payload: {
            timestamp: '2023-01-01T12:00:10Z'
          }
        }
      ];
      
      expect(() => validateConnectionFlow(invalidConnectionFlow)).toThrow('Connection flow must include a connection_ack message after connection');
    });
    
    it('should reject a connection flow with out-of-sequence messages', () => {
      const outOfSequenceFlow = [
        {
          type: 'connection_ack', // Should come after connection
          id: 'conn-123',
          payload: {
            status: 'connected',
            serverTime: '2023-01-01T12:00:00Z',
            connectedClients: 1
          }
        },
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions']
          }
        }
      ];
      
      expect(() => validateConnectionFlow(outOfSequenceFlow)).toThrow('Connection message must come before connection_ack');
    });
  });
  
  describe('Session Creation Flow', () => {
    it('should validate a valid session creation flow', () => {
      const validSessionCreationFlow = [
        {
          type: 'session_create',
          id: 'sess-123',
          payload: {
            sessionId: 'session-abc',
            createdBy: 'client-abc',
            workspaceId: 'workspace-xyz',
            sessionName: 'Collaborative Debug Session'
          }
        },
        {
          type: 'session_create_ack',
          id: 'sess-123',
          payload: {
            sessionId: 'session-abc',
            status: 'created',
            createdAt: '2023-01-01T12:00:00Z'
          }
        }
      ];
      
      expect(() => validateSessionCreationFlow(validSessionCreationFlow)).not.toThrow();
    });
    
    it('should reject a session creation flow with missing session_create_ack', () => {
      const invalidSessionCreationFlow = [
        {
          type: 'session_create',
          id: 'sess-123',
          payload: {
            sessionId: 'session-abc',
            createdBy: 'client-abc',
            workspaceId: 'workspace-xyz',
            sessionName: 'Collaborative Debug Session'
          }
        }
        // Missing session_create_ack
      ];
      
      expect(() => validateSessionCreationFlow(invalidSessionCreationFlow)).toThrow('Session creation flow must include a session_create_ack message');
    });
    
    it('should reject a session creation flow with mismatched session IDs', () => {
      const mismatchedSessionIdsFlow = [
        {
          type: 'session_create',
          id: 'sess-123',
          payload: {
            sessionId: 'session-abc',
            createdBy: 'client-abc',
            workspaceId: 'workspace-xyz',
            sessionName: 'Collaborative Debug Session'
          }
        },
        {
          type: 'session_create_ack',
          id: 'sess-123',
          payload: {
            sessionId: 'session-xyz', // Different session ID
            status: 'created',
            createdAt: '2023-01-01T12:00:00Z'
          }
        }
      ];
      
      expect(() => validateSessionCreationFlow(mismatchedSessionIdsFlow)).toThrow('Session IDs must match between session_create and session_create_ack');
    });
  });
  
  describe('Session Join Flow', () => {
    it('should validate a valid session join flow', () => {
      const validSessionJoinFlow = [
        {
          type: 'session_join',
          id: 'join-123',
          payload: {
            sessionId: 'session-abc',
            clientId: 'client-xyz',
            workspaceId: 'workspace-xyz'
          }
        },
        {
          type: 'session_join_ack',
          id: 'join-123',
          payload: {
            sessionId: 'session-abc',
            status: 'joined',
            participants: ['client-abc', 'client-xyz']
          }
        }
      ];
      
      expect(() => validateSessionJoinFlow(validSessionJoinFlow)).not.toThrow();
    });
    
    it('should reject a session join flow with missing session_join_ack', () => {
      const invalidSessionJoinFlow = [
        {
          type: 'session_join',
          id: 'join-123',
          payload: {
            sessionId: 'session-abc',
            clientId: 'client-xyz',
            workspaceId: 'workspace-xyz'
          }
        }
        // Missing session_join_ack
      ];
      
      expect(() => validateSessionJoinFlow(invalidSessionJoinFlow)).toThrow('Session join flow must include a session_join_ack message');
    });
    
    it('should reject a session join flow with mismatched session IDs', () => {
      const mismatchedSessionIdsFlow = [
        {
          type: 'session_join',
          id: 'join-123',
          payload: {
            sessionId: 'session-abc',
            clientId: 'client-xyz',
            workspaceId: 'workspace-xyz'
          }
        },
        {
          type: 'session_join_ack',
          id: 'join-123',
          payload: {
            sessionId: 'session-xyz', // Different session ID
            status: 'joined',
            participants: ['client-abc', 'client-xyz']
          }
        }
      ];
      
      expect(() => validateSessionJoinFlow(mismatchedSessionIdsFlow)).toThrow('Session IDs must match between session_join and session_join_ack');
    });
  });
  
  describe('Collaborative Editing Flow', () => {
    it('should validate a valid collaborative editing flow', () => {
      const validEditingFlow = [
        {
          type: 'editor',
          id: 'edit-123',
          payload: {
            sessionId: 'session-abc',
            documentUri: 'file:///workspace/project/src/main.js',
            sourceClientId: 'client-abc',
            edit: {
              range: {
                startLine: 10,
                startColumn: 5,
                endLine: 10,
                endColumn: 10
              },
              text: 'newText',
              version: 1
            }
          }
        },
        {
          type: 'editor',
          id: 'edit-124',
          payload: {
            sessionId: 'session-abc',
            documentUri: 'file:///workspace/project/src/main.js',
            sourceClientId: 'client-xyz',
            cursorPosition: {
              line: 12,
              column: 8
            }
          }
        }
      ];
      
      expect(() => validateCollaborativeEditingFlow(validEditingFlow)).not.toThrow();
    });
    
    it('should reject an editing flow with invalid document URI', () => {
      const invalidEditingFlow = [
        {
          type: 'editor',
          id: 'edit-123',
          payload: {
            sessionId: 'session-abc',
            documentUri: '', // Invalid URI
            sourceClientId: 'client-abc',
            edit: {
              range: {
                startLine: 10,
                startColumn: 5,
                endLine: 10,
                endColumn: 10
              },
              text: 'newText',
              version: 1
            }
          }
        }
      ];
      
      expect(() => validateCollaborativeEditingFlow(invalidEditingFlow)).toThrow('Document URI must be a valid URI');
    });
  });
  
  describe('Terminal Sharing Flow', () => {
    it('should validate a valid terminal sharing flow', () => {
      const validTerminalFlow = [
        {
          type: 'terminal',
          id: 'term-123',
          payload: {
            sessionId: 'session-abc',
            data: 'ls -la',
            sourceClientId: 'client-abc',
            terminalId: 'terminal-1'
          }
        },
        {
          type: 'terminal',
          id: 'term-124',
          payload: {
            sessionId: 'session-abc',
            data: 'total 24\ndrwxr-xr-x  5 user  group  160 Jan  1 12:00 .\n',
            sourceClientId: 'client-abc',
            terminalId: 'terminal-1'
          }
        }
      ];
      
      expect(() => validateTerminalSharingFlow(validTerminalFlow)).not.toThrow();
    });
    
    it('should reject a terminal flow with missing required fields', () => {
      const invalidTerminalFlow = [
        {
          type: 'terminal',
          id: 'term-123',
          payload: {
            sessionId: 'session-abc',
            // Missing data
            sourceClientId: 'client-abc',
            terminalId: 'terminal-1'
          }
        }
      ];
      
      expect(() => validateTerminalSharingFlow(invalidTerminalFlow)).toThrow('Terminal message must include data field');
    });
  });
  
  describe('Extension State Synchronization Flow', () => {
    it('should validate a valid extension sync flow', () => {
      const validExtensionFlow = [
        {
          type: 'extension',
          id: 'ext-123',
          payload: {
            extensionId: 'vscode.git',
            state: { branch: 'main', changes: 5 },
            sourceClientId: 'client-abc',
            scope: 'session',
            sessionId: 'session-abc'
          }
        },
        {
          type: 'extension',
          id: 'ext-124',
          payload: {
            extensionId: 'vscode.debug',
            state: { breakpoints: [{ id: 1, line: 10 }] },
            sourceClientId: 'client-xyz',
            scope: 'session',
            sessionId: 'session-abc'
          }
        }
      ];
      
      expect(() => validateExtensionSyncFlow(validExtensionFlow)).not.toThrow();
    });
    
    it('should reject an extension flow with invalid scope', () => {
      const invalidExtensionFlow = [
        {
          type: 'extension',
          id: 'ext-123',
          payload: {
            extensionId: 'vscode.git',
            state: { branch: 'main', changes: 5 },
            sourceClientId: 'client-abc',
            scope: 'invalid', // Invalid scope
            sessionId: 'session-abc'
          }
        }
      ];
      
      expect(() => validateExtensionSyncFlow(invalidExtensionFlow)).toThrow('Extension scope must be either "session" or "global"');
    });
  });
  
  describe('Disconnection Flow', () => {
    it('should validate a valid disconnection flow', () => {
      const validDisconnectionFlow = [
        {
          type: 'disconnection',
          id: 'disc-123',
          payload: {
            clientId: 'client-abc',
            reason: 'User closed VS Code'
          }
        }
      ];
      
      expect(() => validateDisconnectionFlow(validDisconnectionFlow)).not.toThrow();
    });
    
    it('should validate a session leave flow', () => {
      const validSessionLeaveFlow = [
        {
          type: 'session_leave',
          id: 'leave-123',
          payload: {
            sessionId: 'session-abc',
            clientId: 'client-abc',
            reason: 'User left the session'
          }
        }
      ];
      
      expect(() => validateDisconnectionFlow(validSessionLeaveFlow)).not.toThrow();
    });
    
    it('should validate a server shutdown flow', () => {
      const validServerShutdownFlow = [
        {
          type: 'server_shutdown',
          id: 'shutdown-123',
          payload: {
            reason: 'Server maintenance',
            time: '2023-01-01T12:00:00Z',
            plannedRestart: true,
            estimatedDowntime: 300
          }
        }
      ];
      
      expect(() => validateDisconnectionFlow(validServerShutdownFlow)).not.toThrow();
    });
  });
  
  describe('Authentication Flow', () => {
    it('should validate a valid authentication flow', () => {
      const validAuthFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions'],
            authToken: 'hashed-token-123'
          }
        },
        {
          type: 'connection_ack',
          id: 'conn-123',
          payload: {
            status: 'connected',
            serverTime: '2023-01-01T12:00:00Z',
            connectedClients: 1
          }
        }
      ];
      
      expect(() => validateAuthenticationFlow(validAuthFlow)).not.toThrow();
    });
    
    it('should reject an authentication flow with missing token', () => {
      const invalidAuthFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions']
            // Missing authToken
          }
        },
        {
          type: 'connection_ack',
          id: 'conn-123',
          payload: {
            status: 'connected',
            serverTime: '2023-01-01T12:00:00Z',
            connectedClients: 1
          }
        }
      ];
      
      expect(() => validateAuthenticationFlow(invalidAuthFlow)).toThrow('Authentication flow must include an authToken in the connection message');
    });
    
    it('should handle authentication error flow', () => {
      const authErrorFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions'],
            authToken: 'invalid-token'
          }
        },
        {
          type: 'error',
          id: 'conn-123',
          payload: {
            code: 'AUTH_FAILED',
            message: 'Authentication failed',
            relatedTo: 'connection'
          }
        }
      ];
      
      // This should not throw because error responses are valid in auth flows
      expect(() => validateAuthenticationFlow(authErrorFlow)).not.toThrow();
    });
  });
  
  describe('Token Refresh Flow', () => {
    it('should validate a valid token refresh flow', () => {
      const validTokenRefreshFlow = [
        {
          type: 'token_refresh',
          id: 'refresh-123',
          payload: {
            clientId: 'client-abc',
            newToken: 'hashed-token-456',
            sessionId: 'session-abc'
          }
        },
        {
          type: 'token_refresh_ack',
          id: 'refresh-123',
          payload: {
            status: 'accepted',
            validUntil: '2023-01-02T12:00:00Z'
          }
        }
      ];
      
      expect(() => validateTokenRefreshFlow(validTokenRefreshFlow)).not.toThrow();
    });
    
    it('should reject a token refresh flow with missing token_refresh_ack', () => {
      const invalidTokenRefreshFlow = [
        {
          type: 'token_refresh',
          id: 'refresh-123',
          payload: {
            clientId: 'client-abc',
            newToken: 'hashed-token-456',
            sessionId: 'session-abc'
          }
        }
        // Missing token_refresh_ack
      ];
      
      expect(() => validateTokenRefreshFlow(invalidTokenRefreshFlow)).toThrow('Token refresh flow must include a token_refresh_ack message');
    });
    
    it('should handle token refresh rejection flow', () => {
      const tokenRejectionFlow = [
        {
          type: 'token_refresh',
          id: 'refresh-123',
          payload: {
            clientId: 'client-abc',
            newToken: 'invalid-token',
            sessionId: 'session-abc'
          }
        },
        {
          type: 'token_refresh_ack',
          id: 'refresh-123',
          payload: {
            status: 'rejected'
          }
        }
      ];
      
      // This should not throw because rejection is a valid response
      expect(() => validateTokenRefreshFlow(tokenRejectionFlow)).not.toThrow();
    });
  });
  
  describe('Error Handling Flow', () => {
    it('should validate a valid error handling flow', () => {
      const validErrorFlow = [
        {
          type: 'editor', // Invalid message (missing required fields)
          id: 'edit-123',
          payload: {
            sessionId: 'session-abc'
            // Missing documentUri and sourceClientId
          }
        },
        {
          type: 'error',
          id: 'edit-123',
          payload: {
            code: 'INVALID_MESSAGE',
            message: 'Missing required fields in editor message',
            relatedTo: 'editor'
          }
        },
        {
          type: 'editor', // Corrected message
          id: 'edit-124',
          payload: {
            sessionId: 'session-abc',
            documentUri: 'file:///workspace/project/src/main.js',
            sourceClientId: 'client-abc',
            edit: {
              range: {
                startLine: 10,
                startColumn: 5,
                endLine: 10,
                endColumn: 10
              },
              text: 'newText',
              version: 1
            }
          }
        }
      ];
      
      expect(() => validateErrorHandlingFlow(validErrorFlow)).not.toThrow();
    });
    
    it('should reject an error flow with missing error details', () => {
      const invalidErrorFlow = [
        {
          type: 'editor', // Invalid message
          id: 'edit-123',
          payload: {
            sessionId: 'session-abc'
            // Missing documentUri and sourceClientId
          }
        },
        {
          type: 'error',
          id: 'edit-123',
          payload: {
            // Missing code
            message: 'Missing required fields in editor message',
            relatedTo: 'editor'
          }
        }
      ];
      
      expect(() => validateErrorHandlingFlow(invalidErrorFlow)).toThrow('Error message must include code, message, and relatedTo fields');
    });
  });
  
  describe('Reconnection Flow', () => {
    it('should validate a valid reconnection flow', () => {
      const validReconnectionFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions'],
            authToken: 'hashed-token-123'
          }
        },
        {
          type: 'connection_ack',
          id: 'conn-123',
          payload: {
            status: 'connected',
            serverTime: '2023-01-01T12:00:00Z',
            connectedClients: 1
          }
        },
        {
          type: 'session_join',
          id: 'join-123',
          payload: {
            sessionId: 'session-abc', // Previous session ID
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz'
          }
        },
        {
          type: 'session_join_ack',
          id: 'join-123',
          payload: {
            sessionId: 'session-abc',
            status: 'joined',
            participants: ['client-abc']
          }
        }
      ];
      
      expect(() => validateReconnectionFlow(validReconnectionFlow)).not.toThrow();
    });
    
    it('should reject a reconnection flow with missing session_join', () => {
      const invalidReconnectionFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz',
            capabilities: ['terminal', 'editor', 'extensions'],
            authToken: 'hashed-token-123'
          }
        },
        {
          type: 'connection_ack',
          id: 'conn-123',
          payload: {
            status: 'connected',
            serverTime: '2023-01-01T12:00:00Z',
            connectedClients: 1
          }
        }
        // Missing session_join and session_join_ack
      ];
      
      expect(() => validateReconnectionFlow(invalidReconnectionFlow)).toThrow('Reconnection flow must include session_join and session_join_ack messages');
    });
  });
});