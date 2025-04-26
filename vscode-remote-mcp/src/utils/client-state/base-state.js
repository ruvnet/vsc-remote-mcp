/**
 * Base State Class for VSCode Remote MCP
 * 
 * This module provides a base class for all state classes with common functionality.
 */

/**
 * Base State class with common state management functionality
 */
class BaseState {
  /**
   * Create a new BaseState instance
   * @param {string} initialState - The initial state
   */
  constructor(initialState) {
    this.currentState = initialState;
    this.error = null;
    this.lastActivity = null;
    this.listeners = [];
  }

  /**
   * Get the current state
   * @returns {string} The current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get the error if any
   * @returns {Error|null} The error
   */
  getError() {
    return this.error;
  }

  /**
   * Get the last activity timestamp
   * @returns {Date|null} The last activity timestamp
   */
  getLastActivity() {
    return this.lastActivity;
  }

  /**
   * Register a callback for state changes
   * @param {Function} callback - Function to call when state changes
   */
  onStateChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Transition to a new state
   * @param {string} newState - The new state to transition to
   * @param {Error} [error=null] - Optional error associated with the transition
   * @protected
   */
  _transitionTo(newState, error = null) {
    const oldState = this.currentState;
    this.currentState = newState;
    this.error = error;
    this.lastActivity = new Date();
    
    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(oldState, newState);
      } catch (err) {
        console.error('Error in state listener:', err);
      }
    }
  }

  /**
   * Validate if a transition is allowed
   * @param {string} fromState - The state to transition from
   * @param {string} toState - The state to transition to
   * @param {Object} allowedTransitions - Map of allowed transitions
   * @throws {Error} If the transition is not allowed
   * @protected
   */
  _validateTransition(fromState, toState, allowedTransitions) {
    if (!allowedTransitions[fromState] || !allowedTransitions[fromState].includes(toState)) {
      throw new Error(`Invalid state transition from ${fromState} to ${toState}`);
    }
  }

  /**
   * Reset the state
   * @param {string} initialState - The initial state to reset to
   */
  reset(initialState) {
    this._transitionTo(initialState);
    this.error = null;
  }
}

module.exports = BaseState;