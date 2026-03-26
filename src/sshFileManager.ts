import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SSHFileManager {
  /**
   * Check if currently connected to a remote SSH host
   */
  static isConnectedToSSH(): boolean {
    const remoteAuthority = vscode.env.remoteName;
    return remoteAuthority ? remoteAuthority.includes('ssh-remote') : false;
  }

  /**
   * Get the remote authority string
   */
  static getRemoteAuthority(): string | undefined {
    return vscode.env.remoteName;
  }

  /**
   * Parse SSH authority to get connection details
   * Example: ssh-remote+user@host.com:22 -> { user: 'user', host: 'host.com', port: 22 }
   */
  static parseSSHAuthority(authority: string): { user: string; host: string; port: number } {
    // Remove ssh-remote+ prefix
    const connection = authority.replace('ssh-remote+', '');
    
    // Extract user@host:port
    const match = connection.match(/^([^@]+)@([^:]+)(?::(\d+))?$/);
    if (!match) {
      throw new Error(`Invalid SSH authority format: ${authority}`);
    }

    const [, user, host, port] = match;
    return {
      user,
      host,
      port: port ? parseInt(port) : 22,
    };
  }

  /**
   * Copy a file from remote SSH host to local using SCP
   */
  static async copyFileFromRemote(remoteFilePath: string, localFileName?: string): Promise<vscode.Uri> {
    const remoteAuthority = this.getRemoteAuthority();
    if (!remoteAuthority) {
      throw new Error('Not connected to a remote host');
    }

    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      throw new Error('No workspace folder open');
    }

    const destFolder = folders[0];
    const fileName = localFileName || remoteFilePath.split('/').pop() || 'copied-file';
    const destPath = vscode.Uri.joinPath(destFolder.uri, fileName);

    try {
      // Parse SSH connection details
      const sshDetails = this.parseSSHAuthority(remoteAuthority);
      const remoteSource = `${sshDetails.user}@${sshDetails.host}:${remoteFilePath}`;
      
      // Build SCP command
      const scpCommand = `scp -P ${sshDetails.port} "${remoteSource}" "${destPath.fsPath}"`;

      // Execute SCP command
      const { stderr } = await execAsync(scpCommand);
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(`SCP error: ${stderr}`);
      }

      return destPath;
    } catch (error) {
      throw new Error(`Failed to copy file via SCP: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List files in a remote directory using SSH
   */
  static async listRemoteDirectory(remoteDir: string): Promise<[string, vscode.FileType][]> {
    const remoteAuthority = this.getRemoteAuthority();
    if (!remoteAuthority) {
      throw new Error('Not connected to a remote host');
    }

    try {
      // Parse SSH connection details
      const sshDetails = this.parseSSHAuthority(remoteAuthority);

      // Build SSH command to list directory
      const sshCommand = `ssh -p ${sshDetails.port} ${sshDetails.user}@${sshDetails.host} "ls -la ${remoteDir}"`;

      const { stdout } = await execAsync(sshCommand);
      
      // Parse ls output to get file information
      const lines = stdout.trim().split('\n').slice(1); // Skip header
      const files: [string, vscode.FileType][] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.split(/\s+/);
        const isDirectory = parts[0].startsWith('d');
        const fileName = parts.slice(8).join(' '); // Handle filenames with spaces

        if (fileName && fileName !== '.' && fileName !== '..') {
          const fileType = isDirectory ? vscode.FileType.Directory : vscode.FileType.File;
          files.push([fileName, fileType]);
        }
      }

      return files;
    } catch (error) {
      throw new Error(`Failed to list directory via SSH: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Read content from a remote file using SSH
   */
  static async readRemoteFile(remoteFilePath: string): Promise<string> {
    const remoteAuthority = this.getRemoteAuthority();
    if (!remoteAuthority) {
      throw new Error('Not connected to a remote host');
    }

    try {
      // Parse SSH connection details
      const sshDetails = this.parseSSHAuthority(remoteAuthority);

      // Build SSH command to read file
      const sshCommand = `ssh -p ${sshDetails.port} ${sshDetails.user}@${sshDetails.host} "cat ${remoteFilePath}"`;

      const { stdout } = await execAsync(sshCommand);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to read file via SSH: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Write content to a remote file using SSH (via echo piped to file)
   */
  static async writeRemoteFile(remoteFilePath: string, content: string): Promise<void> {
    const remoteAuthority = this.getRemoteAuthority();
    if (!remoteAuthority) {
      throw new Error('Not connected to a remote host');
    }

    try {
      // Parse SSH connection details
      const sshDetails = this.parseSSHAuthority(remoteAuthority);

      // Escape content for shell
      const escapedContent = content.replace(/"/g, '\\"').replace(/\$/g, '\\$');

      // Build SSH command to write file
      const sshCommand = `ssh -p ${sshDetails.port} ${sshDetails.user}@${sshDetails.host} "echo \\"${escapedContent}\\" > ${remoteFilePath}"`;

      await execAsync(sshCommand);
    } catch (error) {
      throw new Error(`Failed to write file via SSH: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
