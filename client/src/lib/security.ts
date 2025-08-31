// Client-side security utilities

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// XSS prevention for displaying user content
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// CSRF token management
let csrfToken: string | null = null;

export const getCSRFToken = async (): Promise<string> => {
  if (csrfToken) return csrfToken;
  
  try {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    csrfToken = data.token || '';
    return csrfToken || '';
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return '';
  }
};

// Secure API request wrapper
export const secureApiRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getCSRFToken();
  
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token,
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session management
  };
  
  return fetch(url, secureOptions);
};

// Password strength validation (client-side)
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('Include numbers');
  
  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Include special characters (@$!%*?&)');
  
  // Check for common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'admin'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    score -= 2;
    feedback.push('Avoid common words and patterns');
  }
  
  return {
    isValid: score >= 4,
    score: Math.max(0, score),
    feedback
  };
};

// Content Security Policy violation reporting
export const setupCSPReporting = () => {
  document.addEventListener('securitypolicyviolation', (e) => {
    console.warn('CSP Violation:', {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy
    });
    
    // Report to security monitoring service
    fetch('/api/security/csp-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        documentURI: e.documentURI,
        timestamp: Date.now()
      })
    }).catch(console.error);
  });
};

// Secure local storage wrapper
export const secureStorage = {
  set: (key: string, value: any): void => {
    try {
      const encrypted = btoa(JSON.stringify(value)); // Basic encoding
      localStorage.setItem(`nn_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  },
  
  get: (key: string): any => {
    try {
      const encrypted = localStorage.getItem(`nn_${key}`);
      if (!encrypted) return null;
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(`nn_${key}`);
  },
  
  clear: (): void => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('nn_'))
      .forEach(key => localStorage.removeItem(key));
  }
};

// File upload security
export const validateFileUpload = (file: File): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  // Check file size
  if (file.size > maxSize) {
    errors.push('File size exceeds 100MB limit');
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /\.php$/i,
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.js$/i,
    /\.html$/i,
    /\.htm$/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    errors.push('File extension not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting helper
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
  
  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Security headers check
export const checkSecurityHeaders = async (): Promise<void> => {
  try {
    const response = await fetch(window.location.origin, { method: 'HEAD' });
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options', 
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !headers.has(header));
    
    if (missingHeaders.length > 0) {
      console.warn('Missing security headers:', missingHeaders);
    }
  } catch (error) {
    console.error('Failed to check security headers:', error);
  }
};

// Initialize client-side security
export const initializeSecurity = (): void => {
  setupCSPReporting();
  checkSecurityHeaders();
  
  // Clear sensitive data on page unload
  window.addEventListener('beforeunload', () => {
    // Clear any sensitive data from memory
    csrfToken = null;
  });
  
  // Prevent drag and drop of external files in sensitive areas
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  document.addEventListener('drop', (e) => {
    e.preventDefault();
  });
};
