// Input validation and sanitization utilities for Edge Functions

export function validateInput(input: any): boolean {
  if (typeof input === 'string') {
    return !detectSQLInjection(input) && !detectXSS(input)
  }
  return true
}

export function sanitizeInput(input: string): string {
  return sanitizeString(input)
}

export function sanitizeString(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>'"\\;]/g, '') // Remove HTML/script chars
    .replace(/\b(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|UNION|SELECT)\b/gi, '') // Remove SQL keywords
    .trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[sanitizeString(key)] = sanitizeObject(obj[key])
      }
    }
    return sanitized
  }
  return obj
}

export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /((\%27)|('))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /((\%3C)|(<)).*?((\%3E)|(>))/gi
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

export function validateRequest(req: Request, requiredFields: string[] = []): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      const body = await req.json()
      const sanitizedBody = sanitizeObject(body)
      
      // Check for required fields
      for (const field of requiredFields) {
        if (!sanitizedBody[field]) {
          reject(new Error(`Missing required field: ${field}`))
          return
        }
      }
      
      // Check for malicious content
      const bodyString = JSON.stringify(sanitizedBody)
      if (detectSQLInjection(bodyString)) {
        reject(new Error('SQL injection attempt detected'))
        return
      }
      
      if (detectXSS(bodyString)) {
        reject(new Error('XSS attempt detected'))
        return
      }
      
      resolve(sanitizedBody)
    } catch (error) {
      reject(new Error('Invalid JSON body'))
    }
  })
}
