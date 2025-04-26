/**
 * Terminal Manager for VSCode Remote MCP
 * 
 * This module handles terminal sharing between clients, including:
 * - Creating shared terminals
 * - Distributing terminal output to connected clients
 * - Processing terminal input from clients
 * - Managing terminal lifecycle
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Terminal Manager class
 */
class TerminalManager {
  /**
   * Create a new TerminalManager instance
   * @param {SessionManager} sessionManager - The session manager instance
   */
  constructor(sessionManager) {
    // Reference to session manager
    this.sessionManager = sessionManager;
    
    // Map of active terminals: terminalId -> terminal object
    this.terminals = new Map();
    
    // Map of client terminals: clientId -> Set of terminalIds
    this.clientTerminals = new Map();
  }

  /**
   * Create a new shared terminal
   * @param {string} sessionId - The session ID
   * @param {string} createdBy - Client ID of the terminal creator
   * @param {Object} options - Terminal options
   * @returns {Object} The created terminal object
   */
  createTerminal(sessionId, createdBy, options = {}) {
    // Verify session exists
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Verify client is in session
    if (!session.participants.includes(createdBy)) {
      throw new Error(`Client ${createdBy} is not a participant in session ${sessionId}`);
    }
    
    // Generate terminal ID
    const terminalId = uuidv4();
    
    // Create terminal object
    const terminal = {
      id: terminalId,
      sessionId,
      createdBy,
      createdAt: new Date(),
      lastActivity: new Date(),
      name: options.name || `Terminal ${terminalId.substring(0, 8)}`,
      shell: options.shell || 'bash',
      cwd: options.cwd || '~',
      dimensions: options.dimensions || { cols: 80, rows: 24 },
      participants: session.participants.slice(), // Copy all session participants
      buffer: [],
      bufferMaxSize: options.bufferMaxSize || 1000,
      state: options.state || 'active' // active, inactive, closed
    };
    
    // Store terminal
    this.terminals.set(terminalId, terminal);
    
    // Add to client terminals map
    for (const clientId of terminal.participants) {
      if (!this.clientTerminals.has(clientId)) {
        this.clientTerminals.set(clientId, new Set());
      }
      this.clientTerminals.get(clientId).add(terminalId);
    }
    
    // Update session state
    this.sessionManager.updateTerminalState(sessionId, terminalId, {
      id: terminalId,
      name: terminal.name,
      createdBy,
      createdAt: terminal.createdAt,
      state: terminal.state
    });
    
    return terminal;
  }

  /**
   * Get a terminal by ID
   * @param {string} terminalId - The terminal ID
   * @returns {Object|null} The terminal object or null if not found
   */
  getTerminal(terminalId) {
    return this.terminals.get(terminalId) || null;
  }

  /**
   * Get all terminals for a session
   * @param {string} sessionId - The session ID
   * @returns {Array} Array of terminal objects
   */
  getSessionTerminals(sessionId) {
    return Array.from(this.terminals.values())
      .filter(terminal => terminal.sessionId === sessionId);
  }

  /**
   * Get all terminals for a client
   * @param {string} clientId - The client ID
   * @returns {Array} Array of terminal objects
   */
  getClientTerminals(clientId) {
    const terminalIds = this.clientTerminals.get(clientId);
    if (!terminalIds) {
      return [];
    }
    
    return Array.from(terminalIds)
      .map(id => this.getTerminal(id))
      .filter(terminal => terminal !== null);
  }

  /**
   * Add a client to a terminal
   * @param {string} terminalId - The terminal ID
   * @param {string} clientId - The client ID to add
   * @returns {boolean} True if client was added, false otherwise
   */
  addClientToTerminal(terminalId, clientId) {
    const terminal = this.getTerminal(terminalId);
    if (!terminal) {
      return false;
    }
    
    // Check if client is already in terminal
    if (terminal.participants.includes(clientId)) {
      return true;
    }
    
    // Add client to terminal
    terminal.participants.push(clientId);
    
    // Add to client terminals map
    if (!this.clientTerminals.has(clientId)) {
      this.clientTerminals.set(clientId, new Set());
    }
    this.clientTerminals.get(clientId).add(terminalId);
    
    return true;
  }

  /**
   * Remove a client from a terminal
   * @param {string} terminalId - The terminal ID
   * @param {string} clientId - The client ID to remove
   * @returns {boolean} True if client was removed, false otherwise
   */
  removeClientFromTerminal(terminalId, clientId) {
    const terminal = this.getTerminal(terminalId);
    if (!terminal) {
      return false;
    }
    
    // Remove client from terminal
    const index = terminal.participants.indexOf(clientId);
    if (index === -1) {
      return false;
    }
    
    terminal.participants.splice(index, 1);
    
    // Remove from client terminals map
    if (this.clientTerminals.has(clientId)) {
      this.clientTerminals.get(clientId).delete(terminalId);
      if (this.clientTerminals.get(clientId).size === 0) {
        this.clientTerminals.delete(clientId);
      }
    }
    
    // If terminal has no participants and not created by this client, close it
    if (terminal.participants.length === 0 && terminal.createdBy !== clientId) {
      this.closeTerminal(terminalId);
    }
    
    return true;
  }

  /**
   * Process terminal output
   * @param {string} terminalId - The terminal ID
   * @param {string} data - The terminal output data
   * @returns {boolean} True if output was processed, false otherwise
   */
  processOutput(terminalId, data) {
    const terminal = this.getTerminal(terminalId);
    if (!terminal || terminal.state === 'closed') {
      return false;
    }
    
    // Update terminal activity
    terminal.lastActivity = new Date();
    
    // Add to buffer
    terminal.buffer.push({
      type: 'output',
      data,
      timestamp: new Date()
    });
    
    // Trim buffer if needed
    if (terminal.buffer.length > terminal.bufferMaxSize) {
      terminal.buffer = terminal.buffer.slice(-terminal.bufferMaxSize);
    }
    
    return true;
  }

  /**
   * Process terminal input
   * @param {string} terminalId - The terminal ID
   * @param {string} clientId - The client ID sending the input
   * @param {string} data - The terminal input data
   * @returns {boolean} True if input was processed, false otherwise
   */
  processInput(terminalId, clientId, data) {
    const terminal = this.getTerminal(terminalId);
    if (!terminal || terminal.state === 'closed') {
      return false;
    }
    
    // Verify client is a participant
    if (!terminal.participants.includes(clientId)) {
      return false;
    }
    
    // Update terminal activity
    terminal.lastActivity = new Date();
    
    // Add to buffer
    terminal.buffer.push({
      type: 'input',
      clientId,
      data,
      timestamp: new Date()
    });
    
    // Trim buffer if needed
    if (terminal.buffer.length > terminal.bufferMaxSize) {
      terminal.buffer = terminal.buffer.slice(-terminal.bufferMaxSize);
    }
    
    return true;
  }

  /**
   * Get terminal buffer
   * @param {string} terminalId - The terminal ID
   * @param {number} limit - Maximum number of entries to return (default: 100)
   * @returns {Array|null} Terminal buffer or null if terminal not found
   */
  getTerminalBuffer(terminalId, limit = 100) {
    const terminal = this.getTerminal(terminalId);
    if (!terminal) {
      return null;
    }
    
    // Return last 'limit' entries
    return terminal.buffer.slice(-limit);
  }

  /**
   * Resize terminal
   * @param {string} terminalId - The terminal ID
   * @param {Object} dimensions - The new dimensions { cols, rows }
   * @returns {boolean} True if terminal was resized, false otherwise
   */
  resizeTerminal(terminalId, dimensions) {
    const terminal = this.getTerminal(terminalId);
    if (!terminal || terminal.state === 'closed') {
      return false;
    }
    
    // Update dimensions
    terminal.dimensions = dimensions;
    terminal.lastActivity = new Date();
    
    return true;
  }

  /**
   * Close terminal
   * @param {string} terminalId - The terminal ID
   * @returns {boolean} True if terminal was closed, false otherwise
   */
  closeTerminal(terminalId) {
    const terminal = this.getTerminal(terminalId);
    if (!terminal) {
      return false;
    }
    
    // Update state
    terminal.state = 'closed';
    terminal.lastActivity = new Date();
    
    // Update session state
    this.sessionManager.updateTerminalState(terminal.sessionId, terminalId, {
      id: terminalId,
      name: terminal.name,
      createdBy: terminal.createdBy,
      createdAt: terminal.createdAt,
      state: 'closed'
    });
    
    // Remove from client terminals map
    for (const clientId of terminal.participants) {
      if (this.clientTerminals.has(clientId)) {
        this.clientTerminals.get(clientId).delete(terminalId);
        if (this.clientTerminals.get(clientId).size === 0) {
          this.clientTerminals.delete(clientId);
        }
      }
    }
    
    // Clear participants
    terminal.participants = [];
    
    return true;
  }

  /**
   * Clean up inactive terminals
   * @param {number} maxInactivityMs - Maximum inactivity time in milliseconds (default: 1 hour)
   * @returns {number} Number of terminals closed
   */
  cleanupInactiveTerminals(maxInactivityMs = 60 * 60 * 1000) {
    const now = new Date();
    let closedCount = 0;
    
    for (const [terminalId, terminal] of this.terminals.entries()) {
      const inactiveTime = now - terminal.lastActivity;
      
      if (terminal.state !== 'closed' && inactiveTime > maxInactivityMs) {
        this.closeTerminal(terminalId);
        closedCount++;
      }
    }
    
    return closedCount;
  }

  /**
   * Remove closed terminals
   * @param {number} maxAgeMs - Maximum age for closed terminals in milliseconds (default: 24 hours)
   * @returns {number} Number of terminals removed
   */
  removeClosedTerminals(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = new Date();
    let removedCount = 0;
    
    for (const [terminalId, terminal] of this.terminals.entries()) {
      if (terminal.state === 'closed') {
        const age = now - terminal.lastActivity;
        
        if (age > maxAgeMs) {
          this.terminals.delete(terminalId);
          removedCount++;
        }
      }
    }
    
    return removedCount;
  }

  /**
   * Dispose of the terminal manager
   */
  dispose() {
    this.terminals.clear();
    this.clientTerminals.clear();
  }
}

module.exports = {
  TerminalManager
};