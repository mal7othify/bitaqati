/* Fixed-window in-memory rate limiter. Per-process is fine for a
   single-instance deployment; a CDN's rate rules can sit in front as a second
   layer for volumetric abuse. */

interface Window {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private windows = new Map<string, Window>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  /** Returns true when the request is allowed. */
  hit(key: string): boolean {
    const now = Date.now();
    const win = this.windows.get(key);
    if (!win || win.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    win.count += 1;
    return win.count <= this.limit;
  }

  /** Drop expired windows so the map cannot grow unbounded. */
  sweep(): void {
    const now = Date.now();
    for (const [key, win] of this.windows) {
      if (win.resetAt <= now) this.windows.delete(key);
    }
  }
}
