import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { CommandTier } from "./security.js";

export interface AuditEntry {
  timestamp: string;
  sessionId: string;
  tool: string;
  tier: CommandTier;
  command?: string;
  args?: string[];
  filePath?: string;
  exitCode?: number;
  outputSize?: number;
  fileHash?: string;
  status: "ALLOWED" | "BLOCKED" | "ERROR";
  reason?: string;
  duration?: number;
}

let currentSessionId = "";
let auditFilePath = "";

export function initAuditLogger(laravelPath: string): string {
  currentSessionId = crypto.randomBytes(6).toString("hex");
  auditFilePath = path.join(laravelPath, ".laravel-mcp-audit.jsonl");

  // Check file size for rotation if > 10MB
  if (fs.existsSync(auditFilePath)) {
    try {
      const stats = fs.statSync(auditFilePath);
      if (stats.size > 10 * 1024 * 1024) {
        const dateStr = new Date().toISOString().split("T")[0];
        const rotatedPath = path.join(laravelPath, `.laravel-mcp-audit.${dateStr}.jsonl`);
        fs.renameSync(auditFilePath, rotatedPath);
      }
    } catch {
      // Ignore rotation errors
    }
  }

  return currentSessionId;
}

export function logAudit(entry: Omit<AuditEntry, "timestamp" | "sessionId">): void {
  const fullEntry: AuditEntry = {
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId || "unknown",
    ...entry,
  };

  const line = JSON.stringify(fullEntry) + "\n";

  if (auditFilePath) {
    try {
      fs.appendFileSync(auditFilePath, line, "utf-8");
    } catch (err) {
      console.error("[AUDIT LOG ERROR]", err);
    }
  }
}
