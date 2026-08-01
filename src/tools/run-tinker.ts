import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { sanitizeTinkerCode } from "../utils/security.js";
import { runArtisan } from "../utils/process.js";
import { logAudit } from "../utils/audit.js";

export function registerRunTinkerTool(server: McpServer, config: ServerConfig): void {
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
      // 1. Sanitize code
      const check = sanitizeTinkerCode(code);
      if (!check.safe) {
        logAudit({
          tool: "run_tinker",
          tier: "DANGEROUS",
          status: "BLOCKED",
          reason: `Blocked functions: ${check.blocked.join(", ")}`,
        });

        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `[SECURITY BLOCK] Prohibited PHP functions/keywords detected: ${check.blocked.join(", ")}`,
            },
          ],
        };
      }

      // Dry-run check
      if (config.dryRun) {
        logAudit({
          tool: "run_tinker",
          tier: "CAUTIOUS",
          status: "ALLOWED",
          reason: "DRY-RUN MODE",
        });
        return {
          content: [
            {
              type: "text",
              text: `[DRY-RUN PREVIEW] Would execute in tinker:\n${code}`,
            },
          ],
        };
      }

      // 2. Execute code via artisan tinker
      // Note: Passing code via execute
      const result = await runArtisan("tinker", ["--execute", code], {
        laravelPath: config.laravelPath,
        phpBinary: config.phpBinary,
        timeoutMs: Math.min(config.commandTimeout, 10000), // Max 10s for tinker
      });

      logAudit({
        tool: "run_tinker",
        tier: "CAUTIOUS",
        exitCode: result.exitCode,
        outputSize: result.stdout.length,
        status: result.exitCode === 0 ? "ALLOWED" : "ERROR",
        duration: result.duration,
      });

      return {
        isError: result.exitCode !== 0,
        content: [{ type: "text", text: result.stdout || result.stderr || "(No output)" }],
      };
    }
  );
}
