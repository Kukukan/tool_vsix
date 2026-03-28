# Debugging Workflow

## Launching the Extension
- Press `F5` to start a new Extension Development Host window.
- The host will have your extension loaded.
- You can set breakpoints in your source code.

## Debugging Webviews
- Open the settings panel.
- In the development host, use `Help > Toggle Developer Tools` to inspect the webview.
- Look for errors in the Console tab.

## Common Issues

### "Not connected to a remote SSH host" – already removed
We have removed these checks, but if you see similar errors, ensure you aren't still using `isConnectedToSSH()`.

### File operations failing
- Check the URI construction: local paths should be `Uri.file()`, remote paths should use `vscode-remote://`.
- Ensure `vscode.workspace.fs` methods are called with the correct scheme.

### Auto‑detection not working
- Verify the workspace URI scheme is `vscode-remote` and authority matches `ssh-remote+<host>:<port>`.
- The regex in `getRemoteInfo` expects that pattern; adjust if your remote authority differs.

### Settings not saving
- Check the configuration section is `huyfive`.
- Use `HuyfiveConfig.set` and verify with `HuyfiveConfig.get`.

## Using Claude to Debug
- Paste error messages and relevant code snippets.
- Ask Claude to suggest fixes or explain the root cause.
- Provide the full context of the file and what you were trying to achieve.