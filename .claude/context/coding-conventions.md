# Coding Conventions

## Naming
- **Classes**: PascalCase, e.g., `SSHFileManager`, `HuyfiveConfig`.
- **Methods/Functions**: camelCase, e.g., `listRemoteDirectory`, `getRemotePath`.
- **Constants**: UPPER_SNAKE_CASE for truly constant values; otherwise camelCase.
- **Private members**: prefix with `_` if needed (e.g., `_panel`), but prefer private access modifiers without prefix.

## TypeScript
- Use `strict: true` in `tsconfig.json`.
- Avoid `any` – use `unknown` or proper types.
- Use `async/await` for promises; avoid `.then` chains.

## File System Operations
- Always use `vscode.workspace.fs` (not `fs` from Node.js) to support both local and remote URIs.
- When constructing URIs:
  - Local: `vscode.Uri.file(path)`
  - Remote: `vscode.Uri.parse(`vscode-remote://${authority}${remotePath}`)`
- Always handle errors with try/catch and show user‑friendly messages via `vscode.window.showErrorMessage`.

## Configuration
- Store settings globally under the namespace `huyfive`.
- Use `HuyfiveConfig` class to encapsulate get/set logic.
- When adding new settings, add a corresponding method in `HuyfiveConfig`.

## Webviews
- Use `vscode.ViewColumn.One` for the panel.
- Enable scripts: `{ enableScripts: true }`.
- Use `acquireVsCodeApi()` in the webview to post messages.
- Style with CSS variables from VS Code (e.g., `--vscode-foreground`, `--vscode-button-background`).

## Error Handling
- All async commands should be wrapped in try/catch.
- Show a modal or notification with the error message.
- Log to console for debugging (`console.log`).

## Testing
- (Optional) Use `mocha` and `@vscode/test-electron` for integration tests.
- For now, manual testing in both local and remote workspaces is recommended.

## Git
- Commit messages should be in present tense, e.g., "Add auto‑detection of remote host".
- Use `npm run compile` before committing to ensure TypeScript compiles.