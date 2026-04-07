import * as vscode from 'vscode';
import { HuyfiveConfig } from './config';
import { SSHFileManager } from './sshFileManager';
import { ComPortManager } from './comPortManager';

export class HuyfiveSettingsPanel {
  public static currentPanel: HuyfiveSettingsPanel | undefined;

  public readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static async createOrShow() {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (HuyfiveSettingsPanel.currentPanel) {
      HuyfiveSettingsPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Auto-populate remote info if not already set
    const remoteInfo = SSHFileManager.getRemoteInfo();
    if (remoteInfo) {
      if (remoteInfo.host && !HuyfiveConfig.getHost()) {
        await HuyfiveConfig.setHost(remoteInfo.host);
      }
      if (remoteInfo.port && !HuyfiveConfig.getPort()) {
        await HuyfiveConfig.setPort(remoteInfo.port);
      }
      if (remoteInfo.repoPath && !HuyfiveConfig.getRepoPath()) {
        await HuyfiveConfig.setRepoPath(remoteInfo.repoPath);
      }
    }

    const panel = vscode.window.createWebviewPanel(
      'huyfiveSettings',
      'Huyfive Settings',
      column || vscode.ViewColumn.One,
      { enableScripts: true }
    );

    HuyfiveSettingsPanel.currentPanel = new HuyfiveSettingsPanel(panel);
  }

  public static revive(panel: vscode.WebviewPanel) {
    HuyfiveSettingsPanel.currentPanel = new HuyfiveSettingsPanel(panel);
  }

  private constructor(panel: vscode.WebviewPanel) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      (message) => this._handleMessage(message),
      null,
      this._disposables
    );
    this._update();
  }

  public dispose() {
    HuyfiveSettingsPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) x.dispose();
    }
  }

  private async _handleMessage(message: any) {
    switch (message.command) {
      case 'saveSettings':
        await HuyfiveConfig.setLocalDestination(message.localDestination);
        await HuyfiveConfig.setLocalAppPath(message.localAppPath);
        await HuyfiveConfig.setHost(message.host);
        await HuyfiveConfig.setPort(message.port);
        await HuyfiveConfig.setRepoPath(message.repoPath);
        await HuyfiveConfig.setBuildMode(message.buildMode || 'user');
        if (message.debugComPort) {
          await HuyfiveConfig.setDebugComPort(message.debugComPort);
        }
        if (message.flashComPort) {
          await HuyfiveConfig.setFlashComPort(message.flashComPort);
        }

        // Save configuration if name is provided
        if (message.configName) {
          await HuyfiveConfig.saveConfiguration(message.configName);
          vscode.window.showInformationMessage(`✓ Configuration "${message.configName}" saved`);
        } else {
          vscode.window.showInformationMessage('Settings saved successfully!');
        }

        this._update();
        break;
      case 'getSettings':
        this._sendSettings();
        break;
      case 'refreshRemote':
        const remoteInfo = SSHFileManager.getRemoteInfo();
        if (remoteInfo) {
          await HuyfiveConfig.setHost(remoteInfo.host);
          await HuyfiveConfig.setPort(remoteInfo.port);
          await HuyfiveConfig.setRepoPath(remoteInfo.repoPath);
          this._update();
          this._panel.webview.postMessage({ command: 'refreshComplete', success: true });
        } else {
          this._panel.webview.postMessage({ command: 'refreshComplete', success: false });
        }
        break;
      case 'loadConfig':
        const configToLoad = message.configName;
        if (configToLoad) {
          const success = await HuyfiveConfig.loadConfiguration(configToLoad);
          if (success) {
            this._update();
            vscode.window.showInformationMessage(`✓ Configuration "${configToLoad}" loaded`);
          } else {
            vscode.window.showErrorMessage(`Failed to load configuration "${configToLoad}"`);
          }
        }
        break;
      case 'deleteConfig':
        const configToDelete = message.configName;
        if (configToDelete) {
          await HuyfiveConfig.deleteConfiguration(configToDelete);
          this._update();
          vscode.window.showInformationMessage(`✓ Configuration "${configToDelete}" deleted`);
        }
        break;
      case 'getComPorts':
        const ports = await ComPortManager.getAvailablePorts();
        const portsForUI = ports.map(port => ({
          path: port.path,
          displayName: ComPortManager.formatPortForDisplay(port)
        }));
        this._panel.webview.postMessage({
          command: 'comPortsReceived',
          ports: portsForUI,
          debugComPort: HuyfiveConfig.getDebugComPort(),
          flashComPort: HuyfiveConfig.getFlashComPort()
        });
        break;
    }
  }

  private _sendSettings() {
    this._panel.webview.postMessage({
      command: 'settings',
      localDestination: HuyfiveConfig.getLocalDestination(),
      downloadHistory: HuyfiveConfig.getDownloadHistory(),
      localAppPath: HuyfiveConfig.getLocalAppPath(),
      host: HuyfiveConfig.getHost(),
      port: HuyfiveConfig.getPort(),
      repoPath: HuyfiveConfig.getRepoPath(),
      buildMode: HuyfiveConfig.getBuildMode(),
      savedConfigurations: HuyfiveConfig.getSavedConfigurations(),
    });
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview(): string {
    const localDestination = HuyfiveConfig.getLocalDestination();
    const downloadHistory = HuyfiveConfig.getDownloadHistory();
    const localAppPath = HuyfiveConfig.getLocalAppPath();
    const host = HuyfiveConfig.getHost();
    const port = HuyfiveConfig.getPort();
    const repoPath = HuyfiveConfig.getRepoPath();
    const buildMode = HuyfiveConfig.getBuildMode() || 'user';

    const historyItems = downloadHistory
      .map((path) => `<div class="history-item">${this._escapeHtml(path)}</div>`)
      .join('');

    const savedConfigs = HuyfiveConfig.getSavedConfigurations();
    const configList = Object.keys(savedConfigs).length > 0
      ? Object.keys(savedConfigs)
          .sort((a, b) => new Date(savedConfigs[b].timestamp).getTime() - new Date(savedConfigs[a].timestamp).getTime())
          .map(name => `<div class="config-item" data-config="${this._escapeHtml(name)}">
            <span class="config-name">${this._escapeHtml(name)}</span>
            <div class="config-actions">
              <button class="config-btn load-btn" type="button">Load</button>
              <button class="config-btn delete-btn" type="button">×</button>
            </div>
          </div>`)
          .join('')
      : '<div class="empty-config">No saved configurations yet</div>';

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Huyfive Settings</title>
      <style>
        :root {
          --vscode-foreground: #cccccc;
          --vscode-background: #1e1e1e;
          --vscode-editor-background: #252526;
          --vscode-button-background: #0e639c;
          --vscode-button-hoverBackground: #1177bb;
          --vscode-input-background: #3c3c3c;
          --vscode-input-foreground: #cccccc;
          --vscode-input-border: #555555;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          color: var(--vscode-foreground);
          background: var(--vscode-background);
          padding: 20px;
        }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 30px; }
        .setting-group {
          margin-bottom: 25px;
          background: var(--vscode-editor-background);
          padding: 15px;
          border-radius: 4px;
          border: 1px solid var(--vscode-input-border);
        }
        .setting-group.remote-group {
          padding: 12px;
          margin-bottom: 20px;
          background: rgba(14, 99, 156, 0.15);
          border: 1px solid #0e639c;
        }
        .remote-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .remote-group-header h3 {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
          color: #0e639c;
        }
        .refresh-btn {
          width: auto;
          padding: 4px 8px;
          font-size: 11px;
          background: #0e639c;
          border: none;
          color: white;
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .refresh-btn:hover {
          background: #1177bb;
        }
        .remote-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .remote-field-group {
          display: flex;
          flex-direction: column;
        }
        .remote-field-group label {
          font-size: 11px;
          font-weight: 500;
          margin-bottom: 4px;
          color: #858585;
        }
        .remote-field-group input {
          padding: 6px 8px;
          font-size: 12px;
        }
        .setting-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .setting-group input {
          width: 100%;
          padding: 8px 12px;
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Courier New', monospace;
        }
        .setting-group input:focus {
          outline: none;
          border-color: #007acc;
          box-shadow: 0 0 0 1px #007acc;
        }
        .setting-description {
          font-size: 12px;
          color: #858585;
          margin-top: 5px;
        }
        .buttons {
          display: flex;
          gap: 10px;
          margin-top: 30px;
        }
        button {
          flex: 1;
          padding: 10px 16px;
          background: var(--vscode-button-background);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        button:hover { background: var(--vscode-button-hoverBackground); }
        button.secondary {
          background: transparent;
          color: var(--vscode-button-background);
          border: 1px solid var(--vscode-button-background);
        }
        button.secondary:hover { background: rgba(14, 99, 156, 0.1); }
        .history-section { margin-top: 30px; }
        .history-section h3 { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
        .history-list {
          background: var(--vscode-editor-background);
          padding: 12px;
          border-radius: 4px;
          border: 1px solid var(--vscode-input-border);
          max-height: 200px;
          overflow-y: auto;
        }
        .history-item {
          padding: 6px 8px;
          background: var(--vscode-input-background);
          margin-bottom: 5px;
          border-radius: 3px;
          font-size: 12px;
          font-family: 'Courier New', monospace;
          color: #858585;
          word-break: break-all;
        }
        .empty-history { color: #858585; font-size: 12px; font-style: italic; padding: 8px; text-align: center; }
        .success-message {
          display: none;
          padding: 10px 12px;
          background: #1a4d2e;
          color: #4caf50;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 15px;
          border-left: 3px solid #4caf50;
        }
        .success-message.show { display: block; }
        .script-generate-section {
          padding: 15px;
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid #4caf50;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .build-mode-section {
          padding: 15px;
          background: rgba(31, 111, 235, 0.08);
          border: 1px solid #1f6feb;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .build-mode-section h3 {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #1f6feb;
        }
        .build-mode-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .mode-option {
          padding: 8px 12px;
          border: 1px solid #1f6feb;
          border-radius: 3px;
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          cursor: pointer;
          font-size: 12px;
          text-align: center;
          transition: all 0.2s;
        }
        .mode-option.active {
          background: #1f6feb;
          color: #ffffff;
          border-color: #1f6feb;
        }
        .config-section {
          padding: 15px;
          background: rgba(201, 209, 217, 0.08);
          border: 1px solid #c9d1d9;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .config-section input {
          width: 100%;
          padding: 8px 12px;
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          font-size: 13px;
        }
        .config-section input:focus {
          outline: none;
          border-color: #007acc;
          box-shadow: 0 0 0 1px #007acc;
        }
        .configs-section {
          padding: 15px;
          background: rgba(201, 209, 217, 0.08);
          border: 1px solid #c9d1d9;
          border-radius: 4px;
          margin-bottom: 20px;
          display: none;
        }
        .configs-section.visible {
          display: block;
        }
        .configs-section h3 {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #c9d1d9;
        }
        .config-list {
          max-height: 200px;
          overflow-y: auto;
          background: var(--vscode-input-background);
          border-radius: 3px;
          padding: 8px;
        }
        .config-item {
          padding: 8px;
          margin-bottom: 4px;
          background: var(--vscode-editor-background);
          border-radius: 3px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          border-left: 2px solid #1f6feb;
        }
        .config-name {
          flex: 1;
          font-weight: 500;
        }
        .config-actions {
          display: flex;
          gap: 4px;
        }
        .config-btn {
          padding: 4px 8px;
          font-size: 11px;
          background: #1f6feb;
          color: white;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .config-btn:hover {
          background: #388bfd;
        }
        .config-btn.delete-btn {
          padding: 4px 6px;
          font-weight: bold;
          background: #da3633;
        }
        .config-btn.delete-btn:hover {
          background: #f85149;
        }
        .empty-config {
          color: #858585;
          font-size: 11px;
          font-style: italic;
          padding: 8px;
          text-align: center;
        }
        .mode-fields {
          margin-top: 12px;
          display: none;
        }
        .mode-fields.visible {
          display: block;
        }
        .mode-fields .setting-group {
          margin-bottom: 12px;
          background: var(--vscode-input-background);
        }
        .com-port-select {
          width: 100%;
          padding: 8px 12px;
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          font-size: 13px;
        }
        .com-port-select:focus {
          outline: none;
          border-color: #007acc;
          box-shadow: 0 0 0 1px #007acc;
        }

</style>
    </head>
    <body>
      <div class="container">
        <h1>⚙️ Huyfive Settings</h1>
        <div class="success-message" id="successMessage">✓ Settings saved successfully!</div>
        <form id="settingsForm">
          <div class="config-section">
            <input type="text" id="configName" placeholder="Save configuration as..." />
          </div>
          <div class="setting-group remote-group">
            <div class="remote-group-header">
              <h3>🔗 Remote Connection</h3>
              <button type="button" class="refresh-btn" id="refreshBtn">🔄 Refresh</button>
            </div>
            <div class="remote-fields">
              <div class="remote-field-group">
                <label for="host">Host</label>
                <input type="text" id="host" placeholder="example.com" value="${this._escapeHtml(host)}" />
              </div>
              <div class="remote-field-group">
                <label for="port">Port</label>
                <input type="text" id="port" placeholder="22" value="${this._escapeHtml(port)}" />
              </div>
            </div>
            <div class="remote-field-group" style="margin-top: 8px;">
              <label for="repoPath">Repository Path</label>
              <input type="text" id="repoPath" placeholder="/home/user/project" value="${this._escapeHtml(repoPath)}" />
            </div>
          </div>
          <div class="build-mode-section">
            <h3>🔧 Build Mode</h3>
            <div class="build-mode-selector">
              <button type="button" class="mode-option ${buildMode === 'flash' ? 'active' : ''}" data-mode="flash">
                ⚡ Flash (COM)
              </button>
              <button type="button" class="mode-option ${buildMode === 'user' ? 'active' : ''}" data-mode="user">
                👤 User Mode
              </button>
            </div>
            <input type="hidden" id="buildMode" value="${buildMode}" />
            <div class="mode-fields ${buildMode === 'flash' ? 'visible' : ''}" id="flashFields">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="setting-group">
                  <label for="debugComPort">Debug COM Port</label>
                  <select id="debugComPort" class="com-port-select">
                    <option value="">-- Detecting ports --</option>
                  </select>
                  <div class="setting-description">COM port for debugging</div>
                </div>
                <div class="setting-group">
                  <label for="flashComPort">Flash COM Port</label>
                  <select id="flashComPort" class="com-port-select">
                    <option value="">-- Detecting ports --</option>
                  </select>
                  <div class="setting-description">COM port for flashing</div>
                </div>
              </div>
              <div class="setting-group">
                <label for="localDestination">Local Destination</label>
                <input type="text" id="localDestination" placeholder="./downloads" value="${this._escapeHtml(localDestination)}" />
                <div class="setting-description">Local folder to save downloaded files</div>
              </div>
            </div>
            <div class="mode-fields ${buildMode === 'user' ? 'visible' : ''}" id="userFields">
              <div class="setting-group">
                <label for="localDestination">Local Destination</label>
                <input type="text" id="localDestination" placeholder="./downloads" value="${this._escapeHtml(localDestination)}" />
                <div class="setting-description">Local folder to save downloaded files</div>
              </div>
              <div class="setting-group">
                <label for="localAppPath">Local Application Path</label>
                <input type="text" id="localAppPath" placeholder="C:\\Program Files\\MyApp\\app.exe" value="${this._escapeHtml(localAppPath)}" />
                <div class="setting-description">Application path to run locally after build</div>
              </div>
            </div>
          </div>
          <div class="buttons">
            <button type="submit">Save Settings</button>
            <button type="button" class="secondary" id="configsBtn">📋 Show Configurations</button>
          </div>
        </form>
        <div class="configs-section" id="configsSection">
          <h3>💾 Saved Configurations</h3>
          <div class="config-list">
            ${configList}
          </div>
        </div>
        <div class="history-section">
          <h3>📋 Download History</h3>
          <div class="history-list">
            ${downloadHistory.length > 0 ? historyItems : '<div class="empty-history">No downloads yet</div>'}
          </div>
        </div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        const state = vscode.getState() || {};
        let configsSectionVisible = state.configsSectionVisible || false;
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
          e.preventDefault();
          vscode.postMessage({
            command: 'saveSettings',
            localDestination: document.getElementById('localDestination').value,
            localAppPath: document.getElementById('localAppPath').value || '',
            host: document.getElementById('host').value,
            port: document.getElementById('port').value,
            repoPath: document.getElementById('repoPath').value,
            buildMode: document.getElementById('buildMode').value,
            debugComPort: document.getElementById('debugComPort')?.value || '',
            flashComPort: document.getElementById('flashComPort')?.value || '',
            configName: document.getElementById('configName').value.trim() || null
          });
          const msg = document.getElementById('successMessage');
          msg.classList.add('show');
          setTimeout(() => msg.classList.remove('show'), 2000);
        });

        document.getElementById('configsBtn').addEventListener('click', (e) => {
          e.preventDefault();
          const configsSection = document.getElementById('configsSection');
          configsSection.classList.toggle('visible');
          configsSectionVisible = configsSection.classList.contains('visible');
          vscode.setState({ configsSectionVisible });
        });

        document.getElementById('refreshBtn').addEventListener('click', (e) => {
          e.preventDefault();
          const btn = document.getElementById('refreshBtn');
          const originalText = btn.textContent;
          btn.textContent = '⏳ Detecting...';
          btn.disabled = true;
          vscode.postMessage({ command: 'refreshRemote' });
        });

        window.addEventListener('message', (event) => {
          const message = event.data;
          if (message.command === 'refreshComplete') {
            const btn = document.getElementById('refreshBtn');
            btn.disabled = false;
            if (message.success) {
              btn.textContent = '✓ Detected';
              setTimeout(() => { btn.textContent = '🔄 Refresh'; }, 1500);
            } else {
              btn.textContent = '✗ Not Remote';
              setTimeout(() => { btn.textContent = '🔄 Refresh'; }, 1500);
            }
          }
          if (message.command === 'comPortsReceived') {
            const debugComPortSelect = document.getElementById('debugComPort');
            const flashComPortSelect = document.getElementById('flashComPort');

            // Function to populate a COM port dropdown
            const populateComPort = (selectElement, selectedValue) => {
              selectElement.innerHTML = '';
              if (message.ports && message.ports.length > 0) {
                message.ports.forEach(port => {
                  const option = document.createElement('option');
                  option.value = port.path;
                  option.textContent = port.displayName;
                  selectElement.appendChild(option);
                });
                // Set previously selected port if available
                if (selectedValue && document.querySelector('#' + selectElement.id + ' option[value="' + selectedValue + '"]')) {
                  selectElement.value = selectedValue;
                }
              } else {
                selectElement.innerHTML = '<option value="">-- No COM ports found --</option>';
              }
            };

            populateComPort(debugComPortSelect, message.debugComPort);
            populateComPort(flashComPortSelect, message.flashComPort);
          }
        });

        // Build mode selector
        document.querySelectorAll('.mode-option').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.mode-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.mode;
            document.getElementById('buildMode').value = mode;

            // Show/hide mode-specific fields
            document.getElementById('flashFields').classList.toggle('visible', mode === 'flash');
            document.getElementById('userFields').classList.toggle('visible', mode === 'user');

            // Request COM ports if Flash mode selected
            if (mode === 'flash') {
              vscode.postMessage({ command: 'getComPorts' });
            }
          });
        });

        // Load configuration buttons
        document.querySelectorAll('.config-item').forEach(item => {
          const configName = item.dataset.config;
          const loadBtn = item.querySelector('.load-btn');
          const deleteBtn = item.querySelector('.delete-btn');

          if (loadBtn) {
            loadBtn.addEventListener('click', (e) => {
              e.preventDefault();
              vscode.postMessage({ command: 'loadConfig', configName });
            });
          }

          if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              vscode.postMessage({ command: 'deleteConfig', configName });
            });
          }
        });

        // Request COM ports if Flash mode is active on load
        if (document.getElementById('buildMode').value === 'flash') {
          vscode.postMessage({ command: 'getComPorts' });
        }

        // Restore configurations section visible state after update
        if (configsSectionVisible) {
          const configsSection = document.getElementById('configsSection');
          if (configsSection) {
            configsSection.classList.add('visible');
          }
        }
      </script>
    </body>
    </html>`;
  }

  private _escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}