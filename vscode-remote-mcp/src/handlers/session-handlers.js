/**
 * Session Handlers for VSCode Remote MCP
 * 
 * This module provides handlers for session-related messages.
 */

const { validateMessage } = require('../utils/message-type-validator');

/**
 * Active sessions
 * @type {Map<string, Object>}
 */
const activeSessions = new Map();

/**
 * Handle a session request
 * @param {Object} message - The session request message
 * @param {Object} client - The client connection
 * @param {Function} respond - Function to send a response
 * @returns {Promise<void>}
 */
async function handleSessionRequest(message, client, respond) {
  try {
    // Validate message
    validateMessage(message);
    
    // Extract session parameters
    const { parameters } = message.payload;
    
    // Generate session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create session
    const session = {
      id: sessionId,
      clientId: client.id,
      parameters,
      createdAt: new Date(),
      lastActivity: new Date(),
      state: 'active'
    };
    
    // Store session
    activeSessions.set(sessionId, session);
    
    // Send response
    respond({
      type: 'session_response',
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responseTo: message.id,
      payload: {
        status: 'success',
        sessionId,
        parameters: session.parameters
      }
    });
    
    // Log session creation
    console.log(`Session created: ${sessionId}`);
  } catch (error) {
    // Send error response
    respond({
      type: 'session_response',
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responseTo: message.id,
      payload: {
        status: 'error',
        error: error.message
      }
    });
    
    // Log error
    console.error(`Session request error: ${error.message}`);
  }
}

/**
 * Handle a session end request
 * @param {Object} message - The session end request message
 * @param {Object} client - The client connection
 * @param {Function} respond - Function to send a response
 * @returns {Promise<void>}
 */
async function handleSessionEndRequest(message, client, respond) {
  try {
    // Validate message
    validateMessage(message);
    
    // Extract session ID
    const { sessionId } = message.payload;
    
    // Check if session exists
    if (!activeSessions.has(sessionId)) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Get session
    const session = activeSessions.get(sessionId);
    
    // Check if client owns session
    if (session.clientId !== client.id) {
      throw new Error('Not authorized to end this session');
    }
    
    // End session
    session.state = 'ended';
    session.endedAt = new Date();
    
    // Remove session
    activeSessions.delete(sessionId);
    
    // Send response
    respond({
      type: 'session_end_response',
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responseTo: message.id,
      payload: {
        status: 'success',
        sessionId
      }
    });
    
    // Log session end
    console.log(`Session ended: ${sessionId}`);
  } catch (error) {
    // Send error response
    respond({
      type: 'session_end_response',
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responseTo: message.id,
      payload: {
        status: 'error',
        error: error.message
      }
    });
    
    // Log error
    console.error(`Session end request error: ${error.message}`);
  }
}

/**
 * Handle a session pause request
 * @param {Object} message - The session pause request message
 * @param {Object} client - The client connection
 * @param {Function} respond - Function to send a response
 * @returns {Promise<void>}
 */
async function handleSessionPauseRequest(message, client, respond) {
  try {
    // Validate message
    validateMessage(message);
    
    // Extract session ID
    const { sessionId } = message.payload;
    
    // Check if session exists
    if (!activeSessions.has(sessionId)) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Get session
    const session = activeSessions.get(sessionId);
    
    // Check if client owns session
    if (session.clientId !== client.id) {
      throw new Error('Not authorized to pause this session');
    }
    
    // Pause session
    session.state = 'paused';
    session.pausedAt = new Date();
    
    // Send response
    respond({
      type: 'session_pause_response',
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responseTo: message.id,
      payload: {
        status: 'success',
        sessionId
      }
    });
    
    // Log session pause
    console.log(`Session paused: ${sessionId}`);
  } catch (error) {
    // Send error response
    respond({
      type: 'session_pause_response',
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responseTo: message.id,
      payload: {
        status: 'error',
        error: error.message
      }
    });
    
    // Log error
    console.error(`Session pause request error: ${error.message}`);
  }
}

/**
 * Handle a session resume request
 * @param {Object} message - The session resume request message
 * @param {Object} client - The client connection
 * @param {Function} respond - Function to send a response
 * @returns {Promise<void>}
 */
async function handleSessionResumeRequest(message, client, respond) {
  try {
    // Validate message
    validateMessage(message);
    
    // Extract session ID
    const { sessionId } = message.payload;
    
    // Check if session exists
    if (!activeSessions.has(sessionId)) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Get session
    const session = activeSessions.get(sessionId);
    
    // Check if client owns session
    if (session.clientId !== client.id) {
      throw new Error('Not authorized to resume this session');
    }
    
    // Check if session is paused
    if (session.state !== 'paused') {
      throw new Error('Session is not paused');
    }
    
    // Resume session
    session.state = 'active';
    session.resumedAt = new Date();
    session.lastActivity = new Date();
    
    // Send response
    respond({
      type: 'session_resume_response',
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responseTo: message.id,
      payload: {
        status: 'success',
        sessionId
      }
    });
    
    // Log session resume
    console.log(`Session resumed: ${sessionId}`);
  } catch (error) {
    // Send error response
    respond({
      type: 'session_resume_response',
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responseTo: message.id,
      payload: {
        status: 'error',
        error: error.message
      }
    });
    
    // Log error
    console.error(`Session resume request error: ${error.message}`);
  }
}

/**
 * Get a session by ID
 * @param {string} sessionId - The session ID
 * @returns {Object|null} The session or null if not found
 */
function getSession(sessionId) {
  return activeSessions.get(sessionId) || null;
}

/**
 * Get all sessions for a client
 * @param {string} clientId - The client ID
 * @returns {Array<Object>} The client's sessions
 */
function getClientSessions(clientId) {
  const sessions = [];
  
  for (const session of activeSessions.values()) {
    if (session.clientId === clientId) {
      sessions.push(session);
    }
  }
  
  return sessions;
}

/**
 * End all sessions for a client
 * @param {string} clientId - The client ID
 * @returns {number} The number of sessions ended
 */
function endClientSessions(clientId) {
  let count = 0;
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.clientId === clientId) {
      session.state = 'ended';
      session.endedAt = new Date();
      activeSessions.delete(sessionId);
      count++;
    }
  }
  
  return count;
}

/**
 * Update session activity
 * @param {string} sessionId - The session ID
 * @returns {boolean} True if session was updated
 */
function updateSessionActivity(sessionId) {
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    session.lastActivity = new Date();
    return true;
  }
  
  return false;
}

/**
 * Clean up inactive sessions
 * @param {number} [maxInactiveTime=3600000] - Max inactive time in ms (default: 1 hour)
 * @returns {number} The number of sessions cleaned up
 */
function cleanupInactiveSessions(maxInactiveTime = 3600000) {
  const now = new Date();
  let count = 0;
  
  for (const [sessionId, session] of activeSessions.entries()) {
    const inactiveTime = now - session.lastActivity;
    
    if (inactiveTime > maxInactiveTime) {
      session.state = 'ended';
      session.endedAt = now;
      activeSessions.delete(sessionId);
      count++;
    }
  }
  
  return count;
}

module.exports = {
  handleSessionRequest,
  handleSessionEndRequest,
  handleSessionPauseRequest,
  handleSessionResumeRequest,
  getSession,
  getClientSessions,
  endClientSessions,
  updateSessionActivity,
  cleanupInactiveSessions
};