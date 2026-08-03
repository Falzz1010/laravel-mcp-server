# Changelog

All notable changes to Laravel MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2026-08-03

### Security
- **Fixed credential disclosure via the `review-code` prompt.** `prompts/get` with
  `file_path: ".env"` returned the file unmasked because the prompt applied only
  `isPathSafe` and skipped the `isReadAllowed` gate that `read_file` uses. Prompts
  are a read surface too and now go through the same gate. Affects 1.0.5 and earlier.
- **Fixed unsanitized argument in the `laravel://config/{key}` resource.** The
  user-controlled URI segment was passed straight into a `php artisan config:show`
  argument while `run_artisan` sanitized its own args. It now goes through the
  same `sanitizeArgs` filter.
- Both fixes are locked by structural regression tests so a future refactor cannot
  silently drop either gate.

### Fixed
- Server version is now read from `package.json` at runtime instead of being
  hardcoded, so `serverInfo.version` can no longer drift from the released version.
- Published tarball no longer ships compiled test files or source maps. The test
  files contained attack-payload strings used as fixtures (reverse shells, `rm -rf /`),
  which triggered supply-chain scanner alerts on the package itself.
  73 entries / 191.4 KB unpacked -> 35 entries / 98.1 KB.

### Improved
- Extracted the three repeated MCP patterns (result shapes, block-and-audit,
  rate-limit guard) into `src/utils/mcp.ts`. Tools, resources, and prompts are
  180 lines shorter with no behaviour change.

## [1.0.5] - 2026-08-01

### Fixed
- Fixed Socket Security workflow to properly install dependencies before scanning
- Improved path traversal tests for better cross-platform reliability (Unix absolute path handling)
- Enhanced CI stability with proper npm ci before security scans

### Improved
- Socket Security workflow now runs `npm ci` to ensure package.json is available for scanning
- Better test coverage for absolute path security validation on Unix systems
- More informative Socket Security scan summary messages

## [1.0.4] - 2026-08-01

### Fixed
- Removed redundant string replacement in regex pattern (CodeQL code quality issue)

### Improved
- Added explicit npm/Socket security alerts explanation to README
- Clarified that shell access, filesystem access, and environment variable access are intentional features
- Enhanced documentation to help users understand expected security alerts

## [1.0.3] - 2026-08-01

### Fixed
- Fixed Security Audit workflow to run successfully on Linux CI
- Made path traversal security tests platform-aware (Windows vs Linux)
- Updated all GitHub Actions workflows to use Node.js 22 (avoiding deprecation warnings)
- Added improved error diagnostics to CI workflows

### Changed
- Re-enabled automated security testing on all pushes and pull requests
- Enhanced test coverage for cross-platform security validation

## [1.0.2] - 2026-08-01

### Added
- Comprehensive supply chain security documentation (SUPPLY_CHAIN_SECURITY.md)
- Project summary documentation (PROJECT_SUMMARY.md)
- 6 GitHub Actions workflows for automated security scanning
- npm package provenance and attestation support
- Enhanced security badges in README

### Security
- CodeQL static analysis (✅ passing)
- OpenSSF Scorecard security metrics
- SBOM generation for releases
- Dependency review automation
- Snyk vulnerability scanning (optional)

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
