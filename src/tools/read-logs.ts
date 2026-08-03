import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { findLogFile, readLastLines } from "../utils/file.js";
import { logAudit } from "../utils/audit.js";
import { errorResult, textResult, type AuditContext } from "../utils/mcp.js";

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
      const audit: AuditContext = { tool: "read_logs", tier: "READ_ONLY" };

      try {
        const logFile = await findLogFile(config.laravelPath);
        // Note: the filter narrows the last N lines; it does not search the
        // whole file for the last N matches.
        const content = applyFilter(await readLastLines(logFile, lines), filter);

        logAudit({ ...audit, filePath: logFile, outputSize: content.length, status: "ALLOWED" });
        return textResult(content || `(No log lines matched filter '${filter}')`);
      } catch (err: any) {
        logAudit({ ...audit, status: "ERROR", reason: err.message });
        return errorResult(`[ERROR READING LOGS] ${err.message}`);
      }
    }
  );
}

function applyFilter(content: string, filter?: string): string {
  if (!filter) {
    return content;
  }
  const needle = filter.toLowerCase();
  return content
    .split("\n")
    .filter((line) => line.toLowerCase().includes(needle))
    .join("\n");
}
