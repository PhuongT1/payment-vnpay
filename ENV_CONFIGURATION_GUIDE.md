# Environment Variables for Production Deployment

## Payment App (payment-vnpay)

Copy these to Railway/Vercel environment variables:

```bash
# Saleor Connection
NEXT_PUBLIC_SALEOR_API_URL=https://your-saleor.cloud/graphql/

# App URLs
APP_API_BASE_URL=https://payment-vnpay-chi.vercel.app

# VNPay Credentials (from VNPay registration)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_ENVIRONMENT=sandbox  # or production

# VNPay Endpoints
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction

# IPN URL (payment app receives webhooks)
VNPAY_IPN_URL=https://payment-vnpay-chi.vercel.app/api/vnpay/ipn

# CRITICAL: Storefront URL (where VNPay redirects users)
# ⚠️ This MUST be your storefront domain, NOT payment app domain!
NEXT_PUBLIC_STOREFRONT_URL=https://your-storefront.vercel.app
STOREFRONT_URL=https://your-storefront.vercel.app

# Currency Exchange Rates
EXCHANGE_RATE_USD_TO_VND=25000
EXCHANGE_RATE_EUR_TO_VND=27000
```

## Storefront (saleor_user_web-main)

Copy these to your storefront Vercel environment variables:

```bash
# Saleor API
NEXT_PUBLIC_SALEOR_API_URL=https://your-saleor.cloud/graphql/

# Your storefront URL (for reference)
NEXT_PUBLIC_SITE_URL=https://your-storefront.vercel.app
```

---

## ⚙️ Configuration Strategy

The payment app uses **multi-strategy detection** for flexibility:

### Priority Order:
1. **Explicit env variable** (`NEXT_PUBLIC_STOREFRONT_URL`) ← **RECOMMENDED**
2. **Referer header** (auto-detect from request)
3. **Origin header** (fallback)
4. **X-Forwarded-Host** (if behind proxy)
5. **Localhost fallback** (development only)

### For Local Development:
```bash
# Payment app: .env
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3001
VNPAY_IPN_URL=http://localhost:3000/api/vnpay/ipn

# Storefront: .env.local  
NEXT_PUBLIC_SALEOR_API_URL=https://your-saleor.cloud/graphql/
```

### For Production:
```bash
# Payment app: Vercel env vars
NEXT_PUBLIC_STOREFRONT_URL=https://your-storefront.vercel.app
VNPAY_IPN_URL=https://payment-vnpay-chi.vercel.app/api/vnpay/ipn

# Storefront: Vercel env vars
NEXT_PUBLIC_SALEOR_API_URL=https://your-saleor.cloud/graphql/
```

---

## 🧪 Testing Different Environments

### Test Local → Local
```bash
# Terminal 1: Payment app
cd payment-vnpay
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3001 npm run dev

# Terminal 2: Storefront
cd saleor_user_web-main
npm run dev  # Usually runs on 3001

# Test:
# → Checkout → VNPay
# → Should redirect to: http://localhost:3001/vnpay-return
```

### Test Local → Production Storefront
```bash
# Payment app with production storefront
cd payment-vnpay
NEXT_PUBLIC_STOREFRONT_URL=https://your-prod-store.vercel.app npm run dev

# Test from local:
# → VNPay will redirect to production storefront
# → Useful for testing production checkout flow
```

### Test Production → Production
```bash
# Deploy both apps with env vars set
# Test full flow on production domains
```

---

## 🔍 Validation

After deploying, check logs for:

```
✅ Expected logs (GOOD):
🎯 Using explicit storefront URL from env: https://your-storefront.vercel.app
✅ VNPay will redirect to: https://your-storefront.vercel.app/vnpay-return?checkout=XXX
🔧 VNPay configuration: { returnUrl: 'https://your-storefront.vercel.app/vnpay-return', ... }

❌ Warning logs (NEEDS FIX):
⚠️ No storefront URL detected, using fallback: http://localhost:3001
💡 Set NEXT_PUBLIC_STOREFRONT_URL in .env for production!

❌ Error logs (CRITICAL):
❌ CRITICAL: Storefront URL is actually payment app URL!
❌ This will cause popup not to close and order not to complete!
→ Fix: Set correct NEXT_PUBLIC_STOREFRONT_URL
```

---

## 🚨 Common Mistakes

### Mistake 1: Return URL points to payment app
```bash
❌ WRONG:
NEXT_PUBLIC_STOREFRONT_URL=https://payment-vnpay-chi.vercel.app

✅ CORRECT:
NEXT_PUBLIC_STOREFRONT_URL=https://your-storefront.vercel.app
```

### Mistake 2: IPN URL points to storefront
```bash
❌ WRONG:
VNPAY_IPN_URL=https://your-storefront.vercel.app/api/vnpay/ipn

✅ CORRECT:
VNPAY_IPN_URL=https://payment-vnpay-chi.vercel.app/api/vnpay/ipn
```

### Mistake 3: Missing protocol
```bash
❌ WRONG:
NEXT_PUBLIC_STOREFRONT_URL=your-storefront.vercel.app

✅ CORRECT:
NEXT_PUBLIC_STOREFRONT_URL=https://your-storefront.vercel.app
```

### Mistake 4: Trailing slash
```bash
❌ WRONG:
NEXT_PUBLIC_STOREFRONT_URL=https://your-storefront.vercel.app/

✅ CORRECT:
NEXT_PUBLIC_STOREFRONT_URL=https://your-storefront.vercel.app
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ User Browser (Storefront Domain)                        │
│ URL: https://your-storefront.vercel.app/checkout        │
└────────────┬────────────────────────────────────────────┘
             │ 1. Click "Đặt hàng"
             ↓
┌─────────────────────────────────────────────────────────┐
│ Saleor GraphQL API                                      │
│ Calls: transactionInitialize                            │
└────────────┬────────────────────────────────────────────┘
             │ 2. Webhook
             ↓
┌─────────────────────────────────────────────────────────┐
│ Payment App (payment-vnpay-chi.vercel.app)             │
│ webhook: vnpay-transaction-initialize-session           │
│                                                          │
│ 🎯 Detects: NEXT_PUBLIC_STOREFRONT_URL                  │
│    = https://your-storefront.vercel.app                 │
│                                                          │
│ 📤 Returns to Saleor:                                   │
│    paymentUrl: https://sandbox.vnpayment.vn/...         │
│    + vnp_ReturnUrl=https://your-storefront.vercel.app   │
│                     /vnpay-return?checkout=XXX          │
└────────────┬────────────────────────────────────────────┘
             │ 3. Return payment URL
             ↓
┌─────────────────────────────────────────────────────────┐
│ Storefront opens VNPay in popup                         │
│ Popup URL: https://sandbox.vnpayment.vn/...?            │
│            vnp_ReturnUrl=https://your-storefront...     │
└────────────┬────────────────────────────────────────────┘
             │ 4. User pays
             ↓
┌─────────────────────────────────────────────────────────┐
│ VNPay Gateway                                           │
│ Redirects to: vnp_ReturnUrl                             │
│ = https://your-storefront.vercel.app/vnpay-return      │
│   ✅ CORRECT DOMAIN!                                     │
└────────────┬────────────────────────────────────────────┘
             │ 5. Redirect
             ↓
┌─────────────────────────────────────────────────────────┐
│ Storefront /vnpay-return page                           │
│ - postMessage to parent window                          │
│ - Close popup                                           │
│ - Start polling                                         │
└────────────┬────────────────────────────────────────────┘
             │ 6. Parallel: IPN webhook
             ↓
┌─────────────────────────────────────────────────────────┐
│ VNPay IPN → Payment App                                 │
│ URL: https://payment-vnpay-chi.vercel.app/api/vnpay/ipn│
│ - Updates transaction                                   │
│ - Creates order in Saleor                               │
└─────────────────────────────────────────────────────────┘
             ↓
       ✅ ORDER CREATED!
       ✅ Polling detects order
       ✅ Redirect to confirmation
```

---

## 🎯 Quick Reference

| Variable | Points To | Used For |
|----------|-----------|----------|
| `NEXT_PUBLIC_STOREFRONT_URL` | Storefront | VNPay return redirect |
| `VNPAY_IPN_URL` | Payment app | Backend webhook |
| `APP_API_BASE_URL` | Payment app | App self-reference |
| `NEXT_PUBLIC_SALEOR_API_URL` | Saleor GraphQL | API calls |

**Remember**: Return URL = Storefront, IPN URL = Payment App!
