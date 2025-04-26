/**
 * Authentication Handlers for VSCode Remote MCP
 * 
 * This module contains handlers for authentication-related messages:
 * - authenticate: Handle authentication requests
 * - token_refresh: Handle token refresh requests
 * - token_validate: Handle token validation requests
 */

/**
 * Handle an authentication request
 * @param {Object} server - The MCP server instance
 * @param {Object} message - The authentication request message
 * @param {Object} client - The client that sent the message
 * @returns {Object} Response message
 */
function handleAuthenticateRequest(server, message, client) {
  const { token, authMethod = 'token' } = message.payload;
  
  try {
    // Validate client is connected
    if (!client.id || !server.connectionManager.isClientConnected(client.id)) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client not connected', 
        'CLIENT_NOT_CONNECTED'
      );
    }
    
    // Check if authentication is enabled
    if (!server.authManager || !server.authManager.isAuthEnabled()) {
      // Authentication is not required, mark client as authenticated
      const clientInfo = server.connectionManager.getClientInfo(client.id);
      if (clientInfo) {
        clientInfo.authenticated = true;
        server.connectionManager.updateClient(client.id, clientInfo);
      }
      
      return server.messageRouter.createSuccessResponse(message, {
        status: 'authenticated',
        message: 'Authentication not required',
        tokenValidUntil: null
      });
    }
    
    // Validate required fields
    if (!token) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Missing authentication token', 
        'MISSING_TOKEN'
      );
    }
    
    // Authenticate based on method
    let authResult;
    switch (authMethod) {
      case 'token':
        authResult = server.authManager.authenticateWithToken(token);
        break;
      case 'oauth':
        authResult = server.authManager.authenticateWithOAuth(token);
        break;
      default:
        return server.messageRouter.createErrorResponse(
          message, 
          `Unsupported authentication method: ${authMethod}`, 
          'UNSUPPORTED_AUTH_METHOD'
        );
    }
    
    // Check authentication result
    if (!authResult.success) {
      return server.messageRouter.createErrorResponse(
        message, 
        authResult.message || 'Authentication failed', 
        authResult.code || 'AUTH_FAILED'
      );
    }
    
    // Update client info with authentication data
    const clientInfo = server.connectionManager.getClientInfo(client.id);
    if (clientInfo) {
      clientInfo.authenticated = true;
      clientInfo.authMethod = authMethod;
      clientInfo.authTime = new Date();
      clientInfo.tokenValidUntil = authResult.tokenValidUntil;
      clientInfo.permissions = authResult.permissions || [];
      
      server.connectionManager.updateClient(client.id, clientInfo);
    }
    
    console.log(`Client authenticated: ${client.id} (Method: ${authMethod})`);
    
    // Send authentication acknowledgment
    return server.messageRouter.createSuccessResponse(message, {
      status: 'authenticated',
      tokenValidUntil: authResult.tokenValidUntil ? authResult.tokenValidUntil.toISOString() : null,
      permissions: authResult.permissions || [],
      refreshToken: authResult.refreshToken || null
    });
  } catch (error) {
    return server.messageRouter.createErrorResponse(message, error.message, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Handle a token refresh request
 * @param {Object} server - The MCP server instance
 * @param {Object} message - The token refresh request message
 * @param {Object} client - The client that sent the message
 * @returns {Object} Response message
 */
function handleTokenRefreshRequest(server, message, client) {
  const { refreshToken } = message.payload;
  
  try {
    // Validate client is connected
    if (!client.id || !server.connectionManager.isClientConnected(client.id)) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client not connected', 
        'CLIENT_NOT_CONNECTED'
      );
    }
    
    // Check if authentication is enabled
    if (!server.authManager || !server.authManager.isAuthEnabled()) {
      return server.messageRouter.createSuccessResponse(message, {
        status: 'accepted',
        message: 'Authentication not required',
        tokenValidUntil: null
      });
    }
    
    // Validate required fields
    if (!refreshToken) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Missing refresh token', 
        'MISSING_REFRESH_TOKEN'
      );
    }
    
    // Get client info
    const clientInfo = server.connectionManager.getClientInfo(client.id);
    if (!clientInfo || !clientInfo.authenticated) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client not authenticated', 
        'CLIENT_NOT_AUTHENTICATED'
      );
    }
    
    // Refresh token
    const refreshResult = server.authManager.refreshToken(refreshToken, client.id);
    
    // Check refresh result
    if (!refreshResult.success) {
      return server.messageRouter.createErrorResponse(
        message, 
        refreshResult.message || 'Token refresh failed', 
        refreshResult.code || 'TOKEN_REFRESH_FAILED'
      );
    }
    
    // Update client info with new token data
    clientInfo.tokenValidUntil = refreshResult.tokenValidUntil;
    server.connectionManager.updateClient(client.id, clientInfo);
    
    console.log(`Token refreshed for client: ${client.id}`);
    
    // Send token refresh acknowledgment
    return server.messageRouter.createSuccessResponse(message, {
      status: 'accepted',
      tokenValidUntil: refreshResult.tokenValidUntil ? refreshResult.tokenValidUntil.toISOString() : null,
      newToken: refreshResult.newToken || null,
      newRefreshToken: refreshResult.newRefreshToken || null
    });
  } catch (error) {
    return server.messageRouter.createErrorResponse(message, error.message, 'TOKEN_REFRESH_ERROR');
  }
}

/**
 * Handle a token validation request
 * @param {Object} server - The MCP server instance
 * @param {Object} message - The token validation request message
 * @param {Object} client - The client that sent the message
 * @returns {Object} Response message
 */
function handleTokenValidateRequest(server, message, client) {
  const { token } = message.payload;
  
  try {
    // Validate client is connected
    if (!client.id || !server.connectionManager.isClientConnected(client.id)) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Client not connected', 
        'CLIENT_NOT_CONNECTED'
      );
    }
    
    // Check if authentication is enabled
    if (!server.authManager || !server.authManager.isAuthEnabled()) {
      return server.messageRouter.createSuccessResponse(message, {
        valid: true,
        message: 'Authentication not required'
      });
    }
    
    // Validate required fields
    if (!token) {
      return server.messageRouter.createErrorResponse(
        message, 
        'Missing token', 
        'MISSING_TOKEN'
      );
    }
    
    // Validate token
    const validationResult = server.authManager.validateToken(token);
    
    // Send validation result
    return server.messageRouter.createSuccessResponse(message, {
      valid: validationResult.valid,
      message: validationResult.message,
      tokenValidUntil: validationResult.tokenValidUntil ? validationResult.tokenValidUntil.toISOString() : null,
      permissions: validationResult.permissions || []
    });
  } catch (error) {
    return server.messageRouter.createErrorResponse(message, error.message, 'TOKEN_VALIDATION_ERROR');
  }
}

module.exports = {
  handleAuthenticateRequest,
  handleTokenRefreshRequest,
  handleTokenValidateRequest
};