/**
 * Environment Variables Validator
 * ================================
 * Validates required environment variables on app startup
 * Throws descriptive errors if required vars are missing
 */

interface EnvConfig {
  // Saleor API
  saleorApiUrl: string;
  
  // App URLs
  appApiBaseUrl: string;
  appIframeBaseUrl: string;
  
  // VNPay (optional - can be configured via UI)
  vnpay?: {
    tmnCode?: string;
    hashSecret?: string;
    environment: 'sandbox' | 'production';
  };
  
  // Metadata
  apl: string;
  saleorSchemaVersion: string;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

export function validateEnvironment(): EnvConfig {
  const errors: string[] = [];
  
  // Required variables
  const requiredVars = {
    NEXT_PUBLIC_SALEOR_API_URL: process.env.NEXT_PUBLIC_SALEOR_API_URL,
    APP_API_BASE_URL: process.env.APP_API_BASE_URL,
  } as const;
  
  // Check for missing required vars
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });
  
  if (errors.length > 0) {
    throw new EnvironmentError(
      `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.\n` +
      `See .env.example for reference.`
    );
  }
  
  // Validate URLs are absolute
  const saleorApiUrl = requiredVars.NEXT_PUBLIC_SALEOR_API_URL!;
  const appApiBaseUrl = requiredVars.APP_API_BASE_URL!;
  
  if (!saleorApiUrl.startsWith('http://') && !saleorApiUrl.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SALEOR_API_URL must be an absolute URL (http:// or https://)');
  }
  
  if (!appApiBaseUrl.startsWith('http://') && !appApiBaseUrl.startsWith('https://')) {
    errors.push('APP_API_BASE_URL must be an absolute URL (http:// or https://)');
  }
  
  if (errors.length > 0) {
    throw new EnvironmentError(
      `Invalid environment configuration:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
  
  // Optional VNPay config
  const vnpayConfig = process.env.VNPAY_TMN_CODE || process.env.VNPAY_HASH_SECRET
    ? {
        tmnCode: process.env.VNPAY_TMN_CODE,
        hashSecret: process.env.VNPAY_HASH_SECRET,
        environment: (process.env.VNPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
      }
    : undefined;
  
  return {
    saleorApiUrl,
    appApiBaseUrl,
    appIframeBaseUrl: process.env.APP_IFRAME_BASE_URL || appApiBaseUrl,
    vnpay: vnpayConfig,
    apl: process.env.APL || 'file',
    saleorSchemaVersion: process.env.SALEOR_SCHEMA_VERSION || '3.22',
  };
}

/**
 * Get VNPay endpoint URLs based on environment
 */
export function getVNPayEndpoints(environment: 'sandbox' | 'production') {
  if (environment === 'production') {
    return {
      paymentUrl: process.env.VNPAY_PAYMENT_URL_PRODUCTION || 'https://payment.vnpay.vn/paymentv2/vpcpay.html',
      apiUrl: process.env.VNPAY_API_URL_PRODUCTION || 'https://payment.vnpay.vn/merchant_webapi/api/transaction',
    };
  }
  
  return {
    paymentUrl: process.env.VNPAY_PAYMENT_URL_SANDBOX || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    apiUrl: process.env.VNPAY_API_URL_SANDBOX || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  };
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    const config = validateEnvironment();
    console.log('✅ Environment validation passed');
    console.log(`📍 Saleor API: ${config.saleorApiUrl}`);
    console.log(`📍 App Base URL: ${config.appApiBaseUrl}`);
    if (config.vnpay) {
      console.log(`💳 VNPay: ${config.vnpay.environment} mode`);
    }
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error('\n❌ ' + error.message + '\n');
      // Don't throw in development to allow env setup# process.exit(1); // Uncomment for strict mode
    } else {
      throw error;
    }
  }
}
