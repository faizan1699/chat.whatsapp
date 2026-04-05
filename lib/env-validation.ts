// Environment variable validation
export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const optional = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about optional JWT secrets in development
  if (process.env.NODE_ENV === 'development') {
    const missingOptional = optional.filter(key => !process.env[key]);
    if (missingOptional.length > 0) {
      console.warn(`Warning: Missing optional environment variables (using fallbacks): ${missingOptional.join(', ')}`);
    }
  }

  // Require JWT secrets in production
  if (process.env.NODE_ENV === 'production') {
    const missingProduction = optional.filter(key => !process.env[key]);
    if (missingProduction.length > 0) {
      throw new Error(`Missing required environment variables for production: ${missingProduction.join(', ')}`);
    }
  }
}
