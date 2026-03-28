# Huyfive VS Code Extension

A VS Code extension that helps you build and run projects across remote SSH hosts or local workspaces. It allows you to configure remote paths, run build scripts, and copy built files locally.

## Core Features
- **List remote files** – Browse any directory on the remote host (or locally).
- **Build and run** – Execute a build script on the remote host, copy artifacts locally, and launch a local application.
- **Settings panel** – Configure remote paths, build script, local destination, and app path. Auto-detects SSH host, port, and repository path when in a remote workspace.

## Project Goals
- Work seamlessly in **any** workspace: local folders, remote SSH, WSL, containers.
- Auto-detect remote connection details to pre‑populate settings.
- Provide a clean, VS Code‑native user experience.

## Key Files
- `src/extension.ts` – Entry point; registers commands.
- `src/config.ts` – Manages settings via VS Code configuration.
- `src/sshFileManager.ts` – Abstracts file operations; detects environment (remote/local).
- `src/settingsPanel.ts` – Webview panel for settings; auto‑populates remote info.
- `src/treeView.ts` – Tree data provider for a sidebar view.

## Development Setup
1. Clone the repository.
2. Run `npm install`.
3. Press `F5` to start debugging the extension.
4. To package: `npm install -g vsce` then `vsce package`.

## Coding Conventions
- Use TypeScript strict mode.
- All file operations use `vscode.workspace.fs`.
- Settings are stored in `huyfive.*` configuration keys.
- Use `async/await` for all asynchronous operations.
- Show user‑friendly error messages with `vscode.window.showErrorMessage`.

## Icons
- Use `vscode.ThemeIcon` with Codicon names for built‑in, theme‑aware icons.
- Avoid custom image icons unless absolutely necessary.
- Refresh tree views when the environment (remote/local) changes.