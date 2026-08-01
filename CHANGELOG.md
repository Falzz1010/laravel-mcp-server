# Changelog

All notable changes to Laravel MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-08-01

### Fixed
- Added shebang to fix EOF error on Windows

### Security
- Added GitHub Actions security workflows (CodeQL, Snyk, OpenSSF Scorecard)
- Implemented npm package provenance
- Added SBOM (Software Bill of Materials) generation
- Enhanced dependency review automation
- Added security badges to README

## [1.0.0] - 2026-08-01

### 🎉 Initial Release

#### Added
- **7 Core Tools**
  - `run_artisan` - Execute safe Laravel artisan commands
  - `read_logs` - Read Laravel application logs with filtering
  - `list_routes` - View all application routes
  - `read_env` - View environment variables with credential masking
  - `read_file` - Read project source code
  - `write_file` - Write/edit files with strict safety controls (opt-in)
  - `run_tinker` - Execute PHP code in sandboxed Tinker environment (opt-in)

- **3 Laravel Resources**
  - `laravel://env` - Static view of masked environment variables
  - `laravel://routes` - JSON view of all routes
  - `laravel://config/{key}` - Dynamic configuration value reader

- **3 Smart Prompts**
  - `debug-error` - Auto-read logs and request AI diagnosis
  - `create-crud` - Template for generating complete CRUD resources
  - `review-code` - Laravel-focused code review prompt

- **10-Layer Security System**
  - Environment gate (refuses to run in production)
  - 3-tier command risk classification (READ_ONLY/CAUTIOUS/DANGEROUS)
  - 20+ permanently blocked destructive commands
  - Input sanitization against shell injection
  - Path traversal protection
  - File write whitelist (directories & extensions)
  - Automatic backup before file modifications
  - Tinker sandbox (blocks 15+ dangerous PHP functions)
  - Rate limiting (30 req/min, 500 req/hour)
  - Full audit logging to `.laravel-mcp-audit.jsonl`

- **CLI Options**
  - `--allow-write` - Enable file writing capability
  - `--allow-tinker` - Enable Tinker code execution
  - `--dry-run` - Preview mode without actual execution
  - `--php [path]` - Custom PHP binary path
  - `--timeout [ms]` - Custom command timeout
  - `--rate-limit [n]` - Custom rate limit

#### Security
- **3-Tier Command Classification**
  - 🟢 READ_ONLY: Safe commands executed immediately
  - 🟡 CAUTIOUS: Logged and rate-limited commands
  - 🔴 DANGEROUS: Permanently blocked destructive commands

- **Path Traversal Protection**
  - All file operations validate paths stay within project root
  - Symlinks checked to prevent escaping project directory
  - Special protection for `.env` and system files

- **Rate Limiting**
  - 30 requests per minute default
  - 500 requests per hour default
  - 2-second cooldown between CAUTIOUS commands
  - READ_ONLY commands excluded from limits

- **Audit Trail**
  - Every operation logged to `.laravel-mcp-audit.jsonl`
  - Includes timestamp, tool, command, args, exit code, duration
  - Logs preserved with SHA-256 hashes for file writes
  - Auto-rotation when log exceeds 10MB

- **Auto-Backup System**
  - Files backed up to `.laravel-mcp-backup/` before overwrite
  - Timestamp-based backup naming
  - Enables safe rollback of AI-made changes

#### Documentation
- Comprehensive README with installation, configuration, usage examples
- Detailed implementation plan with security architecture
- Troubleshooting guide for common issues
- Tool reference with parameters and examples

#### Testing
- 40+ security-focused unit tests
- Command classification validation
- Input sanitization tests
- Path security tests
- Rate limiter tests
- Environment safety checks

### Notes
- Designed for **local development only** - refuses to run in production
- Default mode is read-only for maximum safety
- Requires Node.js 18+ and PHP 8.0+
- Compatible with Laravel 8+

[1.0.0]: https://github.com/your-username/laravel-mcp-server/releases/tag/v1.0.0
