/**
 * Client State Model for VSCode Remote MCP
 * 
 * This module manages client state for MCP connections.
 * It tracks connection, session, and authentication states.
 */

import config from '../config/env';

/**
 * Connection state types
 */
export enum ConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  AuthenticationFailed = 'AuthenticationFailed',
  Reconnecting = 'Reconnecting'
}

/**
 * Session state types
 */
export enum SessionState {
  Inactive = 'Inactive',
  Starting = 'Starting',
  Active = 'Active',
  Ending = 'Ending'
}

/**
 * Client state listener type
 */
type StateListener = (state: any) => void;

/**
 * Client state manager class
 */
export class ClientStateManager {
  private connectionState: ConnectionState;
  private sessionState: SessionState;
  private isAuthenticated: boolean;
  private listeners: Map<string, StateListener[]>;
  
  /**
   * Create a new ClientStateManager instance
   */
  constructor() {
    this.connectionState = ConnectionState.Disconnected;
    this.sessionState = SessionState.Inactive;
    this.isAuthenticated = false;
    this.listeners = new Map();
  }
  
  /**
   * Get the current connection state
   * @returns The connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Get the current session state
   * @returns The session state
   */
  public getSessionState(): SessionState {
    return this.sessionState;
  }
  
  /**
   * Check if the client is authenticated
   * @returns True if authenticated
   */
  public isClientAuthenticated(): boolean {
    return this.isAuthenticated;
  }
  
  /**
   * Update the connection state
   * @param state - New connection state
   */
  public updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.notifyListeners('connection', { state });
  }
  
  /**
   * Update the session state
   * @param state - New session state
   */
  public updateSessionState(state: SessionState): void {
    this.sessionState = state;
    this.notifyListeners('session', { state });
  }
  
  /**
   * Update the authentication state
   * @param authenticated - Whether the client is authenticated
   */
  public updateAuthState(authenticated: boolean): void {
    this.isAuthenticated = authenticated;
    this.notifyListeners('auth', { authenticated });
  }
  
  /**
   * Add a state listener
   * @param type - Listener type
   * @param listener - Listener function
   */
  public addListener(type: string, listener: StateListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    this.listeners.get(type)!.push(listener);
  }
  
  /**
   * Remove a state listener
   * @param type - Listener type
   * @param listener - Listener function
   * @returns True if listener was removed
   */
  public removeListener(type: string, listener: StateListener): boolean {
    if (!this.listeners.has(type)) {
      return false;
    }
    
    const listeners = this.listeners.get(type)!;
    const index = listeners.indexOf(listener);
    
    if (index === -1) {
      return false;
    }
    
    listeners.splice(index, 1);
    return true;
  }
  
  /**
   * Notify all listeners of a state change
   * @param type - Listener type
   * @param state - New state
   */
  public notifyListeners(type: string, state: any): void {
    if (!this.listeners.has(type)) {
      return;
    }
    
    for (const listener of this.listeners.get(type)!) {
      try {
        listener(state);
      } catch (error) {
        console.error(`Error in ${type} state listener:`, error);
      }
    }
  }
  
  /**
   * Reset all state
   */
  public resetState(): void {
    this.connectionState = ConnectionState.Disconnected;
    this.sessionState = SessionState.Inactive;
    this.isAuthenticated = false;
    
    // Notify all listeners
    this.notifyListeners('connection', { state: this.connectionState });
    this.notifyListeners('session', { state: this.sessionState });
    this.notifyListeners('auth', { authenticated: this.isAuthenticated });
  }
}

export default ClientStateManager;