/**
 * Environment Configuration Helper
 * =================================
 * Central place for all environment variables with:
 * - Clear naming
 * - Default values
 * - Type safety
 * - Documentation
 */

// ===========================================
// 1. SALEOR CONNECTION
// ===========================================

export const SALEOR_API_URL = 
  process.env.NEXT_PUBLIC_SALEOR_API_URL || 
  'https://demo.saleor.io/graphql/';

// ===========================================
// 2. APPLICATION BASE URLS
// ===========================================

/**
 * Payment App Base URL (Backend - This app)
 * Where payment processing happens
 */
export const PAYMENT_APP_BASE_URL = 
  process.env.PAYMENT_APP_BASE_URL || 
  process.env.APP_API_BASE_URL ||
  'http://localhost:3000';

/**
 * Storefront Base URL (Frontend - Customer-facing)
 * Where customers shop and see products
 */
export const STOREFRONT_BASE_URL = 
  process.env.STOREFRONT_BASE_URL ||
  process.env.NEXT_PUBLIC_VNPAY_RETURN_BASE_URL ||
  process.env.NEXT_PUBLIC_STOREFRONT_URL ||
  process.env.STOREFRONT_URL ||
  'http://localhost:3000';

// ===========================================
// 3. SALEOR APP CONFIGURATION
// ===========================================

/**
 * App API Base URL
 * Where Saleor sends webhooks
 */
export const APP_API_BASE_URL = 
  process.env.APP_API_BASE_URL || 
  PAYMENT_APP_BASE_URL;

// ===========================================
// 4. VNPAY CALLBACK URLS
// ===========================================

/**
 * VNPay Return URL (User-facing callback)
 * Where VNPay redirects users after payment
 * MUST point to STOREFRONT (not payment app)
 */
export const VNPAY_RETURN_BASE_URL = 
  process.env.NEXT_PUBLIC_VNPAY_RETURN_BASE_URL ||
  process.env.NEXT_PUBLIC_STOREFRONT_URL ||
  STOREFRONT_BASE_URL;

/**
 * Build full VNPay return URL with path
 * Format: {STOREFRONT}/vnpay-return
 */
export function getVNPayReturnUrl(checkoutId?: string): string {
  const baseUrl = VNPAY_RETURN_BASE_URL;
  const path = '/vnpay-return';
  const url = `${baseUrl}${path}`;
  
  if (checkoutId) {
    return `${url}?checkout=${encodeURIComponent(checkoutId)}`;
  }
  
  return url;
}

/**
 * VNPay IPN Webhook URL (Backend callback)
 * Where VNPay sends server-to-server payment confirmation
 * MUST point to PAYMENT APP (backend)
 */
export const VNPAY_IPN_WEBHOOK_URL = 
  process.env.VNPAY_IPN_WEBHOOK_URL ||
  process.env.VNPAY_IPN_URL ||
  `${PAYMENT_APP_BASE_URL}/api/vnpay/ipn`;

// ===========================================
// 5. VNPAY CREDENTIALS
// ===========================================

/**
 * VNPay Terminal Code (Merchant ID)
 */
export const VNPAY_TMN_CODE = 
  process.env.VNPAY_TMN_CODE || 
  '';

/**
 * VNPay Hash Secret (HMAC key)
 */
export const VNPAY_HASH_SECRET = 
  process.env.VNPAY_HASH_SECRET || 
  '';

/**
 * VNPay Access Key (Optional - for query API)
 */
export const VNPAY_ACCESS_KEY = 
  process.env.VNPAY_ACCESS_KEY || 
  '';

/**
 * VNPay Environment Mode
 */
export const VNPAY_ENVIRONMENT = 
  process.env.VNPAY_ENVIRONMENT || 
  'sandbox';

/**
 * VNPay Config Name (Display in Saleor)
 */
export const VNPAY_CONFIG_NAME = 
  process.env.VNPAY_CONFIG_NAME ||
  process.env.VNPAY_DEFAULT_CONFIG_NAME ||
  'VNPay Payment Gateway';

// ===========================================
// 6. VNPAY API ENDPOINTS
// ===========================================

/**
 * VNPay Payment Gateway URL
 * Where users are redirected to pay
 */
export const VNPAY_PAYMENT_GATEWAY_URL = 
  process.env.VNPAY_PAYMENT_GATEWAY_URL ||
  process.env.VNPAY_PAYMENT_URL ||
  (VNPAY_ENVIRONMENT === 'production'
    ? 'https://payment.vnpay.vn/paymentv2/vpcpay.html'
    : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');

/**
 * VNPay Query API URL
 * For querying transaction status
 */
export const VNPAY_API_QUERY_URL = 
  process.env.VNPAY_API_QUERY_URL ||
  process.env.VNPAY_API_URL ||
  (VNPAY_ENVIRONMENT === 'production'
    ? 'https://payment.vnpay.vn/merchant_webapi/api/transaction'
    : 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction');

// ===========================================
// 7. CURRENCY EXCHANGE RATES
// ===========================================

/**
 * USD to VND exchange rate
 */
export const EXCHANGE_RATE_USD_TO_VND = 
  parseInt(process.env.EXCHANGE_RATE_USD_TO_VND || '25000', 10);

/**
 * EUR to VND exchange rate
 */
export const EXCHANGE_RATE_EUR_TO_VND = 
  parseInt(process.env.EXCHANGE_RATE_EUR_TO_VND || '27000', 10);

/**
 * Get exchange rate for a currency
 */
export function getExchangeRate(currency: string): number {
  const rates: Record<string, number> = {
    'USD': EXCHANGE_RATE_USD_TO_VND,
    'EUR': EXCHANGE_RATE_EUR_TO_VND,
    'VND': 1, // VND to VND = 1
  };
  
  return rates[currency.toUpperCase()] || EXCHANGE_RATE_USD_TO_VND;
}

// ===========================================
// 8. PAYMENT FLOW CONFIGURATION
// ===========================================

/**
 * Polling interval for checking order creation (ms)
 */
export const PAYMENT_POLLING_INTERVAL_MS = 
  parseInt(process.env.PAYMENT_POLLING_INTERVAL_MS || '2000', 10);

/**
 * Polling timeout max duration (ms)
 */
export const PAYMENT_POLLING_TIMEOUT_MS = 
  parseInt(process.env.PAYMENT_POLLING_TIMEOUT_MS || '60000', 10);

/**
 * VNPay popup window width
 */
export const VNPAY_POPUP_WIDTH = 
  parseInt(process.env.VNPAY_POPUP_WIDTH || '800', 10);

/**
 * VNPay popup window height
 */
export const VNPAY_POPUP_HEIGHT = 
  parseInt(process.env.VNPAY_POPUP_HEIGHT || '600', 10);

// ===========================================
// VALIDATION & LOGGING
// ===========================================

/**
 * Validate critical environment variables
 * Call this on app startup
 */
export function validateCriticalEnvVars(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check Saleor API
  if (!SALEOR_API_URL || SALEOR_API_URL === 'https://demo.saleor.io/graphql/') {
    errors.push('⚠️ NEXT_PUBLIC_SALEOR_API_URL not set - using demo API!');
  }
  
  // Check VNPay credentials
  if (!VNPAY_TMN_CODE) {
    errors.push('❌ VNPAY_TMN_CODE is required!');
  }
  
  if (!VNPAY_HASH_SECRET) {
    errors.push('❌ VNPAY_HASH_SECRET is required!');
  }
  
  // Check URLs
  if (STOREFRONT_BASE_URL === PAYMENT_APP_BASE_URL && 
      STOREFRONT_BASE_URL !== 'http://localhost:3000') {
    errors.push('⚠️ STOREFRONT_BASE_URL = PAYMENT_APP_BASE_URL. OK for local, but should differ in production!');
  }
  
  return {
    isValid: errors.filter(e => e.startsWith('❌')).length === 0,
    errors,
  };
}

/**
 * Log environment configuration (for debugging)
 */
export function logEnvConfig(): void {
  console.log('🔧 Environment Configuration:');
  console.log('  Saleor API:', SALEOR_API_URL);
  console.log('  Payment App:', PAYMENT_APP_BASE_URL);
  console.log('  Storefront:', STOREFRONT_BASE_URL);
  console.log('  VNPay Return:', VNPAY_RETURN_BASE_URL);
  console.log('  VNPay IPN:', VNPAY_IPN_WEBHOOK_URL);
  console.log('  VNPay Environment:', VNPAY_ENVIRONMENT);
  console.log('  VNPay Gateway:', VNPAY_PAYMENT_GATEWAY_URL);
  
  const validation = validateCriticalEnvVars();
  if (validation.errors.length > 0) {
    console.log('⚠️ Configuration warnings:');
    validation.errors.forEach(err => console.log('  ' + err));
  }
  
  if (!validation.isValid) {
    console.error('❌ Invalid configuration! Fix errors above.');
  }
}

// Export all as default for convenience
export default {
  SALEOR_API_URL,
  PAYMENT_APP_BASE_URL,
  STOREFRONT_BASE_URL,
  APP_API_BASE_URL,
  VNPAY_RETURN_BASE_URL,
  VNPAY_IPN_WEBHOOK_URL,
  VNPAY_TMN_CODE,
  VNPAY_HASH_SECRET,
  VNPAY_ACCESS_KEY,
  VNPAY_ENVIRONMENT,
  VNPAY_CONFIG_NAME,
  VNPAY_PAYMENT_GATEWAY_URL,
  VNPAY_API_QUERY_URL,
  EXCHANGE_RATE_USD_TO_VND,
  EXCHANGE_RATE_EUR_TO_VND,
  PAYMENT_POLLING_INTERVAL_MS,
  PAYMENT_POLLING_TIMEOUT_MS,
  VNPAY_POPUP_WIDTH,
  VNPAY_POPUP_HEIGHT,
  getVNPayReturnUrl,
  getExchangeRate,
  validateCriticalEnvVars,
  logEnvConfig,
};
