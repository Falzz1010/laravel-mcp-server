# Security Policy

## 🔒 Security Philosophy

Laravel MCP Server is designed with security as the **top priority**. This tool gives AI assistants controlled access to your Laravel projects, which requires extreme caution.

### Design Principles

1. **Defense in Depth** — 10 independent security layers
2. **Fail Secure** — Reject by default, allow by whitelist
3. **Least Privilege** — Minimal permissions by default
4. **Full Auditability** — Every operation logged
5. **Local Development Only** — Explicitly refuses production environments

---

## 🛡️ Security Features

### Environment Protection
- **Refuses to start** if `APP_ENV=production`
- Warns if `APP_ENV=staging`
- Validates Laravel project structure before starting

### Command Security
- **3-Tier Risk Classification**: READ_ONLY, CAUTIOUS, DANGEROUS
- **20+ permanently blocked commands** (e.g., `migrate:fresh`, `db:wipe`)
- **Input sanitization** blocks shell injection attempts
- **Dangerous flag blocking** (e.g., `--force`, `--seed`)
- **Rate limiting** prevents abuse (30 req/min, 500 req/hour)

### File System Security
- **Path traversal prevention** — all paths validated
- **Write whitelist** — only safe directories allowed
- **Extension whitelist** — only safe file types
- **Auto-backup** before any file modification
- **Symlink protection** — prevents escaping project root
- **Size limits** — prevents DOS via large files

### Code Execution Security
- **Tinker sandbox** — blocks 15+ dangerous PHP functions
- **Timeout enforcement** — 10 seconds for Tinker, 30s for artisan
- **No shell access** — uses `execFile`, never `exec`
- **Environment stripping** — removes sensitive env vars

### Audit & Monitoring
- **Full audit log** — every operation logged to `.laravel-mcp-audit.jsonl`
- **SHA-256 hashing** — file changes tracked with hashes
- **Session tracking** — unique session IDs
- **Duration tracking** — execution time logged
- **Status tracking** — ALLOWED/BLOCKED/ERROR

---

## 🚨 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## 🐛 Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability:

### For Non-Critical Issues
1. Open an issue on GitHub with the `security` label
2. Include:
   - Detailed description of the vulnerability
   - Steps to reproduce
   - Impact assessment
   - Suggested fix (if you have one)

### For Critical Issues
**DO NOT open a public issue.**

Instead:
1. **Email security contact** (see repository maintainers)
2. Include:
   - Detailed description
   - Proof of concept (if safe to share)
   - Your assessment of severity
   - Suggested remediation
3. **Wait for acknowledgment** before public disclosure
4. **Coordinate disclosure timeline** with maintainers

### What to Expect
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Timeline**: Depends on severity
  - Critical: Immediate priority
  - High: Within 2 weeks
  - Medium: Within 1 month
  - Low: Next regular release

---

## 🔐 Security Best Practices

### For Users

#### 1. **Never Use in Production**
```bash
# ❌ DANGEROUS - Don't do this
node build/index.js /var/www/production-app --allow-write

# ✅ SAFE - Use only locally
node build/index.js /home/dev/my-laravel-app --allow-write
```

#### 2. **Use Least Privilege**
```bash
# Start with read-only (safest)
node build/index.js /path/to/app

# Add write only if needed
node build/index.js /path/to/app --allow-write

# Add Tinker only if absolutely necessary
node build/index.js /path/to/app --allow-write --allow-tinker
```

#### 3. **Review Audit Logs Regularly**
```bash
# Check what AI has been doing
cat /path/to/laravel/.laravel-mcp-audit.jsonl | jq .

# Look for blocked commands
cat .laravel-mcp-audit.jsonl | jq 'select(.status=="BLOCKED")'

# Check file writes
cat .laravel-mcp-audit.jsonl | jq 'select(.tool=="write_file")'
```

#### 4. **Monitor File Changes**
```bash
# Review backups before accepting changes
ls -la /path/to/laravel/.laravel-mcp-backup/

# Use version control
git diff  # Always review AI-made changes
```

#### 5. **Use Dry-Run for Testing**
```bash
# Preview what would happen without executing
node build/index.js /path/to/app --dry-run
```

### For Developers

#### 1. **Validate All Input**
Every input must be validated before use:
```typescript
// ❌ DANGEROUS
const path = input.path;
fs.readFileSync(path);

// ✅ SAFE
const path = isPathSafe(input.path, config.laravelPath);
fs.readFileSync(path);
```

#### 2. **Use Whitelists, Not Blacklists**
```typescript
// ❌ DANGEROUS - Easy to bypass
if (!path.includes('etc')) { ... }

// ✅ SAFE - Explicit allow list
const ALLOWED_DIRS = ['app/', 'routes/', 'database/'];
if (ALLOWED_DIRS.some(dir => path.startsWith(dir))) { ... }
```

#### 3. **Never Use `exec()` or `shell: true`**
```typescript
// ❌ DANGEROUS - Shell injection possible
exec(`php artisan ${command}`);

// ✅ SAFE - No shell access
execFile('php', ['artisan', command]);
```

#### 4. **Always Log Security Events**
```typescript
logAudit({
  tool: 'write_file',
  tier: 'CAUTIOUS',
  filePath: path,
  fileHash: computeFileHash(content),
  status: 'ALLOWED',
});
```

---

## 📋 Security Checklist for New Features

Before merging new features, verify:

- [ ] All user input is validated
- [ ] Path traversal is prevented
- [ ] Shell injection is impossible
- [ ] Rate limiting is applied
- [ ] Audit logging is complete
- [ ] Tests cover security cases
- [ ] Documentation is updated
- [ ] No secrets in code/logs
- [ ] Error messages don't leak sensitive info
- [ ] Timeouts are enforced

---

## 🔍 Known Limitations

### By Design
1. **Local Development Only** — Not designed for production use
2. **Single Project** — One server instance per Laravel project
3. **Synchronous Execution** — Commands run sequentially
4. **Limited Tinker** — Many PHP functions blocked for safety

### Platform-Specific
1. **Windows UNC Paths** — Additional validation may be needed
2. **Symlinks** — Complex symlink scenarios may need extra testing
3. **Permissions** — Depends on host OS file permissions

### Mitigations
- Full audit trail helps detect issues
- Rate limiting prevents rapid exploitation
- Fail-secure defaults minimize risk
- Regular security reviews

---

## 📚 Security Resources

- [MCP Security Guide](https://modelcontextprotocol.io/docs/security)
- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## 🤝 Security Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities:

<!-- List will be populated as issues are reported and fixed -->

---

## 📞 Contact

For security concerns, contact project maintainers:
- GitHub: Open a security advisory
- Email: [See repository for contact info]

Thank you for helping keep Laravel MCP Server secure! 🔒
