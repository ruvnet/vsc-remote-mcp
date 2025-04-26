# VS Code Server Workspace

This is your persistent workspace for the VS Code Server with Roo extension. Any files you create or modify in this directory will be preserved between container restarts.

## Getting Started

This workspace contains a few example files to help you test the Roo extension:

- `index.html` - A simple HTML page to verify the VS Code Server is working
- `test-roo.js` - A JavaScript file to test Roo's code analysis capabilities
- `test_python.py` - A Python file to demonstrate multi-language support

## Using the Roo Extension

The Roo extension (rooveterinaryinc.roo-cline) is pre-installed in this VS Code Server. To use it:

1. Open any file in the editor
2. Access the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
3. Type "Roo" to see available commands

## Adding Your Projects

You can add your own projects to this workspace by:

1. Creating new files and directories directly in the VS Code web interface
2. Uploading files using the VS Code file explorer
3. Cloning Git repositories using the integrated terminal

## Persistent Storage

This workspace is mounted as a Docker volume, so your files will persist even if you restart the container or rebuild the image.

## Need Help?

Refer to the [USAGE.md](../docs/USAGE.md) file for more detailed instructions on using the VS Code Server with Roo extension.