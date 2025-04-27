# Changelog

All notable changes to the `vsc-remote` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-04-27

### Added
- Added configurable timeout settings for MCP requests and connections
- Added command-line options for request timeout, connection timeout, and keep-alive interval
- Added instances directory configuration option
- Added VSCode swarm management capabilities
- Added improved UI login and password management
- Added environment variables for password complexity and swarm configuration

### Fixed
- Fixed connection issue where the server would close with "MCP error -32000: Connection closed"
- Improved signal handling for graceful shutdown
- Enhanced server stability with persistent connection handling
- Fixed instances directory path resolution for global installations

### Changed
- Updated documentation with troubleshooting information for connection issues
- Added GitHub repository information
- Updated package metadata
- Enhanced README with VSCode swarm management and UI login information

## [1.2.0] - 2025-04-26

### Security
- Implemented command injection protections in all tools
- Enhanced password handling with secure storage and validation
- Added comprehensive input validation and sanitization
- Improved authentication with token-based security
- Replaced exec with spawn for secure command execution
- Added path traversal prevention

### Added
- Added verify-package.js script for pre-publishing checks
- Added prepublishOnly npm script to ensure quality before publishing
- Created CHANGELOG.md to track version history
- Added .npmignore file to exclude unnecessary files from the package

### Changed
- Updated package.json configuration for npm publishing
- Improved error handling and reporting
- Enhanced documentation with security best practices
- Updated README with authentication examples

### Fixed
- Fixed potential security vulnerabilities in command execution
- Addressed input validation issues in CLI arguments
- Fixed path handling to prevent directory traversal attacks

## [1.1.0] - 2025-03-15

### Added
- Initial public release
- Support for WebSocket and stdio server modes
- CLI commands for all MCP tools
- Docker integration for VSCode instances
- Resource management capabilities