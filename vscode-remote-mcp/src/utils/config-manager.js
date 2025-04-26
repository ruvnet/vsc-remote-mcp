/**
 * Configuration Manager for VSCode Remote MCP
 * 
 * This module handles configuration management for the MCP server, including:
 * - Loading configuration from files and environment variables
 * - Providing default configurations
 * - Validating configuration values
 * - Exposing configuration to other modules
 */

const fs = require('fs');
const path = require('path');

/**
 * Configuration Manager class
 */
class ConfigManager {
  /**
   * Create a new ConfigManager instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Default configuration
    this.defaultConfig = {
      server: {
        port: 3001,
        host: 'localhost',
        logLevel: 'info', // debug, info, warn, error
        maxClients: 10,
        shutdownTimeoutMs: 5000
      },
      auth: {
        enabled: false,
        tokenExpirationSeconds: 3600,
        refreshTokenExpirationSeconds: 86400,
        jwtSecret: 'mcp-secret-key-change-in-production'
      },
      session: {
        inactivityTimeoutMs: 24 * 60 * 60 * 1000, // 24 hours
        cleanupIntervalMs: 60 * 60 * 1000 // 1 hour
      },
      terminal: {
        maxBufferSize: 1000,
        inactivityTimeoutMs: 60 * 60 * 1000, // 1 hour
        cleanupIntervalMs: 15 * 60 * 1000 // 15 minutes
      },
      editor: {
        maxHistorySize: 100,
        inactivityTimeoutMs: 60 * 60 * 1000, // 1 hour
        cleanupIntervalMs: 15 * 60 * 1000 // 15 minutes
      },
      extension: {
        maxHistorySize: 20,
        inactivityTimeoutMs: 24 * 60 * 60 * 1000, // 24 hours
        cleanupIntervalMs: 60 * 60 * 1000 // 1 hour
      }
    };
    
    // Current configuration (will be populated by load)
    this.config = {};
    
    // Configuration file path
    this.configPath = options.configPath || process.env.MCP_CONFIG_PATH || path.join(process.cwd(), 'config', 'server-config.json');
    
    // Load configuration
    this.load();
  }

  /**
   * Load configuration from file and environment variables
   * @returns {Object} The loaded configuration
   */
  load() {
    // Start with default configuration
    this.config = JSON.parse(JSON.stringify(this.defaultConfig));
    
    // Try to load from config file
    try {
      if (fs.existsSync(this.configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.mergeConfig(this.config, fileConfig);
      }
    } catch (error) {
      console.warn(`Warning: Could not load configuration from ${this.configPath}: ${error.message}`);
    }
    
    // Override with environment variables
    this.loadFromEnvironment();
    
    // Validate configuration
    this.validate();
    
    return this.config;
  }

  /**
   * Merge configuration objects
   * @param {Object} target - Target configuration object
   * @param {Object} source - Source configuration object
   * @returns {Object} The merged configuration
   */
  mergeConfig(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // If property is an object, recurse
          if (!target[key]) {
            target[key] = {};
          }
          this.mergeConfig(target[key], source[key]);
        } else {
          // Otherwise, just copy the property
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment() {
    // Server configuration
    if (process.env.MCP_PORT) {
      this.config.server.port = parseInt(process.env.MCP_PORT, 10);
    }
    if (process.env.MCP_HOST) {
      this.config.server.host = process.env.MCP_HOST;
    }
    if (process.env.MCP_LOG_LEVEL) {
      this.config.server.logLevel = process.env.MCP_LOG_LEVEL;
    }
    if (process.env.MCP_MAX_CLIENTS) {
      this.config.server.maxClients = parseInt(process.env.MCP_MAX_CLIENTS, 10);
    }
    if (process.env.MCP_SHUTDOWN_TIMEOUT_MS) {
      this.config.server.shutdownTimeoutMs = parseInt(process.env.MCP_SHUTDOWN_TIMEOUT_MS, 10);
    }
    
    // Auth configuration
    if (process.env.MCP_AUTH_ENABLED) {
      this.config.auth.enabled = process.env.MCP_AUTH_ENABLED === 'true';
    }
    if (process.env.MCP_TOKEN_EXPIRATION) {
      this.config.auth.tokenExpirationSeconds = parseInt(process.env.MCP_TOKEN_EXPIRATION, 10);
    }
    if (process.env.MCP_REFRESH_TOKEN_EXPIRATION) {
      this.config.auth.refreshTokenExpirationSeconds = parseInt(process.env.MCP_REFRESH_TOKEN_EXPIRATION, 10);
    }
    if (process.env.MCP_JWT_SECRET) {
      this.config.auth.jwtSecret = process.env.MCP_JWT_SECRET;
    }
    
    // Session configuration
    if (process.env.MCP_SESSION_INACTIVITY_TIMEOUT_MS) {
      this.config.session.inactivityTimeoutMs = parseInt(process.env.MCP_SESSION_INACTIVITY_TIMEOUT_MS, 10);
    }
    if (process.env.MCP_SESSION_CLEANUP_INTERVAL_MS) {
      this.config.session.cleanupIntervalMs = parseInt(process.env.MCP_SESSION_CLEANUP_INTERVAL_MS, 10);
    }
    
    // Terminal configuration
    if (process.env.MCP_TERMINAL_MAX_BUFFER_SIZE) {
      this.config.terminal.maxBufferSize = parseInt(process.env.MCP_TERMINAL_MAX_BUFFER_SIZE, 10);
    }
    if (process.env.MCP_TERMINAL_INACTIVITY_TIMEOUT_MS) {
      this.config.terminal.inactivityTimeoutMs = parseInt(process.env.MCP_TERMINAL_INACTIVITY_TIMEOUT_MS, 10);
    }
    if (process.env.MCP_TERMINAL_CLEANUP_INTERVAL_MS) {
      this.config.terminal.cleanupIntervalMs = parseInt(process.env.MCP_TERMINAL_CLEANUP_INTERVAL_MS, 10);
    }
    
    // Editor configuration
    if (process.env.MCP_EDITOR_MAX_HISTORY_SIZE) {
      this.config.editor.maxHistorySize = parseInt(process.env.MCP_EDITOR_MAX_HISTORY_SIZE, 10);
    }
    if (process.env.MCP_EDITOR_INACTIVITY_TIMEOUT_MS) {
      this.config.editor.inactivityTimeoutMs = parseInt(process.env.MCP_EDITOR_INACTIVITY_TIMEOUT_MS, 10);
    }
    if (process.env.MCP_EDITOR_CLEANUP_INTERVAL_MS) {
      this.config.editor.cleanupIntervalMs = parseInt(process.env.MCP_EDITOR_CLEANUP_INTERVAL_MS, 10);
    }
    
    // Extension configuration
    if (process.env.MCP_EXTENSION_MAX_HISTORY_SIZE) {
      this.config.extension.maxHistorySize = parseInt(process.env.MCP_EXTENSION_MAX_HISTORY_SIZE, 10);
    }
    if (process.env.MCP_EXTENSION_INACTIVITY_TIMEOUT_MS) {
      this.config.extension.inactivityTimeoutMs = parseInt(process.env.MCP_EXTENSION_INACTIVITY_TIMEOUT_MS, 10);
    }
    if (process.env.MCP_EXTENSION_CLEANUP_INTERVAL_MS) {
      this.config.extension.cleanupIntervalMs = parseInt(process.env.MCP_EXTENSION_CLEANUP_INTERVAL_MS, 10);
    }
  }

  /**
   * Validate configuration
   * @throws {Error} If configuration is invalid
   */
  validate() {
    // Validate server configuration
    if (isNaN(this.config.server.port) || this.config.server.port < 1 || this.config.server.port > 65535) {
      throw new Error(`Invalid server port: ${this.config.server.port}`);
    }
    
    if (!this.config.server.host) {
      throw new Error('Server host is required');
    }
    
    if (!['debug', 'info', 'warn', 'error'].includes(this.config.server.logLevel)) {
      throw new Error(`Invalid log level: ${this.config.server.logLevel}`);
    }
    
    if (isNaN(this.config.server.maxClients) || this.config.server.maxClients < 1) {
      throw new Error(`Invalid max clients: ${this.config.server.maxClients}`);
    }
    
    // Validate auth configuration
    if (this.config.auth.enabled) {
      if (isNaN(this.config.auth.tokenExpirationSeconds) || this.config.auth.tokenExpirationSeconds < 1) {
        throw new Error(`Invalid token expiration: ${this.config.auth.tokenExpirationSeconds}`);
      }
      
      if (isNaN(this.config.auth.refreshTokenExpirationSeconds) || this.config.auth.refreshTokenExpirationSeconds < 1) {
        throw new Error(`Invalid refresh token expiration: ${this.config.auth.refreshTokenExpirationSeconds}`);
      }
      
      if (!this.config.auth.jwtSecret || this.config.auth.jwtSecret === 'mcp-secret-key-change-in-production') {
        console.warn('Warning: Using default JWT secret. This is insecure for production environments.');
      }
    }
  }

  /**
   * Get the entire configuration
   * @returns {Object} The configuration object
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get a specific configuration section
   * @param {string} section - The configuration section name
   * @returns {Object} The configuration section
   */
  getSection(section) {
    return this.config[section] || {};
  }

  /**
   * Get a specific configuration value
   * @param {string} section - The configuration section name
   * @param {string} key - The configuration key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} The configuration value
   */
  getValue(section, key, defaultValue = null) {
    const sectionObj = this.getSection(section);
    return sectionObj.hasOwnProperty(key) ? sectionObj[key] : defaultValue;
  }

  /**
   * Save configuration to file
   * @param {string} filePath - Optional file path (defaults to this.configPath)
   * @returns {boolean} True if saved successfully, false otherwise
   */
  save(filePath = null) {
    const savePath = filePath || this.configPath;
    
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write configuration to file
      fs.writeFileSync(savePath, JSON.stringify(this.config, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error saving configuration to ${savePath}: ${error.message}`);
      return false;
    }
  }
}

module.exports = {
  ConfigManager
};