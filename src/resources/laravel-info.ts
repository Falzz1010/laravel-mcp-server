import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import path from "node:path";
import { ServerConfig } from "../utils/config.js";
import { readFileContent } from "../utils/file.js";
import { maskEnvValues, sanitizeArgs } from "../utils/security.js";
import { runArtisan } from "../utils/process.js";
import { logAudit } from "../utils/audit.js";
import { resourceResult } from "../utils/mcp.js";

export function registerLaravelResources(server: McpServer, config: ServerConfig): void {
  // 1. Static Resource: laravel://env
  server.registerResource(
    "laravel_env",
    "laravel://env",
    {
      title: "Laravel .env File (Masked)",
      description: "Static read-only view of the Laravel .env configuration file with masked credentials.",
      mimeType: "text/plain",
    },
    async (uri) => {
      const envPath = path.join(config.laravelPath, ".env");
      try {
        const masked = maskEnvValues(await readFileContent(envPath));
        logAudit({ tool: "resource://laravel_env", tier: "READ_ONLY", status: "ALLOWED" });
        return resourceResult(uri, "text/plain", masked);
      } catch (err: any) {
        logAudit({
          tool: "resource://laravel_env",
          tier: "READ_ONLY",
          status: "ERROR",
          reason: err.message,
        });
        return resourceResult(uri, "text/plain", `Error reading .env: ${err.message}`);
      }
    }
  );

  // 2. Static Resource: laravel://routes
  server.registerResource(
    "laravel_routes",
    "laravel://routes",
    {
      title: "Laravel Defined Routes",
      description: "Static view of all application routes in JSON format.",
      mimeType: "application/json",
    },
    async (uri) => {
      const result = await runArtisan("route:list", ["--json"], {
        laravelPath: config.laravelPath,
        phpBinary: config.phpBinary,
        timeoutMs: config.commandTimeout,
      });

      logAudit({
        tool: "resource://laravel_routes",
        tier: "READ_ONLY",
        status: result.exitCode === 0 ? "ALLOWED" : "ERROR",
      });

      return resourceResult(uri, "application/json", result.stdout || "[]");
    }
  );

  // 3. Dynamic Resource Template: laravel://config/{key}
  server.registerResource(
    "laravel_config_key",
    new ResourceTemplate("laravel://config/{key}", { list: undefined }),
    {
      title: "Laravel Config Key Lookup",
      description: "Retrieve a specific configuration value (e.g. app.name, database.default)",
      mimeType: "application/json",
    },
    async (uri, { key }) => {
      const keyStr = Array.isArray(key) ? key[0] : key;

      // The URI segment is user-controlled and lands in an artisan argument,
      // so it goes through the same filter as run_artisan args.
      let safeKey: string;
      try {
        [safeKey] = sanitizeArgs([keyStr]);
      } catch (err: any) {
        logAudit({
          tool: `resource://laravel_config/${keyStr}`,
          tier: "READ_ONLY",
          status: "BLOCKED",
          reason: err.message,
        });
        return resourceResult(
          uri,
          "application/json",
          JSON.stringify({ key: keyStr, error: err.message })
        );
      }

      const result = await runArtisan("config:show", [safeKey], {
        laravelPath: config.laravelPath,
        phpBinary: config.phpBinary,
        timeoutMs: config.commandTimeout,
      });

      logAudit({
        tool: `resource://laravel_config/${safeKey}`,
        tier: "READ_ONLY",
        status: result.exitCode === 0 ? "ALLOWED" : "ERROR",
      });

      return resourceResult(
        uri,
        "application/json",
        JSON.stringify({ key: safeKey, value: result.stdout.trim() })
      );
    }
  );
}
