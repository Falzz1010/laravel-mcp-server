import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { runArtisan } from "../utils/process.js";
import { logAudit } from "../utils/audit.js";
import { errorResult, textResult, type AuditContext } from "../utils/mcp.js";

interface Route {
  method?: string;
  uri?: string;
}

export function registerListRoutesTool(server: McpServer, config: ServerConfig): void {
  server.registerTool(
    "list_routes",
    {
      title: "List Laravel Routes",
      description: "Fetches defined application routes using 'php artisan route:list --json' with optional method/path filtering.",
      inputSchema: z.object({
        method: z
          .string()
          .optional()
          .describe("Filter routes by HTTP method (e.g. 'GET', 'POST', 'PUT', 'DELETE')"),
        path: z
          .string()
          .optional()
          .describe("Filter routes by URI path pattern (e.g. 'api/', 'users')"),
      }),
    },
    async ({ method, path: pathPattern }) => {
      const audit: AuditContext = { tool: "list_routes", tier: "READ_ONLY" };

      const result = await runArtisan("route:list", ["--json"], {
        laravelPath: config.laravelPath,
        phpBinary: config.phpBinary,
        timeoutMs: config.commandTimeout,
      });

      if (result.exitCode !== 0) {
        logAudit({ ...audit, status: "ERROR", reason: result.stderr });
        return errorResult(`[ERROR] Failed to fetch route list: ${result.stderr}`);
      }

      // Anything that isn't a JSON array (plain text, an error object, "null")
      // is handed back verbatim rather than failing the call.
      let routes: Route[];
      try {
        const parsed = JSON.parse(result.stdout);
        if (!Array.isArray(parsed)) {
          return textResult(result.stdout);
        }
        routes = parsed;
      } catch {
        return textResult(result.stdout);
      }

      const filtered = routes
        .filter((r) => matches(r.method, method))
        .filter((r) => matches(r.uri, pathPattern));

      const text = JSON.stringify(filtered, null, 2);
      logAudit({ ...audit, outputSize: text.length, status: "ALLOWED" });
      return textResult(text);
    }
  );
}

/** Case-insensitive substring match; an absent pattern matches everything. */
function matches(value: string | undefined, pattern: string | undefined): boolean {
  if (!pattern) {
    return true;
  }
  return (value ?? "").toLowerCase().includes(pattern.toLowerCase());
}
