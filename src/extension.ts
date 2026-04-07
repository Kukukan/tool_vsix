import * as vscode from 'vscode';
import * as child_process from 'child_process';
import { SSHFileManager } from './sshFileManager';
import { HuyfiveTreeDataProvider } from './treeView';
import { HuyfiveConfig } from './config';
import { HuyfiveSettingsPanel } from './settingsPanel';

// Global output channel for logging operations
let outputChannel: vscode.OutputChannel;

/**
 * Log message to output channel
 * @param message Message to log
 */
function log(message: string): void {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  outputChannel.appendLine(`[${timestamp}] ${message}`);
}

export function activate(context: vscode.ExtensionContext) {
  // Create output channel
  outputChannel = vscode.window.createOutputChannel('Huyfive Operations');
  log('Extension "huyfive" activated!');

  // Register tree view provider
  const treeDataProvider = new HuyfiveTreeDataProvider();
  vscode.window.registerTreeDataProvider('huyfive.operations', treeDataProvider);

  /**
   * Command: List files in a remote or local directory
   * Displays all files and folders in the specified path
   */
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

      log(`Listing files in: ${dirPath}`);
      await HuyfiveConfig.setRemotePath(dirPath);
      const files = await SSHFileManager.listDirectory(dirPath);
      log(`Found ${files.length} items in ${dirPath}`);
      const fileList = files
        .map(([name, fileType]) => {
          const icon = fileType === vscode.FileType.Directory ? '📁' : '📄';
          return `${icon} ${name}`;
        })
        .join('\n');
      vscode.window.showInformationMessage(`Files in ${dirPath}:\n${fileList}`, { modal: true });
    } catch (error: any) {
      log(`Error listing files: ${error.message}`);
      vscode.window.showErrorMessage(`Failed to list files: ${error.message}`);
    }
  });

  /**
   * Command: Build on remote host, copy files locally, and run application
   * Executes build script with timeout, copies files in parallel, and launches app
   */
  const buildAndRunDisposable = vscode.commands.registerCommand('huyfive.buildAndRun', async () => {
    try {
      const localDestination = HuyfiveConfig.getLocalDestination()?.trim();
      const localAppPath = HuyfiveConfig.getLocalAppPath()?.trim();
      const remotePath = HuyfiveConfig.getRemotePath()?.trim();

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Building and running application...',
          cancellable: true,
        },
        async (progress, token) => {
          // Step 1: Run build script with timeout
          progress.report({ increment: 0, message: 'Running build script...' });

          // Check for cancellation
          if (token.isCancellationRequested) {
            vscode.window.showWarningMessage('Build and run cancelled by user');
            return;
          }

          // Step 2: Copy files in parallel
          progress.report({ increment: 30, message: `Copying files from ${remotePath}...` });
          log(`Starting file copy from ${remotePath} to ${localDestination}`);
          try {
            const files = await SSHFileManager.listDirectory(remotePath);
            const filesToCopy = files.filter(([_, fileType]) => fileType === vscode.FileType.File);
            log(`Found ${filesToCopy.length} files to copy`);

            if (filesToCopy.length > 0) {
              const copyResults = await Promise.allSettled(
                filesToCopy.map(([filename]) =>
                  SSHFileManager.copyFileFromRemote(`${remotePath}/${filename}`, filename)
                )
              );

              const failed = copyResults.filter((r) => r.status === 'rejected');
              if (failed.length > 0) {
                const failedNames = filesToCopy
                  .filter((_, i) => copyResults[i].status === 'rejected')
                  .map(([name]) => name)
                  .join(', ');
                log(`Failed to copy ${failed.length} file(s): ${failedNames}`);
                vscode.window.showWarningMessage(`⚠️ Failed to copy ${failed.length} file(s): ${failedNames}`);
              } else {
                log(`All files copied successfully`);
              }
            }
          } catch (copyError: any) {
            log(`File copy error: ${copyError.message}`);
            vscode.window.showErrorMessage(`File copy error: ${copyError.message}`);
            return;
          }

          await HuyfiveConfig.addToDownloadHistory(remotePath);

          // Check for cancellation
          if (token.isCancellationRequested) {
            log(`Build and run cancelled by user`);
            vscode.window.showWarningMessage('Build and run cancelled by user');
            return;
          }

          // Step 3: Run local app
          progress.report({ increment: 60, message: `Running application: ${localAppPath}...` });
          log(`Launching application: ${localAppPath}`);
          try {
            child_process.exec(localAppPath, (error: any) => {
              if (error && error.code !== 0) {
                log(`Application exited with code ${error.code}`);
                vscode.window.showErrorMessage(`Application exited with code ${error.code}`);
              } else {
                log(`Application completed successfully`);
              }
            });
          } catch (appError: any) {
            log(`Failed to start application: ${appError.message}`);
            vscode.window.showErrorMessage(`Failed to start application: ${appError.message}`);
            return;
          }

          progress.report({ increment: 100, message: 'Complete!' });
          log(`✅ Build and run completed successfully!`);
          vscode.window.showInformationMessage('✅ Build and run completed successfully!');
        }
      );
    } catch (error: any) {
      log(`Unexpected error: ${error.message}`);
      vscode.window.showErrorMessage(`Unexpected error: ${error.message}`);
    }
  });

  // Command: open settings panel
  const openSettingsDisposable = vscode.commands.registerCommand('huyfive.openSettings', () => {
    log(`Opening settings panel`);
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

      log(`Executing custom command: ${command}`);
      outputChannel.show();
      const terminal = vscode.window.createTerminal({
        name: 'Huyfive Custom Command',
        isTransient: true,
        location: vscode.TerminalLocation.Panel,
      });
      terminal.sendText(command, true);
      terminal.show();
      log(`Terminal created and command sent`);
      vscode.window.showInformationMessage(`📟 Executing: ${command}`);
    } catch (error: any) {
      log(`Failed to run command: ${error.message}`);
      vscode.window.showErrorMessage(`Failed to run command: ${error.message}`);
    }
  });

  context.subscriptions.push(listFilesDisposable, buildAndRunDisposable, openSettingsDisposable, runCustomCommandDisposable);
}

export function deactivate() {}