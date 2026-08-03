import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { sanitizeTinkerCode } from "../utils/security.js";
import { runArtisan } from "../utils/process.js";
import { logAudit } from "../utils/audit.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import { errorResult, textResult, denied, rateLimitGuard, type AuditContext } from "../utils/mcp.js";

const TINKER_TIMEOUT_MS = 10_000;

export function registerRunTinkerTool(
  server: McpServer,
  config: ServerConfig,
  rateLimiter: RateLimiter
): void {
  if (!config.allowTinker) {
    return;
  }

  server.registerTool(
    "run_tinker",
    {
      title: "Run Laravel Tinker PHP Code (Opt-In)",
      description:
        "Executes a PHP snippet in Laravel Tinker context with strict security filtering.",
      inputSchema: z.object({
        code: z
          .string()
          .describe("PHP code snippet to execute (e.g. 'User::count();', 'config(\"app.name\");')"),
      }),
    },
    async ({ code }) => {
      const audit: AuditContext = { tool: "run_tinker", tier: "CAUTIOUS" };

      // Tinker runs arbitrary PHP, so every attempt counts against the limit.
      const limited = rateLimitGuard(rateLimiter, audit);
      if (limited) {
        return limited;
      }
      rateLimiter.recordRequest();

      // Note: run_artisan blocks "tinker" as DANGEROUS. Reaching it here is
      // deliberate — the --allow-tinker opt-in replaces that gate with this
      // keyword filter. See the ponytail: note on DANGEROUS_FNS_TINKER.
      const check = sanitizeTinkerCode(code);
      if (!check.safe) {
        return denied(
          { ...audit, tier: "DANGEROUS" },
          "[SECURITY BLOCK] Prohibited PHP functions/keywords detected:",
          check.blocked.join(", ")
        );
      }

      if (config.dryRun) {
        logAudit({ ...audit, status: "ALLOWED", reason: "DRY-RUN MODE" });
        return textResult(`[DRY-RUN PREVIEW] Would execute in tinker:\n${code}`);
      }

      const result = await runArtisan("tinker", ["--execute", code], {
        laravelPath: config.laravelPath,
        phpBinary: config.phpBinary,
        timeoutMs: Math.min(config.commandTimeout, TINKER_TIMEOUT_MS),
      });

      logAudit({
        ...audit,
        exitCode: result.exitCode,
        outputSize: result.stdout.length,
        status: result.exitCode === 0 ? "ALLOWED" : "ERROR",
        duration: result.duration,
      });

      const output = result.stdout || result.stderr || "(No output)";
      return result.exitCode === 0 ? textResult(output) : errorResult(output);
    }
  );
}
