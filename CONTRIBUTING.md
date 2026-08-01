# Contributing to Laravel MCP Server

Thank you for your interest in contributing! This guide will help you get started.

## 🎯 Areas for Contribution

We welcome contributions in these areas:

### 1. Security Improvements
- Additional validation layers
- Better sandboxing mechanisms
- Enhanced input sanitization
- Security audit findings

### 2. New Tools
- Laravel-specific tools (e.g., `optimize_queries`, `check_n_plus_one`)
- Development helpers (e.g., `generate_test_data`)
- Code analysis tools (e.g., `analyze_performance`)

### 3. Bug Fixes
- Platform-specific issues (Windows/macOS/Linux)
- Edge cases in path handling
- Command execution issues
- Rate limiter improvements

### 4. Documentation
- Usage tutorials
- Real-world use cases
- Best practices guides
- Video tutorials

### 5. Testing
- Additional test cases
- Integration tests
- Performance tests
- Cross-platform testing

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or newer
- PHP 8.0 or newer
- A local Laravel project for testing
- Git

### Setup Development Environment

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/laravel-mcp-server.git
cd laravel-mcp-server

# 3. Add upstream remote
git remote add upstream https://github.com/original/laravel-mcp-server.git

# 4. Install dependencies
npm install

# 5. Build the project
npm run build

# 6. Run tests
npm test
```

### Development Workflow

```bash
# Watch mode for auto-rebuild during development
npm run dev /path/to/test-laravel-project

# Run tests after making changes
npm test

# Use MCP Inspector for interactive testing
npm run inspect /path/to/test-laravel-project
```

## 📝 Contribution Guidelines

### Code Style

- **TypeScript**: Use strict mode, follow existing patterns
- **Naming**: Use descriptive names (`validateLaravelPath` not `valPath`)
- **Comments**: Document complex logic, especially security checks
- **Error Messages**: Clear, actionable error messages for users

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for Laravel 11 new artisan commands
fix: prevent path traversal in Windows UNC paths
docs: add troubleshooting section for macOS
test: add tests for rate limiter edge cases
security: block additional dangerous PHP functions in Tinker
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write clear, focused commits
   - Add tests for new features
   - Update documentation

3. **Test thoroughly**
   ```bash
   npm test                          # Run all tests
   npm run build                     # Ensure clean build
   npm run inspect /test/project     # Manual testing
   ```

4. **Update documentation**
   - Update README.md if adding features
   - Add examples for new tools
   - Update CHANGELOG.md

5. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```
   - Fill out the PR template
   - Reference related issues
   - Add screenshots/examples if relevant

6. **Code Review**
   - Respond to feedback
   - Make requested changes
   - Keep discussion professional

## ✅ Testing Requirements

All contributions must include appropriate tests:

### For New Tools
```typescript
// Example test structure
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('New Tool', () => {
  it('should handle valid input', () => {
    // Test implementation
  });

  it('should reject invalid input', () => {
    // Security test
  });

  it('should respect rate limits', () => {
    // Rate limit test
  });
});
```

### For Security Changes
- **Must** include tests demonstrating the vulnerability is fixed
- **Must** not break existing security tests
- **Should** include documentation of the security issue

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node --test build/tests/security.test.js

# Run with verbose output
DEBUG=mcp:* npm test
```

## 🔒 Security Contributions

Security is critical for this project. If you find a security vulnerability:

### For Non-Critical Issues
- Open a regular issue with the `security` label
- Include steps to reproduce
- Suggest a fix if possible

### For Critical Issues
- **DO NOT** open a public issue
- Email maintainers directly (see README)
- Include detailed reproduction steps
- Wait for confirmation before disclosure

### Security Testing Checklist
- [ ] No shell injection possible
- [ ] Path traversal prevented
- [ ] Rate limiting works correctly
- [ ] Audit logging captures all operations
- [ ] Dangerous commands properly blocked
- [ ] Input sanitization comprehensive

## 📚 Documentation Standards

### README Updates
- Keep examples concise and practical
- Test all code examples
- Use proper markdown formatting
- Update Table of Contents if needed

### Code Comments
```typescript
// ✅ Good: Explains WHY
// Block --force on migrate to prevent accidental production data loss
if (command === 'migrate' && args.includes('--force')) {
  throw new Error('--force flag not allowed on migrate');
}

// ❌ Bad: Just restates WHAT
// Check if command is migrate and args has force
if (command === 'migrate' && args.includes('--force')) {
```

### JSDoc for Public APIs
```typescript
/**
 * Validates that a path is within the Laravel project root.
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 * 
 * @param relativePath - Path relative to project root
 * @param rootPath - Absolute path to Laravel project
 * @returns Absolute path if safe
 * @throws {Error} If path traversal detected or path outside root
 */
export function isPathSafe(relativePath: string, rootPath: string): string {
  // Implementation
}
```

## 🎨 Adding New Tools

Follow this template when adding a new tool:

```typescript
// src/tools/my-new-tool.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ServerConfig } from "../utils/config.js";

const schema = z.object({
  param1: z.string().describe("Description of parameter"),
  param2: z.number().optional().describe("Optional parameter"),
});

export function registerMyNewTool(
  server: McpServer,
  config: ServerConfig
): void {
  server.addTool({
    name: "my_new_tool",
    description: "Clear description of what this tool does",
    inputSchema: schema,
    handler: async (input) => {
      const args = schema.parse(input);
      
      // 1. Security checks
      // 2. Rate limiting if needed
      // 3. Audit logging
      // 4. Execute operation
      // 5. Return result
      
      return {
        content: [
          {
            type: "text",
            text: "Result of operation",
          },
        ],
      };
    },
  });
}
```

## 🤝 Community Guidelines

- Be respectful and constructive
- Help others learn and grow
- Focus on the code, not the person
- Celebrate contributions of all sizes
- Share knowledge and expertise

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

- Open a discussion on GitHub
- Tag maintainers for help
- Check existing issues/PRs for context

Thank you for contributing! 🎉
