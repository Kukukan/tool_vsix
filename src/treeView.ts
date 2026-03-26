import * as vscode from 'vscode';

export class HuyfiveTreeDataProvider implements vscode.TreeDataProvider<HuyfiveTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<HuyfiveTreeItem | undefined | null | void> = new vscode.EventEmitter<HuyfiveTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<HuyfiveTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: HuyfiveTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: HuyfiveTreeItem): Thenable<HuyfiveTreeItem[]> {
    if (!element) {
      // Root level items
      return Promise.resolve([
        new HuyfiveTreeItem(
          'Build and Run',
          'huyfive.buildAndRun',
          vscode.TreeItemCollapsibleState.None,
          '$(play)'
        ),
        new HuyfiveTreeItem(
          'List Remote Directory Files',
          'huyfive.listRemoteFiles',
          vscode.TreeItemCollapsibleState.None,
          '$(database)'
        ),
        new HuyfiveTreeItem(
          'Open Settings',
          'huyfive.openSettings',
          vscode.TreeItemCollapsibleState.None,
          '$(settings)'
        ),
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
    commandId: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    iconId?: string
  ) {
    super(label, collapsibleState);
    this.command = {
      command: commandId,
      title: label,
    };
    
    if (iconId) {
      this.iconPath = new vscode.ThemeIcon(iconId);
    }
  }
}
