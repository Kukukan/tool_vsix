# Architecture Overview

The extension is split into several modules:

## 1. Commands (`extension.ts`)
- Registers commands: `huyfive.listRemoteFiles`, `huyfive.buildAndRun`, `huyfive.openSettings`.
- Uses the `SSHFileManager` and `HuyfiveConfig` classes to perform actions.
- Catches errors and displays them to the user.

## 2. File Management (`sshFileManager.ts`)
- Provides static methods for listing directories and copying files.
- Detects the current environment:
  - `isRemoteWorkspace()` checks if the workspace is a remote SSH (scheme `vscode-remote`).
  - `getRemoteInfo()` extracts host, port, and repo path from the remote URI.
- Uses `vscode.workspace.fs` with appropriate URIs (remote vs file) to work cross‑environment.

## 3. Configuration (`config.ts`)
- A static class that reads/writes settings from/to VS Code configuration under the section `huyfive`.
- Keys include: `remotePath`, `localDestination`, `bashScriptPath`, `localAppPath`, `host`, `port`, `repoPath`, and `downloadHistory` (array of strings).

## 4. Settings Panel (`settingsPanel.ts`)
- Creates a webview panel (`HuyfiveSettingsPanel`) for configuring all settings.
- In `createOrShow()`, it calls `SSHFileManager.getRemoteInfo()` to pre‑populate host, port, repoPath if they are not already set.
- Sends/receives messages to/from the webview to load and save settings.

## 5. Tree View (`treeView.ts`)
- A `TreeDataProvider` that displays items in the sidebar (currently a placeholder; can be extended).

## Data Flow
1. User opens settings panel → webview loads → requests current settings → `HuyfiveConfig` returns values → webview displays.
2. User saves settings → webview sends message → panel calls `HuyfiveConfig.set*` methods.
3. User runs a command → extension calls `SSHFileManager` methods → operations are performed (remote or local) → results shown.