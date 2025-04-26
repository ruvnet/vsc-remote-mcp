/**
 * Connection Manager for VSCode Remote MCP
 *
 * This module manages WebSocket connections to MCP servers.
 * It handles authentication, reconnection, and message routing.
 */

import config from '../config/env';
import { MCPAuthManager } from './auth-manager';
import { ClientStateManager } from './client-state-model';
import * as errorHandler from './error-handler';
import * as logger from './logger';

/**
 * Simple error handler for connection manager
 */
class MCPErrorHandler {
  /**
   * Handle an error
   * @param message - Error message
   * @param details - Error details
   */
  public handleError(message: string, details: any): void {
    logger.error(message, details);
  }
}

// Message handler type
type MessageHandler = (message: any) => void;

// Connection options interface
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
export class MCPConnectionManager {
  private url: string;
  private sendMessage: (message: any) => void;
  private tokenRefreshThreshold: number;
  private reconnectDelay: number;
  private maxReconnectAttempts: number;
  private autoReconnect: boolean;
  
  private stateManager: ClientStateManager;
  private authManager: MCPAuthManager;
  private errorHandler: MCPErrorHandler;
  
  private socket: WebSocket | null;
  private currentServerId: string | null;
  private currentClientId: string | null;
  private currentWorkspaceId: string | null;
  private tokenRefreshTimers: Map<string, NodeJS.Timeout>;
  private messageHandlers: Map<string, MessageHandler>;
  private pendingRequests: Map<string, { resolve: Function, reject: Function, timeout: NodeJS.Timeout }>;
  private messageQueue: any[];
  private isProcessingQueue: boolean;
  private reconnectAttempts: number;
  
  /**
   * Create a new MCPConnectionManager instance
   * @param options - Connection options
   */
  constructor(options: ConnectionOptions = {}) {
    this.url = options.url || 'http://localhost:3001'; // Default URL
    this.sendMessage = options.sendMessage || this.defaultSendMessage.bind(this);
    this.tokenRefreshThreshold = options.tokenRefreshThreshold || 300; // 5 minutes
    this.reconnectDelay = options.reconnectDelay || 1000; // 1 second
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.autoReconnect = options.autoReconnect !== false;
    
    this.stateManager = new ClientStateManager();
    this.authManager = new MCPAuthManager();
    this.errorHandler = new MCPErrorHandler();
    
    this.socket = null;
    this.currentServerId = null;
    this.currentClientId = null;
    this.currentWorkspaceId = null;
    this.tokenRefreshTimers = new Map();
    this.messageHandlers = new Map();
    this.pendingRequests = new Map();
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.reconnectAttempts = 0;
    
    this.setupDefaultMessageHandlers();
  }
  
  /**
   * Default message sending implementation
   * @param message - Message to send
   */
  private defaultSendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.queueMessage(message);
    }
  }
  
  /**
   * Set up default message handlers
   */
  private setupDefaultMessageHandlers(): void {
    // Handle authentication responses
    this.registerMessageHandler('auth', (message) => {
      if (message.payload?.success) {
        // Update connection state
        this.stateManager.notifyListeners('connection', {
          state: 'Connected',
          serverId: this.currentServerId,
          clientId: this.currentClientId
        });
        
        // Set up token refresh if expiration is provided
        if (message.payload.tokenValidUntil) {
          this.setupTokenRefreshTimer(message.payload.tokenValidUntil);
        }
      } else {
        // Authentication failed
        this.errorHandler.handleError('Authentication failed', {
          serverId: this.currentServerId,
          clientId: this.currentClientId,
          details: message.payload?.error || 'Unknown error'
        });
        
        // Update connection state
        this.stateManager.notifyListeners('connection', {
          state: 'AuthenticationFailed',
          serverId: this.currentServerId,
          clientId: this.currentClientId,
          error: message.payload?.error || 'Authentication failed'
        });
      }
    });
    
    // Handle token refresh responses
    this.registerMessageHandler('tokenRefresh', (message) => {
      if (message.payload?.success && message.payload?.token && this.currentServerId) {
        // Store the new token
        this.authManager.setRefreshedToken(
          this.currentServerId,
          message.payload.token,
          message.payload.tokenValidUntil ? new Date(message.payload.tokenValidUntil) : null
        );
        
        // Set up token refresh if expiration is provided
        if (message.payload.tokenValidUntil) {
          this.setupTokenRefreshTimer(message.payload.tokenValidUntil);
        }
      } else {
        // Token refresh failed
        this.errorHandler.handleError('Token refresh failed', {
          serverId: this.currentServerId,
          clientId: this.currentClientId,
          details: message.payload?.error || 'Unknown error'
        });
      }
    });
    
    // Handle response messages
    this.registerMessageHandler('response', (message) => {
      this.handleResponse(message);
    });
  }
  
  /**
   * Register a message handler
   * @param type - Message type
   * @param handler - Message handler function
   */
  public registerMessageHandler(type: string, handler: MessageHandler): void {
    this.messageHandlers.set(type, handler);
  }
  
  /**
   * Connect to an MCP server
   * @param serverId - Server ID
   * @param clientId - Client ID
   * @param workspaceId - Workspace ID
   * @param capabilities - Client capabilities
   * @returns True if connection was successful
   */
  public async connect(serverId: string, clientId: string, workspaceId: string, capabilities?: string[]): Promise<boolean> {
    this.currentServerId = serverId;
    this.currentClientId = clientId;
    this.currentWorkspaceId = workspaceId;
    
    try {
      // Get authentication token
      const authToken = await this.authManager.getToken(serverId);
      
      // If no token is available, fail the connection
      if (!authToken) {
        console.error('Authentication failed: No token available');
        return false;
      }
      
      // Send connection message
      this.sendMessage({
        type: 'connection',
        payload: {
          clientId,
          workspaceId,
          capabilities: capabilities || ['terminal', 'editor'],
          authToken
        }
      });
      
      return true;
    } catch (error) {
      console.error('Authentication failed:', (error as Error).message);
      return false;
    }
  }
  
  /**
   * Disconnect from the MCP server
   * @param clearAuth - Whether to clear authentication
   * @returns True if disconnection was successful
   */
  public async disconnect(clearAuth = false): Promise<boolean> {
    // Close WebSocket connection
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Clear token refresh timers
    this.clearTokenRefreshTimers();
    
    // Clear authentication if requested
    if (clearAuth && this.currentServerId) {
      await this.authManager.clearToken(this.currentServerId);
    }
    
    // Update connection state
    this.stateManager.notifyListeners('connection', {
      state: 'Disconnected',
      serverId: this.currentServerId,
      clientId: this.currentClientId
    });
    
    // Reset current connection info
    this.currentServerId = null;
    this.currentClientId = null;
    this.currentWorkspaceId = null;
    
    return true;
  }
  
  /**
   * Start a session
   * @param sessionId - Session ID
   * @param sessionOptions - Session options
   * @returns True if session was started successfully
   */
  public async startSession(sessionId: string, sessionOptions: any = {}): Promise<boolean> {
    if (!this.currentServerId || !this.currentClientId) {
      console.error('Cannot start session: Not connected');
      return false;
    }
    
    try {
      // Send session start message
      const response = await this.sendRequest('sessionStart', {
        sessionId,
        ...sessionOptions
      });
      
      if (response.success) {
        // Update session state
        this.stateManager.notifyListeners('session', {
          state: 'Active',
          sessionId,
          options: sessionOptions
        });
        
        return true;
      } else {
        console.error('Failed to start session:', response.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Error starting session:', (error as Error).message);
      return false;
    }
  }
  
  /**
   * End a session
   * @returns True if session was ended successfully
   */
  public async endSession(): Promise<boolean> {
    if (!this.currentServerId || !this.currentClientId) {
      console.error('Cannot end session: Not connected');
      return false;
    }
    
    try {
      // Send session end message
      const response = await this.sendRequest('sessionEnd', {});
      
      if (response.success) {
        // Update session state
        this.stateManager.notifyListeners('session', {
          state: 'Inactive'
        });
        
        return true;
      } else {
        console.error('Failed to end session:', response.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Error ending session:', (error as Error).message);
      return false;
    }
  }
  
  /**
   * Enable or disable automatic reconnection
   * @param enable - Whether to enable reconnection
   */
  public enableReconnection(enable: boolean): void {
    this.autoReconnect = enable;
  }
  
  /**
   * Set up token refresh timer
   * @param tokenValidUntil - Token expiration timestamp
   */
  private setupTokenRefreshTimer(tokenValidUntil: string): void {
    if (!this.currentServerId) {
      return;
    }
    
    // Clear existing timer
    if (this.tokenRefreshTimers.has(this.currentServerId)) {
      clearTimeout(this.tokenRefreshTimers.get(this.currentServerId)!);
      this.tokenRefreshTimers.delete(this.currentServerId);
    }
    
    // Calculate time until refresh
    const expirationTime = new Date(tokenValidUntil).getTime();
    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;
    const timeUntilRefresh = timeUntilExpiration - (this.tokenRefreshThreshold * 1000);
    
    // Set up timer if refresh is needed in the future
    if (timeUntilRefresh > 0) {
      const timer = setTimeout(() => {
        this.refreshToken();
      }, timeUntilRefresh);
      
      this.tokenRefreshTimers.set(this.currentServerId, timer);
    } else {
      // Token is already close to expiration, refresh immediately
      this.refreshToken();
    }
  }
  
  /**
   * Clear all token refresh timers
   */
  private clearTokenRefreshTimers(): void {
    for (const timer of this.tokenRefreshTimers.values()) {
      clearTimeout(timer);
    }
    
    this.tokenRefreshTimers.clear();
  }
  
  /**
   * Refresh authentication token
   * @returns True if token was refreshed successfully
   */
  private async refreshToken(): Promise<boolean> {
    if (!this.currentServerId || !this.currentClientId) {
      return false;
    }
    
    try {
      // Send token refresh request
      const response = await this.sendRequest('tokenRefresh', {
        serverId: this.currentServerId,
        clientId: this.currentClientId
      });
      
      return response.success === true;
    } catch (error) {
      console.error('Error refreshing token:', (error as Error).message);
      return false;
    }
  }
  
  /**
   * Handle incoming message
   * @param message - Message to handle
   */
  public handleMessage(message: any): void {
    // Find handler for message type
    const handler = this.messageHandlers.get(message.type);
    
    if (handler) {
      handler(message);
    } else {
      console.warn('No handler for message type:', message.type);
    }
  }
  
  /**
   * Send a request and wait for response
   * @param requestType - Request type
   * @param payload - Request payload
   * @param timeout - Request timeout in milliseconds
   * @returns Response payload
   */
  public async sendRequest(requestType: string, payload: any, timeout: number = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      // Generate request ID
      const requestId = `${requestType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Request timed out after ${timeout}ms: ${requestType}`));
        }
      }, timeout);
      
      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutId
      });
      
      // Send request
      this.sendMessage({
        type: 'request',
        requestId,
        requestType,
        payload
      });
    });
  }
  
  /**
   * Handle response message
   * @param response - Response message
   */
  private handleResponse(response: any): void {
    const requestId = response.requestId;
    
    if (requestId && this.pendingRequests.has(requestId)) {
      const { resolve, timeout } = this.pendingRequests.get(requestId)!;
      
      // Clear timeout
      clearTimeout(timeout);
      
      // Remove from pending requests
      this.pendingRequests.delete(requestId);
      
      // Resolve promise
      resolve(response.payload);
    }
  }
  
  /**
   * Queue a message for sending
   * @param message - Message to queue
   */
  public queueMessage(message: any): void {
    this.messageQueue.push(message);
    
    // Start processing queue if not already processing
    if (!this.isProcessingQueue) {
      this.processMessageQueue();
    }
  }
  
  /**
   * Process message queue
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.messageQueue.length > 0) {
        // Check if socket is connected
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          const message = this.messageQueue.shift();
          this.socket.send(JSON.stringify(message));
        } else {
          // Socket not connected, try to reconnect
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            // Wait for reconnect delay
            await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
            
            // Try to reconnect
            // This is a simplified version, actual implementation would need to recreate the WebSocket
            if (this.currentServerId && this.currentClientId && this.currentWorkspaceId) {
              await this.connect(this.currentServerId, this.currentClientId, this.currentWorkspaceId);
            } else {
              // Cannot reconnect without connection info
              break;
            }
          } else {
            // Cannot reconnect, clear queue
            this.messageQueue = [];
            break;
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }
}

export default MCPConnectionManager;