/**
 * Detect storefront URL for VNPay return
 * 
 * Strategy (in priority order):
 * 1. Explicit env variable (STOREFRONT_BASE_URL, NEXT_PUBLIC_VNPAY_RETURN_BASE_URL)
 * 2. Referer header (from checkout page)
 * 3. Origin header (from GraphQL request)
 * 4. Fallback to localhost for development
 * 
 * This ensures VNPay redirects back to the correct storefront domain
 * whether in local dev or production.
 */

import { NextApiRequest } from 'next';
import { STOREFRONT_BASE_URL, PAYMENT_APP_BASE_URL } from '@/lib/env-config';

export function detectStorefrontUrl(req: NextApiRequest): string {
  // Strategy 1: Explicit configuration (highest priority)
  // Use this in production for guaranteed correct URL
  if (STOREFRONT_BASE_URL && STOREFRONT_BASE_URL !== 'http://localhost:3000') {
    console.log('🎯 Using explicit storefront URL from env:', STOREFRONT_BASE_URL);
    return STOREFRONT_BASE_URL;
  }

  // Strategy 2: Referer header (where the request came from)
  // This works when checkout page initiates the transaction
  const referer = req.headers.referer || req.headers.referrer;
  if (referer) {
    try {
      const refererUrl = new URL(referer as string);
      const storefrontUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      console.log('🔗 Detected storefront URL from referer:', storefrontUrl);
      return storefrontUrl;
    } catch (error) {
      console.warn('⚠️ Invalid referer URL:', referer);
    }
  }

  // Strategy 3: Origin header (alternative to referer)
  const origin = req.headers.origin;
  if (origin) {
    console.log('🌐 Detected storefront URL from origin:', origin);
    return origin as string;
  }

  // Strategy 4: X-Forwarded-Host (if behind proxy)
  const forwardedHost = req.headers['x-forwarded-host'];
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
  if (forwardedHost) {
    const storefrontUrl = `${forwardedProto}://${forwardedHost}`;
    console.log('📡 Detected storefront URL from forwarded headers:', storefrontUrl);
    return storefrontUrl;
  }

  // Strategy 5: Fallback to localhost for development
  const fallbackUrl = STOREFRONT_BASE_URL; // Use configured base URL
  console.warn('⚠️ No storefront URL detected, using fallback:', fallbackUrl);
  console.warn('💡 Set STOREFRONT_BASE_URL in .env for production!');
  
  return fallbackUrl;
}

/**
 * Build VNPay return URL
 * Points to storefront's vnpay-return page (not payment app!)
 */
export function buildVNPayReturnUrl(req: NextApiRequest, checkoutId?: string): string {
  const storefrontUrl = detectStorefrontUrl(req);
  
  // Build return URL with checkout ID for context
  const returnUrl = new URL('/vnpay-return', storefrontUrl);
  
  if (checkoutId) {
    returnUrl.searchParams.set('checkout', checkoutId);
  }
  
  const finalUrl = returnUrl.toString();
  console.log('✅ VNPay will redirect to:', finalUrl);
  
  return finalUrl;
}

/**
 * Validate detected URL
 * Ensures it's not pointing to payment app itself
 */
export function validateStorefrontUrl(url: string): boolean {
  const paymentAppDomains = [
    'payment-vnpay',
    'localhost:3000', // Payment app local port
  ];
  
  const isPaymentApp = paymentAppDomains.some(domain => url.includes(domain));
  
  if (isPaymentApp) {
    console.error('❌ CRITICAL: Storefront URL is actually payment app URL!');
    console.error('❌ This will cause popup not to close and order not to complete!');
    console.error('💡 Fix: Set STOREFRONT_BASE_URL in .env (different from PAYMENT_APP_BASE_URL)');
    return false;
  }
  
  return true;
}
