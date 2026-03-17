/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  env: {
    // Make VNPay env vars available on client side for dev mode
    NEXT_PUBLIC_VNPAY_TMN_CODE: process.env.VNPAY_TMN_CODE,
    NEXT_PUBLIC_VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET,
    NEXT_PUBLIC_VNPAY_ENVIRONMENT: process.env.VNPAY_ENVIRONMENT || 'sandbox',
    NEXT_PUBLIC_VNPAY_REDIRECT_URL: process.env.VNPAY_REDIRECT_URL || 'http://localhost:3000/api/vnpay/return',
    NEXT_PUBLIC_VNPAY_IPN_URL: process.env.VNPAY_IPN_URL || 'http://localhost:3000/api/vnpay/ipn',
  },
}

export default nextConfig
