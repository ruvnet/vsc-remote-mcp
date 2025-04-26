/**
 * Editor Manager for VSCode Remote MCP
 * 
 * This module handles collaborative editing between clients, including:
 * - Tracking open editors
 * - Synchronizing editor content
 * - Managing cursor positions and selections
 * - Handling editor lifecycle events
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Editor Manager class
 */
class EditorManager {
  /**
   * Create a new EditorManager instance
   * @param {SessionManager} sessionManager - The session manager instance
   */
  constructor(sessionManager) {
    // Reference to session manager
    this.sessionManager = sessionManager;
    
    // Map of active editors: editorId -> editor object
    this.editors = new Map();
    
    // Map of client editors: clientId -> Set of editorIds
    this.clientEditors = new Map();
    
    // Map of file paths to editor IDs: filePath -> editorId
    this.filePathMap = new Map();
  }

  /**
   * Register an editor
   * @param {string} sessionId - The session ID
   * @param {string} clientId - Client ID registering the editor
   * @param {string} filePath - Path to the file being edited
   * @param {Object} options - Editor options
   * @returns {Object} The registered editor object
   */
  registerEditor(sessionId, clientId, filePath, options = {}) {
    // Verify session exists
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Verify client is in session
    if (!session.participants.includes(clientId)) {
      throw new Error(`Client ${clientId} is not a participant in session ${sessionId}`);
    }
    
    // Check if file is already being edited in this session
    if (this.filePathMap.has(filePath)) {
      const existingEditorId = this.filePathMap.get(filePath);
      const existingEditor = this.editors.get(existingEditorId);
      
      if (existingEditor && existingEditor.sessionId === sessionId) {
        // Add client to existing editor
        this.addClientToEditor(existingEditorId, clientId);
        return existingEditor;
      }
    }
    
    // Generate editor ID
    const editorId = uuidv4();
    
    // Create editor object
    const editor = {
      id: editorId,
      sessionId,
      filePath,
      registeredBy: clientId,
      registeredAt: new Date(),
      lastActivity: new Date(),
      language: options.language || this.detectLanguage(filePath),
      participants: [clientId],
      cursors: new Map(), // clientId -> cursor position
      selections: new Map(), // clientId -> selections array
      content: options.content || '',
      version: 1,
      changeHistory: [],
      maxHistorySize: options.maxHistorySize || 100,
      state: 'active' // active, inactive, closed
    };
    
    // Store editor
    this.editors.set(editorId, editor);
    this.filePathMap.set(filePath, editorId);
    
    // Add to client editors map
    if (!this.clientEditors.has(clientId)) {
      this.clientEditors.set(clientId, new Set());
    }
    this.clientEditors.get(clientId).add(editorId);
    
    // Update session state
    this.sessionManager.updateEditorState(sessionId, editorId, {
      id: editorId,
      filePath,
      registeredBy: clientId,
      registeredAt: editor.registeredAt,
      state: editor.state
    });
    
    return editor;
  }

  /**
   * Get an editor by ID
   * @param {string} editorId - The editor ID
   * @returns {Object|null} The editor object or null if not found
   */
  getEditor(editorId) {
    return this.editors.get(editorId) || null;
  }

  /**
   * Get editor by file path
   * @param {string} filePath - The file path
   * @returns {Object|null} The editor object or null if not found
   */
  getEditorByPath(filePath) {
    const editorId = this.filePathMap.get(filePath);
    if (!editorId) {
      return null;
    }
    
    return this.getEditor(editorId);
  }

  /**
   * Get all editors for a session
   * @param {string} sessionId - The session ID
   * @returns {Array} Array of editor objects
   */
  getSessionEditors(sessionId) {
    return Array.from(this.editors.values())
      .filter(editor => editor.sessionId === sessionId);
  }

  /**
   * Get all editors for a client
   * @param {string} clientId - The client ID
   * @returns {Array} Array of editor objects
   */
  getClientEditors(clientId) {
    const editorIds = this.clientEditors.get(clientId);
    if (!editorIds) {
      return [];
    }
    
    return Array.from(editorIds)
      .map(id => this.getEditor(id))
      .filter(editor => editor !== null);
  }

  /**
   * Add a client to an editor
   * @param {string} editorId - The editor ID
   * @param {string} clientId - The client ID to add
   * @returns {boolean} True if client was added, false otherwise
   */
  addClientToEditor(editorId, clientId) {
    const editor = this.getEditor(editorId);
    if (!editor || editor.state === 'closed') {
      return false;
    }
    
    // Check if client is already in editor
    if (editor.participants.includes(clientId)) {
      return true;
    }
    
    // Add client to editor
    editor.participants.push(clientId);
    
    // Add to client editors map
    if (!this.clientEditors.has(clientId)) {
      this.clientEditors.set(clientId, new Set());
    }
    this.clientEditors.get(clientId).add(editorId);
    
    return true;
  }

  /**
   * Remove a client from an editor
   * @param {string} editorId - The editor ID
   * @param {string} clientId - The client ID to remove
   * @returns {boolean} True if client was removed, false otherwise
   */
  removeClientFromEditor(editorId, clientId) {
    const editor = this.getEditor(editorId);
    if (!editor) {
      return false;
    }
    
    // Remove client from editor
    const index = editor.participants.indexOf(clientId);
    if (index === -1) {
      return false;
    }
    
    editor.participants.splice(index, 1);
    
    // Remove cursor and selection
    editor.cursors.delete(clientId);
    editor.selections.delete(clientId);
    
    // Remove from client editors map
    if (this.clientEditors.has(clientId)) {
      this.clientEditors.get(clientId).delete(editorId);
      if (this.clientEditors.get(clientId).size === 0) {
        this.clientEditors.delete(clientId);
      }
    }
    
    // If editor has no participants, close it
    if (editor.participants.length === 0) {
      this.closeEditor(editorId);
    }
    
    return true;
  }

  /**
   * Update editor content
   * @param {string} editorId - The editor ID
   * @param {string} clientId - The client ID making the change
   * @param {string} content - The new content
   * @param {number} version - The client's version number
   * @returns {boolean} True if content was updated, false otherwise
   */
  updateContent(editorId, clientId, content, version) {
    const editor = this.getEditor(editorId);
    if (!editor || editor.state === 'closed') {
      return false;
    }
    
    // Verify client is a participant
    if (!editor.participants.includes(clientId)) {
      return false;
    }
    
    // Check version
    if (version < editor.version) {
      // Client is behind, reject update
      return false;
    }
    
    // Update content
    const oldContent = editor.content;
    editor.content = content;
    editor.version++;
    editor.lastActivity = new Date();
    
    // Add to change history
    editor.changeHistory.push({
      clientId,
      timestamp: new Date(),
      version: editor.version,
      oldContent,
      newContent: content
    });
    
    // Trim history if needed
    if (editor.changeHistory.length > editor.maxHistorySize) {
      editor.changeHistory = editor.changeHistory.slice(-editor.maxHistorySize);
    }
    
    return true;
  }

  /**
   * Update cursor position
   * @param {string} editorId - The editor ID
   * @param {string} clientId - The client ID
   * @param {Object} position - The cursor position { line, column }
   * @returns {boolean} True if cursor was updated, false otherwise
   */
  updateCursor(editorId, clientId, position) {
    const editor = this.getEditor(editorId);
    if (!editor || editor.state === 'closed') {
      return false;
    }
    
    // Verify client is a participant
    if (!editor.participants.includes(clientId)) {
      return false;
    }
    
    // Update cursor
    editor.cursors.set(clientId, position);
    editor.lastActivity = new Date();
    
    return true;
  }

  /**
   * Update selections
   * @param {string} editorId - The editor ID
   * @param {string} clientId - The client ID
   * @param {Array} selections - Array of selection ranges
   * @returns {boolean} True if selections were updated, false otherwise
   */
  updateSelections(editorId, clientId, selections) {
    const editor = this.getEditor(editorId);
    if (!editor || editor.state === 'closed') {
      return false;
    }
    
    // Verify client is a participant
    if (!editor.participants.includes(clientId)) {
      return false;
    }
    
    // Update selections
    editor.selections.set(clientId, selections);
    editor.lastActivity = new Date();
    
    return true;
  }

  /**
   * Close editor
   * @param {string} editorId - The editor ID
   * @returns {boolean} True if editor was closed, false otherwise
   */
  closeEditor(editorId) {
    const editor = this.getEditor(editorId);
    if (!editor) {
      return false;
    }
    
    // Update state
    editor.state = 'closed';
    editor.lastActivity = new Date();
    
    // Update session state
    this.sessionManager.updateEditorState(editor.sessionId, editorId, {
      id: editorId,
      filePath: editor.filePath,
      registeredBy: editor.registeredBy,
      registeredAt: editor.registeredAt,
      state: 'closed'
    });
    
    // Remove from file path map
    this.filePathMap.delete(editor.filePath);
    
    // Remove from client editors map
    for (const clientId of editor.participants) {
      if (this.clientEditors.has(clientId)) {
        this.clientEditors.get(clientId).delete(editorId);
        if (this.clientEditors.get(clientId).size === 0) {
          this.clientEditors.delete(clientId);
        }
      }
    }
    
    // Clear participants
    editor.participants = [];
    
    return true;
  }

  /**
   * Detect language from file path
   * @param {string} filePath - The file path
   * @returns {string} Detected language
   */
  detectLanguage(filePath) {
    const extension = filePath.split('.').pop().toLowerCase();
    
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascriptreact',
      'tsx': 'typescriptreact',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'sh': 'shellscript',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'rs': 'rust'
    };
    
    return languageMap[extension] || 'plaintext';
  }

  /**
   * Clean up inactive editors
   * @param {number} maxInactivityMs - Maximum inactivity time in milliseconds (default: 1 hour)
   * @returns {number} Number of editors closed
   */
  cleanupInactiveEditors(maxInactivityMs = 60 * 60 * 1000) {
    const now = new Date();
    let closedCount = 0;
    
    for (const [editorId, editor] of this.editors.entries()) {
      const inactiveTime = now - editor.lastActivity;
      
      if (editor.state !== 'closed' && inactiveTime > maxInactivityMs) {
        this.closeEditor(editorId);
        closedCount++;
      }
    }
    
    return closedCount;
  }

  /**
   * Remove closed editors
   * @param {number} maxAgeMs - Maximum age for closed editors in milliseconds (default: 24 hours)
   * @returns {number} Number of editors removed
   */
  removeClosedEditors(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = new Date();
    let removedCount = 0;
    
    for (const [editorId, editor] of this.editors.entries()) {
      if (editor.state === 'closed') {
        const age = now - editor.lastActivity;
        
        if (age > maxAgeMs) {
          this.editors.delete(editorId);
          removedCount++;
        }
      }
    }
    
    return removedCount;
  }

  /**
   * Dispose of the editor manager
   */
  dispose() {
    this.editors.clear();
    this.clientEditors.clear();
    this.filePathMap.clear();
  }
}

module.exports = {
  EditorManager
};