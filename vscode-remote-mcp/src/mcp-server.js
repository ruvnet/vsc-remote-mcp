/**
 * VSCode Remote MCP Server
 * 
 * This is the main server class that integrates all components and provides
 * the core functionality for the VSCode Remote MCP system.
 */

const { ConfigManager } = require('./utils/config-manager');
const { AuthManager } = require('./utils/auth-manager');
const { SessionManager } = require('./utils/session-manager');
const { TerminalManager } = require('./utils/terminal-manager');
const { EditorManager } = require('./utils/editor-manager');
const { ExtensionManager } = require('./utils/extension-manager');
const { MessageRouter } = require('./utils/message-router');
const { validateMessage } = require('./utils/message-validator');
const { MCPConnectionManager } = require('./utils/connection-manager');
const { shutdownGracefully } = require('./utils/server-manager');
const { v4: uuidv4 } = require('uuid');

/**
 * MCP Server class
 */
class MCPServer {
  /**
   * Create a new MCPServer instance
   * @param {Object} options - Server options
   */
  constructor(options = {}) {
    // Initialize configuration
    this.configManager = new ConfigManager(options.configPath ? { configPath: options.configPath } : {});
    
    // Initialize managers
    this.authManager = new AuthManager(this.configManager);
    this.sessionManager = new SessionManager();
    this.terminalManager = new TerminalManager(this.sessionManager);
    this.editorManager = new EditorManager(this.sessionManager);
    this.extensionManager = new ExtensionManager(this.sessionManager);
    
    // Initialize message router
    this.messageRouter = new MessageRouter(this.configManager, this.authManager);
    
    // Connected clients map
    this.connectedClients = new Map();
    
    // Server configuration
    this.serverConfig = this.configManager.getSection('server');
    
    // Register message handlers
    this.registerMessageHandlers();
    
    // Set up cleanup intervals
    this.setupCleanupIntervals();
  }

  /**
   * Register message handlers
   */
  registerMessageHandlers() {
    // Connection handlers
    this.messageRouter.registerHandler('connection', this.handleConnectionRequest.bind(this), false);
    this.messageRouter.registerHandler('disconnect', this.handleDisconnectRequest.bind(this), false);
    
    // Authentication handlers
    this.messageRouter.registerHandler('token_refresh', this.handleTokenRefreshRequest.bind(this), false);
    
    // Session handlers
    this.messageRouter.registerHandler('session_create', this.handleSessionCreateRequest.bind(this), true);
    this.messageRouter.registerHandler('session_join', this.handleSessionJoinRequest.bind(this), true);
    this.messageRouter.registerHandler('session_leave', this.handleSessionLeaveRequest.bind(this), true);
    this.messageRouter.registerHandler('session_list', this.handleSessionListRequest.bind(this), true);
    
    // Terminal handlers
    this.messageRouter.registerHandler('terminal_create', this.handleTerminalCreateRequest.bind(this), true);
    this.messageRouter.registerHandler('terminal_data', this.handleTerminalDataRequest.bind(this), true);
    this.messageRouter.registerHandler('terminal_resize', this.handleTerminalResizeRequest.bind(this), true);
    this.messageRouter.registerHandler('terminal_close', this.handleTerminalCloseRequest.bind(this), true);
    
    // Editor handlers
    this.messageRouter.registerHandler('editor_open', this.handleEditorOpenRequest.bind(this), true);
    this.messageRouter.registerHandler('editor_change', this.handleEditorChangeRequest.bind(this), true);
    this.messageRouter.registerHandler('editor_cursor', this.handleEditorCursorRequest.bind(this), true);
    this.messageRouter.registerHandler('editor_selection', this.handleEditorSelectionRequest.bind(this), true);
    this.messageRouter.registerHandler('editor_close', this.handleEditorCloseRequest.bind(this), true);
    
    // Extension handlers
    this.messageRouter.registerHandler('extension_register', this.handleExtensionRegisterRequest.bind(this), true);
    this.messageRouter.registerHandler('extension_state', this.handleExtensionStateRequest.bind(this), true);
    this.messageRouter.registerHandler('extension_unregister', this.handleExtensionUnregisterRequest.bind(this), true);
  }

  /**
   * Set up cleanup intervals
   */
  setupCleanupIntervals() {
    // Session cleanup
    const sessionConfig = this.configManager.getSection('session');
    this.sessionCleanupInterval = setInterval(() => {
      this.sessionManager.cleanupInactiveSessions(sessionConfig.inactivityTimeoutMs);
    }, sessionConfig.cleanupIntervalMs);
    
    // Terminal cleanup
    const terminalConfig = this.configManager.getSection('terminal');
    this.terminalCleanupInterval = setInterval(() => {
      this.terminalManager.cleanupInactiveTerminals(terminalConfig.inactivityTimeoutMs);
      this.terminalManager.removeClosedTerminals();
    }, terminalConfig.cleanupIntervalMs);
    
    // Editor cleanup
    const editorConfig = this.configManager.getSection('editor');
    this.editorCleanupInterval = setInterval(() => {
      this.editorManager.cleanupInactiveEditors(editorConfig.inactivityTimeoutMs);
      this.editorManager.removeClosedEditors();
    }, editorConfig.cleanupIntervalMs);
    
    // Extension cleanup
    const extensionConfig = this.configManager.getSection('extension');
    this.extensionCleanupInterval = setInterval(() => {
      this.extensionManager.cleanupInactiveExtensions(extensionConfig.inactivityTimeoutMs);
    }, extensionConfig.cleanupIntervalMs);
  }

  /**
   * Start the server
   */
  start() {
    console.log('Starting VSCode Remote MCP Server...');
    
    // Set up process signal handlers for graceful shutdown
    process.on('SIGINT', () => {
      console.log('Received SIGINT signal');
      this.shutdown('Server shutdown requested', 0);
    });
    
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM signal');
      this.shutdown('Server termination requested', 0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      this.shutdown('Server error occurred', 1);
    });
    
    console.log(`MCP Server started successfully (${this.serverConfig.host}:${this.serverConfig.port})`);
    
    return this;
  }

  /**
   * Shutdown the server
   * @param {string} reason - Shutdown reason
   * @param {number} exitCode - Process exit code
   */
  shutdown(reason, exitCode = 0) {
    console.log(`Shutting down MCP Server: ${reason}`);
    
    // Clear intervals
    clearInterval(this.sessionCleanupInterval);
    clearInterval(this.terminalCleanupInterval);
    clearInterval(this.editorCleanupInterval);
    clearInterval(this.extensionCleanupInterval);
    
    // Dispose managers
    this.sessionManager.dispose();
    this.terminalManager.dispose();
    this.editorManager.dispose();
    this.extensionManager.dispose();
    this.authManager.dispose();
    
    // Disconnect all clients
    for (const [clientId, client] of this.connectedClients.entries()) {
      try {
        client.send({
          type: 'server_shutdown',
          id: `shutdown-${Date.now()}`,
          timestamp: new Date().toISOString(),
          payload: {
            reason,
            gracePeriodMs: this.serverConfig.shutdownTimeoutMs
          }
        });
        
        client.disconnect();
      } catch (error) {
        console.error(`Error disconnecting client ${clientId}:`, error);
      }
    }
    
    // Clear connected clients
    this.connectedClients.clear();
    
    // Exit process after timeout
    setTimeout(() => {
      process.exit(exitCode);
    }, this.serverConfig.shutdownTimeoutMs);
  }

  /**
   * Process an incoming message
   * @param {Object} message - The message to process
   * @param {Object} client - The client that sent the message
   */
  async processMessage(message, client) {
    try {
      // Route message to appropriate handler
      const response = await this.messageRouter.processMessage(message, client);
      
      // Send response if provided
      if (response) {
        client.send(response);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Send error response
      client.send(this.messageRouter.createErrorResponse(message, error.message));
    }
  }

  /**
   * Handle a connection request
   * @param {Object} message - The connection request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleConnectionRequest(message, client) {
    const { clientId, workspaceId, capabilities = [] } = message.payload;
    
    // Check if max clients limit is reached
    if (this.connectedClients.size >= this.serverConfig.maxClients) {
      return this.messageRouter.createErrorResponse(message, 'Maximum number of clients reached', 'MAX_CLIENTS');
    }
    
    // Store client information
    client.id = clientId;
    client.workspaceId = workspaceId;
    client.capabilities = capabilities;
    client.connectionTime = new Date();
    
    // Add client to connected clients map
    this.connectedClients.set(clientId, client);
    
    // Generate authentication token if auth is enabled
    let tokenInfo = null;
    if (this.authManager.isAuthEnabled()) {
      tokenInfo = this.authManager.generateToken(clientId, { workspaceId });
    }
    
    console.log(`Client connected: ${clientId} (Workspace: ${workspaceId})`);
    
    // Send connection acknowledgment
    return this.messageRouter.createSuccessResponse(message, {
      status: 'connected',
      serverTime: new Date().toISOString(),
      connectedClients: this.connectedClients.size,
      token: tokenInfo ? tokenInfo.token : null,
      refreshToken: tokenInfo ? tokenInfo.refreshToken : null,
      tokenValidUntil: tokenInfo ? tokenInfo.expiresAt : null
    });
  }

  /**
   * Handle a disconnect request
   * @param {Object} message - The disconnect request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleDisconnectRequest(message, client) {
    // Send disconnect acknowledgment first
    const response = this.messageRouter.createSuccessResponse(message, {
      status: 'disconnected',
      serverTime: new Date().toISOString()
    });
    
    // Then remove client from connected clients
    if (client.id && this.connectedClients.has(client.id)) {
      // Clean up client resources
      this.cleanupClientResources(client.id);
      
      // Remove from connected clients
      this.connectedClients.delete(client.id);
      console.log(`Client disconnected: ${client.id}`);
    }
    
    return response;
  }

  /**
   * Handle a token refresh request
   * @param {Object} message - The token refresh request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleTokenRefreshRequest(message, client) {
    const { refreshToken } = message.payload;
    
    // Check if auth is enabled
    if (!this.authManager.isAuthEnabled()) {
      return this.messageRouter.createErrorResponse(message, 'Authentication is not enabled', 'AUTH_DISABLED');
    }
    
    // Refresh token
    const tokenInfo = this.authManager.refreshToken(refreshToken);
    
    if (!tokenInfo) {
      return this.messageRouter.createErrorResponse(message, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }
    
    console.log(`Token refreshed for client: ${client.id}`);
    
    // Send token refresh acknowledgment
    return this.messageRouter.createSuccessResponse(message, {
      status: 'refreshed',
      token: tokenInfo.token,
      refreshToken: tokenInfo.refreshToken,
      expiresAt: tokenInfo.expiresAt
    });
  }

  /**
   * Handle a session creation request
   * @param {Object} message - The session creation request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleSessionCreateRequest(message, client) {
    const { sessionId, sessionName } = message.payload;
    
    try {
      // Create new session
      const session = this.sessionManager.createSession(
        sessionId,
        client.id,
        client.workspaceId,
        sessionName
      );
      
      console.log(`Session created: ${session.id} by ${client.id}`);
      
      // Send session creation acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        sessionId: session.id,
        status: 'created',
        name: session.name,
        createdAt: session.createdAt.toISOString()
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'SESSION_CREATE_ERROR');
    }
  }

  /**
   * Handle a session join request
   * @param {Object} message - The session join request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleSessionJoinRequest(message, client) {
    const { sessionId, createIfNotExists } = message.payload;
    
    try {
      let session = this.sessionManager.getSession(sessionId);
      
      // Create session if it doesn't exist and createIfNotExists is true
      if (!session && createIfNotExists) {
        session = this.sessionManager.createSession(
          sessionId,
          client.id,
          client.workspaceId,
          `Session ${sessionId.substring(0, 8)}`
        );
        
        console.log(`Session auto-created: ${session.id} by ${client.id}`);
      } else if (!session) {
        return this.messageRouter.createErrorResponse(message, `Session with ID ${sessionId} not found`, 'SESSION_NOT_FOUND');
      }
      
      // Add client to session
      this.sessionManager.addParticipant(sessionId, client.id, client.workspaceId);
      
      console.log(`Client ${client.id} joined session: ${sessionId}`);
      
      // Send session join acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        sessionId,
        status: 'joined',
        name: session.name,
        participants: session.participants
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'SESSION_JOIN_ERROR');
    }
  }

  /**
   * Handle a session leave request
   * @param {Object} message - The session leave request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleSessionLeaveRequest(message, client) {
    const { sessionId } = message.payload;
    
    try {
      // Remove client from session
      const session = this.sessionManager.removeParticipant(sessionId, client.id);
      
      console.log(`Client ${client.id} left session: ${sessionId}`);
      
      // Send session leave acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        sessionId,
        status: 'left',
        sessionClosed: session === null
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'SESSION_LEAVE_ERROR');
    }
  }

  /**
   * Handle a session list request
   * @param {Object} message - The session list request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleSessionListRequest(message, client) {
    // Get all sessions
    const sessions = this.sessionManager.getAllSessions();
    
    // Filter sessions for client's workspace if specified
    const { workspaceOnly } = message.payload || {};
    
    const filteredSessions = workspaceOnly
      ? sessions.filter(session => session.workspaceId === client.workspaceId)
      : sessions;
    
    // Format sessions for response
    const formattedSessions = filteredSessions.map(session => ({
      id: session.id,
      name: session.name,
      createdBy: session.createdBy,
      createdAt: session.createdAt.toISOString(),
      participantCount: session.participants.length,
      isParticipant: session.participants.includes(client.id)
    }));
    
    // Send session list response
    return this.messageRouter.createSuccessResponse(message, {
      sessions: formattedSessions,
      count: formattedSessions.length
    });
  }

  /**
   * Handle a terminal create request
   * @param {Object} message - The terminal create request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleTerminalCreateRequest(message, client) {
    const { sessionId, options } = message.payload;
    
    try {
      // Create terminal
      const terminal = this.terminalManager.createTerminal(sessionId, client.id, options);
      
      console.log(`Terminal created: ${terminal.id} in session ${sessionId} by ${client.id}`);
      
      // Send terminal create acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        terminalId: terminal.id,
        sessionId,
        name: terminal.name,
        dimensions: terminal.dimensions
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'TERMINAL_CREATE_ERROR');
    }
  }

  /**
   * Handle a terminal data request
   * @param {Object} message - The terminal data request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleTerminalDataRequest(message, client) {
    const { terminalId, data, type } = message.payload;
    
    try {
      // Process terminal data
      if (type === 'input') {
        this.terminalManager.processInput(terminalId, client.id, data);
      } else if (type === 'output') {
        this.terminalManager.processOutput(terminalId, data);
      } else {
        return this.messageRouter.createErrorResponse(message, `Invalid terminal data type: ${type}`, 'INVALID_DATA_TYPE');
      }
      
      // Get terminal
      const terminal = this.terminalManager.getTerminal(terminalId);
      
      // Broadcast to all participants except sender
      for (const participantId of terminal.participants) {
        if (participantId !== client.id) {
          const participant = this.connectedClients.get(participantId);
          
          if (participant) {
            participant.send({
              type: 'terminal_data',
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              payload: {
                terminalId,
                sessionId: terminal.sessionId,
                data,
                type,
                fromClientId: client.id
              }
            });
          }
        }
      }
      
      // Send acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        terminalId,
        status: 'received'
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'TERMINAL_DATA_ERROR');
    }
  }

  /**
   * Handle a terminal resize request
   * @param {Object} message - The terminal resize request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleTerminalResizeRequest(message, client) {
    const { terminalId, dimensions } = message.payload;
    
    try {
      // Resize terminal
      this.terminalManager.resizeTerminal(terminalId, dimensions);
      
      // Get terminal
      const terminal = this.terminalManager.getTerminal(terminalId);
      
      // Broadcast to all participants except sender
      for (const participantId of terminal.participants) {
        if (participantId !== client.id) {
          const participant = this.connectedClients.get(participantId);
          
          if (participant) {
            participant.send({
              type: 'terminal_resize',
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              payload: {
                terminalId,
                sessionId: terminal.sessionId,
                dimensions,
                fromClientId: client.id
              }
            });
          }
        }
      }
      
      // Send acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        terminalId,
        status: 'resized',
        dimensions
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'TERMINAL_RESIZE_ERROR');
    }
  }

  /**
   * Handle a terminal close request
   * @param {Object} message - The terminal close request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleTerminalCloseRequest(message, client) {
    const { terminalId } = message.payload;
    
    try {
      // Get terminal before closing
      const terminal = this.terminalManager.getTerminal(terminalId);
      
      if (!terminal) {
        return this.messageRouter.createErrorResponse(message, `Terminal with ID ${terminalId} not found`, 'TERMINAL_NOT_FOUND');
      }
      
      // Close terminal
      this.terminalManager.closeTerminal(terminalId);
      
      // Broadcast to all participants except sender
      for (const participantId of terminal.participants) {
        if (participantId !== client.id) {
          const participant = this.connectedClients.get(participantId);
          
          if (participant) {
            participant.send({
              type: 'terminal_close',
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              payload: {
                terminalId,
                sessionId: terminal.sessionId,
                fromClientId: client.id
              }
            });
          }
        }
      }
      
      // Send acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        terminalId,
        status: 'closed'
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'TERMINAL_CLOSE_ERROR');
    }
  }

  /**
   * Handle an editor open request
   * @param {Object} message - The editor open request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleEditorOpenRequest(message, client) {
    const { sessionId, filePath, content, options } = message.payload;
    
    try {
      // Register editor
      const editor = this.editorManager.registerEditor(sessionId, client.id, filePath, {
        ...options,
        content
      });
      
      console.log(`Editor registered: ${editor.id} for ${filePath} in session ${sessionId} by ${client.id}`);
      
      // Broadcast to all participants except sender
      for (const participantId of editor.participants) {
        if (participantId !== client.id) {
          const participant = this.connectedClients.get(participantId);
          
          if (participant) {
            participant.send({
              type: 'editor_open',
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              payload: {
                editorId: editor.id,
                sessionId,
                filePath,
                content,
                language: editor.language,
                fromClientId: client.id
              }
            });
          }
        }
      }
      
      // Send acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        editorId: editor.id,
        sessionId,
        filePath,
        language: editor.language,
        version: editor.version
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'EDITOR_OPEN_ERROR');
    }
  }

  /**
   * Handle an editor change request
   * @param {Object} message - The editor change request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleEditorChangeRequest(message, client) {
    const { editorId, content, version } = message.payload;
    
    try {
      // Update editor content
      const success = this.editorManager.updateContent(editorId, client.id, content, version);
      
      if (!success) {
        return this.messageRouter.createErrorResponse(message, 'Failed to update editor content', 'EDITOR_UPDATE_FAILED');
      }
      
      // Get editor
      const editor = this.editorManager.getEditor(editorId);
      
      // Broadcast to all participants except sender
      for (const participantId of editor.participants) {
        if (participantId !== client.id) {
          const participant = this.connectedClients.get(participantId);
          
          if (participant) {
            participant.send({
              type: 'editor_change',
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              payload: {
                editorId,
                sessionId: editor.sessionId,
                content,
                version: editor.version,
                fromClientId: client.id
              }
            });
          }
        }
      }
      
      // Send acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        editorId,
        status: 'updated',
        version: editor.version
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'EDITOR_CHANGE_ERROR');
    }
  }

  /**
   * Handle an editor cursor request
   * @param {Object} message - The editor cursor request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleEditorCursorRequest(message, client) {
    const { editorId, position } = message.payload;
    
    try {
      // Update cursor position
      const success = this.editorManager.updateCursor(editorId, client.id, position);
      
      if (!success) {
        return this.messageRouter.createErrorResponse(message, 'Failed to update cursor position', 'CURSOR_UPDATE_FAILED');
      }
      
      // Get editor
      const editor = this.editorManager.getEditor(editorId);
      
      // Broadcast to all participants except sender
      for (const participantId of editor.participants) {
        if (participantId !== client.id) {
          const participant = this.connectedClients.get(participantId);
          
          if (participant) {
            participant.send({
              type: 'editor_cursor',
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              payload: {
                editorId,
                sessionId: editor.sessionId,
                position,
                fromClientId: client.id
              }
            });
          }
        }
      }
      
      // Send acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        editorId,
        status: 'cursor_updated'
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'EDITOR_CURSOR_ERROR');
    }
  }

  /**
   * Handle an editor selection request
   * @param {Object} message - The editor selection request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleEditorSelectionRequest(message, client) {
    const { editorId, selections } = message.payload;
    
    try {
      // Update selections
      const success = this.editorManager.updateSelections(editorId, client.id, selections);
      
      if (!success) {
        return this.messageRouter.createErrorResponse(message, 'Failed to update selections', 'SELECTION_UPDATE_FAILED');
      }
      
      // Get editor
      const editor = this.editorManager.getEditor(editorId);
      
      // Broadcast to all participants except sender
      for (const participantId of editor.participants) {
        if (participantId !== client.id) {
          const participant = this.connectedClients.get(participantId);
          
          if (participant) {
            participant.send({
              type: 'editor_selection',
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              payload: {
                editorId,
                sessionId: editor.sessionId,
                selections,
                fromClientId: client.id
              }
            });
          }
        }
      }
      
      // Send acknowledgment
      return this.messageRouter.createSuccessResponse(message, {
        editorId,
        status: 'selections_updated'
      });
    } catch (error) {
      return this.messageRouter.createErrorResponse(message, error.message, 'EDITOR_SELECTION_ERROR');
    }
  }

  /**
   * Handle an editor close request
   * @param {Object} message - The editor close request message
   * @param {Object} client - The client that sent the message
   * @returns {Object} Response message
   */
  handleEditorCloseRequest(message, client) {
    const { editorId } = message.payload;
    
    try {
      // Get editor before closing
      const editor = this.editorManager.getEditor(editorId);
      
      if (!editor) {
        return this.messageRouter.createErrorResponse(message, `Editor with ID ${editorId} not found`, 'EDITOR_NOT_FOUND');
      }
      
      // Remove client from editor
      this.editorManager.removeClientFromEditor(editorId, client.id);
      
      // Broadcast to all participants except sender
      for (const participantId of editor.participants) {
        if (participantId !== client.id) {
