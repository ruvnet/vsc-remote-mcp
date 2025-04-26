/**
 * Terminal Sharing State for VSCode Remote MCP
 * 
 * This module manages the state transitions for terminal sharing.
 */

const BaseState = require('./base-state');
const { TerminalState } = require('./state-constants');

/**
 * Terminal Sharing State class
 * Manages the state transitions for terminal sharing
 */
class TerminalSharingState extends BaseState {
  /**
   * Create a new TerminalSharingState instance
   */
  constructor() {
    super(TerminalState.NO_TERMINAL);
    this.terminalId = null;
    this.currentCommand = null;
  }

  /**
   * Get the terminal ID
   * @returns {string|null} The terminal ID
   */
  getTerminalId() {
    return this.terminalId;
  }

  /**
   * Get the current command
   * @returns {string|null} The current command
   */
  getCurrentCommand() {
    return this.currentCommand;
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
      [TerminalState.NO_TERMINAL]: [TerminalState.ACTIVE],
      [TerminalState.ACTIVE]: [TerminalState.COMMAND, TerminalState.NO_TERMINAL],
      [TerminalState.COMMAND]: [TerminalState.ACTIVE, TerminalState.NO_TERMINAL]
    };

    super._validateTransition(fromState, toState, allowedTransitions);
  }

  /**
   * Start a terminal
   * @param {string} terminalId - The terminal ID
   * @throws {Error} If not in a valid state to start a terminal
   */
  startTerminal(terminalId) {
    this._validateTransition(this.currentState, TerminalState.ACTIVE);
    this.terminalId = terminalId;
    this._transitionTo(TerminalState.ACTIVE);
  }

  /**
   * Send a command to the terminal
   * @param {string} command - The command to send
   * @throws {Error} If not in a valid state to send a command
   */
  sendCommand(command) {
    if (this.currentState !== TerminalState.ACTIVE) {
      throw new Error(`Cannot send command in state: ${this.currentState}`);
    }
    this._validateTransition(this.currentState, TerminalState.COMMAND);
    this.currentCommand = command;
    this._transitionTo(TerminalState.COMMAND);
  }

  /**
   * Complete the current command
   * @throws {Error} If not in a valid state to complete a command
   */
  commandComplete() {
    if (this.currentState !== TerminalState.COMMAND) {
      throw new Error(`Cannot complete command in state: ${this.currentState}`);
    }
    this._validateTransition(this.currentState, TerminalState.ACTIVE);
    this.currentCommand = null;
    this._transitionTo(TerminalState.ACTIVE);
  }

  /**
   * Close the terminal
   * @throws {Error} If not in a valid state to close a terminal
   */
  closeTerminal() {
    if (this.currentState === TerminalState.NO_TERMINAL) {
      throw new Error(`Cannot close terminal in state: ${this.currentState}`);
    }
    this._validateTransition(this.currentState, TerminalState.NO_TERMINAL);
    this.terminalId = null;
    this.currentCommand = null;
    this._transitionTo(TerminalState.NO_TERMINAL);
  }

  /**
   * Reset the terminal state
   */
  reset() {
    super.reset(TerminalState.NO_TERMINAL);
    this.terminalId = null;
    this.currentCommand = null;
  }
}

module.exports = TerminalSharingState;