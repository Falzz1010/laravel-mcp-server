import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { isPathSafe, isWriteAllowed, computeFileHash } from "../utils/security.js";
import { writeFileContent } from "../utils/file.js";
import { logAudit } from "../utils/audit.js";
import { RateLimiter } from "../utils/rate-limiter.js";

export function registerWriteFileTool(
  server: McpServer,
  config: ServerConfig,
  rateLimiter: RateLimiter
): void {
  if (!config.allowWrite) {
    return;
  }

  server.registerTool(
    "write_file",
    {
      title: "Write/Modify Laravel File (Opt-In)",
      description:
        "Writes or edits a file within allowed Laravel project directories (app, routes, config, database, resources). Automatic backups are saved to .laravel-mcp-backup.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("Relative path to file from project root (e.g. 'app/Http/Controllers/ProductController.php')"),
        content: z.string().describe("File content to write"),
      }),
    },
    async ({ path: relPath, content }) => {
      // 0. Rate limit — writes mutate the project, so they always count
      const rateCheck = rateLimiter.checkRateLimit();
      if (!rateCheck.allowed) {
        logAudit({
          tool: "write_file",
          tier: "CAUTIOUS",
          filePath: relPath,
          status: "BLOCKED",
          reason: rateCheck.reason,
        });
        return {
          isError: true,
          content: [{ type: "text", text: `[RATE LIMIT BLOCKED] ${rateCheck.reason}` }],
        };
      }
      rateLimiter.recordRequest();

      // 1. Max size check
      if (content.length > 500 * 1024) {
        logAudit({
          tool: "write_file",
          tier: "CAUTIOUS",
          filePath: relPath,
          status: "BLOCKED",
          reason: "Content exceeds 500KB limit",
        });
        return {
          isError: true,
          content: [{ type: "text", text: "[SECURITY BLOCK] Content size exceeds 500KB limit." }],
        };
      }

      // 2. Write allowed check
      const writeCheck = isWriteAllowed(relPath);
      if (!writeCheck.allowed) {
        logAudit({
          tool: "write_file",
          tier: "CAUTIOUS",
          filePath: relPath,
          status: "BLOCKED",
          reason: writeCheck.reason,
        });
        return {
          isError: true,
          content: [{ type: "text", text: `[SECURITY BLOCK] ${writeCheck.reason}` }],
        };
      }

      try {
        // 3. Path safe check
        const safePath = isPathSafe(relPath, config.laravelPath);

        // Dry-run check
        if (config.dryRun) {
          logAudit({
            tool: "write_file",
            tier: "CAUTIOUS",
            filePath: relPath,
            status: "ALLOWED",
            reason: "DRY-RUN MODE",
          });
          return {
            content: [
              {
                type: "text",
                text: `[DRY-RUN PREVIEW] Would write ${content.length} bytes to ${relPath}`,
              },
            ],
          };
        }

        // 4. Write with backup
        const { backupPath } = await writeFileContent(safePath, content, config.laravelPath);
        const fileHash = computeFileHash(content);

        logAudit({
          tool: "write_file",
          tier: "CAUTIOUS",
          filePath: relPath,
          fileHash,
          outputSize: content.length,
          status: "ALLOWED",
        });

        let msg = `Successfully wrote ${content.length} bytes to ${relPath}.`;
        if (backupPath) {
          msg += ` Previous version backed up to ${backupPath}.`;
        }

        return {
          content: [{ type: "text", text: msg }],
        };
      } catch (err: any) {
        logAudit({
          tool: "write_file",
          tier: "CAUTIOUS",
          filePath: relPath,
          status: "ERROR",
          reason: err.message,
        });

        return {
          isError: true,
          content: [{ type: "text", text: `[WRITE ERROR] ${err.message}` }],
        };
      }
    }
  );
}
