/**
 * Client State Model for VSCode Remote MCP
 *
 * This module manages client state for MCP connections.
 * It tracks connection, session, and authentication states.
 */
/**
 * Connection state types
 */
export declare enum ConnectionState {
    Disconnected = "Disconnected",
    Connecting = "Connecting",
    Connected = "Connected",
    AuthenticationFailed = "AuthenticationFailed",
    Reconnecting = "Reconnecting"
}
/**
 * Session state types
 */
export declare enum SessionState {
    Inactive = "Inactive",
    Starting = "Starting",
    Active = "Active",
    Ending = "Ending"
}
/**
 * Client state listener type
 */
type StateListener = (state: any) => void;
/**
 * Client state manager class
 */
export declare class ClientStateManager {
    private connectionState;
    private sessionState;
    private isAuthenticated;
    private listeners;
    /**
     * Create a new ClientStateManager instance
     */
    constructor();
    /**
     * Get the current connection state
     * @returns The connection state
     */
    getConnectionState(): ConnectionState;
    /**
     * Get the current session state
     * @returns The session state
     */
    getSessionState(): SessionState;
    /**
     * Check if the client is authenticated
     * @returns True if authenticated
     */
    isClientAuthenticated(): boolean;
    /**
     * Update the connection state
     * @param state - New connection state
     */
    updateConnectionState(state: ConnectionState): void;
    /**
     * Update the session state
     * @param state - New session state
     */
    updateSessionState(state: SessionState): void;
    /**
     * Update the authentication state
     * @param authenticated - Whether the client is authenticated
     */
    updateAuthState(authenticated: boolean): void;
    /**
     * Add a state listener
     * @param type - Listener type
     * @param listener - Listener function
     */
    addListener(type: string, listener: StateListener): void;
    /**
     * Remove a state listener
     * @param type - Listener type
     * @param listener - Listener function
     * @returns True if listener was removed
     */
    removeListener(type: string, listener: StateListener): boolean;
    /**
     * Notify all listeners of a state change
     * @param type - Listener type
     * @param state - New state
     */
    notifyListeners(type: string, state: any): void;
    /**
     * Reset all state
     */
    resetState(): void;
}
export default ClientStateManager;
