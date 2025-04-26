/**
 * Unit tests for remaining edge cases in VSCode Remote MCP message type validator
 */

// Import the validation functions
const { 
  validateEditorPayload,
  validateExtensionPayload
} = require('../src/utils/message-type-validator');

describe('Message Type Validator Remaining Edge Cases', () => {
  
  describe('validateEditorPayload remaining edge cases', () => {
    test('should validate payloads with edit.range fields', () => {
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
        }
      };
      
      expect(validateEditorPayload(payload)).toBe(true);
    });
    
    test('should reject payloads with missing edit.range fields', () => {
      const payload = {
        sessionId: 'session-123',
        documentUri: 'file:///workspace/project/src/main.js',
        sourceClientId: 'client-abc',
        edit: {
          range: {
            startLine: 10,
            startColumn: 5,
            endLine: 12
            // missing endColumn
          },
          text: 'new code',
          version: 2
        }
      };
      
      expect(() => validateEditorPayload(payload)).toThrow('Missing required field: endColumn');
    });
    
    test('should reject payloads with non-number edit.range fields', () => {
      const payload = {
        sessionId: 'session-123',
        documentUri: 'file:///workspace/project/src/main.js',
        sourceClientId: 'client-abc',
        edit: {
          range: {
            startLine: '10', // string instead of number
            startColumn: 5,
            endLine: 12,
            endColumn: 10
          },
          text: 'new code',
          version: 2
        }
      };
      
      expect(() => validateEditorPayload(payload)).toThrow('startLine must be a number');
    });
  });
  
  describe('validateExtensionPayload remaining edge cases', () => {
    test('should validate payloads with complex state objects', () => {
      const payload = {
        extensionId: 'vscode.git',
        state: { 
          enabled: true,
          config: {
            remotes: ['origin', 'upstream'],
            branches: ['main', 'develop']
          },
          history: [
            { commit: 'abc123', message: 'Initial commit' },
            { commit: 'def456', message: 'Update readme' }
          ]
        },
        sourceClientId: 'client-abc'
      };
      
      expect(validateExtensionPayload(payload)).toBe(true);
    });
  });
});