// AI Quota Monitor - Track API usage to avoid exceeding limits

class AIQuotaMonitor {
  constructor() {
    this.requestCount = 0;
    this.lastReset = Date.now();
    this.maxRequestsPerMinute = 8; // More conservative limit (reduced from 10)
    this.maxRequestsPerHour = 15; // Add hourly limit
    this.requestHistory = [];
    this.hourlyHistory = [];
  }

  canMakeRequest() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // Clean old requests
    this.requestHistory = this.requestHistory.filter(time => time > oneMinuteAgo);
    this.hourlyHistory = this.hourlyHistory.filter(time => time > oneHourAgo);

    // Check minute limit
    if (this.requestHistory.length >= this.maxRequestsPerMinute) {
      console.warn(`⚠️  AI quota limit reached: ${this.requestHistory.length} requests in last minute`);
      return false;
    }

    // Check hourly limit
    if (this.hourlyHistory.length >= this.maxRequestsPerHour) {
      console.warn(`⚠️  AI hourly quota limit reached: ${this.hourlyHistory.length} requests in last hour`);
      return false;
    }

    return true;
  }

  recordRequest() {
    const now = Date.now();
    this.requestHistory.push(now);
    this.hourlyHistory.push(now);
    this.requestCount++;
    
    console.log(`📊 API Request recorded. Recent: ${this.requestHistory.length}/${this.maxRequestsPerMinute} (1min), ${this.hourlyHistory.length}/${this.maxRequestsPerHour} (1hr)`);
  }

  getStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    const recentRequests = this.requestHistory.filter(time => time > oneMinuteAgo).length;
    const hourlyRequests = this.hourlyHistory.filter(time => time > oneHourAgo).length;

    const minuteRemaining = Math.max(0, this.maxRequestsPerMinute - recentRequests);
    const hourlyRemaining = Math.max(0, this.maxRequestsPerHour - hourlyRequests);

    return {
      totalRequests: this.requestCount,
      recentRequests,
      hourlyRequests,
      remainingQuota: Math.min(minuteRemaining, hourlyRemaining),
      quotaResetIn: recentRequests > 0 
        ? Math.ceil((this.requestHistory[0] + 60000 - now) / 1000) 
        : 0,
      hourlyResetIn: hourlyRequests > 0
        ? Math.ceil((this.hourlyHistory[0] + 3600000 - now) / 1000)
        : 0
    };
  }

  // Get time until next request is allowed
  getNextAllowedTime() {
    if (this.canMakeRequest()) {
      return 0;
    }

    const now = Date.now();
    const oldestMinute = this.requestHistory[0];
    const oldestHour = this.hourlyHistory[0];

    const minuteReset = oldestMinute ? oldestMinute + 60000 - now : 0;
    const hourReset = oldestHour ? oldestHour + 3600000 - now : 0;

    return Math.max(minuteReset, hourReset);
  }
}

export const quotaMonitor = new AIQuotaMonitor();
export default quotaMonitor;
