import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import path from "node:path";
import { ServerConfig } from "../utils/config.js";
import { readFileContent } from "../utils/file.js";
import { maskEnvValues } from "../utils/security.js";
import { logAudit } from "../utils/audit.js";

export function registerReadEnvTool(server: McpServer, config: ServerConfig): void {
  server.registerTool(
    "read_env",
    {
      title: "Read Laravel .env Configuration",
      description:
        "Reads the project .env file. Sensitive credentials (passwords, keys, secrets) are masked by default.",
      inputSchema: z.object({
        show_values: z
          .boolean()
          .optional()
          .default(false)
          .describe("If true, shows unmasked sensitive values (use with caution)"),
      }),
    },
    async ({ show_values = false }) => {
      const envPath = path.join(config.laravelPath, ".env");
      try {
        const rawContent = await readFileContent(envPath);
        const finalContent = show_values ? rawContent : maskEnvValues(rawContent);

        logAudit({
          tool: "read_env",
          tier: "READ_ONLY",
          filePath: envPath,
          status: "ALLOWED",
        });

        return {
          content: [
            {
              type: "text",
              text: finalContent,
            },
          ],
        };
      } catch (err: any) {
        logAudit({
          tool: "read_env",
          tier: "READ_ONLY",
          status: "ERROR",
          reason: err.message,
        });

        return {
          isError: true,
          content: [{ type: "text", text: `[ERROR READING .ENV] ${err.message}` }],
        };
      }
    }
  );
}
