/**
 * Tests for session flow validation in the VSCode Remote MCP system
 */

// Import the validation functions we'll need to test
const {
  validateSessionFlow,
  validateCommandFlow
} = require('../src/utils/message-flow-validator');

describe('Session Flow Validation', () => {
  describe('Session Request/Response Flow', () => {
    it('should validate a valid session flow', () => {
      const validSessionFlow = [
        {
          type: 'session_request',
          id: 'sess-req-123',
          payload: {
            parameters: {
              workspaceId: 'workspace-xyz',
              clientId: 'client-abc',
              sessionType: 'collaborative'
            }
          }
        },
        {
          type: 'session_response',
          id: 'sess-resp-123',
          responseTo: 'sess-req-123',
          payload: {
            status: 'success',
            sessionId: 'session-abc'
          }
        }
      ];
      
      expect(() => validateSessionFlow(validSessionFlow)).not.toThrow();
    });
    
    it('should reject a session flow that does not start with session_request', () => {
      const invalidSessionFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz'
          }
        },
        {
          type: 'session_response',
          id: 'sess-resp-123',
          responseTo: 'sess-req-123',
          payload: {
            status: 'success',
            sessionId: 'session-abc'
          }
        }
      ];
      
      expect(() => validateSessionFlow(invalidSessionFlow)).toThrow('Session flow must start with a session_request');
    });
    
    it('should reject a session flow with missing parameters', () => {
      const invalidSessionFlow = [
        {
          type: 'session_request',
          id: 'sess-req-123',
          payload: {
            // Missing parameters
          }
        },
        {
          type: 'session_response',
          id: 'sess-resp-123',
          responseTo: 'sess-req-123',
          payload: {
            status: 'success',
            sessionId: 'session-abc'
          }
        }
      ];
      
      expect(() => validateSessionFlow(invalidSessionFlow)).toThrow('Session request must include parameters');
    });
    
    it('should reject a session flow with incorrect response sequence', () => {
      const invalidSessionFlow = [
        {
          type: 'session_request',
          id: 'sess-req-123',
          payload: {
            parameters: {
              workspaceId: 'workspace-xyz',
              clientId: 'client-abc',
              sessionType: 'collaborative'
            }
          }
        },
        {
          type: 'connection_ack', // Wrong response type
          id: 'conn-ack-123',
          payload: {
            status: 'connected'
          }
        }
      ];
      
      expect(() => validateSessionFlow(invalidSessionFlow)).toThrow('Session request must be followed by a session_response');
    });
    
    it('should reject a session flow with mismatched request/response IDs', () => {
      const invalidSessionFlow = [
        {
          type: 'session_request',
          id: 'sess-req-123',
          payload: {
            parameters: {
              workspaceId: 'workspace-xyz',
              clientId: 'client-abc',
              sessionType: 'collaborative'
            }
          }
        },
        {
          type: 'session_response',
          id: 'sess-resp-123',
          responseTo: 'sess-req-456', // Different request ID
          payload: {
            status: 'success',
            sessionId: 'session-abc'
          }
        }
      ];
      
      expect(() => validateSessionFlow(invalidSessionFlow)).toThrow('Session response must reference the session request');
    });
  });
});

describe('Command Flow Validation', () => {
  describe('Command Request/Response Flow', () => {
    it('should validate a valid command flow', () => {
      const validCommandFlow = [
        {
          type: 'command_request',
          id: 'cmd-req-123',
          payload: {
            command: 'git status',
            workspaceId: 'workspace-xyz',
            clientId: 'client-abc'
          }
        },
        {
          type: 'command_response',
          id: 'cmd-resp-123',
          responseTo: 'cmd-req-123',
          payload: {
            status: 'success',
            output: 'On branch main\nNothing to commit, working tree clean'
          }
        }
      ];
      
      expect(() => validateCommandFlow(validCommandFlow)).not.toThrow();
    });
    
    it('should reject a command flow that does not start with command_request', () => {
      const invalidCommandFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz'
          }
        },
        {
          type: 'command_response',
          id: 'cmd-resp-123',
          responseTo: 'cmd-req-123',
          payload: {
            status: 'success',
            output: 'On branch main\nNothing to commit, working tree clean'
          }
        }
      ];
      
      expect(() => validateCommandFlow(invalidCommandFlow)).toThrow('Command flow must start with a command_request');
    });
    
    it('should reject a command flow with missing command', () => {
      const invalidCommandFlow = [
        {
          type: 'command_request',
          id: 'cmd-req-123',
          payload: {
            // Missing command
            workspaceId: 'workspace-xyz',
            clientId: 'client-abc'
          }
        },
        {
          type: 'command_response',
          id: 'cmd-resp-123',
          responseTo: 'cmd-req-123',
          payload: {
            status: 'success',
            output: 'On branch main\nNothing to commit, working tree clean'
          }
        }
      ];
      
      expect(() => validateCommandFlow(invalidCommandFlow)).toThrow('Command request must include command');
    });
    
    it('should reject a command flow that does not end with command_response', () => {
      const invalidCommandFlow = [
        {
          type: 'command_request',
          id: 'cmd-req-123',
          payload: {
            command: 'git status',
            workspaceId: 'workspace-xyz',
            clientId: 'client-abc'
          }
        },
        {
          type: 'notification', // Wrong response type
          id: 'notif-123',
          payload: {
            message: 'Command executed'
          }
        }
      ];
      
      expect(() => validateCommandFlow(invalidCommandFlow)).toThrow('Command flow must end with a command_response');
    });
    
    it('should reject a command flow with mismatched request/response IDs', () => {
      const invalidCommandFlow = [
        {
          type: 'command_request',
          id: 'cmd-req-123',
          payload: {
            command: 'git status',
            workspaceId: 'workspace-xyz',
            clientId: 'client-abc'
          }
        },
        {
          type: 'command_response',
          id: 'cmd-resp-123',
          responseTo: 'cmd-req-456', // Different request ID
          payload: {
            status: 'success',
            output: 'On branch main\nNothing to commit, working tree clean'
          }
        }
      ];
      
      expect(() => validateCommandFlow(invalidCommandFlow)).toThrow('Command response must reference the command request');
    });
  });
});