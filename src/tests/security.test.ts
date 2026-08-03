import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  classifyCommand,
  isCommandAllowed,
  sanitizeArgs,
  validateDangerousFlags,
  sanitizeTinkerCode,
  isPathSafe,
  isReadAllowed,
  isWriteAllowed,
  maskEnvValues,
} from "../utils/security.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import { parseConfig } from "../utils/config.js";

test("Command Classification & Safelist", () => {
  assert.equal(classifyCommand("about"), "READ_ONLY");
  assert.equal(classifyCommand("route:list"), "READ_ONLY");
  assert.equal(classifyCommand("make:controller"), "CAUTIOUS");
  assert.equal(classifyCommand("migrate"), "CAUTIOUS");
  assert.equal(classifyCommand("migrate:fresh"), "DANGEROUS");
  assert.equal(classifyCommand("db:wipe"), "DANGEROUS");
  assert.equal(classifyCommand("down"), "DANGEROUS");
  assert.equal(classifyCommand("unknown:command"), "DANGEROUS");

  assert.equal(isCommandAllowed("about").allowed, true);
  assert.equal(isCommandAllowed("migrate:fresh").allowed, false);
  assert.equal(isCommandAllowed("down").allowed, false);
});

test("Input Sanitization & Injections", () => {
  assert.deepEqual(sanitizeArgs(["ProductController", "--resource"]), [
    "ProductController",
    "--resource",
  ]);

  assert.throws(() => sanitizeArgs(["; rm -rf /"]), /Security Error/);
  assert.throws(() => sanitizeArgs(["&& cat /etc/passwd"]), /Security Error/);
  assert.throws(() => sanitizeArgs(["$(whoami)"]), /Security Error/);
  assert.throws(() => sanitizeArgs(["`id`"]), /Security Error/);
  assert.throws(() => sanitizeArgs(["../etc/passwd"]), /Security Error/);
  assert.throws(() => sanitizeArgs(["arg > out.txt"]), /Security Error/);

  // Long arg check
  const longArg = "a".repeat(300);
  assert.throws(() => sanitizeArgs([longArg]), /exceeds 255/);

  // Too many args check
  const manyArgs = Array(25).fill("arg");
  assert.throws(() => sanitizeArgs(manyArgs), /Too many arguments/);
});

test("Dangerous Flags Check", () => {
  assert.throws(
    () => validateDangerousFlags("migrate", ["--force"]),
    /--force/
  );
  assert.throws(
    () => validateDangerousFlags("migrate", ["--seed"]),
    /--seed/
  );
  assert.throws(
    () => validateDangerousFlags("db:seed", ["--drop-tables"]),
    /prohibited/i
  );

  // Valid flags
  assert.doesNotThrow(() =>
    validateDangerousFlags("migrate", ["--pretend"])
  );
});

test("Tinker Code Sanitization", () => {
  assert.equal(sanitizeTinkerCode("User::count();").safe, true);
  assert.equal(sanitizeTinkerCode("config('app.name');").safe, true);

  const check1 = sanitizeTinkerCode("exec('whoami');");
  assert.equal(check1.safe, false);
  assert.ok(check1.blocked.includes("exec"));

  const check2 = sanitizeTinkerCode("DB::statement('DROP TABLE users');");
  assert.equal(check2.safe, false);
  assert.ok(check2.blocked.includes("DB::statement"));

  const check3 = sanitizeTinkerCode("unlink('/tmp/file');");
  assert.equal(check3.safe, false);
  assert.ok(check3.blocked.includes("unlink"));
});

test("Path Security", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-test-"));
  const appDir = path.join(tmpDir, "app");
  fs.mkdirSync(appDir, { recursive: true });

  assert.equal(
    isPathSafe("app/Models/User.php", tmpDir),
    path.resolve(tmpDir, "app/Models/User.php")
  );

  assert.throws(() => isPathSafe("../../etc/passwd", tmpDir), /Security Error/);

  // Clean up
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Write Permission Check", () => {
  assert.equal(isWriteAllowed("app/Http/Controllers/TestController.php").allowed, true);
  assert.equal(isWriteAllowed("routes/api.php").allowed, true);
  assert.equal(isWriteAllowed("database/migrations/2026_create_test.php").allowed, true);

  assert.equal(isWriteAllowed(".env").allowed, false);
  assert.equal(isWriteAllowed("vendor/autoload.php").allowed, false);
  assert.equal(isWriteAllowed("artisan").allowed, false);
  assert.equal(isWriteAllowed("app/test.sh").allowed, false);
  assert.equal(isWriteAllowed("public/index.php").allowed, false);
});

test("Environment Masking", () => {
  const rawEnv = `
APP_NAME=Laravel
DB_PASSWORD=secret123
API_KEY=xyz_789
APP_URL=http://localhost
`;
  const masked = maskEnvValues(rawEnv);
  assert.ok(masked.includes("APP_NAME=Laravel"));
  assert.ok(masked.includes("DB_PASSWORD=***MASKED***"));
  assert.ok(masked.includes("API_KEY=***MASKED***"));
  assert.ok(masked.includes("APP_URL=http://localhost"));
});

test("Rate Limiter", () => {
  const limiter = new RateLimiter({
    maxRequestsPerMinute: 3,
    maxRequestsPerHour: 10,
    cooldownMs: 0, // Disable cooldown for fast test
  });

  assert.equal(limiter.checkRateLimit().allowed, true);
  limiter.recordRequest();

  assert.equal(limiter.checkRateLimit().allowed, true);
  limiter.recordRequest();

  assert.equal(limiter.checkRateLimit().allowed, true);
  limiter.recordRequest();

  // 4th request should be blocked
  assert.equal(limiter.checkRateLimit().allowed, false);
});

test("Path traversal: sibling directory sharing the root prefix", () => {
  // Regression: startsWith() accepted /srv/app-secrets for root /srv/app.
  const root = path.join(os.tmpdir(), "ptroot");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(`${root}-secrets`, { recursive: true });

  assert.throws(() => isPathSafe("../ptroot-secrets/creds.php", root), /Path traversal/);
  assert.throws(() => isPathSafe("../../etc/passwd", root), /Path traversal/);

  // Legitimate paths inside the root still resolve.
  assert.equal(isPathSafe("app/Models/User.php", root), path.join(root, "app/Models/User.php"));
  assert.equal(isPathSafe(".", root), root);
});

test("read_file blocklist: credential files beyond .env", () => {
  assert.equal(isReadAllowed("app/Models/User.php").allowed, true);
  assert.equal(isReadAllowed("routes/web.php").allowed, true);

  // .env and every variant
  assert.equal(isReadAllowed(".env").allowed, false);
  assert.equal(isReadAllowed(".ENV").allowed, false);
  assert.equal(isReadAllowed(".env.production").allowed, false);
  assert.equal(isReadAllowed("app/../.env").allowed, false);

  // Secrets with no masked equivalent
  assert.equal(isReadAllowed(".git/config").allowed, false);
  assert.equal(isReadAllowed("auth.json").allowed, false);
  assert.equal(isReadAllowed("storage/oauth-private.key").allowed, false);
  assert.equal(isReadAllowed("app/certs/server.pem").allowed, false);
});

test("Env masking: credentials embedded in DSN values", () => {
  const masked = maskEnvValues(
    [
      "DATABASE_URL=mysql://root:hunter2@db/app",
      "REDIS_URL=redis://:pw@host",
      "DB_USERNAME=admin",
      "DB_PASSWORD=hunter2",
      "APP_URL=http://localhost",
      "APP_ENV=local",
      "# DATABASE_URL=mysql://commented:out@host/db",
    ].join("\n")
  );

  assert.match(masked, /^DATABASE_URL=\*\*\*MASKED\*\*\*$/m);
  assert.match(masked, /^REDIS_URL=\*\*\*MASKED\*\*\*$/m);
  assert.match(masked, /^DB_USERNAME=\*\*\*MASKED\*\*\*$/m);
  assert.match(masked, /^DB_PASSWORD=\*\*\*MASKED\*\*\*$/m);

  // Non-secrets stay readable, comments untouched
  assert.match(masked, /^APP_URL=http:\/\/localhost$/m);
  assert.match(masked, /^APP_ENV=local$/m);
  assert.match(masked, /^# DATABASE_URL=mysql:\/\/commented:out@host\/db$/m);

  assert.doesNotMatch(masked, /hunter2/);
});

test("Tinker blocklist covers file reads and env access", () => {
  for (const code of [
    'echo file_get_contents("../../.env");',
    'echo env("APP_KEY");',
    'echo getenv("DB_PASSWORD");',
    'include "/etc/passwd";',
    'call_user_func("system", "ls");',
  ]) {
    assert.equal(sanitizeTinkerCode(code).safe, false, `should block: ${code}`);
  }

  assert.equal(sanitizeTinkerCode("User::count();").safe, true);
  assert.equal(sanitizeTinkerCode('config("app.name");').safe, true);
});

test("CLI Config Parsing", () => {
  const config = parseConfig([
    "node",
    "index.js",
    "/path/to/laravel",
    "--allow-write",
    "--allow-tinker",
    "--dry-run",
    "--timeout",
    "15000",
  ]);

  assert.equal(config.laravelPath, path.resolve("/path/to/laravel"));
  assert.equal(config.allowWrite, true);
  assert.equal(config.allowTinker, true);
  assert.equal(config.dryRun, true);
  assert.equal(config.commandTimeout, 15000);
});
