const requestStore = new Map();

export function rateLimitPerMinute(limit = 30) {
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const windowMs = 60 * 1000;

    const entries = requestStore.get(ip) || [];
    const recentEntries = entries.filter((ts) => now - ts < windowMs);

    if (recentEntries.length >= limit) {
      return res.status(429).json({
        message: "Too many search requests. Please try again in a minute."
      });
    }

    recentEntries.push(now);
    requestStore.set(ip, recentEntries);
    next();
  };
}
