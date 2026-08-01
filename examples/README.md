# Configuration Examples

This folder contains example configurations for various AI clients that support MCP (Model Context Protocol).

## 📁 Files

### `claude-desktop-config.json`
Configuration for Claude Desktop app.

**Location:**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

**Usage:**
1. Open the config file in your text editor
2. Add the `laravel-dev` section from the example
3. Update the paths to match your system
4. Restart Claude Desktop

### `cursor-config.json`
Configuration for Cursor IDE.

**Location:** `.cursor/config.json` in your workspace root

**Usage:**
1. Create `.cursor` folder in your Laravel project root
2. Copy the example config
3. Adjust paths if needed (uses `${workspaceFolder}` variable)
4. Restart Cursor

### `vscode-settings.json`
Configuration for VS Code with MCP support.

**Location:** `.vscode/settings.json` in your workspace

**Usage:**
1. Create or edit `.vscode/settings.json` in your Laravel project
2. Add the `mcp.servers` configuration
3. Reload VS Code window

## 🔧 Customizing Paths

Replace these paths with your actual locations:

```json
{
  "command": "node",
  "args": [
    "/absolute/path/to/laravel-mcp-server/build/index.js",  // ← Update this
    "/absolute/path/to/your/laravel-project",                // ← Update this
    "--allow-write"  // ← Optional flags
  ]
}
```

### Windows Example
```json
"E:/desain-ui/laravel-mcp-server/build/index.js"
"E:/xampp/htdocs/my-laravel-app"
```

### macOS/Linux Example
```json
"/home/user/projects/laravel-mcp-server/build/index.js"
"/home/user/projects/my-laravel-app"
```

## 🚦 Access Levels

### Read-Only (Safest)
```json
"args": [
  "/path/to/laravel-mcp-server/build/index.js",
  "/path/to/laravel-project"
]
```

### With Write Access
```json
"args": [
  "/path/to/laravel-mcp-server/build/index.js",
  "/path/to/laravel-project",
  "--allow-write"
]
```

### Full Access (Use with Caution!)
```json
"args": [
  "/path/to/laravel-mcp-server/build/index.js",
  "/path/to/laravel-project",
  "--allow-write",
  "--allow-tinker"
]
```

## 🧪 Testing Configuration

After configuring, test that it works:

1. **Check Server Starts:**
   - Open your AI client
   - Check logs for "Laravel MCP Server running"
   - No error messages should appear

2. **Test Basic Tool:**
   Ask your AI: "Show me all the routes in my Laravel app"
   - Should use the `list_routes` tool
   - Should return your Laravel routes

3. **Verify Security:**
   Ask your AI: "Run `php artisan migrate:fresh`"
   - Should be **blocked** with security message
   - Check audit log for the blocked attempt

## 📋 Multiple Projects

You can configure multiple Laravel projects:

```json
{
  "mcpServers": {
    "laravel-main": {
      "command": "node",
      "args": [
        "/path/to/laravel-mcp-server/build/index.js",
        "/path/to/main-project"
      ]
    },
    "laravel-experimental": {
      "command": "node",
      "args": [
        "/path/to/laravel-mcp-server/build/index.js",
        "/path/to/experimental-project",
        "--allow-write",
        "--allow-tinker"
      ]
    }
  }
}
```

## 🐛 Troubleshooting

### "Command not found: node"
Install Node.js or specify full path:
```json
"command": "/usr/local/bin/node"  // macOS/Linux
"command": "C:/Program Files/nodejs/node.exe"  // Windows
```

### "Invalid Laravel path"
Ensure the path points to your Laravel **root** directory (where `artisan` file is located).

### "Server not starting"
1. Build the server first: `npm run build`
2. Check paths are absolute, not relative
3. Check Node.js version: `node --version` (needs 18+)
4. Check PHP version: `php --version` (needs 8.0+)

### Changes not applying
- Restart your AI client completely
- Check for JSON syntax errors in config
- Review AI client logs for error messages

## 📚 More Information

See the main [README.md](../README.md) for:
- Full installation guide
- Security details
- Tool documentation
- Troubleshooting

For questions, open an issue on GitHub!
