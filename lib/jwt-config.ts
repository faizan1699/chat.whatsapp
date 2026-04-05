// Centralized JWT configuration
export const JWT_CONFIG = {
  secret: new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production'),
  refreshSecret: new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_dont_use_in_production'),
  
  validate() {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET environment variable is required in production');
      }
    }
  }
};

export const secret = JWT_CONFIG.secret;
export const refreshSecret = JWT_CONFIG.refreshSecret;
