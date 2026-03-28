# Testing Guide

## Manual Testing Checklist

### Local Workspace
1. Open a local folder.
2. Run command `Huyfive: List Remote Files` – should allow you to choose a local directory and show its files.
3. Configure settings (remote path, local destination, build script, local app path) using the settings panel.
   - Host/port/repoPath should remain empty (no auto‑detection).
4. Run `Huyfive: Build and Run` – should execute the build script in a local terminal, copy files from the configured remote path (which is now interpreted as a local path) to local destination, and run the local app.

### Remote SSH Workspace
1. Connect to an SSH host (via Remote – SSH).
2. Open a folder on that host.
3. Open the settings panel: host, port, and repoPath should be auto‑populated.
4. Run `Huyfive: List Remote Files` – should list files on the remote host.
5. Run `Huyfive: Build and Run` – should run the build script on the remote host, copy files back to your local machine, and run the local app.

### Edge Cases
- Missing settings: show error messages.
- Invalid remote path: show proper error.
- Network disconnect: handle gracefully.

## Automated Testing (future)
- Use `vscode-test` to run unit tests on the configuration class.
- Mock `vscode` API for file operations.
- Write tests for `SSHFileManager.getRemoteInfo()` with different URIs.