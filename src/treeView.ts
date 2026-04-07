import * as vscode from 'vscode';

export class HuyfiveTreeDataProvider implements vscode.TreeDataProvider<HuyfiveTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<HuyfiveTreeItem | undefined | void> = new vscode.EventEmitter<HuyfiveTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<HuyfiveTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: HuyfiveTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: HuyfiveTreeItem): Thenable<HuyfiveTreeItem[]> {
    if (!element) {
      // Root items with icons
      return Promise.resolve([
        new HuyfiveTreeItem('List Remote Files', vscode.TreeItemCollapsibleState.None, 'huyfive.listRemoteFiles', 'file-directory'),
        new HuyfiveTreeItem('Build and Run', vscode.TreeItemCollapsibleState.None, 'huyfive.buildAndRun', 'run'),
        new HuyfiveTreeItem('Settings', vscode.TreeItemCollapsibleState.None, 'huyfive.openSettings', 'settings-gear'),
      ]);
    }
    return Promise.resolve([]);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

export class HuyfiveTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly commandId?: string,
    public readonly iconId?: string
  ) {
    super(label, collapsibleState);
    if (commandId) {
      this.command = {
        command: commandId,
        title: label,
      };
    }
    // Set icon using Codicon if provided
    if (iconId) {
      this.iconPath = new vscode.ThemeIcon(iconId);
    }
  }
}