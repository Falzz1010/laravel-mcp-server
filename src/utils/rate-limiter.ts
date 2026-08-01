export interface RateLimiterConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  cooldownMs: number;
}

export class RateLimiter {
  private timestamps: number[] = [];
  private lastRequestTime = 0;

  constructor(
    private config: RateLimiterConfig = {
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 500,
      cooldownMs: 2000,
    }
  ) {}

  public checkRateLimit(): { allowed: boolean; retryAfterMs?: number; reason?: string } {
    const now = Date.now();

    // Check cooldown
    const elapsedSinceLast = now - this.lastRequestTime;
    if (this.lastRequestTime > 0 && elapsedSinceLast < this.config.cooldownMs) {
      const waitMs = this.config.cooldownMs - elapsedSinceLast;
      return {
        allowed: false,
        retryAfterMs: waitMs,
        reason: `Rate Limiter: Please wait ${Math.ceil(waitMs / 1000)}s before sending another request (cooldown: ${this.config.cooldownMs}ms).`,
      };
    }

    // Clean timestamps older than 1 hour
    const oneHourAgo = now - 3600 * 1000;
    this.timestamps = this.timestamps.filter((ts) => ts > oneHourAgo);

    // Check requests in last 1 minute
    const oneMinuteAgo = now - 60 * 1000;
    const requestsLastMinute = this.timestamps.filter((ts) => ts > oneMinuteAgo).length;

    if (requestsLastMinute >= this.config.maxRequestsPerMinute) {
      return {
        allowed: false,
        retryAfterMs: 60000,
        reason: `Rate Limiter: Maximum limit of ${this.config.maxRequestsPerMinute} requests per minute exceeded.`,
      };
    }

    // Check requests in last 1 hour
    if (this.timestamps.length >= this.config.maxRequestsPerHour) {
      return {
        allowed: false,
        retryAfterMs: 3600000,
        reason: `Rate Limiter: Maximum limit of ${this.config.maxRequestsPerHour} requests per hour exceeded.`,
      };
    }

    return { allowed: true };
  }

  public recordRequest(): void {
    const now = Date.now();
    this.timestamps.push(now);
    this.lastRequestTime = now;
  }

  public reset(): void {
    this.timestamps = [];
    this.lastRequestTime = 0;
  }
}
