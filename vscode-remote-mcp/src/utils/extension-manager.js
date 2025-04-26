/**
 * Extension Manager for VSCode Remote MCP
 * 
 * This module handles extension state synchronization between clients, including:
 * - Tracking extension states
 * - Synchronizing extension configurations
 * - Managing extension lifecycle events
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Extension Manager class
 */
class ExtensionManager {
  /**
   * Create a new ExtensionManager instance
   * @param {SessionManager} sessionManager - The session manager instance
   */
  constructor(sessionManager) {
    // Reference to session manager
    this.sessionManager = sessionManager;
    
    // Map of extension states: sessionId -> extensionId -> state
    this.extensionStates = new Map();
    
    // Map of client extensions: clientId -> Set of extensionIds
    this.clientExtensions = new Map();
  }

  /**
   * Register an extension
   * @param {string} sessionId - The session ID
   * @param {string} clientId - Client ID registering the extension
   * @param {string} extensionId - The extension ID
   * @param {Object} initialState - Initial extension state
   * @returns {Object} The registered extension state
   */
  registerExtension(sessionId, clientId, extensionId, initialState = {}) {
    // Verify session exists
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Verify client is in session
    if (!session.participants.includes(clientId)) {
      throw new Error(`Client ${clientId} is not a participant in session ${sessionId}`);
    }
    
    // Initialize session extensions if needed
    if (!this.extensionStates.has(sessionId)) {
      this.extensionStates.set(sessionId, new Map());
    }
    
    const sessionExtensions = this.extensionStates.get(sessionId);
    
    // Create extension state if it doesn't exist
    if (!sessionExtensions.has(extensionId)) {
      const extensionState = {
        id: extensionId,
        sessionId,
        registeredBy: clientId,
        registeredAt: new Date(),
        lastUpdated: new Date(),
        version: 1,
        state: initialState,
        history: [],
        maxHistorySize: 20,
        clients: new Set([clientId])
      };
      
      sessionExtensions.set(extensionId, extensionState);
      
      // Update session state
      this.sessionManager.updateExtensionState(sessionId, extensionId, {
        id: extensionId,
        registeredBy: clientId,
        registeredAt: extensionState.registeredAt,
        version: extensionState.version
      });
    } else {
      // Extension already exists, add client
      const extensionState = sessionExtensions.get(extensionId);
      extensionState.clients.add(clientId);
    }
    
    // Add to client extensions map
    if (!this.clientExtensions.has(clientId)) {
      this.clientExtensions.set(clientId, new Set());
    }
    this.clientExtensions.get(clientId).add(extensionId);
    
    return sessionExtensions.get(extensionId);
  }

  /**
   * Get extension state
   * @param {string} sessionId - The session ID
   * @param {string} extensionId - The extension ID
   * @returns {Object|null} The extension state or null if not found
   */
  getExtensionState(sessionId, extensionId) {
    const sessionExtensions = this.extensionStates.get(sessionId);
    if (!sessionExtensions) {
      return null;
    }
    
    return sessionExtensions.get(extensionId) || null;
  }

  /**
   * Get all extensions for a session
   * @param {string} sessionId - The session ID
   * @returns {Array} Array of extension states
   */
  getSessionExtensions(sessionId) {
    const sessionExtensions = this.extensionStates.get(sessionId);
    if (!sessionExtensions) {
      return [];
    }
    
    return Array.from(sessionExtensions.values());
  }

  /**
   * Get all extensions for a client
   * @param {string} clientId - The client ID
   * @returns {Array} Array of extension states
   */
  getClientExtensions(clientId) {
    const extensionIds = this.clientExtensions.get(clientId);
    if (!extensionIds) {
      return [];
    }
    
    const result = [];
    
    for (const [sessionId, sessionExtensions] of this.extensionStates.entries()) {
      for (const extensionId of extensionIds) {
        const extensionState = sessionExtensions.get(extensionId);
        if (extensionState && extensionState.clients.has(clientId)) {
          result.push(extensionState);
        }
      }
    }
    
    return result;
  }

  /**
   * Update extension state
   * @param {string} sessionId - The session ID
   * @param {string} clientId - The client ID making the update
   * @param {string} extensionId - The extension ID
   * @param {Object} stateUpdate - The state update
   * @param {number} version - The client's version number
   * @returns {Object|null} The updated extension state or null if update failed
   */
  updateExtensionState(sessionId, clientId, extensionId, stateUpdate, version) {
    // Get extension state
    const extensionState = this.getExtensionState(sessionId, extensionId);
    if (!extensionState) {
      return null;
    }
    
    // Verify client is registered for this extension
    if (!extensionState.clients.has(clientId)) {
      return null;
    }
    
    // Check version
    if (version < extensionState.version) {
      // Client is behind, reject update
      return null;
    }
    
    // Save old state for history
    const oldState = JSON.parse(JSON.stringify(extensionState.state));
    
    // Update state (merge with existing state)
    extensionState.state = {
      ...extensionState.state,
      ...stateUpdate
    };
    
    extensionState.version++;
    extensionState.lastUpdated = new Date();
    
    // Add to history
    extensionState.history.push({
      clientId,
      timestamp: new Date(),
      version: extensionState.version,
      oldState,
      newState: JSON.parse(JSON.stringify(extensionState.state))
    });
    
    // Trim history if needed
    if (extensionState.history.length > extensionState.maxHistorySize) {
      extensionState.history = extensionState.history.slice(-extensionState.maxHistorySize);
    }
    
    // Update session state
    this.sessionManager.updateExtensionState(sessionId, extensionId, {
      id: extensionId,
      registeredBy: extensionState.registeredBy,
      registeredAt: extensionState.registeredAt,
      version: extensionState.version,
      lastUpdated: extensionState.lastUpdated
    });
    
    return extensionState;
  }

  /**
   * Unregister client from extension
   * @param {string} sessionId - The session ID
   * @param {string} clientId - The client ID to unregister
   * @param {string} extensionId - The extension ID
   * @returns {boolean} True if client was unregistered, false otherwise
   */
  unregisterClient(sessionId, clientId, extensionId) {
    // Get extension state
    const extensionState = this.getExtensionState(sessionId, extensionId);
    if (!extensionState) {
      return false;
    }
    
    // Remove client from extension
    if (!extensionState.clients.has(clientId)) {
      return false;
    }
    
    extensionState.clients.delete(clientId);
    
    // Remove from client extensions map
    if (this.clientExtensions.has(clientId)) {
      this.clientExtensions.get(clientId).delete(extensionId);
      if (this.clientExtensions.get(clientId).size === 0) {
        this.clientExtensions.delete(clientId);
      }
    }
    
    // If no clients left, remove extension state
    if (extensionState.clients.size === 0) {
      const sessionExtensions = this.extensionStates.get(sessionId);
      if (sessionExtensions) {
        sessionExtensions.delete(extensionId);
        
        // If no extensions left for session, remove session
        if (sessionExtensions.size === 0) {
          this.extensionStates.delete(sessionId);
        }
      }
    }
    
    return true;
  }

  /**
   * Unregister all extensions for a client
   * @param {string} clientId - The client ID to unregister
   * @returns {number} Number of extensions unregistered
   */
  unregisterClientAll(clientId) {
    const extensionIds = this.clientExtensions.get(clientId);
    if (!extensionIds) {
      return 0;
    }
    
    let count = 0;
    
    // Copy the set to avoid modification during iteration
    const extensionIdsCopy = Array.from(extensionIds);
    
    for (const [sessionId, sessionExtensions] of this.extensionStates.entries()) {
      for (const extensionId of extensionIdsCopy) {
        if (sessionExtensions.has(extensionId)) {
          if (this.unregisterClient(sessionId, clientId, extensionId)) {
            count++;
          }
        }
      }
    }
    
    return count;
  }

  /**
   * Reset extension state
   * @param {string} sessionId - The session ID
   * @param {string} clientId - The client ID requesting the reset
   * @param {string} extensionId - The extension ID
   * @param {Object} newState - The new state to set
   * @returns {Object|null} The updated extension state or null if reset failed
   */
  resetExtensionState(sessionId, clientId, extensionId, newState = {}) {
    // Get extension state
    const extensionState = this.getExtensionState(sessionId, extensionId);
    if (!extensionState) {
      return null;
    }
    
    // Verify client is registered for this extension
    if (!extensionState.clients.has(clientId)) {
      return null;
    }
    
    // Save old state for history
    const oldState = JSON.parse(JSON.stringify(extensionState.state));
    
    // Reset state
    extensionState.state = newState;
    extensionState.version++;
    extensionState.lastUpdated = new Date();
    
    // Add to history
    extensionState.history.push({
      clientId,
      timestamp: new Date(),
      version: extensionState.version,
      oldState,
      newState: JSON.parse(JSON.stringify(newState)),
      type: 'reset'
    });
    
    // Trim history if needed
    if (extensionState.history.length > extensionState.maxHistorySize) {
      extensionState.history = extensionState.history.slice(-extensionState.maxHistorySize);
    }
    
    // Update session state
    this.sessionManager.updateExtensionState(sessionId, extensionId, {
      id: extensionId,
      registeredBy: extensionState.registeredBy,
      registeredAt: extensionState.registeredAt,
      version: extensionState.version,
      lastUpdated: extensionState.lastUpdated
    });
    
    return extensionState;
  }

  /**
   * Clean up inactive extensions
   * @param {number} maxInactivityMs - Maximum inactivity time in milliseconds (default: 24 hours)
   * @returns {number} Number of extensions removed
   */
  cleanupInactiveExtensions(maxInactivityMs = 24 * 60 * 60 * 1000) {
    const now = new Date();
    let removedCount = 0;
    
    for (const [sessionId, sessionExtensions] of this.extensionStates.entries()) {
      const extensionsToRemove = [];
      
      for (const [extensionId, extensionState] of sessionExtensions.entries()) {
        const inactiveTime = now - extensionState.lastUpdated;
        
        if (inactiveTime > maxInactivityMs) {
          extensionsToRemove.push(extensionId);
          
          // Remove from client extensions map
          for (const clientId of extensionState.clients) {
            if (this.clientExtensions.has(clientId)) {
              this.clientExtensions.get(clientId).delete(extensionId);
              if (this.clientExtensions.get(clientId).size === 0) {
                this.clientExtensions.delete(clientId);
              }
            }
          }
          
          removedCount++;
        }
      }
      
      // Remove extensions
      for (const extensionId of extensionsToRemove) {
        sessionExtensions.delete(extensionId);
      }
      
      // If no extensions left for session, remove session
      if (sessionExtensions.size === 0) {
        this.extensionStates.delete(sessionId);
      }
    }
    
    return removedCount;
  }

  /**
   * Dispose of the extension manager
   */
  dispose() {
    this.extensionStates.clear();
    this.clientExtensions.clear();
  }
}

module.exports = {
  ExtensionManager
};