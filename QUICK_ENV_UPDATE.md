# Quick Environment Update Guide

## 🎯 Tại sao phải update manual?

Node.js với `dotenv` **KHÔNG support** variable expansion `${VAR}`.  
Syntax `${VAR}` chỉ work trong bash/shell, không phải JavaScript!

Vì vậy, khi đổi base URL, bạn phải **manually update** các derived URLs.

---

## 📝 Khi Switch Environment

### Local Development → Production

**Step 1: Update Base URLs**
```bash
# FROM:
PAYMENT_APP_URL=http://localhost:3000
STOREFRONT_URL=http://localhost:3000

# TO:
PAYMENT_APP_URL=https://payment-vnpay-chi.vercel.app
STOREFRONT_URL=https://your-store.vercel.app
```

**Step 2: Update Derived URLs (Must Match!)**
```bash
# FROM:
APP_API_BASE_URL=http://localhost:3000
VNPAY_IPN_URL=http://localhost:3000/api/vnpay/ipn
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000

# TO:
APP_API_BASE_URL=https://payment-vnpay-chi.vercel.app
VNPAY_IPN_URL=https://payment-vnpay-chi.vercel.app/api/vnpay/ipn
NEXT_PUBLIC_STOREFRONT_URL=https://your-store.vercel.app
```

---

## ✅ Quick Checklist (Tránh sai sót)

Khi update environment, check 3 rules này:

### Rule 1: APP_API_BASE_URL = PAYMENT_APP_URL
```bash
PAYMENT_APP_URL=http://localhost:3000
APP_API_BASE_URL=http://localhost:3000  # ✅ SAME
```

### Rule 2: VNPAY_IPN_URL = PAYMENT_APP_URL + /api/vnpay/ipn
```bash
PAYMENT_APP_URL=http://localhost:3000
VNPAY_IPN_URL=http://localhost:3000/api/vnpay/ipn  # ✅ SAME + path
```

### Rule 3: NEXT_PUBLIC_STOREFRONT_URL = STOREFRONT_URL
```bash
STOREFRONT_URL=http://localhost:3000
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000  # ✅ SAME
```

---

## 🧪 Local Test - Current Config

**Your .env should look like:**
```bash
# Base URLs
PAYMENT_APP_URL=http://localhost:3000
STOREFRONT_URL=http://localhost:3000

# Derived URLs
APP_API_BASE_URL=http://localhost:3000
VNPAY_IPN_URL=http://localhost:3000/api/vnpay/ipn
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000
```

**Validate:**
```bash
./validate-vnpay-config.sh local
```

---

## 🚀 Production - Copy to Vercel

**Vercel Dashboard → Settings → Environment Variables**

```bash
# Base URLs (UPDATE THESE!)
PAYMENT_APP_URL=https://payment-vnpay-chi.vercel.app
STOREFRONT_URL=https://your-actual-store.vercel.app

# Derived URLs (MATCH base URLs!)
APP_API_BASE_URL=https://payment-vnpay-chi.vercel.app
VNPAY_IPN_URL=https://payment-vnpay-chi.vercel.app/api/vnpay/ipn
NEXT_PUBLIC_STOREFRONT_URL=https://your-actual-store.vercel.app

# Saleor
NEXT_PUBLIC_SALEOR_API_URL=https://store-fvfkk5hg.saleor.cloud/graphql/

# VNPay Production Credentials
VNPAY_TMN_CODE=your_production_code
VNPAY_HASH_SECRET=your_production_secret
VNPAY_ENVIRONMENT=production

# Exchange Rates
EXCHANGE_RATE_USD_TO_VND=25000
EXCHANGE_RATE_EUR_TO_VND=27000

# VNPay Production Endpoints
VNPAY_PAYMENT_URL=https://payment.vnpay.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://payment.vnpay.vn/merchant_webapi/api/transaction
```

---

## 🎨 Visual Mapping

```
┌─────────────────────────────────────────────────┐
│ BASE URLS (Define Once)                         │
├─────────────────────────────────────────────────┤
│ PAYMENT_APP_URL  = http://localhost:3000        │
│ STOREFRONT_URL   = http://localhost:3000        │
└─────────────────────────────────────────────────┘
                    ↓ ↓ ↓
┌─────────────────────────────────────────────────┐
│ DERIVED URLS (Must Match Base)                  │
├─────────────────────────────────────────────────┤
│ APP_API_BASE_URL          = PAYMENT_APP_URL     │
│ VNPAY_IPN_URL             = PAYMENT_APP_URL/... │
│ NEXT_PUBLIC_STOREFRONT_URL = STOREFRONT_URL     │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Common Mistakes

### ❌ Mistake 1: Forgot to update derived URLs
```bash
PAYMENT_APP_URL=https://payment-vnpay-chi.vercel.app
APP_API_BASE_URL=http://localhost:3000  # ❌ WRONG! Still localhost
```

### ❌ Mistake 2: Typo in path
```bash
VNPAY_IPN_URL=http://localhost:3000/vnpay/ipn  # ❌ Missing /api
```
**Should be:** `/api/vnpay/ipn`

### ❌ Mistake 3: Trailing slash
```bash
STOREFRONT_URL=http://localhost:3000/  # ❌ Has trailing slash
```
**Should be:** No trailing slash

---

## 🛠️ Quick Fix Commands

### Check current values:
```bash
cd /Users/paco/Documents/Projects/payment-vnpay
grep -E "(PAYMENT_APP_URL|STOREFRONT_URL|APP_API_BASE_URL|VNPAY_IPN_URL|NEXT_PUBLIC_STOREFRONT_URL)" .env
```

### Validate configuration:
```bash
./validate-vnpay-config.sh local
```

---

## 📌 Pro Tips

1. **Always update in this order:**
   - Base URLs first
   - Derived URLs second
   - Validate last

2. **Use .env.production as reference**
   - Keep it updated for easy copy-paste to Vercel

3. **Run validation after every change**
   ```bash
   ./validate-vnpay-config.sh local
   ```

4. **For different ports (local testing):**
   ```bash
   # Storefront on port 3001
   STOREFRONT_URL=http://localhost:3001
   NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3001
   
   # Payment app stays on 3000
   PAYMENT_APP_URL=http://localhost:3000
   APP_API_BASE_URL=http://localhost:3000
   VNPAY_IPN_URL=http://localhost:3000/api/vnpay/ipn
   ```

---

**Status**: Ready for local testing with manual URL management
