# Supply Chain Security

This document explains the comprehensive supply chain security measures implemented in Laravel MCP Server.

## 🛡️ Security Measures

### 1. Automated Security Scanning

#### CodeQL Analysis ✅
- **Frequency:** On every push and PR
- **What it does:** Static code analysis to detect security vulnerabilities
- **Status:** ![CodeQL](https://github.com/Falzz1010/laravel-mcp-server/actions/workflows/codeql.yml/badge.svg)

#### OpenSSF Scorecard
- **Frequency:** Weekly on Mondays
- **What it does:** Evaluates project against security best practices
- **Metrics:** Branch protection, dependency updates, code review, etc.
- **View Score:** [OpenSSF Scorecard](https://securityscorecards.dev/viewer/?uri=github.com/Falzz1010/laravel-mcp-server)

#### Snyk Security Scan
- **Frequency:** Daily at midnight
- **What it does:** Scans for known vulnerabilities in dependencies
- **Setup:** Requires `SNYK_TOKEN` secret (optional)

#### npm Audit
- **Frequency:** On every push
- **What it does:** Checks for security advisories in npm packages
- **Threshold:** High severity issues fail the build

### 2. Dependency Management

#### Dependency Review
- **Frequency:** On every PR
- **What it does:** Reviews new dependencies for security issues
- **Blocks:** Dependencies with moderate+ severity issues
- **Blocks:** GPL, AGPL licenses (incompatible with MIT)

#### SBOM Generation
- **Format:** CycloneDX JSON
- **Frequency:** On every push and release
- **What it includes:** Complete software bill of materials
- **Purpose:** Transparency and vulnerability tracking

### 3. Package Integrity

#### npm Provenance
- **Enabled:** Yes (publish with `--provenance`)
- **What it does:** Links published package to source code commit
- **Benefit:** Verifiable authenticity of package

#### Package Signing
- **Method:** npm signatures
- **Verify:** `npm audit signatures`
- **Purpose:** Detect tampering

### 4. Code Quality

#### TypeScript Strict Mode
- All code type-checked with strict settings
- No `any` types without explicit declaration
- Prevents runtime type errors

#### Automated Tests
- Security test suite (19 tests)
- All tests must pass before publish
- Coverage of all 10 security layers

## 🔍 Understanding Socket Alerts

When you see alerts from Socket Security, here's what they mean:

### Expected Alerts (By Design)

#### Shell Access ⚠️
- **Why:** Package must execute `php artisan` commands
- **Mitigation:** Uses `execFile` (not `exec`), no shell injection
- **Validation:** All commands whitelisted, arguments sanitized

#### Filesystem Access ⚠️
- **Why:** Must read Laravel logs, routes, source code
- **Mitigation:** Path traversal protection, write access optional
- **Validation:** File operations audited and logged

#### Environment Variables ⚠️
- **Why:** Checks `APP_ENV` to block production usage
- **Mitigation:** Read-only access, no modification
- **Purpose:** Safety gate to prevent production accidents

#### Network Access ⚠️
- **Why:** MCP SDK uses stdio transport
- **Scope:** Localhost only, no outbound connections

### Dependency Alerts

#### Uses eval ⚠️
- **Source:** Dependencies (Zod, MCP SDK)
- **Risk:** Low (trusted libraries)
- **Your Code:** No eval usage

#### Unmaintained Packages ⚠️
- **Source:** Transitive dependencies
- **Monitored:** Dependabot tracks for updates

#### New Author ⚠️
- **Reason:** First package published by this author
- **Normal:** All new authors receive this alert

## 📊 Security Dashboard

### GitHub Security Features

Enable these in repository settings:

1. **Dependency Graph** ✅
   - Shows all dependencies
   - Enables Dependabot

2. **Dependabot Alerts** ✅
   - Auto-alerts for vulnerable dependencies
   - Weekly check for updates

3. **Dependabot Security Updates** ✅
   - Auto-creates PRs to fix vulnerabilities
   - Automatic patch updates

4. **Code Scanning** ✅
   - CodeQL analysis results
   - SARIF upload from other scanners

5. **Secret Scanning** ✅
   - Prevents committing secrets
   - Scans for leaked credentials

### Monitoring

#### View Security Status

- **GitHub Actions:** [Actions Tab](https://github.com/Falzz1010/laravel-mcp-server/actions)
- **Security Tab:** [Security Overview](https://github.com/Falzz1010/laravel-mcp-server/security)
- **Dependabot:** [Dependency Alerts](https://github.com/Falzz1010/laravel-mcp-server/security/dependabot)
- **OpenSSF:** [Scorecard](https://securityscorecards.dev/viewer/?uri=github.com/Falzz1010/laravel-mcp-server)

## 🔐 Publishing Securely

### Pre-Publish Checklist

- [ ] All tests passing
- [ ] No high/critical npm audit issues
- [ ] Dependencies reviewed
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Committed and pushed

### Publish with Provenance

```bash
npm run build
npm test
npm publish --provenance --access public --otp=YOUR_2FA_CODE
```

This creates a verifiable link between:
- The npm package
- The GitHub repository
- The exact commit
- The build environment

## 🚨 Incident Response

### If Vulnerability Discovered

1. **Assess Severity:**
   - Critical: Immediate action
   - High: 2 week timeline
   - Medium: 1 month timeline

2. **Create Security Advisory:**
   - Use GitHub Security Advisories
   - Request CVE if needed

3. **Develop Fix:**
   - Create private fork
   - Develop and test fix
   - Keep it confidential

4. **Coordinated Disclosure:**
   - Notify affected users
   - Publish advisory
   - Release patched version

5. **Post-Mortem:**
   - Document what happened
   - Add tests to prevent recurrence
   - Update security practices

## 🎯 Best Practices

### For Users

1. **Verify Package:**
   ```bash
   npm audit signatures @falzz1010/laravel-mcp-server
   ```

2. **Check SBOM:**
   - Review dependencies in `sbom.json`
   - Understand what you're installing

3. **Review Audit Log:**
   - Check `.laravel-mcp-audit.jsonl`
   - Monitor what AI is doing

4. **Use Minimal Permissions:**
   - Start without `--allow-write`
   - Add permissions only when needed

### For Contributors

1. **Security-First:**
   - Consider security impact of changes
   - Add tests for security features
   - Document security implications

2. **Dependencies:**
   - Minimize new dependencies
   - Prefer well-maintained packages
   - Check for known vulnerabilities

3. **Code Review:**
   - All PRs reviewed by maintainer
   - Security changes require extra scrutiny
   - Automated checks must pass

## 📚 Resources

- [OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Secure Supply Chain](https://slsa.dev/)
- [CycloneDX SBOM](https://cyclonedx.org/)

## 📞 Contact

- **Security Issues:** [Create Security Advisory](https://github.com/Falzz1010/laravel-mcp-server/security/advisories/new)
- **General Issues:** [GitHub Issues](https://github.com/Falzz1010/laravel-mcp-server/issues)
- **Documentation:** [SECURITY.md](SECURITY.md)

---

**Last Updated:** 2026-08-01  
**Status:** All security measures active and monitored
