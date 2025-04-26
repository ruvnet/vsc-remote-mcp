/**
 * Client Connection State for VSCode Remote MCP
 * 
 * This module manages the state transitions for client connections.
 */

const BaseState = require('./base-state');
const { ConnectionState } = require('./state-constants');

/**
 * Client Connection State class
 * Manages the state transitions for client connections
 */
class ClientConnectionState extends BaseState {
  /**
   * Create a new ClientConnectionState instance
   */
  constructor() {
    super(ConnectionState.DISCONNECTED);
    this.connectionId = null;
  }

  /**
   * Get the connection ID
   * @returns {string|null} The connection ID
   */
  getConnectionId() {
    return this.connectionId;
  }

  /**
   * Validate if a transition is allowed
   * @param {string} fromState - The state to transition from
   * @param {string} toState - The state to transition to
   * @throws {Error} If the transition is not allowed
   * @private
   */
  _validateTransition(fromState, toState) {
    const allowedTransitions = {
      [ConnectionState.DISCONNECTED]: [ConnectionState.CONNECTING],
      [ConnectionState.CONNECTING]: [ConnectionState.CONNECTED, ConnectionState.DISCONNECTED],
      [ConnectionState.CONNECTED]: [ConnectionState.DISCONNECTED],
      [ConnectionState.RECONNECTING]: [ConnectionState.CONNECTED, ConnectionState.DISCONNECTED]
    };

    super._validateTransition(fromState, toState, allowedTransitions);
  }

  /**
   * Initiate a connection
   */
  connect() {
    this._validateTransition(this.currentState, ConnectionState.CONNECTING);
    this._transitionTo(ConnectionState.CONNECTING);
  }

  /**
   * Disconnect from the server
   * @throws {Error} If not in a connected state
   */
  disconnect() {
    if (this.currentState !== ConnectionState.CONNECTED && 
        this.currentState !== ConnectionState.RECONNECTING) {
      throw new Error(`Cannot disconnect from state: ${this.currentState}`);
    }
    this._transitionTo(ConnectionState.DISCONNECTED);
    this.connectionId = null;
  }

  /**
   * Handle incoming messages
   * @param {Object} message - The message to handle
   * @throws {Error} If the message cannot be handled in the current state
   */
  handleMessage(message) {
    if (message.type === 'connection_ack') {
      if (this.currentState !== ConnectionState.CONNECTING && 
          this.currentState !== ConnectionState.RECONNECTING) {
        throw new Error(`Cannot handle connection_ack in state: ${this.currentState}`);
      }
      this._validateTransition(this.currentState, ConnectionState.CONNECTED);
      this._transitionTo(ConnectionState.CONNECTED);
    }
  }

  /**
   * Handle connection errors
   * @param {Error} error - The error that occurred
   */
  handleError(error) {
    this._transitionTo(ConnectionState.DISCONNECTED, error);
    this.connectionId = null;
  }

  /**
   * Set the connection ID
   * @param {string} connectionId - The connection ID
   */
  setConnectionId(connectionId) {
    this.connectionId = connectionId;
  }

  /**
   * Reset the connection state
   */
  reset() {
    super.reset(ConnectionState.DISCONNECTED);
    this.connectionId = null;
  }
}

module.exports = ClientConnectionState;