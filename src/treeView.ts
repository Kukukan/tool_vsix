import * as vscode from 'vscode';

export class HuyfiveTreeDataProvider implements vscode.TreeDataProvider<HuyfiveTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<HuyfiveTreeItem | undefined | void> = new vscode.EventEmitter<HuyfiveTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<HuyfiveTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: HuyfiveTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: HuyfiveTreeItem): Thenable<HuyfiveTreeItem[]> {
    if (!element) {
      // Root items
      return Promise.resolve([
        new HuyfiveTreeItem('List Remote Files', vscode.TreeItemCollapsibleState.None, 'huyfive.listRemoteFiles'),
        new HuyfiveTreeItem('Build and Run', vscode.TreeItemCollapsibleState.None, 'huyfive.buildAndRun'),
        new HuyfiveTreeItem('Settings', vscode.TreeItemCollapsibleState.None, 'huyfive.openSettings'),
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
    public readonly commandId?: string
  ) {
    super(label, collapsibleState);
    if (commandId) {
      this.command = {
        command: commandId,
        title: '',
      };
    }
  }
}