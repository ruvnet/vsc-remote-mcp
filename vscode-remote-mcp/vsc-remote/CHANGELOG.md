# Changelog

All notable changes to the `vsc-remote` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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