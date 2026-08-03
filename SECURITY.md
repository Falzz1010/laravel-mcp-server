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

All 10 layers are tabulated in [README — Security Architecture](README.md#-security-architecture); the implementation lives in [`src/utils/security.ts`](src/utils/security.ts).

---

## 🚨 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## 🐛 Reporting a Vulnerability

### For Non-Critical Issues
1. Open an issue on GitHub with the `security` label
2. Include: description, steps to reproduce, impact assessment, suggested fix

### For Critical Issues
**DO NOT open a public issue.**

1. Open a [private security advisory](https://github.com/Falzz1010/laravel-mcp-server/security/advisories/new)
2. Include: description, proof of concept (if safe to share), severity assessment, suggested remediation
3. **Wait for acknowledgment** before public disclosure
4. **Coordinate disclosure timeline** with maintainers

### What to Expect
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Timeline**: Critical — immediate; High — 2 weeks; Medium — 1 month; Low — next release

### Incident Response
1. **Assess severity** using the timelines above
2. **Create security advisory** on GitHub, request CVE if needed
3. **Develop fix** privately, keep confidential until released
4. **Coordinated disclosure** — notify users, publish advisory, release patch
5. **Post-mortem** — document, add regression tests, update practices

---

## 🔗 Supply Chain Security

### Automated Scanning

| Tool | Frequency | Purpose |
|------|-----------|---------|
| **CodeQL** | Every push and PR | Static analysis for security vulnerabilities |
| **npm audit** | Every push | npm advisories; high severity fails the build |
| **Dependency Review** | Every PR | Blocks moderate+ severity and GPL/AGPL licenses |
| **OpenSSF Scorecard** | Weekly (Mondays) | Security best practices score |

[View Scorecard](https://securityscorecards.dev/viewer/?uri=github.com/Falzz1010/laravel-mcp-server)

### Package Integrity

- **npm Provenance** — published with `--provenance`, links package to source commit
- **Package Signing** — verify with `npm audit signatures`
- **TypeScript strict mode** — all code type-checked
- **Security test suite** — 19 tests covering all 10 layers, must pass before publish

### Publishing Securely

Pre-publish checklist: tests passing · no high/critical audit issues · dependencies reviewed · CHANGELOG updated · version bumped · committed and pushed.

```bash
npm run build
npm test
npm publish --provenance --access public --otp=YOUR_2FA_CODE
```

### Understanding Scanner Alerts

This package legitimately needs capabilities that supply-chain scanners flag. Expected alerts:

| Alert | Why | Mitigation |
|-------|-----|------------|
| **Shell access** | Must execute `php artisan` | Uses `execFile` (never `exec`); commands whitelisted, args sanitized |
| **Filesystem access** | Must read logs, routes, source | Path traversal protection; write access opt-in; all ops audited |
| **Environment variables** | Checks `APP_ENV` to block production | Read-only, no modification |
| **Network access** | MCP SDK stdio transport | Localhost only, no outbound connections |
| **Uses eval** | Dependencies (Zod, MCP SDK) | Not used in this codebase |

### Monitoring

[Actions](https://github.com/Falzz1010/laravel-mcp-server/actions) · [Security Overview](https://github.com/Falzz1010/laravel-mcp-server/security) · [Dependabot](https://github.com/Falzz1010/laravel-mcp-server/security/dependabot)

Enable in repository settings: Dependency Graph, Dependabot Alerts, Dependabot Security Updates, Code Scanning, Secret Scanning.

---

## 🔐 Using This Server Safely

1. **Never point it at production.** The server refuses `APP_ENV=production`, but don't rely on that alone.
2. **Start read-only.** Add `--allow-write`, then `--allow-tinker`, only when needed.
3. **Preview with `--dry-run`** before granting write access.
4. **Review the audit log** at `.laravel-mcp-audit.jsonl` — `jq 'select(.status=="BLOCKED")'` shows what was refused.
5. **Diff before accepting.** Backups land in `.laravel-mcp-backup/`; `git diff` is your last gate.
6. **Verify the package** with `npm audit signatures @falzz1010/laravel-mcp-server`.

Full flag reference and examples: [README](README.md#-usage) · [QUICK_START](QUICK_START.md).

Contributing security-sensitive code? The input-validation rules, whitelist
patterns, and the pre-merge security checklist live in
[CONTRIBUTING.md](CONTRIBUTING.md#-security-contributions).

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

---

## 📚 Security Resources

- [MCP Security Guide](https://modelcontextprotocol.io/docs/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## 📞 Contact

- **Security Issues:** [Create Security Advisory](https://github.com/Falzz1010/laravel-mcp-server/security/advisories/new)
- **General Issues:** [GitHub Issues](https://github.com/Falzz1010/laravel-mcp-server/issues)

Security researchers who responsibly disclose vulnerabilities will be acknowledged here with permission.

Thank you for helping keep Laravel MCP Server secure! 🔒
