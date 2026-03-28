import * as vscode from 'vscode';
import { SSHFileManager } from './sshFileManager';
import { HuyfiveTreeDataProvider } from './treeView';
import { HuyfiveConfig } from './config';
import { HuyfiveSettingsPanel } from './settingsPanel';

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "huyfive" is now active!');

  // Register tree view provider
  const treeDataProvider = new HuyfiveTreeDataProvider();
  vscode.window.registerTreeDataProvider('huyfive.operations', treeDataProvider);

  // Command: list files in a directory
  const listFilesDisposable = vscode.commands.registerCommand('huyfive.listRemoteFiles', async () => {
    try {
      const defaultRemotePath = HuyfiveConfig.getRemotePath();
      const dirPath = await vscode.window.showInputBox({
        prompt: 'Enter the directory path',
        value: defaultRemotePath,
        validateInput: (value) => {
          if (!value.trim()) return 'Directory path cannot be empty';
          return undefined;
        }
      });
      if (!dirPath) return;

      await HuyfiveConfig.setRemotePath(dirPath);
      const files = await SSHFileManager.listDirectory(dirPath);
      const fileList = files
        .map(([name, fileType]) => {
          const icon = fileType === vscode.FileType.Directory ? '📁' : '📄';
          return `${icon} ${name}`;
        })
        .join('\n');
      vscode.window.showInformationMessage(`Files in ${dirPath}:\n${fileList}`, { modal: true });
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to list files: ${error.message}`);
    }
  });

  // Command: build and run
  const buildAndRunDisposable = vscode.commands.registerCommand('huyfive.buildAndRun', async () => {
    try {
      const bashScriptPath = HuyfiveConfig.getBashScriptPath();
      const localDestination = HuyfiveConfig.getLocalDestination();
      const localAppPath = HuyfiveConfig.getLocalAppPath();
      const remotePath = HuyfiveConfig.getRemotePath();

      if (!bashScriptPath || !localDestination || !localAppPath) {
        vscode.window.showErrorMessage('Missing required settings. Please configure in the settings panel.');
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Building and running application...',
          cancellable: false,
        },
        async () => {
          // Step 1: Run build script
          const terminal = vscode.window.createTerminal({
            name: 'Huyfive Build',
            isTransient: true,
            location: vscode.TerminalLocation.Panel,
          });
          terminal.sendText(`cd ${remotePath} && bash ${bashScriptPath}`, true);
          // Wait for build (in real code you'd wait for the process to exit)
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Step 2: Copy files
          vscode.window.showInformationMessage(`📥 Copying files from ${remotePath} to ${localDestination}`);
          const files = await SSHFileManager.listDirectory(remotePath);
          for (const [filename, fileType] of files) {
            if (fileType === vscode.FileType.File) {
              const remoteFile = `${remotePath}/${filename}`;
              try {
                await SSHFileManager.copyFileFromRemote(remoteFile, filename);
              } catch (error) {
                console.log(`Failed to copy ${filename}: ${error}`);
              }
            }
          }
          await HuyfiveConfig.addToDownloadHistory(remotePath);

          // Step 3: Run local app
          vscode.window.showInformationMessage(`🚀 Running local application: ${localAppPath}`);
          const { exec } = require('child_process');
          exec(localAppPath, (error: any) => {
            if (error && error.code !== 0) {
              vscode.window.showErrorMessage(`Application exited with error: ${error.message}`);
            }
          });

          vscode.window.showInformationMessage('✅ Build and run completed successfully!');
        }
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  });

  // Command: open settings panel
  const openSettingsDisposable = vscode.commands.registerCommand('huyfive.openSettings', () => {
    HuyfiveSettingsPanel.createOrShow();
  });

  // Command: run custom command
  const runCustomCommandDisposable = vscode.commands.registerCommand('huyfive.runCustomCommand', async () => {
    try {
      const command = await vscode.window.showInputBox({
        prompt: 'Enter the command to execute',
        validateInput: (value) => {
          if (!value.trim()) return 'Command cannot be empty';
          return undefined;
        }
      });
      if (!command) return;

      const terminal = vscode.window.createTerminal({
        name: 'Huyfive Custom Command',
        isTransient: true,
        location: vscode.TerminalLocation.Panel,
      });
      terminal.sendText(command, true);
      terminal.show();
      vscode.window.showInformationMessage(`📟 Executing: ${command}`);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to run command: ${error.message}`);
    }
  });

  context.subscriptions.push(listFilesDisposable, buildAndRunDisposable, openSettingsDisposable, runCustomCommandDisposable);
}

export function deactivate() {}