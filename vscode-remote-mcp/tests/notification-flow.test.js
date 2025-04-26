/**
 * Tests for notification flow validation in the VSCode Remote MCP system
 */

// Import the validation function we'll need to test
const {
  validateNotificationFlow
} = require('../src/utils/message-flow-validator');

describe('Notification Flow Validation', () => {
  describe('Notification Message Validation', () => {
    it('should validate a valid notification flow', () => {
      const validNotificationFlow = [
        {
          type: 'notification',
          id: 'notif-123',
          payload: {
            message: 'Server is shutting down for maintenance',
            timestamp: '2023-01-01T12:00:00Z',
            severity: 'info',
            source: 'server'
          }
        }
      ];
      
      expect(() => validateNotificationFlow(validNotificationFlow)).not.toThrow();
    });
    
    it('should reject a flow that does not start with notification', () => {
      const invalidNotificationFlow = [
        {
          type: 'connection',
          id: 'conn-123',
          payload: {
            clientId: 'client-abc',
            workspaceId: 'workspace-xyz'
          }
        }
      ];
      
      expect(() => validateNotificationFlow(invalidNotificationFlow)).toThrow('Notification flow must contain a notification message');
    });
    
    it('should reject a notification without a payload', () => {
      const invalidNotificationFlow = [
        {
          type: 'notification',
          id: 'notif-123'
          // Missing payload
        }
      ];
      
      expect(() => validateNotificationFlow(invalidNotificationFlow)).toThrow('Notification must include a payload');
    });
    
    it('should reject a notification without a message', () => {
      const invalidNotificationFlow = [
        {
          type: 'notification',
          id: 'notif-123',
          payload: {
            // Missing message
            timestamp: '2023-01-01T12:00:00Z',
            severity: 'info',
            source: 'server'
          }
        }
      ];
      
      expect(() => validateNotificationFlow(invalidNotificationFlow)).toThrow('Notification must include a message');
    });
    
    it('should reject a notification without a timestamp', () => {
      const invalidNotificationFlow = [
        {
          type: 'notification',
          id: 'notif-123',
          payload: {
            message: 'Server is shutting down for maintenance',
            // Missing timestamp
            severity: 'info',
            source: 'server'
          }
        }
      ];
      
      expect(() => validateNotificationFlow(invalidNotificationFlow)).toThrow('Notification must include a timestamp');
    });
    
    it('should reject a notification with an invalid timestamp format', () => {
      const invalidNotificationFlow = [
        {
          type: 'notification',
          id: 'notif-123',
          payload: {
            message: 'Server is shutting down for maintenance',
            timestamp: '01/01/2023 12:00:00', // Invalid format
            severity: 'info',
            source: 'server'
          }
        }
      ];
      
      expect(() => validateNotificationFlow(invalidNotificationFlow)).toThrow('Notification timestamp must be in ISO 8601 format');
    });
  });
});