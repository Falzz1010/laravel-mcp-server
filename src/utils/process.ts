import { execFile, ChildProcess } from "node:child_process";
import path from "node:path";

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  killed: boolean;
}

export interface RunOptions {
  laravelPath: string;
  phpBinary: string;
  timeoutMs: number;
}

const activeChildren = new Set<ChildProcess>();

export function runArtisan(
  command: string,
  args: string[] = [],
  options: RunOptions
): Promise<ExecResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const artisanPath = path.join(options.laravelPath, "artisan");
    const fullArgs = [artisanPath, command, ...args];

    let killed = false;

    // Filter environment to strip sensitive process environment variables
    const safeEnv = { ...process.env };
    delete safeEnv.APP_KEY;
    delete safeEnv.DB_PASSWORD;
    delete safeEnv.AWS_SECRET_ACCESS_KEY;

    const child = execFile(
      options.phpBinary,
      fullArgs,
      {
        cwd: options.laravelPath,
        timeout: options.timeoutMs,
        maxBuffer: 5 * 1024 * 1024, // 5MB limit
        env: safeEnv,
      },
      (error, stdout, stderr) => {
        activeChildren.delete(child);
        const duration = Date.now() - startTime;

        let exitCode = 0;
        if (error) {
          exitCode = typeof error.code === "number" ? error.code : 1;
          if (error.killed) {
            killed = true;
          }
        }

        // Truncate output if larger than 50KB to protect LLM context
        const maxCharOutput = 50 * 1024;
        let finalStdout = stdout || "";
        let finalStderr = stderr || "";

        if (finalStdout.length > maxCharOutput) {
          finalStdout =
            finalStdout.substring(0, maxCharOutput) +
            "\n... [Output truncated by MCP Server because it exceeds 50KB]";
        }

        if (finalStderr.length > maxCharOutput) {
          finalStderr =
            finalStderr.substring(0, maxCharOutput) +
            "\n... [Stderr truncated by MCP Server because it exceeds 50KB]";
        }

        resolve({
          stdout: finalStdout,
          stderr: finalStderr,
          exitCode,
          duration,
          killed,
        });
      }
    );

    activeChildren.add(child);
  });
}

export function findPhpBinary(customPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(customPath, ["-v"], (error) => {
      if (error) {
        reject(
          new Error(
            `PHP binary '${customPath}' not found or failed to execute. Make sure PHP is installed and in PATH.`
          )
        );
      } else {
        resolve(customPath);
      }
    });
  });
}

export function killAllChildren(): void {
  for (const child of activeChildren) {
    try {
      child.kill("SIGKILL");
    } catch {
      // Ignore errors when killing
    }
  }
  activeChildren.clear();
}
