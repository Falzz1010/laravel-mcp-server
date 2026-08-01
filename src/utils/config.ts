import path from "node:path";

export interface ServerConfig {
  laravelPath: string;
  phpBinary: string;
  commandTimeout: number;
  maxLogLines: number;
  allowWrite: boolean;
  allowTinker: boolean;
  dryRun: boolean;
  rateLimit: number;
}

export function parseConfig(argv: string[]): ServerConfig {
  const args = argv.slice(2);
  let laravelPath = "";
  let phpBinary = "php";
  let commandTimeout = 30000;
  let maxLogLines = 200;
  let allowWrite = false;
  let allowTinker = false;
  let dryRun = false;
  let rateLimit = 30;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--allow-write") {
      allowWrite = true;
    } else if (arg === "--allow-tinker") {
      allowTinker = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--php" && i + 1 < args.length) {
      phpBinary = args[++i];
    } else if (arg === "--timeout" && i + 1 < args.length) {
      const parsed = parseInt(args[++i], 10);
      if (!isNaN(parsed) && parsed > 0) {
        commandTimeout = parsed;
      }
    } else if (arg === "--rate-limit" && i + 1 < args.length) {
      const parsed = parseInt(args[++i], 10);
      if (!isNaN(parsed) && parsed > 0) {
        rateLimit = parsed;
      }
    } else if (arg === "--max-log-lines" && i + 1 < args.length) {
      const parsed = parseInt(args[++i], 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxLogLines = parsed;
      }
    } else if (!arg.startsWith("--") && !laravelPath) {
      laravelPath = path.resolve(arg);
    }
  }

  if (!laravelPath) {
    // Default to current working directory if not supplied
    laravelPath = process.cwd();
  }

  return {
    laravelPath,
    phpBinary,
    commandTimeout,
    maxLogLines,
    allowWrite,
    allowTinker,
    dryRun,
    rateLimit,
  };
}
