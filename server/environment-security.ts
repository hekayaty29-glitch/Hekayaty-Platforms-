import crypto from "crypto";

// Environment variable security validation
export const validateEnvironmentSecurity = (): void => {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLOUDINARY_API_SECRET',
    'RESEND_API_KEY'
  ];

  // Check for missing critical environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing critical environment variables: ${missingVars.join(', ')}`);
  }

  // Check for default/weak values
  const weakPatterns = [
    { key: 'SUPABASE_SERVICE_ROLE_KEY', patterns: ['your_key_here', 'changeme', 'default'] },
    { key: 'CLOUDINARY_API_SECRET', patterns: ['your_secret_here', 'changeme', 'default'] },
    { key: 'RESEND_API_KEY', patterns: ['your_key_here', 'changeme', 'default'] }
  ];

  weakPatterns.forEach(({ key, patterns }) => {
    const value = process.env[key]?.toLowerCase();
    if (value && patterns.some(pattern => value.includes(pattern))) {
      throw new Error(`Weak/default value detected for ${key} - security risk!`);
    }
  });

  // Generate JWT secret if not provided
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    console.warn('[SECURITY] Generated JWT secret - consider setting JWT_SECRET in environment');
  }

  // Generate encryption key if not provided
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    console.warn('[SECURITY] Generated encryption key - consider setting ENCRYPTION_KEY in environment');
  }

  console.log('[SECURITY] Environment security validation passed');
};
