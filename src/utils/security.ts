import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type CommandTier = "READ_ONLY" | "CAUTIOUS" | "DANGEROUS";

const READ_ONLY_COMMANDS = new Set([
  "about",
  "env",
  "route:list",
  "migrate:status",
  "schedule:list",
  "config:show",
]);

const CAUTIOUS_COMMANDS = new Set([
  "route:cache",
  "route:clear",
  "config:cache",
  "config:clear",
  "cache:clear",
  "view:clear",
  "optimize",
  "optimize:clear",
  "migrate",
  "db:seed",
  "key:generate",
  "storage:link",
]);

const DANGEROUS_COMMANDS = new Set([
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
]);

const DANGEROUS_FNS_TINKER = [
  "exec",
  "system",
  "passthru",
  "shell_exec",
  "popen",
  "proc_open",
  "unlink",
  "rmdir",
  "mkdir",
  "rename",
  "copy",
  "chmod",
  "chown",
  "file_put_contents",
  "fwrite",
  "fopen",
  "curl_exec",
  "eval",
  "assert",
  "ini_set",
  "putenv",
  "dl",
  "truncate",
  "forceDelete",
  "DB::statement",
  "DB::unprepared",
  "Schema::drop",
  "Schema::dropIfExists",
];

const ALLOWED_WRITE_EXTENSIONS = new Set([
  ".php",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".stub",
  ".md",
  ".txt",
]);

const ALLOWED_WRITE_DIRS = [
  "app",
  "routes",
  "database/migrations",
  "database/seeders",
  "database/factories",
  "resources/views",
  "config",
  "tests",
];

const BLOCKED_WRITE_PATHS = [
  ".env",
  "vendor",
  "node_modules",
  "storage",
  "public",
  "bootstrap",
  "artisan",
  "composer.json",
  "composer.lock",
  ".git",
];

export function validateLaravelPath(laravelPath: string): void {
  if (!fs.existsSync(laravelPath)) {
    throw new Error(`Directory does not exist: ${laravelPath}`);
  }
  const artisanPath = path.join(laravelPath, "artisan");
  if (!fs.existsSync(artisanPath)) {
    throw new Error(`Target directory is not a valid Laravel project (missing 'artisan' file): ${laravelPath}`);
  }
}

export function checkEnvironment(laravelPath: string): void {
  const envPath = path.join(laravelPath, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/^APP_ENV\s*=\s*(.*)$/m);
    if (match) {
      const envValue = match[1].trim().replace(/^["']|["']$/g, "");
      if (envValue.toLowerCase() === "production") {
        throw new Error("SECURITY BLOCK: Laravel MCP Server refuses to start when APP_ENV=production.");
      } else if (envValue.toLowerCase() === "staging") {
        console.error("[WARNING] Server running in STAGING environment. Exercise caution.");
      }
    }
  }
}

export function classifyCommand(command: string): CommandTier {
  const normalized = command.trim().toLowerCase();
  if (DANGEROUS_COMMANDS.has(normalized)) {
    return "DANGEROUS";
  }
  if (READ_ONLY_COMMANDS.has(normalized)) {
    return "READ_ONLY";
  }
  if (CAUTIOUS_COMMANDS.has(normalized) || normalized.startsWith("make:")) {
    return "CAUTIOUS";
  }
  return "DANGEROUS";
}

export function isCommandAllowed(command: string): { allowed: boolean; tier: CommandTier; reason: string } {
  const tier = classifyCommand(command);
  if (tier === "DANGEROUS") {
    return {
      allowed: false,
      tier,
      reason: `Command '${command}' is classified as DANGEROUS or UNKNOWN and is permanently blocked for safety.`,
    };
  }
  return {
    allowed: true,
    tier,
    reason: `Command '${command}' is permitted in tier ${tier}.`,
  };
}

export function sanitizeArgs(args: string[]): string[] {
  if (args.length > 20) {
    throw new Error("Security Error: Too many arguments (max 20).");
  }

  const injectionRegex = /[;&|`$><\r\n\0]|^\.\.\/|^\.\.\\/;

  return args.map((arg) => {
    if (arg.length > 255) {
      throw new Error(`Security Error: Argument exceeds 255 characters limit: '${arg.substring(0, 20)}...'`);
    }
    if (injectionRegex.test(arg)) {
      throw new Error(`Security Error: Argument contains illegal characters or injection attempt: '${arg}'`);
    }
    if (arg.includes("../") || arg.includes("..\\")) {
      throw new Error(`Security Error: Path traversal detected in argument: '${arg}'`);
    }
    return arg.trim();
  });
}

export function validateDangerousFlags(command: string, args: string[]): void {
  const lowerArgs = args.map((a) => a.toLowerCase());

  if (lowerArgs.includes("--force")) {
    if (["migrate", "db:seed", "key:generate"].includes(command.toLowerCase())) {
      throw new Error(`Security Error: '--force' flag is strictly blocked on command '${command}'.`);
    }
  }

  if (lowerArgs.includes("--seed") && command.toLowerCase() === "migrate") {
    throw new Error("Security Error: '--seed' flag is blocked on 'migrate'. Use 'db:seed' tool explicitly.");
  }

  for (const arg of lowerArgs) {
    if (arg.startsWith("--drop-") || arg.startsWith("--wipe")) {
      throw new Error(`Security Error: Destructive flag '${arg}' is prohibited.`);
    }
  }
}

export function sanitizeTinkerCode(code: string): { safe: boolean; blocked: string[] } {
  if (code.length > 2000) {
    return { safe: false, blocked: ["Code length exceeds max limit of 2000 characters"] };
  }

  const blocked: string[] = [];

  for (const fn of DANGEROUS_FNS_TINKER) {
    // Check regex pattern for fn occurrence
    const pattern = new RegExp(`\\b${fn.replace(/::/g, "::")}\\b`, "i");
    if (pattern.test(code)) {
      blocked.push(fn);
    }
  }

  return {
    safe: blocked.length === 0,
    blocked,
  };
}

export function isPathSafe(relativePath: string, rootPath: string): string {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedTarget = path.resolve(resolvedRoot, relativePath);

  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error(`Security Error: Path traversal attempt blocked: '${relativePath}'`);
  }

  // Check for symlink outside root if target exists
  if (fs.existsSync(resolvedTarget)) {
    const realPath = fs.realpathSync(resolvedTarget);
    if (!realPath.startsWith(resolvedRoot)) {
      throw new Error(`Security Error: Symlink points outside project root: '${relativePath}'`);
    }
  }

  return resolvedTarget;
}

export function isWriteAllowed(relativePath: string): { allowed: boolean; reason: string } {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\.\//, "");

  // Check blocked paths
  for (const blocked of BLOCKED_WRITE_PATHS) {
    if (normalized === blocked || normalized.startsWith(`${blocked}/`)) {
      return {
        allowed: false,
        reason: `Writing to '${blocked}' is strictly prohibited.`,
      };
    }
  }

  // Check extension whitelist
  const ext = path.extname(normalized).toLowerCase();
  const isBlade = normalized.endsWith(".blade.php");

  if (!isBlade && !ALLOWED_WRITE_EXTENSIONS.has(ext)) {
    return {
      allowed: false,
      reason: `File extension '${ext}' is not in the whitelist for write operations.`,
    };
  }

  // Check directory whitelist
  const isInAllowedDir = ALLOWED_WRITE_DIRS.some(
    (dir) => normalized === dir || normalized.startsWith(`${dir}/`)
  );

  if (!isInAllowedDir) {
    return {
      allowed: false,
      reason: `Target path '${normalized}' is outside allowed directories (${ALLOWED_WRITE_DIRS.join(", ")}).`,
    };
  }

  return { allowed: true, reason: "Path is permitted for writing." };
}

export function maskEnvValues(content: string): string {
  const sensitivePattern = /(PASSWORD|SECRET|KEY|TOKEN|HASH|PRIVATE|CREDENTIAL|API_KEY|AUTH|MAIL_PASSWORD|AWS_|REDIS_PASSWORD|DB_PASSWORD|PUSHER_|MIX_PUSHER_)/i;

  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) {
        return line;
      }
      const key = line.substring(0, eqIndex).trim();
      if (sensitivePattern.test(key)) {
        return `${key}=***MASKED***`;
      }
      return line;
    })
    .join("\n");
}

export function computeFileHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
