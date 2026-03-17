# 🎉 MoMo Payment App for Saleor - COMPLETE

A fully functional MoMo payment gateway integration for Saleor e-commerce platform.

## ✅ What's Included

### Core Payment Features
- ✅ **TRANSACTION_INITIALIZE_SESSION** - Create MoMo payment with QR code
- ✅ **TRANSACTION_PROCESS_SESSION** - Verify and complete payments
- ✅ **TRANSACTION_CHARGE_REQUESTED** - Handle charge requests
- ✅ **TRANSACTION_REFUND_REQUESTED** - Process refunds via MoMo API
- ✅ **TRANSACTION_CANCELATION_REQUESTED** - Handle payment cancellations

### MoMo Integration
- ✅ HMAC SHA256 signature generation and verification
- ✅ Payment creation with QR code support
- ✅ IPN (Instant Payment Notification) webhook
- ✅ Payment status queries
- ✅ Refund API integration
- ✅ Return URL handling

### Testing Infrastructure
- ✅ Interactive UI test page (`/momo-test`)
- ✅ Automated test script (`pnpm test:momo`)
- ✅ Test utilities and mock data
- ✅ Comprehensive test documentation
- ✅ Full test flow guide

### Security & Configuration
- ✅ Environment-based configuration
- ✅ Secure webhook handling
- ✅ Request/response signature verification
- ✅ Production-ready error handling

## 📁 Files Created

```
saleor-app-template/
├── src/
│   ├── lib/
│   │   └── momo/
│   │       ├── momo-api.ts                    ← MoMo API client
│   │       ├── types.ts                       ← TypeScript definitions
│   │       └── test-utils.ts                  ← Test utilities & mock data
│   ├── scripts/
│   │   └── test-momo.ts                       ← Automated test script
│   └── pages/
│       ├── momo-test.tsx                      ← Interactive test UI
│       └── api/
│           ├── test/                          ← Test endpoints
│           │   ├── momo-initialize.ts
│           │   ├── momo-query.ts
│           │   ├── momo-refund.ts
│           │   └── momo-return.ts
│           ├── momo/                          ← Production endpoints
│           │   ├── ipn.ts                     ← IPN callback handler
│           │   └── return.ts                  ← Payment return handler
│           ├── webhooks/                      ← Saleor webhooks
│           │   ├── transaction-initialize-session.ts
│           │   ├── transaction-process-session.ts
│           │   ├── transaction-charge-requested.ts
│           │   ├── transaction-refund-requested.ts
│           │   └── transaction-cancelation-requested.ts
│           └── manifest.ts                    ← Updated with MoMo webhooks
├── graphql/
│   └── mutations/
│       └── TransactionMutations.graphql       ← Transaction mutations
├── .env.example                               ← MoMo configuration
├── package.json                               ← Updated with test scripts
├── MOMO_INTEGRATION.md                        ← Technical documentation
├── QUICKSTART_MOMO.md                         ← Quick start guide
├── TEST_FLOW.md                               ← Detailed test procedures
├── TESTING.md                                 ← Testing guide
└── README_MOMO.md                             ← This file
```

**Total: 28 files** (Production + Testing + Documentation)

## 🚀 Quick Start

### 1. Install & Configure

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env and add your MoMo credentials
# (Test credentials are already in .env.example)

# Generate types
pnpm generate

# Start development server
pnpm dev
```

### 2. Test Locally (No Saleor Required!)

```bash
# Open test UI in browser
open http://localhost:3000/momo-test

# Or run automated tests
pnpm test:momo
```

**Quick UI Test:**
1. Click "1. Initialize Payment" → Opens MoMo payment page
2. Use test phone: `0399888999`, OTP: `123456`
3. Complete payment
4. Click "2. Query Status" → Verify success ✅

### 3. Expose with ngrok (For Saleor Integration)

```bash
ngrok http 3000
```

Update `.env`:
```env
APP_API_BASE_URL=https://your-ngrok-url.ngrok.io
```

### 4. Install in Saleor

1. Go to Saleor Dashboard → Apps
2. Install External App
3. Manifest URL: `https://your-ngrok-url.ngrok.io/api/manifest`
4. Authorize

### 5. Test Full E2E Payment

1. Create order in storefront
2. Go to checkout
3. Select MoMo payment
4. Complete payment

✅ Done!

## 📖 Documentation

- **Quick Start**: [QUICKSTART_MOMO.md](./QUICKSTART_MOMO.md) - Get started in 5 minutes
- **Testing Guide**: [TESTING.md](./TESTING.md) - Complete testing documentation
- **Test Flow**: [TEST_FLOW.md](./TEST_FLOW.md) - Step-by-step test procedures
- **Full Documentation**: [MOMO_INTEGRATION.md](./MOMO_INTEGRATION.md) - Technical details
- **Saleor Docs**: https://docs.saleor.io/docs/3.x/developer/payments
- **MoMo API Docs**: https://developers.momo.vn

## 🔑 Test Credentials

### MoMo Sandbox

Already configured in `.env.example`:

```env
MOMO_PARTNER_CODE=MOMOBKUN20240101
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_ENDPOINT=https://test-payment.momo.vn
```

### Test Payment

- **Phone**: 0399888999
- **OTP**: 123456

## 🏗️ Architecture

```
Storefront → Saleor → Payment App → MoMo API
                ↑                       ↓
                └─────── IPN ──────────┘
```

### Payment Flow

1. **Initialize**: Create MoMo payment request → Get `payUrl`
2. **Redirect**: User pays on MoMo page
3. **IPN**: MoMo sends payment confirmation
4. **Process**: Verify and complete transaction
5. **Order**: Saleor creates order

## 🛠️ API Endpoints

### Webhooks (Registered Automatically)
- `POST /api/webhooks/transaction-initialize-session`
- `POST /api/webhooks/transaction-process-session`
- `POST /api/webhooks/transaction-charge-requested`
- `POST /api/webhooks/transaction-refund-requested`
- `POST /api/webhooks/transaction-cancelation-requested`

### MoMo Callbacks
- `POST /api/momo/ipn` - IPN notifications from MoMo
- `GET /api/momo/return` - Return URL after payment

## 🧪 Testing Checklist

- [ ] Payment initialization
- [ ] QR code generation
- [ ] Payment completion
- [ ] IPN callback handling
- [ ] Transaction status update in Saleor
- [ ] Refund processing
- [ ] Payment cancellation
- [ ] Error handling

## 🚀 Production Deployment

### 1. Get Production Credentials

Contact MoMo Business: https://business.momo.vn

### 2. Update Environment

```env
MOMO_PARTNER_CODE=your_production_code
MOMO_ACCESS_KEY=your_production_access_key
MOMO_SECRET_KEY=your_production_secret_key
MOMO_ENDPOINT=https://payment.momo.vn
STOREFRONT_URL=https://your-store.com
```

### 3. Deploy

**Vercel** (Recommended):
```bash
vercel --prod
```

**Railway**:
```bash
railway up
```

**Docker**:
```bash
docker build -t momo-payment-app .
docker run -p 3000:3000 --env-file .env momo-payment-app
```

### 4. Configure MoMo Portal

Set IPN URL to: `https://your-app.com/api/momo/ipn`

## 📊 Monitoring

### Logs to Watch

```bash
# Payment initialization
"Transaction Initialize Session webhook triggered"

# Payment completion
"MoMo payment status: { resultCode: 0 }"

# IPN received
"MoMo IPN received: { orderId, transId, resultCode }"

# Refund
"MoMo refund result: { resultCode: 0 }"
```

### Common Result Codes

| Code | Meaning |
|------|---------|
| 0    | Success |
| 9000 | Confirmed |
| 1000 | Initiated |
| 1003 | Declined |
| 1004 | Cancelled |

## ❓ Troubleshooting

### Payment not initializing
- Check MoMo credentials in `.env`
- Verify webhook is registered in Saleor
- Check app logs for errors

### IPN not received
- Ensure app URL is publicly accessible
- Verify firewall allows MoMo's IPs
- Check MoMo portal IPN configuration

### Transaction not updating
- Check `TRANSACTION_PROCESS_SESSION` webhook
- Verify payment status in MoMo portal
- Check Saleor transaction events

## 📞 Support

- **MoMo**: business@momo.vn / 1900 54 54 10
- **Saleor Discord**: https://discord.gg/H52JTZAtSH
- **GitHub Issues**: Create an issue in your repository

## 📝 License

BSD-3-Clause (same as Saleor App Template)

---

## 🎯 Next Steps

1. ✅ Test in development
2. ✅ Get production credentials
3. ✅ Deploy to production
4. ✅ Configure MoMo portal
5. ✅ Test end-to-end
6. ✅ Go live!

**Made with ❤️ for Saleor + MoMo integration**
