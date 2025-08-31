import { Request, Response, NextFunction } from "express";
import { auditLog } from "./database-security";

// Security event types
export enum SecurityEventType {
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_FILE_UPLOAD = 'suspicious_file_upload',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CSRF_TOKEN_MISMATCH = 'csrf_token_mismatch',
  INVALID_SESSION = 'invalid_session',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt'
}

// Security monitoring class
class SecurityMonitor {
  private alerts: Map<string, number> = new Map();
  public blockedIPs: Set<string> = new Set();
  private suspiciousUsers: Set<string> = new Set();

  // Log security event
  logEvent(
    type: SecurityEventType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    req: Request,
    details?: any
  ): void {
    const event = {
      type,
      severity,
      timestamp: new Date().toISOString(),
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      details
    };

    console.warn(`[SECURITY ALERT] ${severity.toUpperCase()}: ${type}`, event);
    auditLog.logSecurityEvent(type, severity, event);

    // Auto-block for critical events
    if (severity === 'critical' && req.ip) {
      this.blockIP(req.ip);
      if (req.user?.id) {
        this.flagSuspiciousUser(req.user.id);
      }
    }

    // Track alert frequency
    const alertKey = `${req.ip || 'unknown'}_${type}`;
    const count = this.alerts.get(alertKey) || 0;
    this.alerts.set(alertKey, count + 1);

    // Auto-block after multiple alerts
    if (count > 5 && req.ip) {
      this.blockIP(req.ip);
    }
  }

  // Block IP address
  blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    console.warn(`[SECURITY] IP ${ip} has been blocked`);
  }

  // Check if IP is blocked
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Flag suspicious user
  flagSuspiciousUser(userId: string): void {
    this.suspiciousUsers.add(userId);
    console.warn(`[SECURITY] User ${userId} flagged as suspicious`);
  }

  // Check if user is suspicious
  isUserSuspicious(userId: string): boolean {
    return this.suspiciousUsers.has(userId);
  }

  // Get security stats
  getStats(): any {
    return {
      blockedIPs: Array.from(this.blockedIPs),
      suspiciousUsers: Array.from(this.suspiciousUsers),
      alertCounts: Object.fromEntries(this.alerts)
    };
  }

  // Clean up old data
  cleanup(): void {
    // Clear alerts older than 24 hours
    this.alerts.clear();
    
    // In production, you might want to persist blocked IPs
    // and only clear temporary blocks
  }
}

export const securityMonitor = new SecurityMonitor();

// Security middleware
export const securityMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if IP is blocked
  if (req.ip && securityMonitor.isIPBlocked(req.ip)) {
    securityMonitor.logEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      'high',
      req,
      { reason: 'blocked_ip_access_attempt' }
    );
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if user is suspicious
  if (req.user && securityMonitor.isUserSuspicious(req.user.id)) {
    securityMonitor.logEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      'medium',
      req,
      { reason: 'suspicious_user_access' }
    );
    // Don't block, but log and monitor
  }

  next();
};

// Honeypot endpoints to catch attackers
export const setupHoneypots = (app: any) => {
  const honeypotPaths = [
    '/admin.php',
    '/wp-admin/',
    '/phpmyadmin/',
    '/.env',
    '/config.php',
    '/database.sql',
    '/backup.zip',
    '/admin/login',
    '/administrator/',
    '/wp-login.php'
  ];

  honeypotPaths.forEach(path => {
    app.all(path, (req: Request, res: Response) => {
      securityMonitor.logEvent(
        SecurityEventType.UNAUTHORIZED_ACCESS,
        'critical',
        req,
        { 
          reason: 'honeypot_triggered',
          path: path,
          likely_bot: true
        }
      );
      
      // Return fake response to waste attacker's time
      res.status(404).send('Not Found');
    });
  });
};

// Real-time threat detection
export const threatDetection = {
  // Detect brute force attacks
  detectBruteForce: (req: Request, failedAttempts: number) => {
    if (failedAttempts > 3) {
      securityMonitor.logEvent(
        SecurityEventType.BRUTE_FORCE_ATTEMPT,
        'high',
        req,
        { failedAttempts }
      );
    }
  },

  // Detect SQL injection attempts
  detectSQLInjection: (req: Request, suspiciousInput: string) => {
    securityMonitor.logEvent(
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      'critical',
      req,
      { suspiciousInput: suspiciousInput.substring(0, 200) }
    );
  },

  // Detect XSS attempts
  detectXSS: (req: Request, suspiciousInput: string) => {
    securityMonitor.logEvent(
      SecurityEventType.XSS_ATTEMPT,
      'high',
      req,
      { suspiciousInput: suspiciousInput.substring(0, 200) }
    );
  },

  // Detect privilege escalation
  detectPrivilegeEscalation: (req: Request, attemptedRole: string, currentRole: string) => {
    securityMonitor.logEvent(
      SecurityEventType.PRIVILEGE_ESCALATION,
      'critical',
      req,
      { attemptedRole, currentRole }
    );
  },

  // Detect suspicious file uploads
  detectSuspiciousUpload: (req: Request, fileName: string, fileType: string) => {
    securityMonitor.logEvent(
      SecurityEventType.SUSPICIOUS_FILE_UPLOAD,
      'high',
      req,
      { fileName, fileType }
    );
  }
};

// Security dashboard endpoint
export const setupSecurityDashboard = (app: any) => {
  app.get('/api/admin/security/stats', (req: Request, res: Response) => {
    // Only allow admin access
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = securityMonitor.getStats();
    res.json(stats);
  });

  app.post('/api/admin/security/unblock-ip', (req: Request, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { ip } = req.body;
    securityMonitor.blockedIPs.delete(ip);
    res.json({ message: 'IP unblocked successfully' });
  });
};

// Clean up security data periodically
setInterval(() => {
  securityMonitor.cleanup();
}, 24 * 60 * 60 * 1000); // Every 24 hours
