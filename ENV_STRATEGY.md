# Environment Configuration Strategy
# ==================================

## 📋 Overview

This project uses a **DRY (Don't Repeat Yourself)** approach for environment variables:
- Define base URLs once
- Other variables reference these base URLs
- Easy to switch between local/staging/production

---

## 🎯 Base Variables (Define These First!)

### Local Development

```bash
# Payment app runs on port 3000
PAYMENT_APP_URL=http://localhost:3000

# Storefront runs on port 3001
STOREFRONT_URL=http://localhost:3001
```

### Production (Vercel)

```bash
# Your payment app domain
PAYMENT_APP_URL=https://payment-vnpay-chi.vercel.app

# Your storefront domain
STOREFRONT_URL=https://your-actual-store.vercel.app
```

---

## 🔗 Derived Variables (Auto-Built)

These use the base variables above:

```bash
# App API endpoint
APP_API_BASE_URL=${PAYMENT_APP_URL}

# VNPay IPN webhook
VNPAY_IPN_URL=${PAYMENT_APP_URL}/api/vnpay/ipn

# Storefront return URL
NEXT_PUBLIC_STOREFRONT_URL=${STOREFRONT_URL}
```

**Why this works?**
- Change `PAYMENT_APP_URL` → All payment app URLs update
- Change `STOREFRONT_URL` → All storefront URLs update
- No need to update multiple places!

---

## 📝 Vercel Configuration

### Option 1: Use Variable References (Recommended)

In Vercel Dashboard:

```bash
# Base URLs
PAYMENT_APP_URL=https://payment-vnpay-chi.vercel.app
STOREFRONT_URL=https://your-store.vercel.app

# Derived (using ${} syntax)
APP_API_BASE_URL=${PAYMENT_APP_URL}
VNPAY_IPN_URL=${PAYMENT_APP_URL}/api/vnpay/ipn
NEXT_PUBLIC_STOREFRONT_URL=${STOREFRONT_URL}
```

### Option 2: Expand Values (If Vercel doesn't support ${})

```bash
# Base URLs
PAYMENT_APP_URL=https://payment-vnpay-chi.vercel.app
STOREFRONT_URL=https://your-store.vercel.app

# Expanded values
APP_API_BASE_URL=https://payment-vnpay-chi.vercel.app
VNPAY_IPN_URL=https://payment-vnpay-chi.vercel.app/api/vnpay/ipn
NEXT_PUBLIC_STOREFRONT_URL=https://your-store.vercel.app
```

---

## 🧪 Testing Different Environments

### Local → Local

```bash
PAYMENT_APP_URL=http://localhost:3000
STOREFRONT_URL=http://localhost:3001
```

Test: Both apps running locally

### Local → Production Storefront

```bash
PAYMENT_APP_URL=http://localhost:3000
STOREFRONT_URL=https://your-prod-store.vercel.app
```

Test: Payment app local, storefront production

### Staging

```bash
PAYMENT_APP_URL=https://payment-vnpay-staging.vercel.app
STOREFRONT_URL=https://store-staging.vercel.app
```

---

## 📊 Complete Variable List

### Required (Must Set)

| Variable | Example | Description |
|----------|---------|-------------|
| `PAYMENT_APP_URL` | `http://localhost:3000` | This app's base URL |
| `STOREFRONT_URL` | `http://localhost:3001` | Customer store URL |
| `NEXT_PUBLIC_SALEOR_API_URL` | `https://...saleor.cloud/graphql/` | Saleor API |
| `VNPAY_TMN_CODE` | `9BPJ5NYM` | VNPay terminal |
| `VNPAY_HASH_SECRET` | `8H7WMLT...` | VNPay secret |

### Derived (Auto-Built)

| Variable | Built From | Purpose |
|----------|------------|---------|
| `APP_API_BASE_URL` | `${PAYMENT_APP_URL}` | Saleor webhook target |
| `VNPAY_IPN_URL` | `${PAYMENT_APP_URL}/api/vnpay/ipn` | VNPay backend webhook |
| `NEXT_PUBLIC_STOREFRONT_URL` | `${STOREFRONT_URL}` | User redirect target |

### Optional (Has Defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `VNPAY_ENVIRONMENT` | `sandbox` | VNPay mode |
| `EXCHANGE_RATE_USD_TO_VND` | `25000` | USD/VND rate |
| `EXCHANGE_RATE_EUR_TO_VND` | `27000` | EUR/VND rate |

---

## ✅ Validation Checklist

Use the validation script:

```bash
cd /Users/paco/Documents/Projects/payment-vnpay
./validate-vnpay-config.sh local
```

**Checks**:
- ✅ Base URLs are set
- ✅ URLs have correct protocol (http/https)
- ✅ No trailing slashes
- ✅ Storefront ≠ Payment app domain
- ✅ All required variables present

---

## 🚀 Quick Setup Guide

### Step 1: Copy Template

```bash
# For local
cp .env .env.local

# Edit .env.local:
PAYMENT_APP_URL=http://localhost:3000
STOREFRONT_URL=http://localhost:3001
```

### Step 2: Update Vercel

```bash
# Copy .env.production values to Vercel Dashboard
# Settings → Environment Variables
# Paste all variables
```

### Step 3: Validate

```bash
# Local
./validate-vnpay-config.sh local

# Production (copy .env.production to temp file)
./validate-vnpay-config.sh production
```

### Step 4: Test

```bash
# Start both apps
Terminal 1: cd payment-vnpay && npm run dev
Terminal 2: cd saleor_user_web-main && npm run dev

# Test payment flow
```

---

## 🔧 Troubleshooting

### Issue: Variables Not Expanding

**Vercel doesn't support `${}` syntax in UI**

**Solution**: Use expanded values (Option 2)

### Issue: Wrong Domain Detected

**Check**: Validation script output

```bash
./validate-vnpay-config.sh local
# Look for: "Using explicit storefront URL from env"
```

### Issue: Need Different URLs Per Branch

**Vercel supports per-branch env vars**:
- Production: `STOREFRONT_URL=https://store.vercel.app`
- Preview: `STOREFRONT_URL=https://store-preview.vercel.app`
- Development: `STOREFRONT_URL=http://localhost:3001`

---

## 📚 Examples

### Local Development

```bash
# .env
PAYMENT_APP_URL=http://localhost:3000
STOREFRONT_URL=http://localhost:3001
NEXT_PUBLIC_SALEOR_API_URL=https://store-fvfkk5hg.saleor.cloud/graphql/
VNPAY_TMN_CODE=9BPJ5NYM
VNPAY_HASH_SECRET=8H7WMLT2J77PW2WJW78DI67ETKG5R6QG

# Derived automatically:
# VNPAY_IPN_URL=http://localhost:3000/api/vnpay/ipn
# NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3001
```

### Production

```bash
# .env.production (copy to Vercel)
PAYMENT_APP_URL=https://payment-vnpay-chi.vercel.app
STOREFRONT_URL=https://mystorefront.vercel.app
NEXT_PUBLIC_SALEOR_API_URL=https://store-fvfkk5hg.saleor.cloud/graphql/
VNPAY_TMN_CODE=production_code
VNPAY_HASH_SECRET=production_secret
VNPAY_ENVIRONMENT=production

# Derived automatically:
# VNPAY_IPN_URL=https://payment-vnpay-chi.vercel.app/api/vnpay/ipn
# NEXT_PUBLIC_STOREFRONT_URL=https://mystorefront.vercel.app
```

---

## 🎯 Key Benefits

1. **DRY**: Change base URL once, everything updates
2. **Clear**: Easy to see what points where
3. **Safe**: Validation prevents common mistakes
4. **Flexible**: Easy to switch environments
5. **Maintainable**: Less chance of typos/errors

---

**Status**: ✅ Production-ready configuration strategy
