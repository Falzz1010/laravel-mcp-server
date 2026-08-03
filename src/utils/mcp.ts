import { logAudit, type AuditEntry } from "./audit.js";
import type { RateLimiter } from "./rate-limiter.js";

/**
 * The audit fields a call site knows before it decides the outcome.
 * `status` and `reason` are supplied by the helpers below.
 */
export type AuditContext = Omit<AuditEntry, "timestamp" | "sessionId" | "status" | "reason">;

/** MCP tool result carrying a single text block. */
export function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

/** MCP tool result flagged as an error, carrying a single text block. */
export function errorResult(text: string) {
  return { isError: true, content: [{ type: "text" as const, text }] };
}

/** MCP resource result carrying a single text block. */
export function resourceResult(uri: URL, mimeType: string, text: string) {
  return { contents: [{ uri: uri.href, mimeType, text }] };
}

/**
 * Record a refusal in the audit log and render it for the caller.
 * Every security refusal goes through here so the log and the message can
 * never disagree about why something was blocked.
 */
export function denied(context: AuditContext, prefix: string, reason: string) {
  logAudit({ ...context, status: "BLOCKED", reason });
  return errorResult(`${prefix} ${reason}`);
}

/**
 * Returns an error result when the caller must back off, or null to proceed.
 * Recording the request is left to the caller: run_artisan only counts
 * non-read-only work, while write_file and run_tinker count every attempt.
 */
export function rateLimitGuard(rateLimiter: RateLimiter, context: AuditContext) {
  const check = rateLimiter.checkRateLimit();
  if (check.allowed) {
    return null;
  }
  return denied(context, "[RATE LIMIT BLOCKED]", check.reason ?? "Rate limit exceeded.");
}
