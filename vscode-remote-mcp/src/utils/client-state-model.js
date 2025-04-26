/**
 * Client State Model for VSCode Remote MCP
 * 
 * This module provides a comprehensive state management system for the VSCode Remote MCP client.
 * It includes classes for managing connection state, session participation, document collaboration,
 * and terminal sharing.
 * 
 * @module client-state-model
 */

const BaseState = require('./client-state/base-state');
const ClientConnectionState = require('./client-state/connection-state');
const SessionParticipationState = require('./client-state/session-state');
const DocumentCollaborationState = require('./client-state/document-state');
const TerminalSharingState = require('./client-state/terminal-state');
const ClientStateManager = require('./client-state/client-state-manager');
const { 
  ConnectionState, 
  SessionState, 
  DocumentState, 
  TerminalState 
} = require('./client-state/state-constants');

/**
 * @typedef {Object} StateChangeEvent
 * @property {string} oldState - The previous state
 * @property {string} newState - The new state
 * @property {Error|null} error - Any error associated with the state change
 */

/**
 * @typedef {Object} StateListener
 * @property {Function} callback - The callback function to be called on state change
 * @property {string} id - The unique identifier for the listener
 */

// Export all classes and constants
module.exports = {
  // State classes
  BaseState,
  ClientConnectionState,
  SessionParticipationState,
  DocumentCollaborationState,
  TerminalSharingState,
  ClientStateManager,
  
  // State constants
  ConnectionState,
  SessionState,
  DocumentState,
  TerminalState
};
