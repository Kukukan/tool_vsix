import * as vscode from 'vscode';
import { HuyfiveConfig } from './config';

export class HuyfiveSettingsPanel {
  public static currentPanel: HuyfiveSettingsPanel | undefined;

  public readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow() {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (HuyfiveSettingsPanel.currentPanel) {
      HuyfiveSettingsPanel.currentPanel._panel.reveal(column);
      return;
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
      if (x) {
        x.dispose();
      }
    }
  }

  private async _handleMessage(message: any) {
    switch (message.command) {
      case 'saveSettings':
        await HuyfiveConfig.setRemotePath(message.remotePath);
        await HuyfiveConfig.setLocalDestination(message.localDestination);
        await HuyfiveConfig.setBashScriptPath(message.bashScriptPath);
        await HuyfiveConfig.setLocalAppPath(message.localAppPath);
        vscode.window.showInformationMessage('Settings saved successfully!');
        this._update();
        break;
      case 'getSettings':
        this._sendSettings();
        break;
    }
  }

  private _sendSettings() {
    const remotePath = HuyfiveConfig.getRemotePath();
    const localDestination = HuyfiveConfig.getLocalDestination();
    const downloadHistory = HuyfiveConfig.getDownloadHistory();
    const bashScriptPath = HuyfiveConfig.getBashScriptPath();
    const localAppPath = HuyfiveConfig.getLocalAppPath();

    this._panel.webview.postMessage({
      command: 'settings',
      remotePath,
      localDestination,
      downloadHistory,
      bashScriptPath,
      localAppPath,
    });
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview(): string {
    const remotePath = HuyfiveConfig.getRemotePath();
    const localDestination = HuyfiveConfig.getLocalDestination();
    const downloadHistory = HuyfiveConfig.getDownloadHistory();
    const bashScriptPath = HuyfiveConfig.getBashScriptPath();
    const localAppPath = HuyfiveConfig.getLocalAppPath();

    const historyItems = downloadHistory
      .map((path) => `<div class="history-item">${this._escapeHtml(path)}</div>`)
      .join('');

    return `
      <!DOCTYPE html>
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

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: var(--vscode-foreground);
            background: var(--vscode-background);
            padding: 20px;
          }

          .container {
            max-width: 600px;
            margin: 0 auto;
          }

          h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 30px;
            color: var(--vscode-foreground);
          }

          .setting-group {
            margin-bottom: 25px;
            background: var(--vscode-editor-background);
            padding: 15px;
            border-radius: 4px;
            border: 1px solid var(--vscode-input-border);
          }

          .setting-group label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
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

          button:hover {
            background: var(--vscode-button-hoverBackground);
          }

          button.secondary {
            background: transparent;
            color: var(--vscode-button-background);
            border: 1px solid var(--vscode-button-background);
          }

          button.secondary:hover {
            background: rgba(14, 99, 156, 0.1);
          }

          .history-section {
            margin-top: 30px;
          }

          .history-section h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--vscode-foreground);
          }

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

          .history-item:last-child {
            margin-bottom: 0;
          }

          .empty-history {
            color: #858585;
            font-size: 12px;
            font-style: italic;
            padding: 8px;
            text-align: center;
          }

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

          .success-message.show {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚙️ Huyfive Settings</h1>

          <div class="success-message" id="successMessage">✓ Settings saved successfully!</div>

          <form id="settingsForm">
            <div class="setting-group">
              <label for="remotePath">Remote File Path</label>
              <input
                type="text"
                id="remotePath"
                placeholder="/home/user"
                value="${this._escapeHtml(remotePath)}"
              />
              <div class="setting-description">
                Default path for browsing files on the remote SSH host
              </div>
            </div>

            <div class="setting-group">
              <label for="localDestination">Local Destination</label>
              <input
                type="text"
                id="localDestination"
                placeholder="./downloads"
                value="${this._escapeHtml(localDestination)}"
              />
              <div class="setting-description">
                Local folder to save downloaded files (relative or absolute path)
              </div>
            </div>

            <div class="setting-group">
              <label for="bashScriptPath">Remote Build Script</label>
              <input
                type="text"
                id="bashScriptPath"
                placeholder="build.sh"
                value="${this._escapeHtml(bashScriptPath)}"
              />
              <div class="setting-description">
                Bash script path or name to run on remote host for building (e.g., build.sh or ./scripts/build.sh)
              </div>
            </div>

            <div class="setting-group">
              <label for="localAppPath">Local Application Path</label>
              <input
                type="text"
                id="localAppPath"
                placeholder="C:\\Program Files\\MyApp\\app.exe"
                value="${this._escapeHtml(localAppPath)}"
              />
              <div class="setting-description">
                Application path to run locally after build (e.g., ./dist/app or /usr/local/bin/myapp)
              </div>
            </div>

            <div class="buttons">
              <button type="submit">Save Settings</button>
              <button type="button" class="secondary" id="resetBtn">Reset to Default</button>
            </div>
          </form>

          <div class="history-section">
            <h3>📋 Download History</h3>
            <div class="history-list">
              ${
                downloadHistory.length > 0
                  ? historyItems
                  : '<div class="empty-history">No downloads yet</div>'
              }
            </div>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const remotePath = document.getElementById('remotePath').value;
            const localDestination = document.getElementById('localDestination').value;
            const bashScriptPath = document.getElementById('bashScriptPath').value;
            const localAppPath = document.getElementById('localAppPath').value;

            vscode.postMessage({
              command: 'saveSettings',
              remotePath,
              localDestination,
              bashScriptPath,
              localAppPath,
            });

            document.getElementById('successMessage').classList.add('show');
            setTimeout(() => {
              document.getElementById('successMessage').classList.remove('show');
            }, 2000);
          });

          document.getElementById('resetBtn').addEventListener('click', () => {
            document.getElementById('remotePath').value = '/home';
            document.getElementById('localDestination').value = './downloads';
          });
        </script>
      </body>
      </html>
    `;
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
