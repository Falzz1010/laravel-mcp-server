# 🚀 Quick Start Guide

Get Laravel MCP Server running in **5 minutes**!

## Prerequisites Check

Open terminal and verify:

```bash
# Node.js (needs 18+)
node --version
# Should output: v18.x.x or higher

# PHP (needs 8.0+)
php --version
# Should output: PHP 8.x.x

# npm
npm --version
```

If any command fails, install the missing software first.

## Step 1: Install Laravel MCP Server

```bash
# Navigate to your projects folder
cd ~/projects  # or C:\projects on Windows

# Clone or download the server
git clone https://github.com/Falzz1010/laravel-mcp-server.git
cd laravel-mcp-server

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Verify tests pass
npm test
```

**Expected output:**
```
✓ All security tests passed (19 tests)
```

## Step 2: Configure Your AI Client

### For Claude Desktop

1. **Find config file location:**
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`

2. **Edit the file** and add:

```json
{
  "mcpServers": {
    "laravel": {
      "command": "node",
      "args": [
        "REPLACE_WITH_SERVER_PATH/build/index.js",
        "REPLACE_WITH_LARAVEL_PATH"
      ]
    }
  }
}
```

3. **Replace paths:**
   - `REPLACE_WITH_SERVER_PATH`: Where you cloned laravel-mcp-server
   - `REPLACE_WITH_LARAVEL_PATH`: Your Laravel project directory

**Example (Windows):**
```json
{
  "mcpServers": {
    "laravel": {
      "command": "node",
      "args": [
        "E:/projects/laravel-mcp-server/build/index.js",
        "E:/xampp/htdocs/my-laravel-app"
      ]
    }
  }
}
```

**Example (Mac/Linux):**
```json
{
  "mcpServers": {
    "laravel": {
      "command": "node",
      "args": [
        "/home/user/projects/laravel-mcp-server/build/index.js",
        "/home/user/projects/my-laravel-app"
      ]
    }
  }
}
```

4. **Restart Claude Desktop**

### For Cursor IDE

1. **In your Laravel project**, create `.cursor/config.json`:

```bash
cd /path/to/your/laravel-project
mkdir .cursor
```

2. **Create config file** `.cursor/config.json`:

```json
{
  "mcp": {
    "servers": {
      "laravel": {
        "command": "node",
        "args": [
          "/absolute/path/to/laravel-mcp-server/build/index.js",
          "${workspaceFolder}"
        ]
      }
    }
  }
}
```

3. **Restart Cursor**

## Step 3: Test It Works!

### Test 1: Check Server Connection

Open your AI client and say:

> "Hi! Can you see the Laravel MCP tools?"

**Expected response:**
AI should mention it has access to Laravel tools like `run_artisan`, `read_logs`, etc.

### Test 2: Read Routes

Say:

> "Show me all the routes in my Laravel application"

**Expected result:**
- AI uses the `list_routes` tool
- You see your Laravel routes listed

### Test 3: Read Logs

Say:

> "Show me the last 20 lines from my Laravel logs"

**Expected result:**
- AI uses the `read_logs` tool
- You see recent log entries

### Test 4: Security Check

Say:

> "Run `php artisan migrate:fresh`"

**Expected result:**
- AI should **refuse** or explain it's blocked
- You see a security message about dangerous commands

**If this test passes, your security is working!** ✅

## Step 4: Enable Write Access (Optional)

**Warning:** This allows AI to create/modify files!

Edit your config and add `--allow-write`:

```json
{
  "mcpServers": {
    "laravel": {
      "command": "node",
      "args": [
        "/path/to/laravel-mcp-server/build/index.js",
        "/path/to/laravel-project",
        "--allow-write"  // ← Add this line
      ]
    }
  }
}
```

Restart your AI client, then test:

> "Create a new controller called TestController"

**Expected result:**
- AI uses `run_artisan` with `make:controller`
- New file created in `app/Http/Controllers/`
- Backup created in `.laravel-mcp-backup/`

## Common Issues

Server won't start? Check `npm run build` ran, paths are absolute, and the Laravel path contains an `artisan` file. Then test it directly:

```bash
node /path/to/laravel-mcp-server/build/index.js /path/to/laravel-project
# [INFO] Laravel MCP Server running on stdio transport.
```

Every other error — invalid path, production refusal, PHP not found, blocked commands, tools missing from the client — is covered in [README — Troubleshooting](README.md#-troubleshooting).

## Next Steps

✅ Server is running
✅ Basic tools work
✅ Security is working

**Now you can:**

1. **Read the full README** — [README.md](README.md)
   - Learn about all 6 tools
   - Understand security features
   - See usage examples

2. **Check example configs** — [examples/](examples/)
   - Multiple project setups
   - Different access levels
   - Platform-specific configs

3. **Review security** — [SECURITY.md](SECURITY.md)
   - Understand what's blocked and why
   - Learn about audit logging
   - See best practices

4. **Read the source** — [`src/utils/security.ts`](src/utils/security.ts)
   - Command tiers and blocklists
   - Path and write validation
   - Full security implementation

## Getting Help

- 📖 **Documentation**: Check README.md and other docs
- 🐛 **Bug Reports**: Open GitHub issue
- 💬 **Questions**: GitHub Discussions
- 🔒 **Security**: See SECURITY.md for reporting

Happy Laravel development with AI! 🎉
