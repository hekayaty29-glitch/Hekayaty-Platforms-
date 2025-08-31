import { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { body, param, query, validationResult } from "express-validator";
import DOMPurify from "isomorphic-dompurify";
import crypto from "crypto";

// Rate limiting configurations
const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    skip: (req) => {
      // Always skip rate limiting for upload endpoints
      if (req.path.includes('/upload') || req.path.includes('/api/upload')) {
        return true;
      }
      
      // Disable rate limits when running locally in development
      if (process.env.NODE_ENV !== "production") {
        const ip = req.ip || "";
        const host = req.get('host') || "";
        console.log(`Rate limit check - IP: ${ip}, Host: ${host}, NODE_ENV: ${process.env.NODE_ENV}`);
        
        // Skip for localhost/127.0.0.1 in any form
        return ip === "127.0.0.1" || 
               ip === "::1" || 
               ip.startsWith("::ffff:127.0.0.1") ||
               ip.startsWith("::ffff:127.0.0.1") ||
               host.includes("localhost") ||
               host.includes("127.0.0.1");
      }
      return false;
    },
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`Rate limit hit - IP: ${req.ip}, Host: ${req.get('host')}`);
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  "Too many authentication attempts, please try again later"
);

export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  "Too many requests, please try again later"
);

export const uploadRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  50, // 50 uploads (increased for comic editor)
  "Too many upload attempts, please try again later"
);

export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  200, // 200 API calls
  "API rate limit exceeded, please try again later"
);

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize all string inputs
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array()
    });
  }
  next();
};

// CSRF protection
const csrfTokens = new Map<string, { token: string; expires: number }>();

export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.ip || 'unknown';
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour
  
  csrfTokens.set(sessionId, { token, expires });
  
  // Clean expired tokens
  csrfTokens.forEach((value, key) => {
    if (value.expires < Date.now()) {
      csrfTokens.delete(key);
    }
  });
  
  res.locals.csrfToken = token;
  next();
};

export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.ip || 'unknown';
  const clientToken = req.headers['x-csrf-token'] as string;
  const storedToken = csrfTokens.get(sessionId);
  
  if (!storedToken || storedToken.expires < Date.now()) {
    return res.status(403).json({ error: "CSRF token expired" });
  }
  
  if (!clientToken || clientToken !== storedToken.token) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  
  next();
};

// SQL Injection prevention patterns
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /('|(\\')|(;)|(\\;)|(\|)|(\*)|(%)|(<)|(>)|(\^)|(\[)|(\])|(\\)|(\/)|(\?)|(=))/gi,
  /((\%3C)|(<)).*?((\%3E)|(>))/gi,
  /((\%27)|('))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi
];

export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const checkForSQLInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlInjectionPatterns.some(pattern => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkForSQLInjection);
    }
    if (value && typeof value === 'object') {
      return Object.values(value).some(checkForSQLInjection);
    }
    return false;
  };

  if (checkForSQLInjection(req.body) || 
      checkForSQLInjection(req.query) || 
      checkForSQLInjection(req.params)) {
    return res.status(400).json({ 
      error: "Potentially malicious input detected" 
    });
  }
  
  next();
};

// XSS Protection
const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi
];

export const preventXSS = (req: Request, res: Response, next: NextFunction) => {
  const checkForXSS = (value: any): boolean => {
    if (typeof value === 'string') {
      return xssPatterns.some(pattern => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkForXSS);
    }
    if (value && typeof value === 'object') {
      return Object.values(value).some(checkForXSS);
    }
    return false;
  };

  if (checkForXSS(req.body) || 
      checkForXSS(req.query) || 
      checkForXSS(req.params)) {
    return res.status(400).json({ 
      error: "XSS attempt detected" 
    });
  }
  
  next();
};

// File upload security
export const secureFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    const file = req.file;
    
    // Check file size (already handled by multer, but double-check)
    if (file.size > 100 * 1024 * 1024) { // 100MB
      return res.status(400).json({ error: "File too large" });
    }
    
    // Validate file type by magic numbers (not just extension)
    const allowedTypes = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
      'application/pdf': [0x25, 0x50, 0x44, 0x46]
    };
    
    const fileBuffer = file.buffer;
    const mimeType = file.mimetype;
    
    if (allowedTypes[mimeType as keyof typeof allowedTypes]) {
      const signature = allowedTypes[mimeType as keyof typeof allowedTypes];
      const fileSignature = Array.from(fileBuffer.slice(0, signature.length));
      
      if (!signature.every((byte, index) => byte === fileSignature[index])) {
        return res.status(400).json({ 
          error: "File type mismatch - potential security threat" 
        });
      }
    }
    
    // Check for embedded scripts in files
    const fileContent = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length));
    if (/<script|javascript:|on\w+=/gi.test(fileContent)) {
      return res.status(400).json({ 
        error: "Malicious content detected in file" 
      });
    }
  }
  
  next();
};

// Security headers and CORS
export const setupSecurity = (app: Express) => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.supabase.co"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS configuration
  app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
    optionsSuccessStatus: 200
  }));

  // Additional security middleware
  app.use((req, res, next) => {
    // Remove server signature
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  });

  // Apply rate limiting (disabled in development and for uploads)
  if (process.env.NODE_ENV === "production") {
    app.use('/api/auth', authRateLimit);
    // Skip upload rate limiting entirely
    // app.use('/api/upload', uploadRateLimit);
    app.use('/api', apiRateLimit);
    app.use(generalRateLimit);
  } else {
    console.log('Rate limiting disabled in development mode');
  }

  // Apply security middleware
  app.use(sanitizeInput);
  app.use(preventSQLInjection);
  app.use(preventXSS);
};

// Validation schemas
export const authValidation = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
    body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-30 characters, alphanumeric and underscores only')
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 })
  ]
};

export const storyValidation = {
  create: [
    body('title').isLength({ min: 1, max: 200 }).trim().escape(),
    body('description').optional().isLength({ max: 2000 }).trim().escape(),
    body('genre').optional().isIn(['fantasy', 'romance', 'mystery', 'sci-fi', 'horror', 'adventure', 'drama', 'comedy'])
  ],
  update: [
    param('id').isUUID(),
    body('title').optional().isLength({ min: 1, max: 200 }).trim().escape(),
    body('description').optional().isLength({ max: 2000 }).trim().escape()
  ]
};

export const userValidation = {
  updateProfile: [
    body('username').optional().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
    body('bio').optional().isLength({ max: 500 }).trim().escape(),
    body('social_links').optional().isObject()
  ]
};
