/**
 * Mock Client State Manager for VSCode Remote MCP
 */

class ClientStateManager {
  constructor() {
    this.connectionState = 'Disconnected';
    this.sessionState = 'Inactive';
    this.terminalState = 'Closed';
    this.documentState = 'Closed';
    this.listeners = new Map();
  }

  /**
   * Get the current connection state
   * @returns {string} - Connection state
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Set the connection state
   * @param {string} state - New connection state
   */
  setConnectionState(state) {
    this.connectionState = state;
    this.notifyListeners('connection', state);
  }

  /**
   * Get the current session state
   * @returns {string} - Session state
   */
  getSessionState() {
    return this.sessionState;
  }

  /**
   * Set the session state
   * @param {string} state - New session state
   */
  setSessionState(state) {
    this.sessionState = state;
    this.notifyListeners('session', state);
  }

  /**
   * Get the current terminal state
   * @returns {string} - Terminal state
   */
  getTerminalState() {
    return this.terminalState;
  }

  /**
   * Set the terminal state
   * @param {string} state - New terminal state
   */
  setTerminalState(state) {
    this.terminalState = state;
    this.notifyListeners('terminal', state);
  }

  /**
   * Get the current document state
   * @returns {string} - Document state
   */
  getDocumentState() {
    return this.documentState;
  }

  /**
   * Set the document state
   * @param {string} state - New document state
   */
  setDocumentState(state) {
    this.documentState = state;
    this.notifyListeners('document', state);
  }

  /**
   * Add a state change listener
   * @param {string} stateType - Type of state to listen for
   * @param {Function} listener - Listener function
   * @returns {Function} - Function to remove the listener
   */
  addStateChangeListener(stateType, listener) {
    if (!this.listeners.has(stateType)) {
      this.listeners.set(stateType, new Set());
    }
    this.listeners.get(stateType).add(listener);
    
    return () => {
      const listeners = this.listeners.get(stateType);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  /**
   * Notify all listeners of a state change
   * @param {string} stateType - Type of state that changed
   * @param {string} newState - New state value
   */
  notifyListeners(stateType, newState) {
    const listeners = this.listeners.get(stateType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(newState);
        } catch (error) {
          console.error(`Error in state listener for ${stateType}:`, error);
        }
      });
    }
  }
}

// Create a mock ClientStateModel for testing
const ClientStateModel = jest.fn().mockImplementation(() => ({
  getClientState: jest.fn(),
  updateConnectionState: jest.fn(),
  updateSessionState: jest.fn()
}));

module.exports = {
  ClientStateManager,
  ClientStateModel
};