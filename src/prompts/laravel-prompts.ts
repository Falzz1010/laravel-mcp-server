import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ServerConfig } from "../utils/config.js";
import { findLogFile, readLastLines, readFileContent } from "../utils/file.js";
import { isPathSafe } from "../utils/security.js";

export function registerLaravelPrompts(server: McpServer, config: ServerConfig): void {
  // 1. Prompt: debug-error
  server.registerPrompt(
    "debug-error",
    {
      description: "Reads recent Laravel error log entries and asks the AI to analyze the cause and solution.",
      argsSchema: {
        lines: z.string().optional().describe("Number of log lines to inspect (default: 50)"),
      },
    },
    async ({ lines = "50" }) => {
      let logContent = "";
      try {
        const lineCount = parseInt(lines, 10) || 50;
        const logFile = await findLogFile(config.laravelPath);
        logContent = await readLastLines(logFile, lineCount);
      } catch (err: any) {
        logContent = `Could not read log file: ${err.message}`;
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Here are the latest log entries from the Laravel application:\n\n\`\`\`\n${logContent}\n\`\`\`\n\nPlease analyze the errors, identify the root cause, and provide a step-by-step fix including code snippets or artisan commands required.`,
            },
          },
        ],
      };
    }
  );

  // 2. Prompt: create-crud
  server.registerPrompt(
    "create-crud",
    {
      description: "Generates instructions to create a complete CRUD (Model, Migration, Controller, Request, Routes) for an entity.",
      argsSchema: {
        model_name: z.string().describe("Name of the model in PascalCase (e.g. 'Product', 'OrderItem')"),
        fields: z.string().describe("Comma-separated list of fields and types (e.g. 'title:string, price:decimal, status:enum')"),
      },
    },
    async ({ model_name, fields }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `I need to create a complete CRUD in my Laravel application for entity: **${model_name}**.\nFields: ${fields}\n\nPlease generate:\n1. Artisan command to create Model with Migration and Controller\n2. Migration schema code\n3. Model mass assignment & relationships\n4. Resource Controller code (index, store, show, update, destroy)\n5. Form Request validation rules\n6. Route definitions for routes/api.php or routes/web.php`,
            },
          },
        ],
      };
    }
  );

  // 3. Prompt: review-code
  server.registerPrompt(
    "review-code",
    {
      description: "Reads a Laravel source code file and requests a security, performance, and best practices code review.",
      argsSchema: {
        file_path: z.string().describe("Relative path to source file (e.g. 'app/Http/Controllers/ProductController.php')"),
      },
    },
    async ({ file_path }) => {
      let content = "";
      try {
        const safePath = isPathSafe(file_path, config.laravelPath);
        content = await readFileContent(safePath);
      } catch (err: any) {
        content = `Could not read file: ${err.message}`;
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please perform a comprehensive code review for the following Laravel file (\`${file_path}\`):\n\n\`\`\`php\n${content}\n\`\`\`\n\nEvaluate:\n1. Laravel conventions & best practices (Repository pattern, Form Requests, Resources)\n2. Security vulnerabilities (SQL Injection, XSS, CSRF, Mass Assignment)\n3. Performance bottlenecks (N+1 queries, unindexed columns, heavy loops)\n4. Refactoring recommendations with concrete code blocks.`,
            },
          },
        ],
      };
    }
  );
}
