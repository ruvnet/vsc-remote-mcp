/**
 * Server Manager for VSCode Remote MCP
 * 
 * This module manages the MCP server instance.
 */

const { shutdownGracefully, setupShutdownHandlers } = require('./graceful-shutdown');

/**
 * Server Manager class
 */
class ServerManager {
  /**
   * Create a new ServerManager instance
   * @param {Object} server - The server instance
   * @param {Object} options - Server options
   */
  constructor(server, options = {}) {
    this.server = server;
    this.options = {
      shutdownTimeout: 10000, // 10 seconds
      ...options
    };
    
    this.clients = new Map();
    this.isShuttingDown = false;
  }

  /**
   * Add a client
   * @param {string} clientId - The client ID
   * @param {Object} client - The client
   * @returns {boolean} True if client was added
   */
  addClient(clientId, client) {
    // Don't add clients during shutdown
    if (this.isShuttingDown) {
      return false;
    }
    
    this.clients.set(clientId, client);
    return true;
  }

  /**
   * Remove a client
   * @param {string} clientId - The client ID
   * @returns {boolean} True if client was removed
   */
  removeClient(clientId) {
    return this.clients.delete(clientId);
  }

  /**
   * Get a client
   * @param {string} clientId - The client ID
   * @returns {Object|undefined} The client
   */
  getClient(clientId) {
    return this.clients.get(clientId);
  }

  /**
   * Get all clients
   * @returns {Map} The clients
   */
  getClients() {
    return this.clients;
  }

  /**
   * Get client count
   * @returns {number} The client count
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Broadcast a message to all clients
   * @param {Object} message - The message
   * @returns {number} Number of clients the message was sent to
   */
  broadcastMessage(message) {
    let count = 0;
    
    for (const client of this.clients.values()) {
      if (client && client.send && typeof client.send === 'function') {
        try {
          client.send(JSON.stringify(message));
          count++;
        } catch (error) {
          console.error('Error sending message to client:', error);
        }
      }
    }
    
    return count;
  }

  /**
   * Gracefully shut down the server
   * @param {string} [reason='Server shutdown'] - Shutdown reason
   * @param {number} [estimatedDowntime=300] - Estimated downtime in seconds
   * @returns {Promise<void>}
   */
  async gracefulShutdown(reason = 'Server shutdown', estimatedDowntime = 300) {
    // Check if already shutting down
    if (this.isShuttingDown) {
      return;
    }
    
    // Set shutting down flag
    this.isShuttingDown = true;
    
    console.log(`Initiating graceful shutdown: ${reason}`);
    
    try {
      // Notify all clients
      await shutdownGracefully(this.clients, reason, estimatedDowntime);
      
      // Close server
      if (this.server && this.server.close && typeof this.server.close === 'function') {
        await new Promise((resolve) => {
          this.server.close(() => {
            console.log('Server closed');
            resolve();
          });
          
          // Set timeout to force close
          setTimeout(() => {
            console.log('Server close timed out, forcing close');
            resolve();
          }, this.options.shutdownTimeout);
        });
      }
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
    }
  }

  /**
   * Check if server is shutting down
   * @returns {boolean} True if server is shutting down
   */
  isServerShuttingDown() {
    return this.isShuttingDown;
  }

  /**
   * Get server info
   * @returns {Object} Server info
   */
  getServerInfo() {
    return {
      clientCount: this.clients.size,
      isShuttingDown: this.isShuttingDown
    };
  }
}

module.exports = {
  ServerManager,
  shutdownGracefully
};