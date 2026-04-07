import * as vscode from 'vscode';

/**
 * Configuration management for Huyfive extension
 * Stores and retrieves settings from VS Code global configuration
 */
export class HuyfiveConfig {
  private static readonly CONFIG_SECTION = 'huyfive';

  // --- Validation methods ---
  
  /**
   * Validate a port number
   * @param value Port number as string
   * @returns true if valid port (1-65535), false otherwise
   */
  static isValidPort(value: string): boolean {
    const port = parseInt(value, 10);
    return /^\d+$/.test(value) && port > 0 && port < 65536;
  }

  /**
   * Validate a file path (non-empty)
   * @param value File path as string
   * @returns true if path is non-empty, false otherwise
   */
  static isValidPath(value: string): boolean {
    return value?.trim().length > 0;
  }

  /**
   * Validate SSH host address
   * @param value Host address or IP
   * @returns true if valid hostname/IP format, false otherwise
   */
  static isValidHost(value: string): boolean {
    const hostRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$|^(\d{1,3}\.){3}\d{1,3}$/;
    return hostRegex.test(value.trim());
  }

  // --- Existing getters/setters ---
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
      // Keep only last 50 items
      if (history.length > 50) {
        history.shift();
      }
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
    return this.get<string>('port', '22');
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

  // --- Build mode (Flash/User) ---
  static getBuildMode(): 'flash' | 'user' {
    return this.get<'flash' | 'user'>('buildMode', 'user');
  }
  static setBuildMode(value: 'flash' | 'user'): Thenable<void> {
    return this.set('buildMode', value);
  }

  // --- Selected COM ports (Debug and Flash) ---
  static getDebugComPort(): string {
    return this.get<string>('debugComPort', '');
  }
  static setDebugComPort(value: string): Thenable<void> {
    return this.set('debugComPort', value);
  }

  static getFlashComPort(): string {
    return this.get<string>('flashComPort', '');
  }
  static setFlashComPort(value: string): Thenable<void> {
    return this.set('flashComPort', value);
  }

  // --- Saved configurations ---
  /**
   * Save current configuration with a name
   * @param configName Name for this configuration
   */
  static async saveConfiguration(configName: string): Promise<void> {
    const configs = this.getSavedConfigurations();
    const config = {
      name: configName,
      timestamp: new Date().toISOString(),
      host: this.getHost(),
      port: this.getPort(),
      repoPath: this.getRepoPath(),
      remotePath: this.getRemotePath(),
      localDestination: this.getLocalDestination(),
      localAppPath: this.getLocalAppPath(),
      buildMode: this.getBuildMode(),
      debugComPort: this.getDebugComPort(),
      flashComPort: this.getFlashComPort(),
    };
    configs[configName] = config;
    await this.set('savedConfigurations', configs);
  }

  /**
   * Get all saved configurations
   */
  static getSavedConfigurations(): { [key: string]: any } {
    return this.get<{ [key: string]: any }>('savedConfigurations', {});
  }

  /**
   * Load a saved configuration by name
   * @param configName Name of configuration to load
   */
  static async loadConfiguration(configName: string): Promise<boolean> {
    const configs = this.getSavedConfigurations();
    const config = configs[configName];
    if (!config) return false;

    await this.setHost(config.host);
    await this.setPort(config.port);
    await this.setRepoPath(config.repoPath);
    await this.setRemotePath(config.remotePath);
    await this.setLocalDestination(config.localDestination);
    await this.setLocalAppPath(config.localAppPath);
    if (config.buildMode) {
      await this.setBuildMode(config.buildMode);
    }
    // Load COM ports (new format) or migrate from old format
    if (config.debugComPort) {
      await this.setDebugComPort(config.debugComPort);
    }
    if (config.flashComPort) {
      await this.setFlashComPort(config.flashComPort);
    }
    // Backward compatibility: if old selectedComPort exists, use it for both
    if (config.selectedComPort && !config.debugComPort && !config.flashComPort) {
      await this.setDebugComPort(config.selectedComPort);
      await this.setFlashComPort(config.selectedComPort);
    }
    return true;
  }

  /**
   * Delete a saved configuration
   * @param configName Name of configuration to delete
   */
  static async deleteConfiguration(configName: string): Promise<void> {
    const configs = this.getSavedConfigurations();
    const configsCopy = { ...configs };
    delete configsCopy[configName];
    await this.set('savedConfigurations', configsCopy);
  }
  /**
   * Get a configuration value with default fallback
   * @param key Configuration key
   * @param defaultValue Default value if key not found
   * @returns Configuration value or default
   */
  private static get<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<T>(key, defaultValue);
  }

  /**
   * Set a configuration value globally
   * @param key Configuration key
   * @param value Value to set
   */
  private static async set<T>(key: string, value: T): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }
}