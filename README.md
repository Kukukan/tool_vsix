# Huyfive - SSH File Operations Extension

A VS Code extension that provides convenient commands for copying files from remote Linux hosts connected via SSH.

## Features

- **🚀 Build and Run Workflow** - Execute remote build script → Copy files → Run local app in one click
- **Custom Settings Panel** - Beautiful, intuitive editor for managing extension settings
- **☁️ Copy File from SSH Host** - Copy files from your remote SSH machine to your local workspace
- **🗄️ List Remote Directory Files** - Browse and view files in a remote directory with icons
- **📋 Download History** - Tracks your last 10 downloaded file paths
- **💾 Persistent Settings** - All configuration is saved globally and persists between sessions
- **⚡ Smart Defaults** - Extension remembers your previous paths for faster workflow

## Requirements

- VS Code 1.75.0 or higher
- VS Code Remote - SSH extension installed
- Node.js and npm (for development)

## Usage

### Prerequisites
First, connect to a remote SSH host:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Remote-SSH: Connect to Host..."
3. Enter your SSH connection details

### Configure Settings
1. Click the **Huyfive icon** on the left sidebar
2. Click **"Open Settings"** 
3. Configure:
   - **Remote File Path** - Default path to browse on remote host (e.g., `/home/user`)
   - **Local Destination** - Folder to save downloaded files (e.g., `./downloads`)
   - **Remote Build Script** - Bash script to run on remote for building (e.g., `build.sh` or `./scripts/build.sh`)
   - **Local Application Path** - Application to run locally after build (e.g., `./dist/app` or `C:\Program Files\MyApp\app.exe`)
4. Click **"Save Settings"**
5. Your settings persist for future sessions

### Build and Run (Complete Workflow)
1. Click **"Build and Run"** from the Huyfive menu
2. Extension will automatically:
   - Execute the build script on your remote host
   - Copy built files to your local destination
   - Run your local application
3. A terminal window shows the build output
4. Status notifications guide you through each step

### List Remote Directory Files
1. Click **"List Remote Directory Files"** from the Huyfive menu
2. Enter the directory path (uses previous path by default)
3. Browse all files and folders in that directory with icons

## Development

### Setup
```bash
npm install
npm run compile
```

### Build
```bash
npm run compile
```

### Watch Mode (auto-compile on changes)
```bash
npm run watch
```

### Debug
Press `F5` to start debugging the extension in a new VS Code window

### Lint
```bash
npm run lint
```

## Project Structure
```
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── sshFileManager.ts     # SSH file operations utility
│   ├── config.ts             # Configuration management
│   ├── settingsPanel.ts      # Custom settings UI panel
│   └── treeView.ts           # Sidebar menu tree view
├── media/
│   └── huyfive.svg           # Extension icon
├── .vscode/
│   ├── launch.json           # Debug configuration
│   └── tasks.json            # Build tasks
├── package.json              # Extension manifest
└── tsconfig.json             # TypeScript configuration
```

## API Reference

### HuyfiveConfig Class
Configuration management with persistent storage:

**`getRemotePath(): string`**
- Returns the default remote path

**`setRemotePath(path: string): Promise<void>`**
- Sets the default remote path

**`getLocalDestination(): string`**
- Returns the local destination folder

**`setLocalDestination(path: string): Promise<void>`**
- Sets the local destination folder

**`getBashScriptPath(): string`**
- Returns the bash script path for remote build

**`setBashScriptPath(path: string): Promise<void>`**
- Sets the bash script path for remote build

**`getLocalAppPath(): string`**
- Returns the local application path to run

**`setLocalAppPath(path: string): Promise<void>`**
- Sets the local application path to run

**`getDownloadHistory(): string[]`**
- Returns the list of recent downloaded files (last 10)

**`addToDownloadHistory(filePath: string): Promise<void>`**
- Adds a file to the download history

**`clearDownloadHistory(): Promise<void>`**
- Clears the entire download history

### HuyfiveSettingsPanel Class
Custom WebView panel for settings UI:

**`createOrShow(): void`**
- Opens or brings to focus the settings panel

**`dispose(): void`**
- Closes and cleans up the settings panel

### SSHFileManager Class

**`isConnectedToSSH(): boolean`**
- Returns true if VS Code is connected to a remote SSH host

**`getRemoteAuthority(): string | undefined`**
- Returns the current remote authority string (e.g., "ssh-remote+user@host")

**`copyFileFromRemote(remoteFilePath: string, localFileName?: string): Promise<Uri>`**
- Copies a file from the remote host to the local workspace
- Returns the URI of the copied file

**`listRemoteDirectory(remoteDir: string): Promise<[string, FileType][]>`**
- Lists files and directories in a remote directory
- Returns array of [filename, type] tuples

**`readRemoteFile(remoteFilePath: string): Promise<string>`**
- Reads content from a remote file as text

**`writeRemoteFile(remoteFilePath: string, content: string): Promise<void>`**
- Writes text content to a remote file

## Troubleshooting

**"Build script path not configured" error**
- Open Settings panel and set "Remote Build Script" (e.g., `build.sh`)
- Make sure the script is executable on the remote host: `chmod +x build.sh`

**"Local app path not configured" error**
- Open Settings panel and set "Local Application Path" (e.g., `./dist/app`)
- For Windows, use full path with `.exe` extension

**Build completes but app doesn't run**
- Check that the local app path is correct and the file exists
- Verify the application is executable (`chmod +x app` on Linux/Mac)
- Check the plugin output for error messages

**"Not connected to a remote SSH host" error**
- Make sure you've connected to an SSH host first using Remote-SSH extension
- Check that your SSH configuration is valid

**File not found errors**
- Verify the file path is correct and starts with `/`
- Use absolute paths, not relative paths
- Check permissions on the remote file

## License

MIT
