import * as vscode from 'vscode';
import * as path from 'path';
import { HuyfiveConfig } from './config';

/**
 * Manages file operations for both remote SSH and local workspaces
 * Abstracts environment detection and provides unified file operations API
 */
export class SSHFileManager {
  /**
   * Detect if we are in a remote SSH workspace
   * @returns true if connected to remote SSH, false otherwise
   */
  public static isRemoteWorkspace(): boolean {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return workspaceFolder?.uri.scheme === 'vscode-remote';
  }

  /**
   * Extract connection information from current remote workspace URI
   * Auto-detects SSH host, port, and repository path from workspace
   * @returns Object with host, port, repoPath or null if not in remote workspace
   */
  public static getRemoteInfo(): { host: string; port: string; repoPath: string } | null {
    if (!this.isRemoteWorkspace()) return null;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return null;

    const uri = workspaceFolder.uri;
    const authority = uri.authority;
    // Authority format: 'ssh-remote+<host>:<port>' (port optional)
    // Example: 'ssh-remote+example.com:2222' or 'ssh-remote+example.com'
    const match = authority.match(/^ssh-remote\+([^:]+)(?::(\d+))?$/);
    if (match) {
      const host = match[1] || '';
      const port = match[2] || '22';
      const repoPath = uri.path; // The remote path inside the workspace
      return { host, port, repoPath };
    }
    return null;
  }

  /**
   * List files in a directory (remote or local)
   * @param dirPath Directory path to list
   * @returns Array of [filename, fileType] tuples
   * @throws Error if directory cannot be read
   */
  public static async listDirectory(dirPath: string): Promise<[string, vscode.FileType][]> {
    try {
      const uri = this._getUri(dirPath);
      const entries = await vscode.workspace.fs.readDirectory(uri);
      return entries;
    } catch (error) {
      throw new Error(`Failed to read directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Copy a file from remote or local source to local destination
   * Creates destination directory if it doesn't exist
   * @param remoteFilePath Source file path
   * @param localFileName Target filename in local destination
   * @throws Error if source doesn't exist or copy fails
   */
  public static async copyFileFromRemote(remoteFilePath: string, localFileName: string): Promise<void> {
    const localDestination = HuyfiveConfig.getLocalDestination();
    if (!localDestination || !localDestination.trim()) {
      throw new Error('Local destination not configured');
    }

    // Ensure local directory exists
    const localDirUri = vscode.Uri.file(localDestination);
    try {
      await vscode.workspace.fs.stat(localDirUri);
    } catch {
      // Directory doesn't exist, create it
      try {
        await vscode.workspace.fs.createDirectory(localDirUri);
      } catch (createError) {
        throw new Error(`Failed to create destination directory: ${createError}`);
      }
    }

    const sourceUri = this._getUri(remoteFilePath);
    const targetUri = vscode.Uri.file(path.join(localDestination, localFileName));

    try {
      await vscode.workspace.fs.copy(sourceUri, targetUri, { overwrite: true });
    } catch (copyError) {
      throw new Error(`Failed to copy file ${remoteFilePath} to ${localFileName}: ${copyError}`);
    }
  }

  /**
   * Helper to create a URI for both remote SSH and local paths
   * Detects environment and constructs appropriate URI scheme
   * @param filePath File path (absolute or relative)
   * @returns VS Code URI for the file
   * @throws Error if workspace folder is not available in remote mode
   */
  private static _getUri(filePath: string): vscode.Uri {
    if (this.isRemoteWorkspace()) {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder open - cannot access remote files');
      }
      // Ensure the path is absolute; if not, it's relative to workspace root
      const absolutePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
      return vscode.Uri.parse(`vscode-remote://${workspaceFolder.uri.authority}${absolutePath}`);
    } else {
      // Local workspace – treat path as local file path
      return vscode.Uri.file(filePath);
    }
  }
}