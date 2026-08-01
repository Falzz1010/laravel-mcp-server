import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { isPathSafe } from "../utils/security.js";
import { readFileContent } from "../utils/file.js";
import { logAudit } from "../utils/audit.js";

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
      try {
        if (relPath.includes(".env")) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "[SECURITY BLOCK] Use 'read_env' tool to read .env files with credential masking.",
              },
            ],
          };
        }

        const safePath = isPathSafe(relPath, config.laravelPath);
        const content = await readFileContent(safePath);

        logAudit({
          tool: "read_file",
          tier: "READ_ONLY",
          filePath: relPath,
          outputSize: content.length,
          status: "ALLOWED",
        });

        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      } catch (err: any) {
        logAudit({
          tool: "read_file",
          tier: "READ_ONLY",
          filePath: relPath,
          status: "BLOCKED",
          reason: err.message,
        });

        return {
          isError: true,
          content: [{ type: "text", text: `[SECURITY/FILE ERROR] ${err.message}` }],
        };
      }
    }
  );
}
