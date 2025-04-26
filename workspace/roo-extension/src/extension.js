const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('rooExtensionRunner.runCommand', async (command, input) => {
    try {
      // Check if Roo extension is available
      const rooExtension = vscode.extensions.getExtension('rooveterinaryinc.roo-cline');
      if (!rooExtension) {
        vscode.window.showErrorMessage('Roo extension is not installed or not activated');
        return;
      }
      
      // Make sure the extension is activated
      if (!rooExtension.isActive) {
        await rooExtension.activate();
      }
      
      // Execute the command
      switch (command) {
        case 'ask':
          await vscode.commands.executeCommand('roo.ask', input);
          break;
        case 'explain':
          await vscode.commands.executeCommand('roo.explain');
          break;
        case 'optimize':
          await vscode.commands.executeCommand('roo.optimize');
          break;
        case 'refactor':
          await vscode.commands.executeCommand('roo.refactor', input);
          break;
        case 'generate':
          await vscode.commands.executeCommand('roo.generate', input);
          break;
        case 'test':
          await vscode.commands.executeCommand('roo.test');
          break;
        case 'debug':
          await vscode.commands.executeCommand('roo.debug', input);
          break;
        case 'document':
          await vscode.commands.executeCommand('roo.document');
          break;
        default:
          vscode.window.showErrorMessage('Unknown command: ' + command);
      }
    } catch (error) {
      vscode.window.showErrorMessage('Error: ' + error.message);
    }
  });
  
  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
