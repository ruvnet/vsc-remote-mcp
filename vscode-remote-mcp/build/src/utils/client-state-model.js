"use strict";
/**
 * Client State Model for VSCode Remote MCP
 *
 * This module manages client state for MCP connections.
 * It tracks connection, session, and authentication states.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientStateManager = exports.SessionState = exports.ConnectionState = void 0;
/**
 * Connection state types
 */
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["Disconnected"] = "Disconnected";
    ConnectionState["Connecting"] = "Connecting";
    ConnectionState["Connected"] = "Connected";
    ConnectionState["AuthenticationFailed"] = "AuthenticationFailed";
    ConnectionState["Reconnecting"] = "Reconnecting";
})(ConnectionState || (exports.ConnectionState = ConnectionState = {}));
/**
 * Session state types
 */
var SessionState;
(function (SessionState) {
    SessionState["Inactive"] = "Inactive";
    SessionState["Starting"] = "Starting";
    SessionState["Active"] = "Active";
    SessionState["Ending"] = "Ending";
})(SessionState || (exports.SessionState = SessionState = {}));
/**
 * Client state manager class
 */
class ClientStateManager {
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
    getConnectionState() {
        return this.connectionState;
    }
    /**
     * Get the current session state
     * @returns The session state
     */
    getSessionState() {
        return this.sessionState;
    }
    /**
     * Check if the client is authenticated
     * @returns True if authenticated
     */
    isClientAuthenticated() {
        return this.isAuthenticated;
    }
    /**
     * Update the connection state
     * @param state - New connection state
     */
    updateConnectionState(state) {
        this.connectionState = state;
        this.notifyListeners('connection', { state });
    }
    /**
     * Update the session state
     * @param state - New session state
     */
    updateSessionState(state) {
        this.sessionState = state;
        this.notifyListeners('session', { state });
    }
    /**
     * Update the authentication state
     * @param authenticated - Whether the client is authenticated
     */
    updateAuthState(authenticated) {
        this.isAuthenticated = authenticated;
        this.notifyListeners('auth', { authenticated });
    }
    /**
     * Add a state listener
     * @param type - Listener type
     * @param listener - Listener function
     */
    addListener(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(listener);
    }
    /**
     * Remove a state listener
     * @param type - Listener type
     * @param listener - Listener function
     * @returns True if listener was removed
     */
    removeListener(type, listener) {
        if (!this.listeners.has(type)) {
            return false;
        }
        const listeners = this.listeners.get(type);
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
    notifyListeners(type, state) {
        if (!this.listeners.has(type)) {
            return;
        }
        for (const listener of this.listeners.get(type)) {
            try {
                listener(state);
            }
            catch (error) {
                console.error(`Error in ${type} state listener:`, error);
            }
        }
    }
    /**
     * Reset all state
     */
    resetState() {
        this.connectionState = ConnectionState.Disconnected;
        this.sessionState = SessionState.Inactive;
        this.isAuthenticated = false;
        // Notify all listeners
        this.notifyListeners('connection', { state: this.connectionState });
        this.notifyListeners('session', { state: this.sessionState });
        this.notifyListeners('auth', { authenticated: this.isAuthenticated });
    }
}
exports.ClientStateManager = ClientStateManager;
exports.default = ClientStateManager;
//# sourceMappingURL=client-state-model.js.map