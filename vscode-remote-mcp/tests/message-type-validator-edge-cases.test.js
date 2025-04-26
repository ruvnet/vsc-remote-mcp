/**
 * Unit tests for VSCode Remote MCP message type validator edge cases
 */

// Import the validation functions
const { 
  validateEditorPayload,
  validateExtensionPayload,
  validateSessionCreatePayload,
  validateSessionJoinAckPayload,
  validateServerShutdownPayload,
  validateTokenRefreshAckPayload
} = require('../src/utils/message-type-validator');

describe('Message Type Validator Edge Cases', () => {
  
  describe('validateEditorPayload edge cases', () => {
    test('should validate payloads with edit, cursorPosition, and selection', () => {
      const payload = {
        sessionId: 'session-123',
        documentUri: 'file:///workspace/project/src/main.js',
        sourceClientId: 'client-abc',
        edit: {
          range: {
            startLine: 10,
            startColumn: 5,
            endLine: 12,
            endColumn: 10
          },
          text: 'new code',
          version: 2
        },
        cursorPosition: {
          line: 15,
          column: 8
        },
        selection: {
          startLine: 15,
          startColumn: 5,
          endLine: 15,
          endColumn: 20
        }
      };
      
      expect(validateEditorPayload(payload)).toBe(true);
    });
    
    test('should reject payloads with invalid edit structure', () => {
      const payload = {
        sessionId: 'session-123',
        documentUri: 'file:///workspace/project/src/main.js',
        sourceClientId: 'client-abc',
        edit: 'not an object'
      };
      
      expect(() => validateEditorPayload(payload)).toThrow('edit must be an object');
    });
    
    test('should reject payloads with missing edit fields', () => {
      const payload = {
        sessionId: 'session-123',
        documentUri: 'file:///workspace/project/src/main.js',
        sourceClientId: 'client-abc',
        edit: {
          text: 'new code',
          version: 2
          // missing range
        }
      };
      
      expect(() => validateEditorPayload(payload)).toThrow('Missing required field: range');
    });
    
    test('should reject payloads with invalid edit.range structure', () => {
      const payload = {
        sessionId: 'session-123',
        documentUri: 'file:///workspace/project/src/main.js',
        sourceClientId: 'client-abc',
        edit: {
          range: 'not an object',
          text: 'new code',
          version: 2
        }
      };
      
      expect(() => validateEditorPayload(payload)).toThrow('range must be an object');
    });
    
    test('should reject payloads with invalid cursorPosition structure', () => {
      const payload = {
        sessionId: 'session-123',
        documentUri: 'file:///workspace/project/src/main.js',
        sourceClientId: 'client-abc',
        cursorPosition: 'not an object'
      };
      
      expect(() => validateEditorPayload(payload)).toThrow('cursorPosition must be an object');
    });
    
    test('should reject payloads with missing cursorPosition fields', () => {
      const payload = {
        sessionId: 'session-123',
        documentUri: 'file:///workspace/project/src/main.js',
        sourceClientId: 'client-abc',
        cursorPosition: {
          line: 15
          // missing column
        }
      };
      
      expect(() => validateEditorPayload(payload)).toThrow('Missing required field: column');
    });
    
    test('should reject payloads with invalid selection structure', () => {
      const payload = {
        sessionId: 'session-123',
        documentUri: 'file:///workspace/project/src/main.js',
        sourceClientId: 'client-abc',
        selection: 'not an object'
      };
      
      expect(() => validateEditorPayload(payload)).toThrow('selection must be an object');
    });
  });
  
  describe('validateExtensionPayload edge cases', () => {
    test('should validate payloads with session scope and sessionId', () => {
      const payload = {
        extensionId: 'vscode.git',
        state: { enabled: true },
        sourceClientId: 'client-abc',
        scope: 'session',
        sessionId: 'session-123'
      };
      
      expect(validateExtensionPayload(payload)).toBe(true);
    });
    
    test('should validate payloads with global scope', () => {
      const payload = {
        extensionId: 'vscode.git',
        state: { enabled: true },
        sourceClientId: 'client-abc',
        scope: 'global'
      };
      
      expect(validateExtensionPayload(payload)).toBe(true);
    });
    
    test('should reject payloads with invalid scope value', () => {
      const payload = {
        extensionId: 'vscode.git',
        state: { enabled: true },
        sourceClientId: 'client-abc',
        scope: 'invalid-scope'
      };
      
      expect(() => validateExtensionPayload(payload)).toThrow('scope must be either "session" or "global"');
    });
    
    test('should reject payloads with session scope but missing sessionId', () => {
      const payload = {
        extensionId: 'vscode.git',
        state: { enabled: true },
        sourceClientId: 'client-abc',
        scope: 'session'
        // missing sessionId
      };
      
      expect(() => validateExtensionPayload(payload)).toThrow('sessionId is required when scope is "session"');
    });
  });
  
  describe('validateSessionCreatePayload edge cases', () => {
    test('should validate payloads with sessionOptions', () => {
      const payload = {
        sessionId: 'session-123',
        createdBy: 'client-abc',
        workspaceId: 'workspace-xyz',
        sessionOptions: {
          allowEditing: true,
          allowTerminal: false,
          isPrivate: true
        }
      };
      
      expect(validateSessionCreatePayload(payload)).toBe(true);
    });
    
    test('should reject payloads with invalid sessionOptions structure', () => {
      const payload = {
        sessionId: 'session-123',
        createdBy: 'client-abc',
        workspaceId: 'workspace-xyz',
        sessionOptions: 'not an object'
      };
      
      expect(() => validateSessionCreatePayload(payload)).toThrow('sessionOptions must be an object');
    });
    
    test('should reject payloads with invalid sessionOptions field types', () => {
      const payload = {
        sessionId: 'session-123',
        createdBy: 'client-abc',
        workspaceId: 'workspace-xyz',
        sessionOptions: {
          allowEditing: 'not a boolean',
          allowTerminal: false,
          isPrivate: true
        }
      };
      
      expect(() => validateSessionCreatePayload(payload)).toThrow('allowEditing must be a boolean');
    });
  });
  
  describe('validateSessionJoinAckPayload edge cases', () => {
    test('should validate payloads with joined status', () => {
      const payload = {
        sessionId: 'session-123',
        status: 'joined',
        participants: ['client-abc', 'client-def'],
        activeDocument: 'file:///workspace/project/src/main.js',
        sharedTerminal: 'terminal-1'
      };
      
      expect(validateSessionJoinAckPayload(payload)).toBe(true);
    });
    
    test('should validate payloads with rejected status', () => {
      const payload = {
        sessionId: 'session-123',
        status: 'rejected',
        participants: []
      };
      
      expect(validateSessionJoinAckPayload(payload)).toBe(true);
    });
    
    test('should reject payloads with invalid status value', () => {
      const payload = {
        sessionId: 'session-123',
        status: 'invalid-status',
        participants: ['client-abc']
      };
      
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('status must be either "joined" or "rejected"');
    });
    
    test('should reject payloads with non-array participants', () => {
      const payload = {
        sessionId: 'session-123',
        status: 'joined',
        participants: 'not an array'
      };
      
      expect(() => validateSessionJoinAckPayload(payload)).toThrow('participants must be an array');
    });
  });
  
  describe('validateServerShutdownPayload edge cases', () => {
    test('should validate payloads with planned restart', () => {
      const payload = {
        reason: 'Maintenance',
        time: '2025-04-04T22:30:00Z',
        plannedRestart: true,
        estimatedDowntime: 300
      };
      
      expect(validateServerShutdownPayload(payload)).toBe(true);
    });
    
    test('should reject payloads with invalid time format', () => {
      const payload = {
        reason: 'Maintenance',
        time: '2025-04-04 22:30:00',
        plannedRestart: true
      };
      
      expect(() => validateServerShutdownPayload(payload)).toThrow('time must be a valid ISO 8601 timestamp');
    });
    
    test('should reject payloads with invalid plannedRestart type', () => {
      const payload = {
        reason: 'Maintenance',
        time: '2025-04-04T22:30:00Z',
        plannedRestart: 'not a boolean'
      };
      
      expect(() => validateServerShutdownPayload(payload)).toThrow('plannedRestart must be a boolean');
    });
    
    test('should reject payloads with invalid estimatedDowntime type', () => {
      const payload = {
        reason: 'Maintenance',
        time: '2025-04-04T22:30:00Z',
        plannedRestart: true,
        estimatedDowntime: 'not a number'
      };
      
      expect(() => validateServerShutdownPayload(payload)).toThrow('estimatedDowntime must be a number');
    });
  });
  
  describe('validateTokenRefreshAckPayload edge cases', () => {
    test('should validate payloads with accepted status and validUntil', () => {
      const payload = {
        status: 'accepted',
        validUntil: '2025-04-05T22:30:00Z'
      };
      
      expect(validateTokenRefreshAckPayload(payload)).toBe(true);
    });
    
    test('should validate payloads with rejected status', () => {
      const payload = {
        status: 'rejected'
      };
      
      expect(validateTokenRefreshAckPayload(payload)).toBe(true);
    });
    
    test('should reject payloads with invalid status value', () => {
      const payload = {
        status: 'invalid-status'
      };
      
      expect(() => validateTokenRefreshAckPayload(payload)).toThrow('status must be either "accepted" or "rejected"');
    });
    
    test('should reject payloads with invalid validUntil format', () => {
      const payload = {
        status: 'accepted',
        validUntil: '2025-04-05 22:30:00'
      };
      
      expect(() => validateTokenRefreshAckPayload(payload)).toThrow('validUntil must be a valid ISO 8601 timestamp');
    });
  });
});