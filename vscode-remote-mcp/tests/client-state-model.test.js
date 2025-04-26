/**
 * Tests for client state model in the VSCode Remote MCP system
 * Based on the state model defined in 05-client-state-model.md
 */

// Import the client state model functions (to be implemented)
const {
  ClientConnectionState,
  SessionParticipationState,
  DocumentCollaborationState,
  TerminalSharingState,
  ClientStateManager
} = require('../src/utils/client-state-model');

describe('Client State Model', () => {
  // Connection State Tests
  describe('Connection State Machine', () => {
    let connectionState;

    beforeEach(() => {
      connectionState = new ClientConnectionState();
    });

    it('should initialize in Disconnected state', () => {
      expect(connectionState.getCurrentState()).toBe('Disconnected');
    });

    it('should transition from Disconnected to Connecting when connect() is called', () => {
      connectionState.connect();
      expect(connectionState.getCurrentState()).toBe('Connecting');
    });

    it('should transition from Connecting to Connected when connection_ack is received', () => {
      connectionState.connect();
      connectionState.handleMessage({ type: 'connection_ack' });
      expect(connectionState.getCurrentState()).toBe('Connected');
    });

    it('should transition from Connecting to Disconnected on error', () => {
      connectionState.connect();
      connectionState.handleError(new Error('Connection failed'));
      expect(connectionState.getCurrentState()).toBe('Disconnected');
    });

    it('should transition from Connected to Disconnected when disconnect() is called', () => {
      // Setup: Get to Connected state
      connectionState.connect();
      connectionState.handleMessage({ type: 'connection_ack' });
      
      // Test the transition
      connectionState.disconnect();
      expect(connectionState.getCurrentState()).toBe('Disconnected');
    });

    it('should transition from Connected to Disconnected on error', () => {
      // Setup: Get to Connected state
      connectionState.connect();
      connectionState.handleMessage({ type: 'connection_ack' });
      
      // Test the transition
      connectionState.handleError(new Error('Connection lost'));
      expect(connectionState.getCurrentState()).toBe('Disconnected');
    });

    it('should not allow invalid transitions', () => {
      // Cannot go from Disconnected to Connected directly
      expect(() => connectionState.handleMessage({ type: 'connection_ack' })).toThrow();
      
      // Cannot disconnect when not connected
      expect(() => connectionState.disconnect()).toThrow();
    });

    it('should trigger callbacks on state transitions', () => {
      const mockCallback = jest.fn();
      connectionState.onStateChange(mockCallback);
      
      connectionState.connect();
      expect(mockCallback).toHaveBeenCalledWith('Disconnected', 'Connecting');
      
      connectionState.handleMessage({ type: 'connection_ack' });
      expect(mockCallback).toHaveBeenCalledWith('Connecting', 'Connected');
    });
  });

  // Session Participation State Tests
  describe('Session Participation State Machine', () => {
    let sessionState;

    beforeEach(() => {
      sessionState = new SessionParticipationState();
    });

    it('should initialize in Not In Session state', () => {
      expect(sessionState.getCurrentState()).toBe('NotInSession');
    });

    it('should transition from NotInSession to CreatingSession when createSession() is called', () => {
      sessionState.createSession('session-123');
      expect(sessionState.getCurrentState()).toBe('CreatingSession');
      expect(sessionState.getSessionId()).toBe('session-123');
    });

    it('should transition from CreatingSession to SessionOwner when session_create_ack is received', () => {
      sessionState.createSession('session-123');
      sessionState.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      });
      expect(sessionState.getCurrentState()).toBe('SessionOwner');
    });

    it('should transition from NotInSession to JoiningSession when joinSession() is called', () => {
      sessionState.joinSession('session-123');
      expect(sessionState.getCurrentState()).toBe('JoiningSession');
      expect(sessionState.getSessionId()).toBe('session-123');
    });

    it('should transition from JoiningSession to SessionParticipant when session_join_ack is received', () => {
      sessionState.joinSession('session-123');
      sessionState.handleMessage({ 
        type: 'session_join_ack', 
        payload: { sessionId: 'session-123', status: 'joined' } 
      });
      expect(sessionState.getCurrentState()).toBe('SessionParticipant');
    });

    it('should transition from JoiningSession to NotInSession when session_join_ack with rejected status is received', () => {
      sessionState.joinSession('session-123');
      sessionState.handleMessage({ 
        type: 'session_join_ack', 
        payload: { sessionId: 'session-123', status: 'rejected' } 
      });
      expect(sessionState.getCurrentState()).toBe('NotInSession');
    });

    it('should transition from SessionOwner to NotInSession when leaveSession() is called', () => {
      // Setup: Get to SessionOwner state
      sessionState.createSession('session-123');
      sessionState.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      });
      
      // Test the transition
      sessionState.leaveSession();
      expect(sessionState.getCurrentState()).toBe('NotInSession');
      expect(sessionState.getSessionId()).toBeNull();
    });

    it('should transition from SessionParticipant to NotInSession when leaveSession() is called', () => {
      // Setup: Get to SessionParticipant state
      sessionState.joinSession('session-123');
      sessionState.handleMessage({ 
        type: 'session_join_ack', 
        payload: { sessionId: 'session-123', status: 'joined' } 
      });
      
      // Test the transition
      sessionState.leaveSession();
      expect(sessionState.getCurrentState()).toBe('NotInSession');
      expect(sessionState.getSessionId()).toBeNull();
    });

    it('should not allow invalid transitions', () => {
      // Cannot go from NotInSession to SessionOwner directly
      expect(() => sessionState.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      })).toThrow();
      
      // Cannot leave a session when not in one
      expect(() => sessionState.leaveSession()).toThrow();
    });
  });

  // Document Collaboration State Tests
  describe('Document Collaboration State Machine', () => {
    let documentState;

    beforeEach(() => {
      documentState = new DocumentCollaborationState();
    });

    it('should initialize in No Active Document state', () => {
      expect(documentState.getCurrentState()).toBe('NoActiveDocument');
    });

    it('should transition from NoActiveDocument to DocumentActive when openDocument() is called', () => {
      documentState.openDocument('file:///path/to/document.js');
      expect(documentState.getCurrentState()).toBe('DocumentActive');
      expect(documentState.getDocumentUri()).toBe('file:///path/to/document.js');
    });

    it('should transition from DocumentActive to EditingDocument when makeEdit() is called', () => {
      documentState.openDocument('file:///path/to/document.js');
      documentState.makeEdit({ range: { startLine: 1, startColumn: 1 }, text: 'edit' });
      expect(documentState.getCurrentState()).toBe('EditingDocument');
    });

    it('should transition from EditingDocument to DocumentActive when editComplete() is called', () => {
      // Setup: Get to EditingDocument state
      documentState.openDocument('file:///path/to/document.js');
      documentState.makeEdit({ range: { startLine: 1, startColumn: 1 }, text: 'edit' });
      
      // Test the transition
      documentState.editComplete();
      expect(documentState.getCurrentState()).toBe('DocumentActive');
    });

    it('should transition from DocumentActive to NoActiveDocument when closeDocument() is called', () => {
      // Setup: Get to DocumentActive state
      documentState.openDocument('file:///path/to/document.js');
      
      // Test the transition
      documentState.closeDocument();
      expect(documentState.getCurrentState()).toBe('NoActiveDocument');
      expect(documentState.getDocumentUri()).toBeNull();
    });

    it('should transition from EditingDocument to NoActiveDocument when closeDocument() is called', () => {
      // Setup: Get to EditingDocument state
      documentState.openDocument('file:///path/to/document.js');
      documentState.makeEdit({ range: { startLine: 1, startColumn: 1 }, text: 'edit' });
      
      // Test the transition
      documentState.closeDocument();
      expect(documentState.getCurrentState()).toBe('NoActiveDocument');
      expect(documentState.getDocumentUri()).toBeNull();
    });

    it('should not allow invalid transitions', () => {
      // Cannot make edit when no document is active
      expect(() => documentState.makeEdit({ range: { startLine: 1, startColumn: 1 }, text: 'edit' })).toThrow();
      
      // Cannot complete edit when not editing
      expect(() => documentState.editComplete()).toThrow();
      
      // Cannot close document when no document is active
      expect(() => documentState.closeDocument()).toThrow();
    });
  });

  // Terminal Sharing State Tests
  describe('Terminal Sharing State Machine', () => {
    let terminalState;

    beforeEach(() => {
      terminalState = new TerminalSharingState();
    });

    it('should initialize in No Terminal state', () => {
      expect(terminalState.getCurrentState()).toBe('NoTerminal');
    });

    it('should transition from NoTerminal to TerminalActive when startTerminal() is called', () => {
      terminalState.startTerminal('terminal-1');
      expect(terminalState.getCurrentState()).toBe('TerminalActive');
      expect(terminalState.getTerminalId()).toBe('terminal-1');
    });

    it('should transition from TerminalActive to TerminalCommand when sendCommand() is called', () => {
      terminalState.startTerminal('terminal-1');
      terminalState.sendCommand('ls -la');
      expect(terminalState.getCurrentState()).toBe('TerminalCommand');
      expect(terminalState.getCurrentCommand()).toBe('ls -la');
    });

    it('should transition from TerminalCommand to TerminalActive when commandComplete() is called', () => {
      // Setup: Get to TerminalCommand state
      terminalState.startTerminal('terminal-1');
      terminalState.sendCommand('ls -la');
      
      // Test the transition
      terminalState.commandComplete();
      expect(terminalState.getCurrentState()).toBe('TerminalActive');
      expect(terminalState.getCurrentCommand()).toBeNull();
    });

    it('should transition from TerminalActive to NoTerminal when closeTerminal() is called', () => {
      // Setup: Get to TerminalActive state
      terminalState.startTerminal('terminal-1');
      
      // Test the transition
      terminalState.closeTerminal();
      expect(terminalState.getCurrentState()).toBe('NoTerminal');
      expect(terminalState.getTerminalId()).toBeNull();
    });

    it('should transition from TerminalCommand to NoTerminal when closeTerminal() is called', () => {
      // Setup: Get to TerminalCommand state
      terminalState.startTerminal('terminal-1');
      terminalState.sendCommand('ls -la');
      
      // Test the transition
      terminalState.closeTerminal();
      expect(terminalState.getCurrentState()).toBe('NoTerminal');
      expect(terminalState.getTerminalId()).toBeNull();
      expect(terminalState.getCurrentCommand()).toBeNull();
    });

    it('should not allow invalid transitions', () => {
      // Cannot send command when no terminal is active
      expect(() => terminalState.sendCommand('ls -la')).toThrow();
      
      // Cannot complete command when not in command state
      expect(() => terminalState.commandComplete()).toThrow();
      
      // Cannot close terminal when no terminal is active
      expect(() => terminalState.closeTerminal()).toThrow();
    });
  });

  // Client State Manager Tests
  describe('Client State Manager', () => {
    let stateManager;

    beforeEach(() => {
      stateManager = new ClientStateManager();
    });

    it('should initialize all state machines to their initial states', () => {
      expect(stateManager.getConnectionState()).toBe('Disconnected');
      expect(stateManager.getSessionState()).toBe('NotInSession');
      expect(stateManager.getDocumentState()).toBe('NoActiveDocument');
      expect(stateManager.getTerminalState()).toBe('NoTerminal');
    });

    it('should handle connection state transitions', () => {
      stateManager.connect();
      expect(stateManager.getConnectionState()).toBe('Connecting');
      
      stateManager.handleMessage({ type: 'connection_ack' });
      expect(stateManager.getConnectionState()).toBe('Connected');
    });

    it('should handle session state transitions', () => {
      // Setup: Connect first
      stateManager.connect();
      stateManager.handleMessage({ type: 'connection_ack' });
      
      stateManager.createSession('session-123');
      expect(stateManager.getSessionState()).toBe('CreatingSession');
      
      stateManager.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      });
      expect(stateManager.getSessionState()).toBe('SessionOwner');
    });

    it('should handle document state transitions', () => {
      // Setup: Connect and join session first
      stateManager.connect();
      stateManager.handleMessage({ type: 'connection_ack' });
      stateManager.createSession('session-123');
      stateManager.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      });
      
      stateManager.openDocument('file:///path/to/document.js');
      expect(stateManager.getDocumentState()).toBe('DocumentActive');
      
      stateManager.makeEdit({ range: { startLine: 1, startColumn: 1 }, text: 'edit' });
      expect(stateManager.getDocumentState()).toBe('EditingDocument');
    });

    it('should handle terminal state transitions', () => {
      // Setup: Connect and join session first
      stateManager.connect();
      stateManager.handleMessage({ type: 'connection_ack' });
      stateManager.createSession('session-123');
      stateManager.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      });
      
      stateManager.startTerminal('terminal-1');
      expect(stateManager.getTerminalState()).toBe('TerminalActive');
      
      stateManager.sendCommand('ls -la');
      expect(stateManager.getTerminalState()).toBe('TerminalCommand');
    });

    it('should reset session state when disconnected', () => {
      // Setup: Connect and join session first
      stateManager.connect();
      stateManager.handleMessage({ type: 'connection_ack' });
      stateManager.createSession('session-123');
      stateManager.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      });
      
      // Test: Disconnect
      stateManager.disconnect();
      
      // Verify all states are reset
      expect(stateManager.getConnectionState()).toBe('Disconnected');
      expect(stateManager.getSessionState()).toBe('NotInSession');
      expect(stateManager.getDocumentState()).toBe('NoActiveDocument');
      expect(stateManager.getTerminalState()).toBe('NoTerminal');
    });

    it('should reset document and terminal states when leaving session', () => {
      // Setup: Connect, join session, open document, start terminal
      stateManager.connect();
      stateManager.handleMessage({ type: 'connection_ack' });
      stateManager.createSession('session-123');
      stateManager.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      });
      stateManager.openDocument('file:///path/to/document.js');
      stateManager.startTerminal('terminal-1');
      
      // Test: Leave session
      stateManager.leaveSession();
      
      // Verify document and terminal states are reset
      expect(stateManager.getConnectionState()).toBe('Connected');
      expect(stateManager.getSessionState()).toBe('NotInSession');
      expect(stateManager.getDocumentState()).toBe('NoActiveDocument');
      expect(stateManager.getTerminalState()).toBe('NoTerminal');
    });

    it('should handle reconnection by restoring previous session', () => {
      // Setup: Connect, join session, then disconnect
      stateManager.connect();
      stateManager.handleMessage({ type: 'connection_ack' });
      stateManager.createSession('session-123');
      stateManager.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      });
      
      // Store session info for reconnection
      const sessionId = stateManager.getSessionId();
      stateManager.enableReconnection(true);
      
      // Disconnect
      stateManager.disconnect();
      
      // Reconnect
      stateManager.connect();
      stateManager.handleMessage({ type: 'connection_ack' });
      
      // Verify session is being rejoined
      expect(stateManager.getConnectionState()).toBe('Connected');
      expect(stateManager.getSessionState()).toBe('JoiningSession');
      expect(stateManager.getSessionId()).toBe(sessionId);
      
      // Complete reconnection
      stateManager.handleMessage({ 
        type: 'session_join_ack', 
        payload: { sessionId, status: 'joined' } 
      });
      
      // Verify session is rejoined
      expect(stateManager.getSessionState()).toBe('SessionParticipant');
    });

    it('should validate state transitions based on prerequisites', () => {
      // Cannot create session when not connected
      expect(() => stateManager.createSession('session-123')).toThrow();
      
      // Connect first
      stateManager.connect();
      stateManager.handleMessage({ type: 'connection_ack' });
      
      // Now can create session
      expect(() => stateManager.createSession('session-123')).not.toThrow();
      
      // Cannot open document when not in session
      expect(() => stateManager.openDocument('file:///path/to/document.js')).toThrow();
      
      // Join session first
      stateManager.handleMessage({ 
        type: 'session_create_ack', 
        payload: { sessionId: 'session-123' } 
      });
      
      // Now can open document
      expect(() => stateManager.openDocument('file:///path/to/document.js')).not.toThrow();
    });

    it('should handle error messages appropriately', () => {
      // Setup: Connect
      stateManager.connect();
      
      // Test: Handle connection error
      stateManager.handleMessage({ 
        type: 'error', 
        payload: { 
          code: 'CONNECTION_FAILED',
          message: 'Failed to connect',
          relatedTo: 'connection'
        } 
      });
      
      // Verify connection state is reset
      expect(stateManager.getConnectionState()).toBe('Disconnected');
      
      // Setup: Connect and try to create session
      stateManager.connect();
      stateManager.handleMessage({ type: 'connection_ack' });
      stateManager.createSession('session-123');
      
      // Test: Handle session creation error
      stateManager.handleMessage({ 
        type: 'error', 
        payload: { 
          code: 'SESSION_CREATE_FAILED',
          message: 'Failed to create session',
          relatedTo: 'session_create'
        } 
      });
      
      // Verify session state is reset
      expect(stateManager.getConnectionState()).toBe('Connected');
      expect(stateManager.getSessionState()).toBe('NotInSession');
    });
  });
});