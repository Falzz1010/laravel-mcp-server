import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { isPathSafe, isWriteAllowed, computeFileHash } from "../utils/security.js";
import { writeFileContent } from "../utils/file.js";
import { logAudit } from "../utils/audit.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import { errorResult, textResult, denied, rateLimitGuard, type AuditContext } from "../utils/mcp.js";

const MAX_CONTENT_BYTES = 500 * 1024;

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
      const audit: AuditContext = { tool: "write_file", tier: "CAUTIOUS", filePath: relPath };

      // Writes mutate the project, so every attempt counts against the limit.
      const limited = rateLimitGuard(rateLimiter, audit);
      if (limited) {
        return limited;
      }
      rateLimiter.recordRequest();

      if (content.length > MAX_CONTENT_BYTES) {
        return denied(audit, "[SECURITY BLOCK]", "Content size exceeds 500KB limit.");
      }

      const writeCheck = isWriteAllowed(relPath);
      if (!writeCheck.allowed) {
        return denied(audit, "[SECURITY BLOCK]", writeCheck.reason);
      }

      try {
        const safePath = isPathSafe(relPath, config.laravelPath);

        if (config.dryRun) {
          logAudit({ ...audit, status: "ALLOWED", reason: "DRY-RUN MODE" });
          return textResult(`[DRY-RUN PREVIEW] Would write ${content.length} bytes to ${relPath}`);
        }

        const { backupPath } = await writeFileContent(safePath, content, config.laravelPath);

        logAudit({
          ...audit,
          fileHash: computeFileHash(content),
          outputSize: content.length,
          status: "ALLOWED",
        });

        const backupNote = backupPath ? ` Previous version backed up to ${backupPath}.` : "";
        return textResult(`Successfully wrote ${content.length} bytes to ${relPath}.${backupNote}`);
      } catch (err: any) {
        logAudit({ ...audit, status: "ERROR", reason: err.message });
        return errorResult(`[WRITE ERROR] ${err.message}`);
      }
    }
  );
}
