import * as vscode from 'vscode';
import * as path from 'path';
import { HuyfiveConfig } from './config';

export class SSHFileManager {
  // Detect if we are in a remote SSH workspace
  public static isRemoteWorkspace(): boolean {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return workspaceFolder?.uri.scheme === 'vscode-remote';
  }

  // Extract host, port, repo path from current remote workspace URI
  public static getRemoteInfo(): { host: string; port: string; repoPath: string } | null {
    if (!this.isRemoteWorkspace()) return null;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return null;

    const uri = workspaceFolder.uri;
    const authority = uri.authority;
    // Authority format: 'ssh-remote+<host>:<port>' (port optional)
    const match = authority.match(/^ssh-remote\+([^:]+)(?::(\d+))?$/);
    if (match) {
      const host = match[1] || '';
      const port = match[2] || '22';
      const repoPath = uri.path; // The remote path inside the workspace
      return { host, port, repoPath };
    }
    return null;
  }

  // List files in a directory (remote or local)
  public static async listDirectory(dirPath: string): Promise<[string, vscode.FileType][]> {
    try {
      const uri = this._getUri(dirPath);
      const entries = await vscode.workspace.fs.readDirectory(uri);
      return entries;
    } catch (error) {
      throw new Error(`Failed to read directory: ${error}`);
    }
  }

  // Copy a file from remote to local destination (works for both remote and local sources)
  public static async copyFileFromRemote(remoteFilePath: string, localFileName: string): Promise<void> {
    const localDestination = HuyfiveConfig.getLocalDestination();
    if (!localDestination) {
      throw new Error('Local destination not configured');
    }

    // Ensure local directory exists
    const localDirUri = vscode.Uri.file(localDestination);
    try {
      await vscode.workspace.fs.stat(localDirUri);
    } catch {
      await vscode.workspace.fs.createDirectory(localDirUri);
    }

    const sourceUri = this._getUri(remoteFilePath);
    const targetUri = vscode.Uri.file(path.join(localDestination, localFileName));

    await vscode.workspace.fs.copy(sourceUri, targetUri, { overwrite: true });
  }

  // Helper to create a URI that works for both remote and local paths
  private static _getUri(path: string): vscode.Uri {
    if (this.isRemoteWorkspace()) {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder open');
      }
      // Ensure the path is absolute; if not, it's relative to workspace root
      const absolutePath = path.startsWith('/') ? path : `/${path}`;
      return vscode.Uri.parse(`vscode-remote://${workspaceFolder.uri.authority}${absolutePath}`);
    } else {
      // Local workspace – treat path as local file path
      return vscode.Uri.file(path);
    }
  }
}