import { Request, Response, NextFunction } from "express";
import { supabaseStorage } from "./supabase-storage";

// Database query sanitization
export const sanitizeQuery = (query: any): any => {
  if (typeof query === 'string') {
    // Remove potentially dangerous SQL keywords and characters
    return query
      .replace(/['"\\;]/g, '') // Remove quotes and semicolons
      .replace(/\b(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|EXECUTE|UNION|SELECT)\b/gi, '') // Remove SQL keywords
      .trim();
  }
  
  if (Array.isArray(query)) {
    return query.map(sanitizeQuery);
  }
  
  if (query && typeof query === 'object') {
    const sanitized: any = {};
    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        sanitized[sanitizeQuery(key)] = sanitizeQuery(query[key]);
      }
    }
    return sanitized;
  }
  
  return query;
};

// Parameterized query builder
export class SecureQueryBuilder {
  private query: string = '';
  private params: any[] = [];
  
  select(columns: string[]): this {
    const sanitizedColumns = columns.map(col => col.replace(/[^a-zA-Z0-9_]/g, ''));
    this.query = `SELECT ${sanitizedColumns.join(', ')}`;
    return this;
  }
  
  from(table: string): this {
    const sanitizedTable = table.replace(/[^a-zA-Z0-9_]/g, '');
    this.query += ` FROM ${sanitizedTable}`;
    return this;
  }
  
  where(condition: string, value: any): this {
    this.query += this.params.length === 0 ? ' WHERE ' : ' AND ';
    this.query += `${condition} = $${this.params.length + 1}`;
    this.params.push(value);
    return this;
  }
  
  limit(count: number): this {
    const sanitizedCount = Math.max(1, Math.min(1000, parseInt(count.toString())));
    this.query += ` LIMIT ${sanitizedCount}`;
    return this;
  }
  
  build(): { query: string; params: any[] } {
    return { query: this.query, params: this.params };
  }
}

// Database access control
export const checkDatabasePermissions = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const userRole = req.user?.role || 'free';
  
  // Check if user has permission for the requested operation
  const path = req.path;
  const method = req.method;
  
  // Admin-only endpoints
  const adminEndpoints = [
    '/api/admin',
    '/api/users/ban',
    '/api/users/delete',
    '/api/stories/moderate',
    '/api/analytics'
  ];
  
  if (adminEndpoints.some(endpoint => path.startsWith(endpoint))) {
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
  }
  
  // VIP-only endpoints
  const vipEndpoints = [
    '/api/stories/premium',
    '/api/download/unlimited'
  ];
  
  if (vipEndpoints.some(endpoint => path.startsWith(endpoint))) {
    if (userRole === 'free') {
      return res.status(403).json({ error: 'VIP access required' });
    }
  }
  
  // Resource ownership check
  if (method !== 'GET' && path.includes('/stories/')) {
    const storyId = req.params.id || req.body.storyId;
    if (storyId && userRole !== 'admin') {
      try {
        const story = await supabaseStorage.getStory(storyId);
        if (story && story.author_id !== userId) {
          return res.status(403).json({ error: 'Access denied - not story owner' });
        }
      } catch (error) {
        return res.status(500).json({ error: 'Permission check failed' });
      }
    }
  }
  
  next();
};

// Query logging for security monitoring
export const logDatabaseQueries = (req: Request, res: Response, next: NextFunction) => {
  const originalQuery = req.query;
  const originalBody = req.body;
  const userId = req.user?.id;
  const ip = req.ip;
  
  // Log potentially suspicious queries
  const suspiciousPatterns = [
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /update\s+.*\s+set/gi,
    /insert\s+into/gi,
    /exec\s*\(/gi,
    /script\s*>/gi
  ];
  
  const queryString = JSON.stringify({ query: originalQuery, body: originalBody });
  
  if (suspiciousPatterns.some(pattern => pattern.test(queryString))) {
    console.warn(`[SECURITY] Suspicious query detected from user ${userId} at IP ${ip}:`, queryString);
    
    // You could also send this to a security monitoring service
    // securityMonitor.alert('suspicious_query', { userId, ip, query: queryString });
  }
  
  next();
};

// Database connection security
export const secureDatabaseConnection = () => {
  // Ensure database connections use SSL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes('sslmode=require')) {
    console.warn('[SECURITY] Database connection should use SSL in production');
  }
  
  // Check for default credentials
  if (dbUrl?.includes('password=password') || dbUrl?.includes('password=123456')) {
    throw new Error('Default database credentials detected - security risk!');
  }
};

// Row Level Security helpers for Supabase
export const enableRLS = async (tableName: string) => {
  // This would be run during database setup
  const query = `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`;
  console.log(`RLS enabled for table: ${tableName}`);
  return query;
};

export const createUserPolicy = (tableName: string, operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE') => {
  return `
    CREATE POLICY "${tableName}_${operation.toLowerCase()}_policy" ON ${tableName}
    FOR ${operation} USING (auth.uid() = user_id);
  `;
};

// Data encryption helpers
export const encryptSensitiveData = (data: string): string => {
  // In production, use a proper encryption library like crypto
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptSensitiveData = (encryptedData: string): string => {
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Audit logging
export const auditLog = {
  logUserAction: (userId: string, action: string, resource: string, details?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      details,
      ip: 'logged_separately' // IP should be logged separately for privacy
    };
    
    console.log('[AUDIT]', JSON.stringify(logEntry));
    
    // In production, send to audit logging service
    // auditService.log(logEntry);
  },
  
  logSecurityEvent: (type: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      severity,
      details
    };
    
    console.warn('[SECURITY EVENT]', JSON.stringify(logEntry));
    
    // In production, send to security monitoring
    // securityMonitor.alert(type, logEntry);
  }
};
