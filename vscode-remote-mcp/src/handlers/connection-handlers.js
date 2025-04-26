/**
 * Connection Handlers for VSCode Remote MCP
 * 
 * This module contains handlers for connection-related messages:
 * - connection: Handle connection requests
 * - disconnect: Handle disconnect requests
 * - ping: Handle ping requests
 * - client_info: Handle client info requests
 */

/**
 * Handle a connection request
 * @param {Object} server - The MCP server instance
 * @param {Object} message - The connection request message
 * @param {Object} client - The client that sent the message
 * @returns {Object} Response message
 */
function handleConnectionRequest(server, message, client) {
  const { clientId, workspaceId, capabilities = [], metadata = {} } = message.payload;
  
  try {
    // Validate required fields
    if (!clientId) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Missing client ID', 
        'MISSING_CLIENT_ID'
      );
    }
    
    // Check if max clients limit is reached
    if (server.connectionManager.getConnectedClientCount() >= server.config.maxClients) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Maximum number of clients reached', 
        'MAX_CLIENTS_REACHED'
      );
    }
    
    // Check if client ID is already in use
    if (server.connectionManager.isClientConnected(clientId) && clientId !== client.id) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client ID already in use', 
        'CLIENT_ID_IN_USE'
      );
    }
    
    // Store client information
    const clientInfo = {
      id: clientId,
      workspaceId: workspaceId || 'unknown',
      capabilities: capabilities,
      metadata: metadata,
      connectionTime: new Date(),
      lastActivityTime: new Date(),
      authenticated: false, // Will be set to true after authentication
      ipAddress: client.ipAddress || 'unknown',
      userAgent: client.userAgent || 'unknown'
    };
    
    // Update client object with ID
    client.id = clientId;
    
    // Register client with connection manager
    server.connectionManager.registerClient(clientId, client, clientInfo);
    
    console.log(`Client connected: ${clientId} (Workspace: ${workspaceId || 'unknown'})`);
    
    // Determine if authentication is required
    const authRequired = server.authManager && server.authManager.isAuthEnabled();
    
    // Send connection acknowledgment
    return server.messageRouter.createSuccessResponse(message, {
      status: 'connected',
      serverTime: new Date().toISOString(),
      connectedClients: server.connectionManager.getConnectedClientCount(),
      serverVersion: server.version,
      authRequired: authRequired,
      serverCapabilities: server.capabilities || [],
      sessionCount: server.sessionManager ? server.sessionManager.getSessionCount() : 0
    });
  } catch (error) {
    return server.messageRouter.createErrorResponse(message, error.message, 'CONNECTION_ERROR');
  }
}

/**
 * Handle a disconnect request
 * @param {Object} server - The MCP server instance
 * @param {Object} message - The disconnect request message
 * @param {Object} client - The client that sent the message
 * @returns {Object} Response message
 */
function handleDisconnectRequest(server, message, client) {
  try {
    // Validate client is connected
    if (!client.id || !server.connectionManager.isClientConnected(client.id)) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client not connected', 
        'CLIENT_NOT_CONNECTED'
      );
    }
    
    // Get client info before disconnection
    const clientInfo = server.connectionManager.getClientInfo(client.id);
    
    // Leave all sessions if client is in any
    if (clientInfo && clientInfo.joinedSessions) {
      Object.keys(clientInfo.joinedSessions).forEach(sessionId => {
        if (server.sessionManager.sessionExists(sessionId)) {
          // Notify other participants about the client leaving
          server.notificationManager.notifySessionParticipants(
            sessionId,
            client.id, // exclude the leaving client
            'session_participant_left',
            {
              sessionId,
              participantId: client.id,
              timestamp: new Date().toISOString(),
              reason: 'client_disconnected'
            }
          );
          
          // Remove client from session
          server.sessionManager.removeParticipantFromSession(sessionId, client.id);
          
          // Check if session is empty and clean up if needed
          const remainingParticipants = server.sessionManager.getSessionParticipants(sessionId);
          if (remainingParticipants.length === 0) {
            server.sessionManager.removeSession(sessionId);
            console.log(`Session ${sessionId} removed (no participants left)`);
          }
        }
      });
    }
    
    // Send disconnect acknowledgment before removing client
    const response = server.messageRouter.createSuccessResponse(message, {
      status: 'disconnected',
      serverTime: new Date().toISOString(),
      message: 'Successfully disconnected'
    });
    
    // Schedule client removal after response is sent
    setTimeout(() => {
      // Unregister client from connection manager
      server.connectionManager.unregisterClient(client.id);
      console.log(`Client disconnected: ${client.id}`);
    }, 100);
    
    return response;
  } catch (error) {
    return server.messageRouter.createErrorResponse(message, error.message, 'DISCONNECT_ERROR');
  }
}

/**
 * Handle a ping request
 * @param {Object} server - The MCP server instance
 * @param {Object} message - The ping request message
 * @param {Object} client - The client that sent the message
 * @returns {Object} Response message
 */
function handlePingRequest(server, message, client) {
  try {
    // Validate client is connected
    if (!client.id || !server.connectionManager.isClientConnected(client.id)) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client not connected', 
        'CLIENT_NOT_CONNECTED'
      );
    }
    
    // Update last activity time
    const clientInfo = server.connectionManager.getClientInfo(client.id);
    if (clientInfo) {
      clientInfo.lastActivityTime = new Date();
      server.connectionManager.updateClient(client.id, clientInfo);
    }
    
    // Send pong response
    return server.messageRouter.createSuccessResponse(message, {
      serverTime: new Date().toISOString(),
      clientTime: message.payload && message.payload.clientTime ? message.payload.clientTime : null,
      connectedClients: server.connectionManager.getConnectedClientCount()
    });
  } catch (error) {
    return server.messageRouter.createErrorResponse(message, error.message, 'PING_ERROR');
  }
}

/**
 * Handle a client info request
 * @param {Object} server - The MCP server instance
 * @param {Object} message - The client info request message
 * @param {Object} client - The client that sent the message
 * @returns {Object} Response message
 */
function handleClientInfoRequest(server, message, client) {
  const { targetClientId } = message.payload || {};
  
  try {
    // Validate client is connected
    if (!client.id || !server.connectionManager.isClientConnected(client.id)) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client not connected', 
        'CLIENT_NOT_CONNECTED'
      );
    }
    
    // If targetClientId is provided, get info for that client
    // Otherwise, get info for the requesting client
    const clientIdToQuery = targetClientId || client.id;
    
    // Check if client exists
    if (!server.connectionManager.isClientConnected(clientIdToQuery)) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Target client not connected', 
        'TARGET_CLIENT_NOT_CONNECTED'
      );
    }
    
    // Check permissions if requesting info for another client
    if (targetClientId && targetClientId !== client.id) {
      // Only allow if client is authenticated and has admin permissions
      const clientInfo = server.connectionManager.getClientInfo(client.id);
      if (!clientInfo || !clientInfo.authenticated || 
          !clientInfo.permissions || !clientInfo.permissions.includes('admin')) {
        return server.messageRouter.createErrorResponse(
          message, 
          'Permission denied', 
          'PERMISSION_DENIED'
        );
      }
    }
    
    // Get client info
    const targetClientInfo = server.connectionManager.getClientInfo(clientIdToQuery);
    
    // Remove sensitive information if not requesting own info
    let sanitizedInfo = { ...targetClientInfo };
    if (targetClientId && targetClientId !== client.id) {
      // Remove sensitive fields
      delete sanitizedInfo.authToken;
      delete sanitizedInfo.refreshToken;
    }
    
    // Format joined sessions
    if (sanitizedInfo.joinedSessions) {
      const formattedSessions = {};
      Object.keys(sanitizedInfo.joinedSessions).forEach(sessionId => {
        const sessionInfo = sanitizedInfo.joinedSessions[sessionId];
        formattedSessions[sessionId] = {
          ...sessionInfo,
          joinedAt: sessionInfo.joinedAt ? sessionInfo.joinedAt.toISOString() : null
        };
      });
      sanitizedInfo.joinedSessions = formattedSessions;
    }
    
    // Format dates
    if (sanitizedInfo.connectionTime) {
      sanitizedInfo.connectionTime = sanitizedInfo.connectionTime.toISOString();
    }
    if (sanitizedInfo.lastActivityTime) {
      sanitizedInfo.lastActivityTime = sanitizedInfo.lastActivityTime.toISOString();
    }
    if (sanitizedInfo.authTime) {
      sanitizedInfo.authTime = sanitizedInfo.authTime.toISOString();
    }
    if (sanitizedInfo.tokenValidUntil) {
      sanitizedInfo.tokenValidUntil = sanitizedInfo.tokenValidUntil.toISOString();
    }
    
    // Send client info response
    return server.messageRouter.createSuccessResponse(message, {
      clientInfo: sanitizedInfo
    });
  } catch (error) {
    return server.messageRouter.createErrorResponse(message, error.message, 'CLIENT_INFO_ERROR');
  }
}

/**
 * Handle a client update request
 * @param {Object} server - The MCP server instance
 * @param {Object} message - The client update request message
 * @param {Object} client - The client that sent the message
 * @returns {Object} Response message
 */
function handleClientUpdateRequest(server, message, client) {
  const { capabilities, metadata } = message.payload || {};
  
  try {
    // Validate client is connected
    if (!client.id || !server.connectionManager.isClientConnected(client.id)) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client not connected', 
        'CLIENT_NOT_CONNECTED'
      );
    }
    
    // Get current client info
    const clientInfo = server.connectionManager.getClientInfo(client.id);
    if (!clientInfo) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client info not found', 
        'CLIENT_INFO_NOT_FOUND'
      );
    }
    
    // Update capabilities if provided
    if (capabilities) {
      clientInfo.capabilities = capabilities;
    }
    
    // Update metadata if provided
    if (metadata) {
      clientInfo.metadata = { ...clientInfo.metadata, ...metadata };
    }
    
    // Update last activity time
    clientInfo.lastActivityTime = new Date();
    
    // Update client info
    server.connectionManager.updateClient(client.id, clientInfo);
    
    console.log(`Client updated: ${client.id}`);
    
    // Send client update acknowledgment
    return server.messageRouter.createSuccessResponse(message, {
      status: 'updated',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    return server.messageRouter.createErrorResponse(message, error.message, 'CLIENT_UPDATE_ERROR');
  }
}

module.exports = {
  handleConnectionRequest,
  handleDisconnectRequest,
  handlePingRequest,
  handleClientInfoRequest,
  handleClientUpdateRequest
};