/**
 * Session Participation State for VSCode Remote MCP
 * 
 * This module manages the state transitions for session participation.
 */

const BaseState = require('./base-state');
const { SessionState } = require('./state-constants');

/**
 * Session Participation State class
 * Manages the state transitions for session participation
 */
class SessionParticipationState extends BaseState {
  /**
   * Create a new SessionParticipationState instance
   */
  constructor() {
    super(SessionState.NO_SESSION);
    this.sessionId = null;
  }

  /**
   * Get the session ID
   * @returns {string|null} The session ID
   */
  getSessionId() {
    return this.sessionId;
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
      [SessionState.NO_SESSION]: [SessionState.REQUESTING, SessionState.JOINING],
      [SessionState.REQUESTING]: [SessionState.ACTIVE_OWNER, SessionState.NO_SESSION],
      [SessionState.JOINING]: [SessionState.ACTIVE_PARTICIPANT, SessionState.NO_SESSION],
      [SessionState.ACTIVE_OWNER]: [SessionState.NO_SESSION],
      [SessionState.ACTIVE_PARTICIPANT]: [SessionState.NO_SESSION]
    };

    super._validateTransition(fromState, toState, allowedTransitions);
  }

  /**
   * Create a new session
   * @param {string} sessionId - The session ID
   * @throws {Error} If not in a valid state to create a session
   */
  createSession(sessionId) {
    this._validateTransition(this.currentState, SessionState.REQUESTING);
    this.sessionId = sessionId;
    this._transitionTo(SessionState.REQUESTING);
  }

  /**
   * Join an existing session
   * @param {string} sessionId - The session ID
   * @throws {Error} If not in a valid state to join a session
   */
  joinSession(sessionId) {
    this._validateTransition(this.currentState, SessionState.JOINING);
    this.sessionId = sessionId;
    this._transitionTo(SessionState.JOINING);
  }

  /**
   * Leave the current session
   * @throws {Error} If not in a session
   */
  leaveSession() {
    if (this.currentState !== SessionState.ACTIVE_OWNER && 
        this.currentState !== SessionState.ACTIVE_PARTICIPANT) {
      throw new Error(`Cannot leave session from state: ${this.currentState}`);
    }
    this._validateTransition(this.currentState, SessionState.NO_SESSION);
    this._transitionTo(SessionState.NO_SESSION);
    this.sessionId = null;
  }

  /**
   * Handle incoming messages
   * @param {Object} message - The message to handle
   * @throws {Error} If the message cannot be handled in the current state
   */
  handleMessage(message) {
    if (message.type === 'session_create_ack') {
      if (this.currentState !== SessionState.REQUESTING) {
        throw new Error(`Cannot handle session_create_ack in state: ${this.currentState}`);
      }
      this._validateTransition(this.currentState, SessionState.ACTIVE_OWNER);
      this._transitionTo(SessionState.ACTIVE_OWNER);
    } else if (message.type === 'session_join_ack') {
      if (this.currentState !== SessionState.JOINING) {
        throw new Error(`Cannot handle session_join_ack in state: ${this.currentState}`);
      }
      
      if (message.payload.status === 'joined') {
        this._validateTransition(this.currentState, SessionState.ACTIVE_PARTICIPANT);
        this._transitionTo(SessionState.ACTIVE_PARTICIPANT);
      } else if (message.payload.status === 'rejected') {
        this._validateTransition(this.currentState, SessionState.NO_SESSION);
        this._transitionTo(SessionState.NO_SESSION);
        this.sessionId = null;
      }
    }
  }

  /**
   * Handle session errors
   * @param {Error} error - The error that occurred
   */
  handleError(error) {
    this._transitionTo(SessionState.NO_SESSION, error);
    this.sessionId = null;
  }

  /**
   * Reset the session state
   */
  reset() {
    super.reset(SessionState.NO_SESSION);
    this.sessionId = null;
  }
}

module.exports = SessionParticipationState;