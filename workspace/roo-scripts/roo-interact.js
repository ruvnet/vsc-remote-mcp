// This script uses the VS Code API to interact with the Roo extension
const vscode = require('vscode');

/**
 * Interacts with the Roo extension
 * @param {string} command - The Roo command to execute
 * @param {string} input - The input for the command
 * @returns {Promise<string>} - The result of the command
 */
async function interactWithRoo(command, input) {
  try {
    // Check if Roo extension is available
    const rooExtension = vscode.extensions.getExtension('rooveterinaryinc.roo-cline');
    if (!rooExtension) {
      return 'Roo extension is not installed or not activated';
    }
    
    // Make sure the extension is activated
    if (!rooExtension.isActive) {
      await rooExtension.activate();
    }
    
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;
    if (!editor && ['explain', 'optimize', 'refactor', 'test', 'debug', 'document'].includes(command)) {
      return 'No active text editor';
    }
    
    // Execute the appropriate command based on the input
    switch (command) {
      case 'ask':
        await vscode.commands.executeCommand('roo.ask', input);
        return 'Asked Roo: ' + input;
        
      case 'explain':
        if (editor) {
          await vscode.commands.executeCommand('roo.explain');
          return 'Asked Roo to explain the current file';
        }
        return 'No active text editor';
        
      case 'optimize':
        if (editor) {
          await vscode.commands.executeCommand('roo.optimize');
          return 'Asked Roo to optimize the current file';
        }
        return 'No active text editor';
        
      case 'refactor':
        if (editor) {
          await vscode.commands.executeCommand('roo.refactor', input);
          return 'Asked Roo to refactor the current file with instructions: ' + input;
        }
        return 'No active text editor';
        
      case 'generate':
        await vscode.commands.executeCommand('roo.generate', input);
        return 'Asked Roo to generate code based on: ' + input;
        
      case 'test':
        if (editor) {
          await vscode.commands.executeCommand('roo.test');
          return 'Asked Roo to generate tests for the current file';
        }
        return 'No active text editor';
        
      case 'debug':
        if (editor) {
          await vscode.commands.executeCommand('roo.debug', input);
          return 'Asked Roo to debug the current file with error: ' + input;
        }
        return 'No active text editor';
        
      case 'document':
        if (editor) {
          await vscode.commands.executeCommand('roo.document');
          return 'Asked Roo to document the current file';
        }
        return 'No active text editor';
        
      default:
        return 'Unknown command: ' + command;
    }
  } catch (error) {
    return 'Error: ' + error.message;
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];
const input = args[1] || '';

// Execute the command and print the result
interactWithRoo(command, input)
  .then(result => console.log(result))
  .catch(error => console.error('Error:', error));
