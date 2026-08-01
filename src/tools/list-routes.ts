import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { runArtisan } from "../utils/process.js";
import { logAudit } from "../utils/audit.js";

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
      const result = await runArtisan("route:list", ["--json"], {
        laravelPath: config.laravelPath,
        phpBinary: config.phpBinary,
        timeoutMs: config.commandTimeout,
      });

      if (result.exitCode !== 0) {
        logAudit({
          tool: "list_routes",
          tier: "READ_ONLY",
          status: "ERROR",
          reason: result.stderr,
        });
        return {
          isError: true,
          content: [{ type: "text", text: `[ERROR] Failed to fetch route list: ${result.stderr}` }],
        };
      }

      try {
        let routes = JSON.parse(result.stdout);

        if (method) {
          const upperMethod = method.toUpperCase();
          routes = routes.filter((r: any) =>
            r.method ? r.method.toUpperCase().includes(upperMethod) : false
          );
        }

        if (pathPattern) {
          const lowerPattern = pathPattern.toLowerCase();
          routes = routes.filter((r: any) =>
            r.uri ? r.uri.toLowerCase().includes(lowerPattern) : false
          );
        }

        logAudit({
          tool: "list_routes",
          tier: "READ_ONLY",
          outputSize: JSON.stringify(routes).length,
          status: "ALLOWED",
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(routes, null, 2),
            },
          ],
        };
      } catch {
        return {
          content: [{ type: "text", text: result.stdout }],
        };
      }
    }
  );
}
