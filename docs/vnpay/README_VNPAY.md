# 💳 VNPay Payment Gateway - Saleor Integration

Complete VNPay payment gateway integration for Saleor e-commerce platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Configuration](#configuration)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This integration provides a complete VNPay payment gateway for Saleor, supporting:

- ✅ **Multiple payment methods**: QR Code, ATM cards, International cards
- ✅ **Saleor webhooks**: Full transaction lifecycle support
- ✅ **IPN callback**: Real-time payment notifications
- ✅ **Sandbox testing**: Instant sandbox registration with test cards
- ✅ **Production ready**: Secure HMAC SHA512 signatures
- ✅ **Type-safe**: Full TypeScript support

### Why VNPay?

- ✅ **Instant sandbox**: Register và nhận credentials ngay lập tức
- ✅ **Public test cards**: 12+ test cards công khai
- ✅ **Market leader**: #1 payment gateway tại Việt Nam
- ✅ **Comprehensive documentation**: Chi tiết và dễ hiểu
- ✅ **Multiple banks**: Hỗ trợ 40+ ngân hàng

---

## ✨ Features

### Payment Methods

- **VNPAYQR**: QR Code payment via VNPay/Banking apps
- **ATM/Debit Cards**: Domestic bank cards via NAPAS
- **Credit/Debit International**: Visa, Mastercard, JCB
- **Bank Account**: Direct bank account payment

### Transaction Management

- ✅ Initialize payment session
- ✅ Process payment authorization
- ✅ Query transaction status
- ✅ Refund handling (full/partial)
- ✅ Cancel transactions
- ✅ IPN webhook handling

### Security

- 🔐 HMAC SHA512 signature verification
- 🔐 SSL/TLS for all API calls
- 🔐 PCI DSS compliant
- 🔐 Secure credential management

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- VNPay sandbox credentials

### 1. Register VNPay Sandbox

```bash
# Truy cập:
open http://sandbox.vnpayment.vn/devreg/

# Nhận credentials qua email:
# - vnp_TmnCode
# - vnp_HashSecret
```

### 2. Install & Configure

```bash
# Install dependencies
pnpm install

# Configure .env
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
```

### 3. Run & Test

```bash
# Start server
pnpm run dev

# Open test page
open http://localhost:3000/vnpay-test
```

📖 **Detailed guide:** See [VNPAY_QUICKSTART.md](./VNPAY_QUICKSTART.md)

---

## 🏗️ Architecture

### Payment Flow

```
┌─────────────┐
│   Customer  │
│  (Browser)  │
└──────┬──────┘
       │ 1. Checkout
       ↓
┌─────────────────────────────────────────┐
│         Saleor Checkout                 │
│  ┌───────────────────────────────────┐  │
│  │ TRANSACTION_INITIALIZE_SESSION    │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼──────────────────────┘
                   │ 2. Call webhook
                   ↓
┌─────────────────────────────────────────┐
│     Saleor Payment App (This Project)   │
│  ┌───────────────────────────────────┐  │
│  │ VNPayAPI.createPayment()          │  │
│  │ - Generate signature              │  │
│  │ - Build payment URL               │  │
│  │ - Return to Saleor                │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼──────────────────────┘
                   │ 3. Payment URL
                   ↓
┌─────────────────────────────────────────┐
│         Redirect to VNPay               │
│  ┌───────────────────────────────────┐  │
│  │ sandbox.vnpayment.vn              │  │
│  │ - Select payment method           │  │
│  │ - Enter card/account info         │  │
│  │ - Authenticate (OTP)              │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼──────────────────────┘
                   │ 4. Payment result
                   ↓
┌─────────────────────────────────────────┐
│     Parallel Callbacks                  │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │ Return URL   │  │  IPN Callback   │  │
│  │ (Customer)   │  │  (Server)       │  │
│  │              │  │                 │  │
│  │ Show result  │  │ Update order    │  │
│  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

### Component Architecture

```
src/
├── lib/vnpay/
│   ├── vnpay-api.ts       # Main API client
│   ├── types.ts           # TypeScript definitions
│   └── test-utils.ts      # Testing helpers
│
├── pages/
│   ├── vnpay-test.tsx     # Test UI
│   └── api/
│       ├── vnpay/
│       │   ├── ipn.ts         # IPN webhook handler
│       │   └── return.ts      # Return URL handler
│       ├── webhooks/
│       │   ├── transaction-initialize-session.ts
│       │   ├── transaction-process-session.ts
│       │   └── transaction-refund-requested.ts
│       └── test/
│           ├── vnpay-initialize.ts
│           └── vnpay-query.ts
```

---

## 📁 File Structure

### Production Files (9 files)

#### Core Library
- **src/lib/vnpay/vnpay-api.ts** (320 lines)
  - VNPayAPI class
  - createPayment(), queryTransaction(), refundTransaction()
  - HMAC SHA512 signature generation
  - getVNPayAPI() factory function

- **src/lib/vnpay/types.ts** (420 lines)
  - TypeScript interfaces and enums
  - Helper functions: isVNPayPaymentSuccessful(), formatVNPayAmount()
  - Vietnamese diacritics removal

#### API Endpoints
- **src/pages/api/vnpay/ipn.ts** (150 lines)
  - IPN callback handler
  - Signature verification
  - Order status update

- **src/pages/api/vnpay/return.ts** (200 lines)
  - Customer return URL handler
  - Result page generation
  - Auto-redirect after 30s

#### Saleor Webhooks
- **src/pages/api/webhooks/transaction-initialize-session.ts**
  - Initialize payment session
  - Return payment URL to Saleor

- **src/pages/api/webhooks/transaction-process-session.ts**
  - Process payment verification
  - Update transaction status

- **src/pages/api/webhooks/transaction-refund-requested.ts**
  - Handle refund requests
  - Partial/full refund support

#### Test Infrastructure
- **src/pages/vnpay-test.tsx** (500 lines)
  - Interactive test UI
  - Initialize, query, test cards
  - Real-time results display

- **src/pages/api/test/vnpay-initialize.ts**
  - Test payment initialization

- **src/pages/api/test/vnpay-query.ts**
  - Test transaction query

### Documentation Files (5 files)

1. **README_VNPAY.md** - This file
2. **VNPAY_QUICKSTART.md** - 5-minute setup guide
3. **VNPAY_TEST_CARDS.md** - Complete test card list
4. **VNPAY_INTEGRATION.md** - Technical integration details
5. **VNPAY_PRODUCTION.md** - Production deployment guide

---

## ⚙️ Configuration

### Environment Variables

```bash
# .env
VNPAY_TMN_CODE=DEMOV210              # Merchant code from VNPay
VNPAY_HASH_SECRET=your_secret_key     # Hash secret for signatures

# Sandbox URLs (default)
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction

# Optional
VNPAY_RETURN_URL=http://localhost:3000/api/vnpay/return
```

### Saleor Configuration

1. **Install App in Saleor Dashboard**
   ```
   Apps → Install from URL
   URL: http://localhost:3000
   ```

2. **Configure Webhooks**
   - Automatically registered via manifest
   - Check: Settings → Webhooks

3. **Test Checkout**
   - Create product
   - Add to cart
   - Proceed to checkout
   - Select VNPay payment

---

## 🧪 Testing

### Test UI

```bash
# Open test page
open http://localhost:3000/vnpay-test
```

### Test Flow

1. **Initialize Payment**
   - Enter order ID, amount
   - Click "1️⃣ Initialize Payment"
   - Get payment URL

2. **Complete Payment**
   - Click "Open VNPay Payment Page"
   - Select bank: NCB
   - Enter card: `9704198526191432198`
   - OTP: `123456`

3. **Verify Result**
   - Check return page
   - Check console logs
   - Query transaction status

### Test Cards

See [VNPAY_TEST_CARDS.md](./VNPAY_TEST_CARDS.md) for complete list (12+ cards).

**Quick test card:**
```
Bank: NCB
Card: 9704198526191432198
Name: NGUYEN VAN A
Date: 07/15
OTP: 123456
```

---

## 🚀 Production Deployment

### 1. Get Production Credentials

```bash
# Contact VNPay
Email: hotrovnpay@vnpay.vn
Phone: 1900 55 55 77

# Provide:
- Company registration
- Tax ID
- Business license
```

### 2. Update Configuration

```bash
# .env.production
VNPAY_TMN_CODE=YOUR_PROD_CODE
VNPAY_HASH_SECRET=YOUR_PROD_SECRET
VNPAY_PAYMENT_URL=https://payment.vnpay.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://payment.vnpay.vn/merchant_webapi/api/transaction
```

### 3. Security Checklist

- [ ] Use HTTPS for all URLs
- [ ] Enable IPN URL with SSL
- [ ] Verify all signatures
- [ ] Log all transactions
- [ ] Monitor for suspicious activity
- [ ] Set up error alerts
- [ ] Test refund flow
- [ ] Backup payment data

### 4. Go Live

```bash
# Deploy to production
pnpm build
pnpm start

# Update Saleor with production URLs
# Test complete checkout flow
# Monitor first transactions closely
```

---

## 📖 API Reference

### VNPayAPI Class

```typescript
import { getVNPayAPI } from "@/lib/vnpay/vnpay-api";

const vnpayAPI = getVNPayAPI();

// Create payment
const payment = await vnpayAPI.createPayment({
  orderId: "ORDER_123",
  amount: 100000, // VND
  orderInfo: "Payment for order ORDER_123",
  ipAddr: "127.0.0.1",
  bankCode: "NCB", // Optional
  locale: "vn",
});

// Query transaction
const query = await vnpayAPI.queryTransaction({
  orderId: "ORDER_123",
  transactionDate: "20240315120000",
  ipAddr: "127.0.0.1",
});

// Refund
const refund = await vnpayAPI.refundTransaction({
  orderId: "ORDER_123",
  amount: 100000,
  transactionDate: "20240315120000",
  transactionType: "02", // Full refund
  createdBy: "admin",
  ipAddr: "127.0.0.1",
});

// Verify IPN signature
const isValid = vnpayAPI.verifyIPNSignature(ipnData);
```

### Response Codes

```typescript
// Success
vnp_ResponseCode = "00"
vnp_TransactionStatus = "00"

// Common errors
"07" = Suspected fraud
"09" = Not registered Internet Banking
"11" = Timeout
"24" = Canceled by user
"51" = Insufficient balance
```

See [VNPAY_INTEGRATION.md](./VNPAY_INTEGRATION.md) for complete API documentation.

---

## 🐛 Troubleshooting

### Invalid Signature

**Problem:** `vnp_SecureHash` verification fails

**Solution:**
1. Check `VNPAY_HASH_SECRET` is correct
2. Ensure no extra spaces in .env
3. Restart server after .env changes
4. Verify parameter sorting (alphabetical)

### Merchant Not Found

**Problem:** `vnp_TmnCode` not recognized

**Solution:**
1. Verify `VNPAY_TMN_CODE` from email
2. Check for sandbox vs production mismatch
3. Re-register if needed

### Payment Timeout

**Problem:** Payment expires before completion

**Solution:**
1. Check `vnp_ExpireDate` (default: 15 minutes)
2. Increase timeout in `vnpay-api.ts`
3. Test with faster completion

### IPN Not Received

**Problem:** Server doesn't receive IPN callback

**Solution:**
1. Ensure IPN URL is publicly accessible
2. Use ngrok for local testing
3. Check VNPay IPN logs
4. Verify URL registered correctly

### Test Card Fails

**Problem:** Test card returns error

**Solution:**
1. Use exact card number: `9704198526191432198`
2. OTP must be: `123456`
3. Check bank is NCB
4. Try different test cardSee [VNPAY_TEST_CARDS.md](./VNPAY_TEST_CARDS.md)

---

## 📞 Support

### VNPay Support
- 📧 Email: hotrovnpay@vnpay.vn
- 📞 Hotline: 1900 55 55 77
- 🌐 Portal: https://business.vnpay.vn
- 📚 Docs: https://sandbox.vnpayment.vn/apis/docs/

### Documentation Links
- [Sandbox Registration](http://sandbox.vnpayment.vn/devreg/)
- [API Documentation](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)
- [Test Demo](https://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder)
- [Bank List](https://sandbox.vnpayment.vn/apis/danh-sach-ngan-hang/)

---

## 📄 License

This integration is part of the Saleor Payment App Template.

---

**Created:** March 15, 2026  
**Version:** 1.0.0  
**Author:** Saleor VNPay Integration Team
