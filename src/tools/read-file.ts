import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { isPathSafe, isReadAllowed } from "../utils/security.js";
import { readFileContent } from "../utils/file.js";
import { logAudit } from "../utils/audit.js";
import { errorResult, textResult, denied, type AuditContext } from "../utils/mcp.js";

export function registerReadFileTool(server: McpServer, config: ServerConfig): void {
  server.registerTool(
    "read_file",
    {
      title: "Read Laravel Source File",
      description: "Reads content of a source file within the Laravel project with path traversal protection.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("Relative path to file from project root (e.g. 'app/Models/User.php', 'routes/web.php')"),
      }),
    },
    async ({ path: relPath }) => {
      const audit: AuditContext = { tool: "read_file", tier: "READ_ONLY", filePath: relPath };

      try {
        const readCheck = isReadAllowed(relPath);
        if (!readCheck.allowed) {
          return denied(audit, "[SECURITY BLOCK]", readCheck.reason);
        }

        const safePath = isPathSafe(relPath, config.laravelPath);
        const content = await readFileContent(safePath);

        logAudit({ ...audit, outputSize: content.length, status: "ALLOWED" });
        return textResult(content);
      } catch (err: any) {
        logAudit({ ...audit, status: "BLOCKED", reason: err.message });
        return errorResult(`[SECURITY/FILE ERROR] ${err.message}`);
      }
    }
  );
}
