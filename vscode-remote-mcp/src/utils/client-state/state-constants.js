/**
 * State Constants for VSCode Remote MCP
 * 
 * This module defines the constants for all state types.
 */

/**
 * Connection state constants
 * @enum {string}
 */
const ConnectionState = {
  /** Client is disconnected from the server */
  DISCONNECTED: 'Disconnected',
  /** Client is attempting to connect to the server */
  CONNECTING: 'Connecting',
  /** Client is connected to the server */
  CONNECTED: 'Connected',
  /** Client is attempting to reconnect to the server */
  RECONNECTING: 'Reconnecting'
};

/**
 * Session state constants
 * @enum {string}
 */
const SessionState = {
  /** Client is not in a session */
  NO_SESSION: 'NotInSession',
  /** Client is requesting to create a session */
  REQUESTING: 'CreatingSession',
  /** Client is joining an existing session */
  JOINING: 'JoiningSession',
  /** Client is the owner of an active session */
  ACTIVE_OWNER: 'SessionOwner',
  /** Client is a participant in an active session */
  ACTIVE_PARTICIPANT: 'SessionParticipant'
};

/**
 * Document state constants
 * @enum {string}
 */
const DocumentState = {
  /** No document is open */
  NO_DOCUMENT: 'NoActiveDocument',
  /** Document is open and active */
  ACTIVE: 'DocumentActive',
  /** Document is being edited */
  EDITING: 'EditingDocument'
};

/**
 * Terminal state constants
 * @enum {string}
 */
const TerminalState = {
  /** No terminal is open */
  NO_TERMINAL: 'NoTerminal',
  /** Terminal is open and active */
  ACTIVE: 'TerminalActive',
  /** Terminal is executing a command */
  COMMAND: 'TerminalCommand'
};

module.exports = {
  ConnectionState,
  SessionState,
  DocumentState,
  TerminalState
};