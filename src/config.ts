import * as vscode from 'vscode';

export class HuyfiveConfig {
  private static readonly CONFIG_SECTION = 'huyfive';

  // --- Existing getters/setters (add yours) ---
  static getRemotePath(): string {
    return this.get<string>('remotePath', '');
  }
  static setRemotePath(value: string): Thenable<void> {
    return this.set('remotePath', value);
  }

  static getLocalDestination(): string {
    return this.get<string>('localDestination', '');
  }
  static setLocalDestination(value: string): Thenable<void> {
    return this.set('localDestination', value);
  }

  static getBashScriptPath(): string {
    return this.get<string>('bashScriptPath', '');
  }
  static setBashScriptPath(value: string): Thenable<void> {
    return this.set('bashScriptPath', value);
  }

  static getLocalAppPath(): string {
    return this.get<string>('localAppPath', '');
  }
  static setLocalAppPath(value: string): Thenable<void> {
    return this.set('localAppPath', value);
  }

  static getDownloadHistory(): string[] {
    return this.get<string[]>('downloadHistory', []);
  }
  static async addToDownloadHistory(path: string): Promise<void> {
    const history = this.getDownloadHistory();
    if (!history.includes(path)) {
      history.push(path);
      await this.set('downloadHistory', history);
    }
  }

  // --- New methods for host, port, repoPath ---
  static getHost(): string {
    return this.get<string>('host', '');
  }
  static setHost(value: string): Thenable<void> {
    return this.set('host', value);
  }

  static getPort(): string {
    return this.get<string>('port', '');
  }
  static setPort(value: string): Thenable<void> {
    return this.set('port', value);
  }

  static getRepoPath(): string {
    return this.get<string>('repoPath', '');
  }
  static setRepoPath(value: string): Thenable<void> {
    return this.set('repoPath', value);
  }

  // --- Helpers ---
  private static get<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<T>(key, defaultValue);
  }

  private static async set<T>(key: string, value: T): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }
}