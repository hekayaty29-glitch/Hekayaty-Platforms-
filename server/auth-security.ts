import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

// Password security configuration
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Password strength validation
export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  // Check for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i
  ];
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    errors.push('Password contains common patterns and is not secure');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Secure password hashing
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Password verification
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// JWT token generation
export const generateTokens = (userId: string, email: string) => {
  const payload = { userId, email };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'novelnexus',
    audience: 'novelnexus-users'
  });
  
  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'novelnexus',
    audience: 'novelnexus-users'
  });
  
  return { accessToken, refreshToken };
};

// JWT token verification
export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, {
      issuer: 'novelnexus',
      audience: 'novelnexus-users'
    }, (err: jwt.VerifyErrors | null, decoded: unknown) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// Account lockout mechanism
const loginAttempts = new Map<string, { attempts: number; lockedUntil?: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

export const checkAccountLockout = (email: string): { locked: boolean; remainingTime?: number } => {
  const attempts = loginAttempts.get(email);
  
  if (!attempts) {
    return { locked: false };
  }
  
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    return { 
      locked: true, 
      remainingTime: Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60) 
    };
  }
  
  // Reset if lockout period has passed
  if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
    loginAttempts.delete(email);
    return { locked: false };
  }
  
  return { locked: false };
};

export const recordFailedLogin = (email: string): void => {
  const attempts = loginAttempts.get(email) || { attempts: 0 };
  attempts.attempts += 1;
  
  if (attempts.attempts >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  
  loginAttempts.set(email, attempts);
};

export const recordSuccessfulLogin = (email: string): void => {
  loginAttempts.delete(email);
};

// Session security
export const generateSecureSessionId = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Two-factor authentication helpers
export const generateTOTPSecret = (): string => {
  // crypto.toString does not support 'base32'; use hex for secret
  return crypto.randomBytes(20).toString('hex');
};

export const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

// Email verification token
export const generateEmailVerificationToken = (email: string): string => {
  const payload = { email, type: 'email_verification' };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// Password reset token
export const generatePasswordResetToken = (email: string): string => {
  const payload = { email, type: 'password_reset' };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// Secure middleware for sensitive operations
export const requireRecentAuth = (maxAge: number = 30 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authTime = (req as any).session?.authTime;
    
    if (!authTime || Date.now() - authTime > maxAge) {
      return res.status(401).json({ 
        error: 'Recent authentication required',
        code: 'RECENT_AUTH_REQUIRED'
      });
    }
    
    next();
  };
};

// IP-based security
const suspiciousIPs = new Set<string>();
const ipAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

export const checkSuspiciousIP = (ip: string): boolean => {
  // Skip suspicious IP checks for localhost/development
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("::ffff:127.0.0.1") || process.env.NODE_ENV !== "production") {
    return false;
  }
  
  if (suspiciousIPs.has(ip)) {
    return true;
  }
  
  const attempts = ipAttempts.get(ip);
  if (attempts && attempts.attempts > 50 && Date.now() - attempts.lastAttempt < 60 * 60 * 1000) {
    suspiciousIPs.add(ip);
    return true;
  }
  
  return false;
};

export const recordIPAttempt = (ip: string): void => {
  const attempts = ipAttempts.get(ip) || { attempts: 0, lastAttempt: 0 };
  attempts.attempts += 1;
  attempts.lastAttempt = Date.now();
  ipAttempts.set(ip, attempts);
};

// Clean up old records periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean login attempts older than 24 hours
  for (const [email, attempts] of loginAttempts.entries()) {
    if (attempts.lockedUntil && attempts.lockedUntil < now - 24 * 60 * 60 * 1000) {
      loginAttempts.delete(email);
    }
  }
  
  // Clean IP attempts older than 24 hours
  for (const [ip, attempts] of ipAttempts.entries()) {
    if (now - attempts.lastAttempt > 24 * 60 * 60 * 1000) {
      ipAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000); // Run every hour
