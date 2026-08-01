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
      // Step 1: Check rate limiter
      const rateCheck = rateLimiter.checkRateLimit();
      if (!rateCheck.allowed) {
        logAudit({
          tool: "run_artisan",
          tier: "UNKNOWN",
          command,
          args,
          status: "BLOCKED",
          reason: rateCheck.reason,
        });
        return {
          isError: true,
          content: [{ type: "text", text: `[RATE LIMIT BLOCKED] ${rateCheck.reason}` }],
        };
      }

      // Step 2: Check command security classification
      const check = isCommandAllowed(command);
      if (!check.allowed) {
        logAudit({
          tool: "run_artisan",
          tier: check.tier,
          command,
          args,
          status: "BLOCKED",
          reason: check.reason,
        });
        return {
          isError: true,
          content: [{ type: "text", text: `[SECURITY BLOCK] ${check.reason}` }],
        };
      }

      // Step 3: Sanitize args & check dangerous flags
      let cleanArgs: string[] = [];
      try {
        cleanArgs = sanitizeArgs(args);
        validateDangerousFlags(command, cleanArgs);
      } catch (err: any) {
        logAudit({
          tool: "run_artisan",
          tier: check.tier,
          command,
          args,
          status: "BLOCKED",
          reason: err.message,
        });
        return {
          isError: true,
          content: [{ type: "text", text: `[SECURITY BLOCK] ${err.message}` }],
        };
      }

      // Record rate limit request for non-read-only
      if (check.tier !== "READ_ONLY") {
        rateLimiter.recordRequest();
      }

      // Step 4: Dry-run check
      if (config.dryRun) {
        logAudit({
          tool: "run_artisan",
          tier: check.tier,
          command,
          args: cleanArgs,
          status: "ALLOWED",
          reason: "DRY-RUN MODE",
        });
        return {
          content: [
            {
              type: "text",
              text: `[DRY-RUN PREVIEW] Would execute: php artisan ${command} ${cleanArgs.join(" ")}`,
            },
          ],
        };
      }

      // Step 5: Execute via execFile
      const result = await runArtisan(command, cleanArgs, {
        laravelPath: config.laravelPath,
        phpBinary: config.phpBinary,
        timeoutMs: config.commandTimeout,
      });

      // Step 6: Log audit
      logAudit({
        tool: "run_artisan",
        tier: check.tier,
        command,
        args: cleanArgs,
        exitCode: result.exitCode,
        outputSize: result.stdout.length + result.stderr.length,
        status: result.exitCode === 0 ? "ALLOWED" : "ERROR",
        duration: result.duration,
        reason: result.killed ? "Execution timed out" : undefined,
      });

      let output = "";
      if (result.stdout) {
        output += result.stdout;
      }
      if (result.stderr) {
        if (output) output += "\n--- STDERR ---\n";
        output += result.stderr;
      }

      if (!output) {
        output = "(Command executed successfully with no output)";
      }

      return {
        isError: result.exitCode !== 0,
        content: [{ type: "text", text: output }],
      };
    }
  );
}
