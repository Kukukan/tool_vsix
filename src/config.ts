import * as vscode from 'vscode';

export class HuyfiveConfig {
  private static CONFIG_SECTION = 'huyfive';

  static getRemotePath(): string {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .get<string>('remotePath') || '';
  }

  static setRemotePath(path: string): Thenable<void> {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .update('remotePath', path, vscode.ConfigurationTarget.Global);
  }

  static getLocalDestination(): string {
    const dest = vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .get<string>('localDestination') || '';
    
    if (dest && !dest.startsWith('/') && !dest.match(/^[a-zA-Z]:/)) {
      // Resolve relative paths to workspace root
      const folders = vscode.workspace.workspaceFolders;
      if (folders && folders.length > 0) {
        return vscode.Uri.joinPath(folders[0].uri, dest).fsPath;
      }
    }
    return dest;
  }

  static setLocalDestination(path: string): Thenable<void> {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .update('localDestination', path, vscode.ConfigurationTarget.Global);
  }

  static getAutoDownloadEnabled(): boolean {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .get<boolean>('autoDownload') || false;
  }

  static getDownloadHistory(): string[] {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .get<string[]>('downloadHistory') || [];
  }

  static addToDownloadHistory(filePath: string): Thenable<void> {
    const history = this.getDownloadHistory();
    const updated = [filePath, ...history.filter(p => p !== filePath)].slice(0, 10); // Keep last 10
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .update('downloadHistory', updated, vscode.ConfigurationTarget.Global);
  }

  static clearDownloadHistory(): Thenable<void> {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .update('downloadHistory', [], vscode.ConfigurationTarget.Global);
  }

  static getBashScriptPath(): string {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .get<string>('bashScriptPath') || 'build.sh';
  }

  static setBashScriptPath(path: string): Thenable<void> {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .update('bashScriptPath', path, vscode.ConfigurationTarget.Global);
  }

  static getLocalAppPath(): string {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .get<string>('localAppPath') || '';
  }

  static setLocalAppPath(path: string): Thenable<void> {
    return vscode.workspace
      .getConfiguration(this.CONFIG_SECTION)
      .update('localAppPath', path, vscode.ConfigurationTarget.Global);
  }
}
