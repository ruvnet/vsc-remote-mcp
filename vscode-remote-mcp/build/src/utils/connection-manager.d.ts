/**
 * Connection Manager for VSCode Remote MCP
 *
 * This module manages WebSocket connections to MCP servers.
 * It handles authentication, reconnection, and message routing.
 */
type MessageHandler = (message: any) => void;
interface ConnectionOptions {
    url?: string;
    sendMessage?: (message: any) => void;
    tokenRefreshThreshold?: number;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
    autoReconnect?: boolean;
}
/**
 * MCP Connection Manager class
 */
export declare class MCPConnectionManager {
    private url;
    private sendMessage;
    private tokenRefreshThreshold;
    private reconnectDelay;
    private maxReconnectAttempts;
    private autoReconnect;
    private stateManager;
    private authManager;
    private errorHandler;
    private socket;
    private currentServerId;
    private currentClientId;
    private currentWorkspaceId;
    private tokenRefreshTimers;
    private messageHandlers;
    private pendingRequests;
    private messageQueue;
    private isProcessingQueue;
    private reconnectAttempts;
    /**
     * Create a new MCPConnectionManager instance
     * @param options - Connection options
     */
    constructor(options?: ConnectionOptions);
    /**
     * Default message sending implementation
     * @param message - Message to send
     */
    private defaultSendMessage;
    /**
     * Set up default message handlers
     */
    private setupDefaultMessageHandlers;
    /**
     * Register a message handler
     * @param type - Message type
     * @param handler - Message handler function
     */
    registerMessageHandler(type: string, handler: MessageHandler): void;
    /**
     * Connect to an MCP server
     * @param serverId - Server ID
     * @param clientId - Client ID
     * @param workspaceId - Workspace ID
     * @param capabilities - Client capabilities
     * @returns True if connection was successful
     */
    connect(serverId: string, clientId: string, workspaceId: string, capabilities?: string[]): Promise<boolean>;
    /**
     * Disconnect from the MCP server
     * @param clearAuth - Whether to clear authentication
     * @returns True if disconnection was successful
     */
    disconnect(clearAuth?: boolean): Promise<boolean>;
    /**
     * Start a session
     * @param sessionId - Session ID
     * @param sessionOptions - Session options
     * @returns True if session was started successfully
     */
    startSession(sessionId: string, sessionOptions?: any): Promise<boolean>;
    /**
     * End a session
     * @returns True if session was ended successfully
     */
    endSession(): Promise<boolean>;
    /**
     * Enable or disable automatic reconnection
     * @param enable - Whether to enable reconnection
     */
    enableReconnection(enable: boolean): void;
    /**
     * Set up token refresh timer
     * @param tokenValidUntil - Token expiration timestamp
     */
    private setupTokenRefreshTimer;
    /**
     * Clear all token refresh timers
     */
    private clearTokenRefreshTimers;
    /**
     * Refresh authentication token
     * @returns True if token was refreshed successfully
     */
    private refreshToken;
    /**
     * Handle incoming message
     * @param message - Message to handle
     */
    handleMessage(message: any): void;
    /**
     * Send a request and wait for response
     * @param requestType - Request type
     * @param payload - Request payload
     * @param timeout - Request timeout in milliseconds
     * @returns Response payload
     */
    sendRequest(requestType: string, payload: any, timeout?: number): Promise<any>;
    /**
     * Handle response message
     * @param response - Response message
     */
    private handleResponse;
    /**
     * Queue a message for sending
     * @param message - Message to queue
     */
    queueMessage(message: any): void;
    /**
     * Process message queue
     */
    private processMessageQueue;
}
export default MCPConnectionManager;
