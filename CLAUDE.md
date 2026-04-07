# Huyfive VS Code Extension

A VS Code extension that helps you build and run projects across remote SSH hosts or local workspaces. It allows you to configure remote paths, run build scripts, and copy built files locally.

## Core Features
- **List remote files** – Browse any directory on the remote host (or locally).
- **Build and run** – Execute a build script on the remote host, copy artifacts locally in parallel, and launch a local application.
- **Settings panel** – Configure remote paths, build script, local destination, and app path. Auto-detects SSH host, port, and repository path when in a remote workspace.
- **Cancellable operations** – Cancel long-running build and run operations.
- **Error handling** – Detailed error messages and recovery for failed operations.

## Project Goals
- Work seamlessly in **any** workspace: local folders, remote SSH, WSL, containers.
- Auto-detect remote connection details to pre‑populate settings.
- Provide a clean, VS Code‑native user experience.
- Robust error handling and proper async/await patterns.

## Key Files
- [src/extension.ts](src/extension.ts) – Entry point; registers commands with JSDoc documentation.
- [src/config.ts](src/config.ts) – Manages settings via VS Code configuration; includes input validation methods.
- [src/sshFileManager.ts](src/sshFileManager.ts) – Abstracts file operations; detects environment (remote/local) with null checks.
- [src/settingsPanel.ts](src/settingsPanel.ts) – Webview panel for settings; auto‑populates remote info.
- [src/treeView.ts](src/treeView.ts) – Tree data provider for a sidebar view.

## Recent Updates (v0.2.0)

### Bug Fixes
- ✅ Fixed race condition in build execution by using `promisify(child_process.exec)` instead of `setTimeout`
- ✅ Implemented proper async/await for build command execution with configurable timeout (2 min default)
- ✅ Added null checks in `SSHFileManager._getUri()` for better error handling
- ✅ Proper error propagation for failed file copies with user-friendly messages

### Features
- ✅ Parallel file copying using `Promise.allSettled()` for better performance
- ✅ Cancellation token support (`cancellable: true` in progress)
- ✅ Progress reporting with incremental updates during build/run workflow
- ✅ Input validation methods in config class (`isValidPort`, `isValidHost`, `isValidPath`)
- ✅ Limited download history to last 50 entries

### Code Quality
- ✅ Added comprehensive JSDoc comments to all public methods and commands
- ✅ Proper error messages with context (file names, error codes)
- ✅ Improved code organization with better separation of concerns
- ✅ Enhanced null checks and validation throughout

### Development
- ✅ Updated VS Code engine to `^1.95.0` (from 1.74.0)
- ✅ Updated TypeScript to `^5.3.3`
- ✅ Added ESLint configuration with TypeScript support
- ✅ Added `npm run lint` script
- ✅ Created `.vscodeignore` file for cleaner package distribution
- ✅ Updated Node types to 18.x
- ✅ Added `.eslintrc.json` configuration

## Development Setup
1. Clone the repository.
2. Run `npm install`.
3. Press `F5` to start debugging the extension.
4. To package: `npm run build` then `vsce package`.

## Scripts
```bash
npm run compile    # Build TypeScript
npm run watch      # Watch mode
npm run lint       # Run ESLint
npm run package    # Package as VSIX
```

## Coding Conventions
- Use TypeScript strict mode.
- All file operations use `vscode.workspace.fs`.
- Settings are stored in `huyfive.*` configuration keys.
- Use `async/await` for all asynchronous operations.
- Show user‑friendly error messages with `vscode.window.showErrorMessage`.
- Add JSDoc comments to all public methods.
- Validate user input before processing.

## Icons
- Use `vscode.ThemeIcon` with Codicon names for built‑in, theme‑aware icons.
- Avoid custom image icons unless absolutely necessary.
- Refresh tree views when the environment (remote/local) changes.

## Known Limitations
- Build timeout is fixed at 2 minutes (can be made configurable in future)
- SSH port validation is basic (1-65535 range check)
- No retry logic for network-based file operations
- No dry-run mode for build operations