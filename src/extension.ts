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

  // List files in remote directory
  const listFilesDisposable = vscode.commands.registerCommand('huyfive.listRemoteFiles', async () => {
    try {
      if (!SSHFileManager.isConnectedToSSH()) {
        vscode.window.showErrorMessage('Not connected to a remote SSH host. Open a remote folder via SSH first.');
        return;
      }

      const defaultRemotePath = HuyfiveConfig.getRemotePath();
      const dirPath = await vscode.window.showInputBox({
        prompt: 'Enter the remote directory path',
        value: defaultRemotePath,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Directory path cannot be empty';
          }
          return undefined;
        }
      });

      if (!dirPath) {
        return;
      }

      // Save to config for next time
      await HuyfiveConfig.setRemotePath(dirPath);

      const files = await SSHFileManager.listRemoteDirectory(dirPath);
      const fileList = files
        .map(([name, fileType]) => {
          const icon = fileType === vscode.FileType.Directory ? '📁' : '📄';
          return `${icon} ${name}`;
        })
        .join('\n');

      vscode.window.showInformationMessage(
        `Files in ${dirPath}:\n${fileList}`,
        { modal: true }
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to list files: ${error.message}`);
    }
  });

  // Build and Run command
  const buildAndRunDisposable = vscode.commands.registerCommand('huyfive.buildAndRun', async () => {
    try {
      if (!SSHFileManager.isConnectedToSSH()) {
        vscode.window.showErrorMessage('Not connected to a remote SSH host. Open a remote folder via SSH first.');
        return;
      }

      const bashScriptPath = HuyfiveConfig.getBashScriptPath();
      const localDestination = HuyfiveConfig.getLocalDestination();
      const localAppPath = HuyfiveConfig.getLocalAppPath();
      const remotePath = HuyfiveConfig.getRemotePath();

      if (!bashScriptPath) {
        vscode.window.showErrorMessage('Build script path not configured. Go to Settings and set "Remote Build Script".');
        return;
      }

      if (!localDestination) {
        vscode.window.showErrorMessage('Local destination not configured. Go to Settings and set "Local Destination".');
        return;
      }

      if (!localAppPath) {
        vscode.window.showErrorMessage('Local app path not configured. Go to Settings and set "Local Application Path".');
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Building on remote host and running application...',
          cancellable: false
        },
        async () => {
          try {
            // Step 1: Run build script on remote host
            vscode.window.showInformationMessage(`📦 Running build script: ${bashScriptPath}`);
            const terminal = vscode.window.createTerminal({
              name: 'Huyfive Build',
              isTransient: true,
              location: vscode.TerminalLocation.Panel
            });

            terminal.sendText(`cd ${remotePath} && bash ${bashScriptPath}`, true);

            // Wait for build to complete (simple delay - in production you'd want proper process monitoring)
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Step 2: Copy built files to local destination
            vscode.window.showInformationMessage(`📥 Copying files from ${remotePath} to ${localDestination}`);
            const files = await SSHFileManager.listRemoteDirectory(remotePath);
            
            for (const [filename, fileType] of files) {
              if (fileType === vscode.FileType.File) {
                const remoteFile = `${remotePath}/${filename}`;
                try {
                  await SSHFileManager.copyFileFromRemote(remoteFile, filename);
                } catch (error) {
                  // Continue copying other files even if one fails
                  console.log(`Failed to copy ${filename}: ${error}`);
                }
              }
            }

            await HuyfiveConfig.addToDownloadHistory(remotePath);

            // Step 3: Run local application
            vscode.window.showInformationMessage(`🚀 Running local application: ${localAppPath}`);
            const { exec } = require('child_process');
            
            exec(localAppPath, (error: any) => {
              if (error && error.code !== 0) {
                vscode.window.showErrorMessage(`Application exited with error: ${error.message}`);
              }
            });

            vscode.window.showInformationMessage('✅ Build and run completed successfully!');
          } catch (error: any) {
            vscode.window.showErrorMessage(`Failed during build and run: ${error.message}`);
          }
        }
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  });

  // Open settings panel command
  const openSettingsDisposable = vscode.commands.registerCommand('huyfive.openSettings', () => {
    HuyfiveSettingsPanel.createOrShow();
  });

  context.subscriptions.push(buildAndRunDisposable, listFilesDisposable, openSettingsDisposable);
}

export function deactivate() {
  console.log('Extension "huyfive" is now deactivated!');
}
