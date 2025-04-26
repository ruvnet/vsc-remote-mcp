/**
 * Client State Manager for VSCode Remote MCP
 * 
 * This module provides a unified interface for managing all client state.
 */

const ClientConnectionState = require('./connection-state');
const SessionParticipationState = require('./session-state');
const DocumentCollaborationState = require('./document-state');
const TerminalSharingState = require('./terminal-state');
const { ConnectionState, SessionState } = require('./state-constants');

/**
 * Client State Manager class
 * Manages all client state and their interactions
 */
class ClientStateManager {
  /**
   * Create a new ClientStateManager instance
   */
  constructor() {
    this.connectionState = new ClientConnectionState();
    this.sessionState = new SessionParticipationState();
    this.documentState = new DocumentCollaborationState();
    this.terminalState = new TerminalSharingState();
    this.reconnectEnabled = false;
    this.previousSessionId = null;
    this.listeners = new Map();
    
    // Set up internal listeners to handle dependencies between states
    this._setupStateListeners();
  }

  /**
   * Set up internal state change listeners
   * @private
   */
  _setupStateListeners() {
    this.connectionState.onStateChange((oldState, newState) => {
      if (newState === ConnectionState.DISCONNECTED && oldState !== ConnectionState.DISCONNECTED) {
        // Reset session, document, and terminal states when disconnected
        this.sessionState.reset();
        this.documentState.reset();
        this.terminalState.reset();
        this.notifyListeners('connectionState', newState);
      } else if (newState === ConnectionState.CONNECTED && this.reconnectEnabled && this.previousSessionId) {
        // Auto-rejoin previous session if reconnection is enabled
        this.joinSession(this.previousSessionId);
      } else {
        this.notifyListeners('connectionState', newState);
      }
    });
    
    this.sessionState.onStateChange((oldState, newState) => {
      if (newState === SessionState.NO_SESSION && 
          (oldState === SessionState.ACTIVE_OWNER || oldState === SessionState.ACTIVE_PARTICIPANT)) {
        // Reset document and terminal states when leaving a session
        this.documentState.reset();
        this.terminalState.reset();
      }
      this.notifyListeners('sessionState', newState);
    });
    
    this.documentState.onStateChange((oldState, newState) => {
      this.notifyListeners('documentState', newState);
    });
    
    this.terminalState.onStateChange((oldState, newState) => {
      this.notifyListeners('terminalState', newState);
    });
  }

  /**
   * Connect to the server
   */
  connect() {
    this.connectionState.connect();
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    this.connectionState.disconnect();
  }

  /**
   * Create a new session
   * @param {string} sessionId - The session ID
   * @throws {Error} If not connected
   */
  createSession(sessionId) {
    if (this.connectionState.getCurrentState() !== ConnectionState.CONNECTED) {
      throw new Error('Cannot create session: Not connected');
    }
    this.sessionState.createSession(sessionId);
  }

  /**
   * Join an existing session
   * @param {string} sessionId - The session ID
   * @throws {Error} If not connected
   */
  joinSession(sessionId) {
    if (this.connectionState.getCurrentState() !== ConnectionState.CONNECTED) {
      throw new Error('Cannot join session: Not connected');
    }
    this.sessionState.joinSession(sessionId);
  }

  /**
   * Leave the current session
   */
  leaveSession() {
    if (this.reconnectEnabled) {
      this.previousSessionId = this.sessionState.getSessionId();
    }
    this.sessionState.leaveSession();
  }

  /**
   * Open a document
   * @param {string} documentUri - The document URI
   * @throws {Error} If not in a session
   */
  openDocument(documentUri) {
    if (this.sessionState.getCurrentState() !== SessionState.ACTIVE_OWNER && 
        this.sessionState.getCurrentState() !== SessionState.ACTIVE_PARTICIPANT) {
      throw new Error('Cannot open document: Not in a session');
    }
    this.documentState.openDocument(documentUri);
  }

  /**
   * Make an edit to the document
   * @param {Object} edit - The edit to make
   */
  makeEdit(edit) {
    this.documentState.makeEdit(edit);
  }

  /**
   * Complete the current edit
   */
  editComplete() {
    this.documentState.editComplete();
  }

  /**
   * Close the document
   */
  closeDocument() {
    this.documentState.closeDocument();
  }

  /**
   * Start a terminal
   * @param {string} terminalId - The terminal ID
   * @throws {Error} If not in a session
   */
  startTerminal(terminalId) {
    if (this.sessionState.getCurrentState() !== SessionState.ACTIVE_OWNER && 
        this.sessionState.getCurrentState() !== SessionState.ACTIVE_PARTICIPANT) {
      throw new Error('Cannot start terminal: Not in a session');
    }
    this.terminalState.startTerminal(terminalId);
  }

  /**
   * Send a command to the terminal
   * @param {string} command - The command to send
   */
  sendCommand(command) {
    this.terminalState.sendCommand(command);
  }

  /**
   * Complete the current command
   */
  commandComplete() {
    this.terminalState.commandComplete();
  }

  /**
   * Close the terminal
   */
  closeTerminal() {
    this.terminalState.closeTerminal();
  }

  /**
   * Handle incoming messages
   * @param {Object} message - The message to handle
   */
  handleMessage(message) {
    try {
      // Handle connection messages
      if (message.type === 'connection_ack') {
        this.connectionState.handleMessage(message);
      }
      // Handle session messages
      else if (message.type === 'session_create_ack' || message.type === 'session_join_ack') {
        this.sessionState.handleMessage(message);
      }
      // Handle error messages
      else if (message.type === 'error') {
        this.handleErrorMessage(message);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle error messages
   * @param {Object} message - The error message
   * @private
   */
  handleErrorMessage(message) {
    const { code, relatedTo } = message.payload;
    
    if (relatedTo === 'connection') {
      this.connectionState.handleError(new Error(message.payload.message));
    } else if (relatedTo === 'session_create' || relatedTo === 'session_join') {
      this.sessionState.handleError(new Error(message.payload.message));
    }
  }

  /**
   * Enable reconnection
   * @param {boolean} enabled - Whether reconnection is enabled
   */
  enableReconnection(enabled) {
    this.reconnectEnabled = enabled;
    if (enabled && this.sessionState.getCurrentState() !== SessionState.NO_SESSION) {
      this.previousSessionId = this.sessionState.getSessionId();
    }
  }

  /**
   * Get the current connection state
   * @returns {string} The connection state
   */
  getConnectionState() {
    return this.connectionState.getCurrentState();
  }

  /**
   * Get the current session state
   * @returns {string} The session state
   */
  getSessionState() {
    return this.sessionState.getCurrentState();
  }

  /**
   * Get the current document state
   * @returns {string} The document state
   */
  getDocumentState() {
    return this.documentState.getCurrentState();
  }

  /**
   * Get the current terminal state
   * @returns {string} The terminal state
   */
  getTerminalState() {
    return this.terminalState.getCurrentState();
  }

  /**
   * Get the session ID
   * @returns {string|null} The session ID
   */
  getSessionId() {
    return this.sessionState.getSessionId();
  }

  /**
   * Add a state change listener
   * @param {string} event - The event to listen for
   * @param {Function} callback - The callback function
   * @returns {string} The listener ID
   */
  addListener(event, callback) {
    const listenerId = `${event}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map());
    }
    
    this.listeners.get(event).set(listenerId, callback);
    
    return listenerId;
  }

  /**
   * Remove a state change listener
   * @param {string} event - The event
   * @param {string} listenerId - The listener ID
   */
  removeListener(event, listenerId) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(listenerId);
    }
  }

  /**
   * Notify all listeners of a state change
   * @param {string} event - The event
   * @param {*} data - The event data
   * @private
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event).values()) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Reset the state manager
   */
  reset() {
    this.connectionState.reset();
    this.sessionState.reset();
    this.documentState.reset();
    this.terminalState.reset();
    this.reconnectEnabled = false;
    this.previousSessionId = null;
  }
}

module.exports = ClientStateManager;