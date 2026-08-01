import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { findLogFile, readLastLines } from "../utils/file.js";
import { logAudit } from "../utils/audit.js";

export function registerReadLogsTool(server: McpServer, config: ServerConfig): void {
  server.registerTool(
    "read_logs",
    {
      title: "Read Laravel Log File",
      description:
        "Reads recent log entries from storage/logs/laravel.log or daily log file with optional line filtering.",
      inputSchema: z.object({
        lines: z
          .number()
          .optional()
          .default(100)
          .describe("Number of recent lines to read (default: 100, max: 500)"),
        filter: z
          .string()
          .optional()
          .describe("Optional keyword filter (e.g. 'ERROR', 'CRITICAL', 'Exception')"),
      }),
    },
    async ({ lines = 100, filter }) => {
      try {
        const logFile = await findLogFile(config.laravelPath);
        let content = await readLastLines(logFile, lines);

        if (filter) {
          const filterLower = filter.toLowerCase();
          content = content
            .split("\n")
            .filter((l) => l.toLowerCase().includes(filterLower))
            .join("\n");
        }

        logAudit({
          tool: "read_logs",
          tier: "READ_ONLY",
          filePath: logFile,
          outputSize: content.length,
          status: "ALLOWED",
        });

        return {
          content: [
            {
              type: "text",
              text: content || `(No log lines matched filter '${filter}')`,
            },
          ],
        };
      } catch (err: any) {
        logAudit({
          tool: "read_logs",
          tier: "READ_ONLY",
          status: "ERROR",
          reason: err.message,
        });

        return {
          isError: true,
          content: [{ type: "text", text: `[ERROR READING LOGS] ${err.message}` }],
        };
      }
    }
  );
}
