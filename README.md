# 🚀 Laravel MCP Server

> **AI-Powered Laravel Development Assistant** — Secure bridge between AI Clients (Claude Desktop, Cursor, VS Code) and your local Laravel projects.

<div align="center">

[![npm version](https://img.shields.io/npm/v/@falzz1010/laravel-mcp-server.svg?style=flat-square)](https://www.npmjs.com/package/@falzz1010/laravel-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@falzz1010/laravel-mcp-server.svg?style=flat-square)](https://www.npmjs.com/package/@falzz1010/laravel-mcp-server)
[![GitHub](https://img.shields.io/github/stars/Falzz1010/laravel-mcp-server?style=flat-square)](https://github.com/Falzz1010/laravel-mcp-server)
[![OpenSSF Scorecard](https://img.shields.io/ossf-scorecard/github.com/Falzz1010/laravel-mcp-server?label=openssf%20scorecard&style=flat-square)](https://securityscorecards.dev/viewer/?uri=github.com/Falzz1010/laravel-mcp-server)
[![Security Rating](https://img.shields.io/badge/Security-A+-brightgreen?style=flat-square)](SECURITY.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js&style=flat-square)](https://nodejs.org/)
[![Laravel](https://img.shields.io/badge/Laravel-8+-red?logo=laravel&style=flat-square)](https://laravel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Security: 10 Layers](https://img.shields.io/badge/Security-10%20Layers-green?style=flat-square)](SECURITY.md)

</div>

---

## ⚠️ Security Notice

This package **intentionally** requires system access for its core functionality (executing artisan commands, reading logs, etc.). All operations are protected by a [10-layer security system](SECURITY.md) including:
- Input sanitization & command validation
- Path traversal prevention
- Production environment blocking  
- Rate limiting & audit logging
- No shell injection (uses `execFile` only)

**For local development only. Never use in production.**

### 📢 Expected npm/Socket Security Alerts

When installing this package, you may see alerts from npm or Socket.dev about:
- **Shell Access** ✓ Required - safely executes `php artisan` commands
- **Filesystem Access** ✓ Required - reads Laravel logs and source files  
- **Environment Variables** ✓ Required - validates `APP_ENV` to block production
- **Network Access** ✓ Required - MCP protocol communication
- **AI-detected risks** ✓ Expected - automated scanners flag dev tools

**These are NOT vulnerabilities** - they are legitimate features of a Laravel development tool, all protected by our security layers. See [SECURITY.md](SECURITY.md) for complete details on how each capability is secured.

### 🔐 Security Monitoring

We maintain enterprise-grade security through:
- ✅ [CodeQL Analysis](https://github.com/Falzz1010/laravel-mcp-server/security/code-scanning) - Automated code security scanning
- ✅ [Dependabot](https://github.com/Falzz1010/laravel-mcp-server/security/dependabot) - Dependency vulnerability alerts
- ✅ [Security Tests](https://github.com/Falzz1010/laravel-mcp-server/actions/workflows/security.yml) - 19 security-focused tests
- 📊 [OpenSSF Scorecard](https://securityscorecards.dev/viewer/?uri=github.com/Falzz1010/laravel-mcp-server) - Best practice monitoring (weekly)

See [SECURITY.md](SECURITY.md) for complete security details.

---

## 📖 Table of Contents

- [What is Laravel MCP Server?](#-what-is-laravel-mcp-server)
- [Features](#-features)
- [Security Architecture](#-security-architecture)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Usage Examples](#-usage-examples)
- [Tools Reference](#-tools-reference)
- [Security Details](#-security-details)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 What is Laravel MCP Server?

Laravel MCP Server adalah **MCP (Model Context Protocol) Server** berbasis TypeScript/Node.js yang memungkinkan AI Assistant seperti Claude untuk:

- ✅ Menjalankan perintah `php artisan` dengan aman
- ✅ Membaca dan menganalisis Laravel logs
- ✅ Melihat routes, config, dan structure proyek
- ✅ Membaca dan menulis source code (dengan proteksi ketat)
- ✅ Menjalankan kode PHP via Tinker (dalam sandbox mode)

**Mengapa dibuat?** AI modern sangat powerful untuk development, tapi memberikan akses terminal langsung ke AI sangat **berbahaya**. Server ini memberikan **controlled access** dengan **10 lapis security layer** yang dirancang khusus untuk mencegah kerusakan pada proyek Laravel kamu.

---

## ✨ Features

### 🔧 7 Powerful Tools

| Tool | Fungsi | Access Level |
|------|--------|--------------|
| **`run_artisan`** | Jalankan perintah artisan yang aman | 🟢 Always Active |
| **`read_logs`** | Baca Laravel logs dengan filter | 🟢 Always Active |
| **`list_routes`** | Lihat semua routes dengan filter | 🟢 Always Active |
| **`read_file`** | Baca source code proyek | 🟢 Always Active |
| **`write_file`** | Tulis/edit file proyek | 🔴 Requires `--allow-write` |
| **`run_tinker`** | Jalankan PHP code via Tinker | 🔴 Requires `--allow-tinker` |

### 📂 3 Laravel Resources

- **`laravel://env`** — Static view of `.env` dengan credential masking
- **`laravel://routes`** — JSON view lengkap semua routes
- **`laravel://config/{key}`** — Dynamic config reader (contoh: `laravel://config/app.name`)

### 💬 3 Smart Prompts

- **`debug-error`** — Otomatis baca logs dan minta AI menganalisis error
- **`create-crud`** — Template untuk generate CRUD lengkap (Model, Migration, Controller, Routes)
- **`review-code`** — Code review dengan fokus Laravel best practices

### 🛡️ 10-Layer Security System

1. **Environment Gate** — Menolak start jika `APP_ENV=production`
2. **Rate Limiter** — Max 30 perintah/menit, 500 perintah/jam
3. **Command Classifier** — 3-tier risk classification (READ_ONLY, CAUTIOUS, DANGEROUS)
4. **Input Sanitizer** — Blokir shell injection (`;`, `&&`, `$()`, backticks, dll)
5. **Flag Validator** — Blokir `--force`, `--seed`, `--drop-*`, `--wipe`
6. **Path Protector** — Blokir path traversal (`../`, symlinks keluar project)
7. **Write Guard** — Whitelist directory + extension untuk `write_file`
8. **Tinker Sandbox** — Blokir 15+ fungsi PHP berbahaya
9. **Execution Sandbox** — Timeout ketat, no shell access (`execFile` only)
10. **Audit Trail** — Log semua operasi ke `.laravel-mcp-audit.jsonl`

---

## 🏗️ Security Architecture

### 3-Tier Command Classification

Setiap perintah artisan dikategorikan berdasarkan tingkat risiko:

| Tier | Warna | Level | Contoh Perintah | Perlakuan |
|------|-------|-------|-----------------|-----------|
| 🟢 **READ_ONLY** | Hijau | Aman | `about`, `route:list`, `config:show` | Langsung dieksekusi |
| 🟡 **CAUTIOUS** | Kuning | Hati-hati | `make:*`, `migrate`, `cache:clear` | Audit log + Rate limited |
| 🔴 **DANGEROUS** | Merah | Berbahaya | `migrate:fresh`, `db:wipe`, `down` | **DIBLOKIR TOTAL** |

### Permanently Blocked Commands (20+)

Perintah berikut **TIDAK PERNAH** bisa dijalankan, bahkan dengan flag khusus:

```
migrate:fresh    → Hapus SEMUA tabel + migrate ulang
migrate:reset    → Rollback SEMUA migrations
migrate:refresh  → Reset + re-migrate database
db:wipe          → Hapus SEMUA tabel, views, types
down             → Matikan aplikasi (maintenance mode)
tinker           → Ada tool terpisah yang lebih aman
serve            → Blocking command yang bisa hang server
queue:restart    → Restart semua queue workers
vendor:publish   → Bisa overwrite file penting
package:discover → Security risk
```

**Lihat full list di:** [`src/utils/security.ts`](src/utils/security.ts) (`DANGEROUS_COMMANDS`)

### File Write Protection

Tool `write_file` hanya bisa menulis ke directory yang di-whitelist:

✅ **Allowed Directories:**
```
app/                    → Models, Controllers, Services
routes/                 → Route definitions
database/migrations/    → Migration files
database/seeders/       → Seeder files
database/factories/     → Factory definitions
resources/views/        → Blade templates
config/                 → Config files
tests/                  → Test files
```

❌ **Blocked Directories:**
```
.env, vendor/, node_modules/, storage/, public/, 
bootstrap/, artisan, composer.json, .git/
```

✅ **Allowed Extensions:**
```
.php, .blade.php, .json, .yaml, .yml, .xml, .stub, .md, .txt
```

❌ **Blocked Extensions:**
```
.sh, .bat, .exe, .phar, .js, .env*
```

### Auto Backup System

Setiap kali `write_file` mengubah file yang sudah ada, server otomatis membuat backup ke:

```
.laravel-mcp-backup/
├── User.php.2026-08-01T143022.bak
├── ProductController.php.2026-08-01T143045.bak
└── ...
```

---

## 📦 Installation

### Prerequisites

- **Node.js** 18.0 atau lebih baru
- **PHP** 8.0 atau lebih baru
- **Laravel Project** (lokal di mesin kamu)

### Install via npm (Recommended)

```bash
# Install globally
npm install -g @falzz1010/laravel-mcp-server

# Verify installation
laravel-mcp --version
```

### Install from Source

```bash
# Clone repository
git clone https://github.com/Falzz1010/laravel-mcp-server.git
cd laravel-mcp-server

# Install dependencies
npm install

# Build TypeScript → JavaScript
npm run build
```

### Verify Installation

```bash
# Test security layer
npm test

# Expected output:
# ✓ All security tests passed (19 tests)
```

---

## 🚀 Quick Start

### 1. Basic Usage (Read-Only Mode)

Mode paling aman — hanya bisa baca data, tidak bisa menulis:

```bash
node build/index.js /path/to/your/laravel-project
```

**Yang bisa dilakukan:**
- ✅ Jalankan perintah artisan READ_ONLY (`route:list`, `about`, dll)
- ✅ Baca logs (`read_logs`)
- ✅ Baca source code (`read_file`)
- ✅ Lihat `.env` dengan masking (resource `laravel://env`)
- ❌ Tidak bisa menulis file
- ❌ Tidak bisa jalankan Tinker

### 2. With Write Access

Izinkan AI menulis/edit file proyek (dengan whitelist ketat):

```bash
node build/index.js /path/to/your/laravel-project --allow-write
```

**Tambahan yang bisa dilakukan:**
- ✅ Generate controller, model, migration via `make:*`
- ✅ Edit file di `app/`, `routes/`, `database/`, `config/`, `tests/`
- ✅ Auto backup sebelum overwrite

### 3. With Tinker Access

Izinkan AI menjalankan kode PHP (dalam sandbox mode):

```bash
node build/index.js /path/to/your/laravel-project --allow-tinker
```

**Tambahan yang bisa dilakukan:**
- ✅ Query database via Eloquent: `User::count()`
- ✅ Test helpers: `cache()->get('key')`
- ✅ Manipulasi data: `User::find(1)->update(['name' => 'Test'])`
- ❌ **Diblokir:** `exec()`, `system()`, `unlink()`, `file_put_contents()`, dll

### 4. Full Access Mode (USE WITH CAUTION!)

```bash
node build/index.js /path/to/your/laravel-project --allow-write --allow-tinker
```

### 5. Dry-Run Mode (Preview Only)

Lihat preview command tanpa benar-benar menjalankannya:

```bash
node build/index.js /path/to/your/laravel-project --dry-run
```

---

## ⚙️ Configuration

### Claude Desktop Configuration

Edit `claude_desktop_config.json` (biasanya di `%APPDATA%\Claude\` atau `~/.config/claude/`):

#### Using Global npm Package (Recommended)

```json
{
  "mcpServers": {
    "laravel-dev": {
      "command": "npx",
      "args": [
        "@falzz1010/laravel-mcp-server",
        "E:/xampp/htdocs/my-laravel-app"
      ]
    }
  }
}
```

#### Using Local Installation

```json
{
  "mcpServers": {
    "laravel-dev": {
      "command": "node",
      "args": [
        "E:/desain-ui/laravel-mcp-server/build/index.js",
        "E:/xampp/htdocs/my-laravel-app",
        "--allow-write"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### VS Code / Cursor Configuration

#### Using npm Package

Edit `.vscode/settings.json` atau Cursor settings:

```json
{
  "mcp.servers": {
    "laravel": {
      "command": "npx",
      "args": [
        "@falzz1010/laravel-mcp-server",
        "${workspaceFolder}",
        "--allow-write"
      ]
    }
  }
}
```

#### Using Local Installation

```json
{
  "mcp.servers": {
    "laravel": {
      "command": "node",
      "args": [
        "E:/desain-ui/laravel-mcp-server/build/index.js",
        "${workspaceFolder}",
        "--allow-write"
      ]
    }
  }
}
```

### CLI Arguments Reference

| Argument | Default | Deskripsi |
|----------|---------|-----------|
| `[path]` | *required* | Path ke root proyek Laravel |
| `--allow-write` | `false` | Aktifkan tool `write_file` |
| `--allow-tinker` | `false` | Aktifkan tool `run_tinker` |
| `--dry-run` | `false` | Preview mode (tidak eksekusi command) |
| `--php [path]` | `php` | Custom PHP binary path |
| `--timeout [ms]` | `30000` | Timeout untuk artisan commands (ms) |
| `--rate-limit [n]` | `30` | Max requests per menit |

**Contoh lengkap:**

```bash
node build/index.js \
  /var/www/laravel-app \
  --allow-write \
  --php /usr/bin/php8.2 \
  --timeout 60000 \
  --rate-limit 50
```

---

## 💡 Usage Examples

### Example 1: Debugging Error Logs

**User berkata ke Claude:**
> "Ada error di aplikasi, coba lihat log dan jelasin masalahnya"

**AI menggunakan tool `read_logs`:**
```json
{
  "tool": "read_logs",
  "arguments": {
    "lines": 50,
    "filter": "ERROR"
  }
}
```

**Output:**
```
[2026-08-01 14:30:22] local.ERROR: Call to undefined method App\Models\User::getFullNameAttribute() 
{"exception":"Error","file":"app/Http/Controllers/UserController.php","line":42}
```

**AI menganalisis:**
> "Error terjadi karena method accessor `getFullNameAttribute()` tidak ditemukan. Seharusnya accessor didefinisikan dengan prefix `get` dan suffix `Attribute`. Coba tambahkan method ini di Model User..."

### Example 2: Generate CRUD Resource

**User:**
> "Bikin CRUD untuk Product dong, fieldnya: name, description, price, stock"

**AI menggunakan prompt `create-crud`:**
```json
{
  "prompt": "create-crud",
  "arguments": {
    "model_name": "Product",
    "fields": "name:string,description:text,price:decimal,stock:integer"
  }
}
```

**AI kemudian menjalankan:**
1. `run_artisan make:model Product -m` → Buat Model + Migration
2. `write_file database/migrations/..._create_products_table.php` → Edit migration
3. `run_artisan make:controller ProductController --resource` → Buat Controller
4. `write_file routes/web.php` → Tambahkan route resource

### Example 3: Code Review

**User:**
> "Review code di `app/Http/Controllers/OrderController.php`"

**AI menggunakan prompt `review-code`:**
```json
{
  "prompt": "review-code",
  "arguments": {
    "file_path": "app/Http/Controllers/OrderController.php"
  }
}
```

**AI membaca file lalu memberikan feedback:**
> ✅ **Positif:**
> - Controller menggunakan Form Request untuk validasi
> - Query menggunakan Eloquent relationships dengan benar
> 
> ⚠️ **Perlu Diperbaiki:**
> - Method `store()` tidak menggunakan DB transaction, risiko partial save
> - Query di `index()` bisa N+1 problem, tambahkan `with(['user', 'items'])`
> - Tidak ada authorization check, sebaiknya gunakan Policy

---

## 🔧 Tools Reference

### 1. `run_artisan`

Jalankan perintah `php artisan` yang aman.

**Parameters:**
```typescript
{
  command: string;          // e.g. "make:controller"
  args?: string[];          // e.g. ["UserController", "--resource"]
}
```

**Example:**
```json
{
  "tool": "run_artisan",
  "arguments": {
    "command": "make:model",
    "args": ["Product", "-m", "-c", "-r"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "output": "Model created successfully.\nCreated Migration: 2026_08_01_143022_create_products_table",
  "exitCode": 0
}
```

### 2. `read_logs`

Baca baris terakhir dari Laravel logs.

**Parameters:**
```typescript
{
  lines?: number;           // Default: 100, Max: 500
  filter?: string;          // Keyword untuk filter (case-insensitive)
}
```

**Example:**
```json
{
  "tool": "read_logs",
  "arguments": {
    "lines": 50,
    "filter": "ERROR"
  }
}
```

### 3. `list_routes`

Lihat semua routes dengan optional filter.

**Parameters:**
```typescript
{
  method?: string;          // Filter by HTTP method: GET, POST, PUT, DELETE
  path?: string;            // Filter by path pattern (regex)
}
```

**Example:**
```json
{
  "tool": "list_routes",
  "arguments": {
    "method": "POST",
    "path": "/api/"
  }
}
```

### 4. `read_file`

Baca source code dari proyek Laravel.

**Parameters:**
```typescript
{
  path: string;             // Relative path dari root project
}
```

**Example:**
```json
{
  "tool": "read_file",
  "arguments": {
    "path": "app/Models/User.php"
  }
}
```

**Security:**
- ✅ Path traversal protection
- ✅ Max file size: 1MB
- ❌ Cannot read `.env` (use resource `laravel://env`, masked)

### 5. `write_file` (Requires `--allow-write`)

Tulis/edit file di proyek Laravel.

**Parameters:**
```typescript
{
  path: string;             // Relative path
  content: string;          // File content
}
```

**Example:**
```json
{
  "tool": "write_file",
  "arguments": {
    "path": "app/Models/Product.php",
    "content": "<?php\n\nnamespace App\\Models;\n..."
  }
}
```

**Security:**
- ✅ Directory whitelist (only `app/`, `routes/`, `database/`, `config/`, `tests/`)
- ✅ Extension whitelist (`.php`, `.blade.php`, `.json`, `.yaml`, dll)
- ✅ Auto backup ke `.laravel-mcp-backup/`
- ✅ Max file size: 500KB
- ❌ Cannot write to `.env`, `vendor/`, `node_modules/`, dll

### 6. `run_tinker` (Requires `--allow-tinker`)

Jalankan kode PHP via Tinker.

**Parameters:**
```typescript
{
  code: string;             // PHP code (tanpa <?php tag)
}
```

**Example:**
```json
{
  "tool": "run_tinker",
  "arguments": {
    "code": "User::count()"
  }
}
```

**Security:**
- ✅ Timeout ultra-ketat: 10 detik
- ✅ Max code length: 2000 karakter
- ❌ **Blocked functions:** `exec()`, `system()`, `shell_exec()`, `passthru()`, `popen()`, `proc_open()`, `unlink()`, `rmdir()`, `file_put_contents()`, `fwrite()`, `curl_exec()`, `eval()`, dll (15+ functions)
- ❌ **Blocked keywords:** `::truncate()`, `::delete()`, `->forceDelete()`, `DB::statement()`, `DB::unprepared()`, `Schema::drop()`, dll

---

## 🔒 Security Details

### Audit Logging

Semua operasi dicatat dalam **JSON Lines** format di:

```
{laravelPath}/.laravel-mcp-audit.jsonl
```

**Example log entry:**
```json
{"timestamp":"2026-08-01T14:30:22.000Z","sessionId":"abc123","tool":"run_artisan","tier":"CAUTIOUS","command":"make:controller","args":["ProductController","--resource"],"exitCode":0,"outputSize":45,"status":"ALLOWED","duration":1523}
```

**Fields:**
- `timestamp` — ISO 8601 timestamp
- `sessionId` — Unique per server session
- `tool` — Tool yang dipanggil
- `tier` — Risk tier (READ_ONLY, CAUTIOUS, DANGEROUS)
- `command` — Artisan command (if applicable)
- `args` — Command arguments
- `filePath` — File yang dibaca/ditulis (if applicable)
- `exitCode` — Command exit code
- `outputSize` — Output size in bytes
- `fileHash` — SHA-256 hash dari file yang ditulis
- `status` — ALLOWED / BLOCKED / ERROR
- `reason` — Alasan jika blocked
- `duration` — Execution duration in ms

### Rate Limiting

**Default limits:**
- 30 requests per menit
- 500 requests per jam
- 2 detik cooldown minimum antar perintah CAUTIOUS

**READ_ONLY commands tidak dihitung dalam limit.**

**Jika limit tercapai:**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Try again in 15 seconds.",
  "retryAfterMs": 15000
}
```

### Environment Protection

Server **menolak untuk start** jika:

```bash
# .env file contains:
APP_ENV=production
```

**Error message:**
```
[FATAL ERROR] Refusing to run in PRODUCTION environment. 
This server is designed for LOCAL development only.
```

**Warning untuk staging:**
```bash
# .env file contains:
APP_ENV=staging
```

**Warning message:**
```
[WARNING] Running in STAGING environment. Proceed with caution.
```

---

## 🔍 Development & Debugging

### MCP Inspector

Gunakan MCP Inspector untuk debug tools secara interaktif:

```bash
# Install inspector (jika belum)
npm install -g @modelcontextprotocol/inspector

# Run inspector
npm run inspect /path/to/laravel-project
```

**Inspector akan:**
1. Start MCP server
2. Buka web interface di browser
3. Tampilkan semua tools, resources, prompts
4. Izinkan testing tool secara interaktif

### Development Mode

Watch mode untuk auto-rebuild saat edit code:

```bash
npm run dev /path/to/laravel-project
```

### Enable Debug Logging

Set environment variable untuk verbose logging:

```bash
# Unix/Mac
DEBUG=mcp:* node build/index.js /path/to/laravel-project

# Windows CMD
set DEBUG=mcp:* && node build/index.js /path/to/laravel-project

# Windows PowerShell
$env:DEBUG="mcp:*"; node build/index.js /path/to/laravel-project
```

---

## 🐛 Troubleshooting

### Error: "Invalid Laravel path"

**Problem:** Server tidak menemukan file `artisan` di path yang diberikan.

**Solution:**
```bash
# Pastikan path mengarah ke ROOT project Laravel
ls /path/to/laravel-project/artisan

# Bukan ke subfolder
# ❌ SALAH: /path/to/laravel-project/app
# ✅ BENAR: /path/to/laravel-project
```

### Error: "Refusing to run in PRODUCTION environment"

**Problem:** File `.env` memiliki `APP_ENV=production`.

**Solution:**
```bash
# Edit .env
APP_ENV=local    # atau 'development'

# Server ini HANYA untuk development, TIDAK untuk production!
```

### Error: "PHP binary not found"

**Problem:** Command `php` tidak ditemukan di PATH.

**Solution:**
```bash
# Option 1: Tambahkan PHP ke PATH (recommended)
export PATH="/usr/local/bin:$PATH"

# Option 2: Specify PHP path explicitly
node build/index.js /path/to/laravel --php /usr/bin/php8.2
```

### Error: "Command not allowed"

**Problem:** AI mencoba menjalankan command yang di-blocklist.

**Solution:**
Ini adalah **fitur keamanan**. Command berbahaya seperti `migrate:fresh`, `db:wipe`, dll memang diblokir secara permanen.

**Workaround:**
```bash
# Jalankan manual di terminal kamu (jika benar-benar diperlukan)
cd /path/to/laravel-project
php artisan migrate:fresh --seed
```

### Tools tidak muncul di Claude Desktop

**Problem:** Setelah konfigurasi, tools tidak muncul.

**Solution:**
1. Restart Claude Desktop
2. Cek file config path:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Cek build folder exist: `ls build/index.js`
4. Test manual:
   ```bash
   node build/index.js /path/to/laravel-project
   # Should output: [INFO] Laravel MCP Server running on stdio transport.
   ```

---

## 🧪 Running Tests

### Full Test Suite

```bash
npm test
```

**Expected output:**
```
✓ classifyCommand() - READ_ONLY commands (7 tests)
✓ classifyCommand() - CAUTIOUS commands (12 tests)
✓ classifyCommand() - DANGEROUS commands (20 tests)
✓ sanitizeArgs() - Shell injection protection (8 tests)
✓ isPathSafe() - Path traversal protection (6 tests)
✓ isWriteAllowed() - Write protection (5 tests)
✓ sanitizeTinkerCode() - Tinker sandbox (8 tests)
✓ Rate Limiter (4 tests)
✓ Environment check (3 tests)

Total: 40 tests passed
```

### Run Specific Test File

```bash
# Unix/Mac
node --test build/tests/security.test.js

# Windows
node --test build\tests\security.test.js
```

---

## 🤝 Contributing

Kontribusi sangat welcome! Terutama untuk:

1. **Security improvements** — Additional validation, better sandboxing
2. **Tool additions** — New Laravel-specific tools
3. **Bug fixes** — Especially edge cases di Windows/Mac/Linux
4. **Documentation** — Tutorial, use cases, best practices

**Contribution guidelines:**
1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

**Testing requirements:**
- ✅ Semua test harus pass: `npm test`
- ✅ TypeScript harus compile tanpa error: `npm run build`
- ✅ Tambahkan test untuk fitur baru

---

## 📄 License

MIT License — feel free to use in your projects!

---

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) — MCP SDK
- [Anthropic](https://www.anthropic.com/) — Claude Desktop
- [Laravel](https://laravel.com/) — The PHP Framework

---

## 📞 Support

- 📖 **Documentation:** [QUICK_START.md](QUICK_START.md) · [SECURITY.md](SECURITY.md)
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/Falzz1010/laravel-mcp-server/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/Falzz1010/laravel-mcp-server/discussions)

---

<div align="center">

**Made with ❤️ for Laravel Developers**

⭐ Star this repo if you find it useful!

</div>
