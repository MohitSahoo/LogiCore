// AI Quota Monitor - Track API usage to avoid exceeding limits

class AIQuotaMonitor {
  constructor() {
    this.requestCount = 0;
    this.lastReset = Date.now();
    this.maxRequestsPerMinute = 10; // Conservative limit
    this.requestHistory = [];
  }

  canMakeRequest() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old requests
    this.requestHistory = this.requestHistory.filter(time => time > oneMinuteAgo);

    // Check if under limit
    if (this.requestHistory.length >= this.maxRequestsPerMinute) {
      console.warn(`⚠️  AI quota limit reached: ${this.requestHistory.length} requests in last minute`);
      return false;
    }

    return true;
  }

  recordRequest() {
    this.requestHistory.push(Date.now());
    this.requestCount++;
  }

  getStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestHistory.filter(time => time > oneMinuteAgo).length;

    return {
      totalRequests: this.requestCount,
      recentRequests,
      remainingQuota: Math.max(0, this.maxRequestsPerMinute - recentRequests),
      quotaResetIn: recentRequests > 0 
        ? Math.ceil((this.requestHistory[0] + 60000 - now) / 1000) 
        : 0
    };
  }
}

export const quotaMonitor = new AIQuotaMonitor();
export default quotaMonitor;
