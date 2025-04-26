/**
 * Session Manager for VSCode Remote MCP
 * 
 * This module handles the creation, management, and cleanup of collaborative sessions.
 * It provides functionality for:
 * - Creating new sessions
 * - Adding participants to sessions
 * - Removing participants from sessions
 * - Session state synchronization
 * - Session cleanup and termination
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Session Manager class
 */
class SessionManager {
  /**
   * Create a new SessionManager instance
   */
  constructor() {
    // Map of active sessions: sessionId -> session object
    this.activeSessions = new Map();
    
    // Map of client to session: clientId -> sessionId
    this.clientSessionMap = new Map();
    
    // Set interval for session cleanup
    this.cleanupInterval = setInterval(() => this.cleanupInactiveSessions(), 60 * 60 * 1000); // 1 hour
  }

  /**
   * Create a new session
   * @param {string} sessionId - Optional session ID (generated if not provided)
   * @param {string} createdBy - Client ID of the session creator
   * @param {string} workspaceId - Workspace ID for the session
   * @param {string} sessionName - Name of the session
   * @returns {Object} The created session object
   */
  createSession(sessionId = null, createdBy, workspaceId, sessionName = null) {
    // Generate session ID if not provided
    const id = sessionId || uuidv4();
    
    // Check if session already exists
    if (this.activeSessions.has(id)) {
      throw new Error(`Session with ID ${id} already exists`);
    }
    
    // Create new session object
    const session = {
      id,
      createdBy,
      workspaceId,
      name: sessionName || `Session ${id.substring(0, 8)}`,
      createdAt: new Date(),
      lastActivity: new Date(),
      participants: [createdBy],
      state: {
        terminals: new Map(),
        editors: new Map(),
        extensions: new Map()
      }
    };
    
    // Store session
    this.activeSessions.set(id, session);
    this.clientSessionMap.set(createdBy, id);
    
    return session;
  }

  /**
   * Get a session by ID
   * @param {string} sessionId - The session ID
   * @returns {Object|null} The session object or null if not found
   */
  getSession(sessionId) {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Add a participant to a session
   * @param {string} sessionId - The session ID
   * @param {string} clientId - The client ID to add
   * @param {string} workspaceId - The workspace ID of the client
   * @returns {Object} The updated session object
   */
  addParticipant(sessionId, clientId, workspaceId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Check if client is already in session
    if (session.participants.includes(clientId)) {
      return session;
    }
    
    // Add client to session
    session.participants.push(clientId);
    session.lastActivity = new Date();
    
    // Update client-session mapping
    this.clientSessionMap.set(clientId, sessionId);
    
    return session;
  }

  /**
   * Remove a participant from a session
   * @param {string} sessionId - The session ID
   * @param {string} clientId - The client ID to remove
   * @returns {Object} The updated session object
   */
  removeParticipant(sessionId, clientId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Remove client from session
    session.participants = session.participants.filter(id => id !== clientId);
    session.lastActivity = new Date();
    
    // Remove client-session mapping
    this.clientSessionMap.delete(clientId);
    
    // If session is empty, remove it
    if (session.participants.length === 0) {
      this.removeSession(sessionId);
      return null;
    }
    
    return session;
  }

  /**
   * Remove a session
   * @param {string} sessionId - The session ID
   * @returns {boolean} True if session was removed, false otherwise
   */
  removeSession(sessionId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    // Remove all client-session mappings for this session
    for (const clientId of session.participants) {
      this.clientSessionMap.delete(clientId);
    }
    
    // Remove session
    this.activeSessions.delete(sessionId);
    
    return true;
  }

  /**
   * Get the session for a client
   * @param {string} clientId - The client ID
   * @returns {Object|null} The session object or null if not found
   */
  getClientSession(clientId) {
    const sessionId = this.clientSessionMap.get(clientId);
    
    if (!sessionId) {
      return null;
    }
    
    return this.getSession(sessionId);
  }

  /**
   * Update session activity timestamp
   * @param {string} sessionId - The session ID
   * @returns {boolean} True if session was updated, false otherwise
   */
  updateSessionActivity(sessionId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    session.lastActivity = new Date();
    return true;
  }

  /**
   * Clean up inactive sessions
   * @param {number} maxInactivityMs - Maximum inactivity time in milliseconds (default: 24 hours)
   * @returns {number} Number of sessions removed
   */
  cleanupInactiveSessions(maxInactivityMs = 24 * 60 * 60 * 1000) {
    const now = new Date();
    let removedCount = 0;
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      const inactiveTime = now - session.lastActivity;
      
      if (inactiveTime > maxInactivityMs) {
        this.removeSession(sessionId);
        removedCount++;
      }
    }
    
    return removedCount;
  }

  /**
   * Update terminal state for a session
   * @param {string} sessionId - The session ID
   * @param {string} terminalId - The terminal ID
   * @param {Object} state - The terminal state
   * @returns {boolean} True if state was updated, false otherwise
   */
  updateTerminalState(sessionId, terminalId, state) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    session.state.terminals.set(terminalId, {
      ...state,
      updatedAt: new Date()
    });
    
    session.lastActivity = new Date();
    return true;
  }

  /**
   * Get terminal state for a session
   * @param {string} sessionId - The session ID
   * @param {string} terminalId - The terminal ID
   * @returns {Object|null} The terminal state or null if not found
   */
  getTerminalState(sessionId, terminalId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }
    
    return session.state.terminals.get(terminalId) || null;
  }

  /**
   * Update editor state for a session
   * @param {string} sessionId - The session ID
   * @param {string} editorId - The editor ID
   * @param {Object} state - The editor state
   * @returns {boolean} True if state was updated, false otherwise
   */
  updateEditorState(sessionId, editorId, state) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    session.state.editors.set(editorId, {
      ...state,
      updatedAt: new Date()
    });
    
    session.lastActivity = new Date();
    return true;
  }

  /**
   * Get editor state for a session
   * @param {string} sessionId - The session ID
   * @param {string} editorId - The editor ID
   * @returns {Object|null} The editor state or null if not found
   */
  getEditorState(sessionId, editorId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }
    
    return session.state.editors.get(editorId) || null;
  }

  /**
   * Update extension state for a session
   * @param {string} sessionId - The session ID
   * @param {string} extensionId - The extension ID
   * @param {Object} state - The extension state
   * @returns {boolean} True if state was updated, false otherwise
   */
  updateExtensionState(sessionId, extensionId, state) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    session.state.extensions.set(extensionId, {
      ...state,
      updatedAt: new Date()
    });
    
    session.lastActivity = new Date();
    return true;
  }

  /**
   * Get extension state for a session
   * @param {string} sessionId - The session ID
   * @param {string} extensionId - The extension ID
   * @returns {Object|null} The extension state or null if not found
   */
  getExtensionState(sessionId, extensionId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }
    
    return session.state.extensions.get(extensionId) || null;
  }

  /**
   * Get all sessions
   * @returns {Array} Array of all session objects
   */
  getAllSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get number of active sessions
   * @returns {number} Number of active sessions
   */
  getSessionCount() {
    return this.activeSessions.size;
  }

  /**
   * Dispose of the session manager
   */
  dispose() {
    clearInterval(this.cleanupInterval);
    this.activeSessions.clear();
    this.clientSessionMap.clear();
  }
}

module.exports = {
  SessionManager
};
