import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import {
  isCommandAllowed,
  sanitizeArgs,
  validateDangerousFlags,
} from "../utils/security.js";
import { runArtisan } from "../utils/process.js";
import { logAudit } from "../utils/audit.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import { errorResult, textResult, denied, rateLimitGuard, type AuditContext } from "../utils/mcp.js";

export function registerRunArtisanTool(
  server: McpServer,
  config: ServerConfig,
  rateLimiter: RateLimiter
): void {
  server.registerTool(
    "run_artisan",
    {
      title: "Run Laravel Artisan Command",
      description:
        "Executes safe php artisan commands in the target Laravel project. Destructive commands (migrate:fresh, db:wipe, down) are permanently blocked.",
      inputSchema: z.object({
        command: z
          .string()
          .describe("The artisan command to run (e.g. 'make:controller', 'route:list', 'migrate')"),
        args: z
          .array(z.string())
          .optional()
          .describe("Additional command arguments (e.g. ['ProductController', '--resource'])"),
      }),
    },
    async ({ command, args = [] }) => {
      // 1. Classify the command. Tier drives both the audit trail and whether
      //    the call counts against the rate limit, so it comes first.
      const check = isCommandAllowed(command);
      const audit: AuditContext = { tool: "run_artisan", tier: check.tier, command, args };

      if (!check.allowed) {
        return denied(audit, "[SECURITY BLOCK]", check.reason);
      }

      // 2. Rate limit.
      const limited = rateLimitGuard(rateLimiter, audit);
      if (limited) {
        return limited;
      }

      // 3. Sanitize args and reject destructive flags.
      let cleanArgs: string[];
      try {
        cleanArgs = sanitizeArgs(args);
        validateDangerousFlags(command, cleanArgs);
      } catch (err: any) {
        return denied(audit, "[SECURITY BLOCK]", err.message);
      }

      // Read-only commands don't consume budget; anything that can mutate does.
      if (check.tier !== "READ_ONLY") {
        rateLimiter.recordRequest();
      }

      if (config.dryRun) {
        logAudit({ ...audit, args: cleanArgs, status: "ALLOWED", reason: "DRY-RUN MODE" });
        return textResult(
          `[DRY-RUN PREVIEW] Would execute: php artisan ${command} ${cleanArgs.join(" ")}`
        );
      }

      const result = await runArtisan(command, cleanArgs, {
        laravelPath: config.laravelPath,
        phpBinary: config.phpBinary,
        timeoutMs: config.commandTimeout,
      });

      logAudit({
        ...audit,
        args: cleanArgs,
        exitCode: result.exitCode,
        outputSize: result.stdout.length + result.stderr.length,
        status: result.exitCode === 0 ? "ALLOWED" : "ERROR",
        duration: result.duration,
        reason: result.killed ? "Execution timed out" : undefined,
      });

      const output = formatOutput(result.stdout, result.stderr);
      return result.exitCode === 0 ? textResult(output) : errorResult(output);
    }
  );
}

function formatOutput(stdout: string, stderr: string): string {
  const parts = [stdout, stderr].filter(Boolean);
  if (parts.length === 0) {
    return "(Command executed successfully with no output)";
  }
  return parts.join("\n--- STDERR ---\n");
}
