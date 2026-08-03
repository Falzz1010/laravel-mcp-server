#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { parseConfig } from "./utils/config.js";
import { checkEnvironment } from "./utils/security.js";
import { findPhpBinary, killAllChildren } from "./utils/process.js";
import { initAuditLogger, logAudit } from "./utils/audit.js";
import { RateLimiter } from "./utils/rate-limiter.js";

// Tools
import { registerRunArtisanTool } from "./tools/run-artisan.js";
import { registerReadLogsTool } from "./tools/read-logs.js";
import { registerListRoutesTool } from "./tools/list-routes.js";
import { registerReadFileTool } from "./tools/read-file.js";
import { registerWriteFileTool } from "./tools/write-file.js";
import { registerRunTinkerTool } from "./tools/run-tinker.js";

// Resources & Prompts
import { registerLaravelResources } from "./resources/laravel-info.js";
import { registerLaravelPrompts } from "./prompts/laravel-prompts.js";

// Read once from package.json so the version can never drift from the release.
const { version } = createRequire(import.meta.url)("../package.json");

async function main() {
  const config = parseConfig(process.argv);

  // 1. Validate target directory is a valid Laravel project
  if (!fs.existsSync(path.join(config.laravelPath, "artisan"))) {
    console.error(`[FATAL ERROR] Not a Laravel project (missing 'artisan'): ${config.laravelPath}`);
    process.exit(1);
  }

  // 2. Check environment safety (refuse to run in production)
  try {
    checkEnvironment(config.laravelPath);
  } catch (err: any) {
    console.error(`[FATAL ERROR] ${err.message}`);
    process.exit(1);
  }

  // 3. Verify PHP binary exists
  try {
    await findPhpBinary(config.phpBinary);
  } catch (err: any) {
    console.error(`[FATAL ERROR] ${err.message}`);
    process.exit(1);
  }

  // 4. Initialize Audit Logger
  const sessionId = initAuditLogger(config.laravelPath);
  console.error(`[INFO] Laravel MCP Server initialized.`);
  console.error(`[INFO] Session ID: ${sessionId}`);
  console.error(`[INFO] Target Project: ${config.laravelPath}`);
  console.error(`[INFO] Write Access: ${config.allowWrite ? "ENABLED" : "DISABLED"}`);
  console.error(`[INFO] Tinker Access: ${config.allowTinker ? "ENABLED" : "DISABLED"}`);
  if (config.dryRun) {
    console.error(`[INFO] Dry-Run Mode: ENABLED (No commands will be executed)`);
  }

  // 5. Initialize Rate Limiter
  const rateLimiter = new RateLimiter({
    maxRequestsPerMinute: config.rateLimit,
    maxRequestsPerHour: 500,
    cooldownMs: 2000,
  });

  // 6. Initialize McpServer
  const server = new McpServer({
    name: "laravel-mcp-server",
    version,
  });

  // 7. Register Tools
  registerRunArtisanTool(server, config, rateLimiter);
  registerReadLogsTool(server, config);
  registerListRoutesTool(server, config);
  registerReadFileTool(server, config);
  registerWriteFileTool(server, config, rateLimiter);
  registerRunTinkerTool(server, config, rateLimiter);

  // 8. Register Resources & Prompts
  registerLaravelResources(server, config);
  registerLaravelPrompts(server, config);

  // 9. Connect Transport
  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.error(`[INFO] Received ${signal}, shutting down server...`);
    logAudit({
      tool: "server_shutdown",
      tier: "READ_ONLY",
      status: "ALLOWED",
      reason: `Signal ${signal}`,
    });
    killAllChildren();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await server.connect(transport);
  console.error("[INFO] Laravel MCP Server running on stdio transport.");
}

main().catch((err) => {
  console.error("[FATAL SERVER ERROR]", err);
  killAllChildren();
  process.exit(1);
});
