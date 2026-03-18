# Saleor Payment App Architecture - Quick Reference

## 🎯 2 Required Webhooks For Payment Apps

### 1. PAYMENT_GATEWAY_INITIALIZE_SESSION (Layer 1 - Discovery)
**Purpose**: Make payment gateway VISIBLE in checkout

**When Called**: Storefront loads checkout payment step

**What It Does**: 
- Returns list of available payment gateways
- Saleor shows these as payment options to customer

**Response Format**:
```json
{
  "data": [
    {
      "id": "vnpay.payment.app",
      "name": "VNPay",
      "currencies": ["VND", "USD"],
      "config": [
        { "field": "gateway_id", "value": "vnpay" },
        { "field": "environment", "value": "sandbox" }
      ]
    }
  ]
}
```

**Critical**: WITHOUT THIS WEBHOOK, payment method WILL NOT APPEAR in checkout!

### 2. TRANSACTION_INITIALIZE_SESSION (Layer 2 - Payment)
**Purpose**: Initialize actual payment when customer selects gateway

**When Called**: Customer clicks "Complete Checkout" after selecting payment method

**What It Does**:
- Creates payment in payment provider (VNPay, Stripe, etc.)
- Returns payment URL for redirect
- Returns pspReference for tracking

**Response Format**:
```json
{
  "pspReference": "VNPAY_123456",
  "result": "AUTHORIZATION_ACTION_REQUIRED",
  "amount": 100000,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/..."
  },
  "actions": [
    {
      "actionType": "REDIRECT",
      "url": "https://sandbox.vnpayment.vn/..."
    }
  ]
}
```

## 🔄 Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CHECKOUT PAGE LOADS                                      │
│    Storefront calls: checkout.availablePaymentGateways      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SALEOR CALLS: PAYMENT_GATEWAY_INITIALIZE_SESSION         │
│    To each installed payment app                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. APP RETURNS: Available gateways                          │
│    { id: "vnpay", name: "VNPay", ... }                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. STOREFRONT SHOWS: Payment options                        │
│    ○ Credit Card                                            │
│    ○ VNPay                                                  │
│    ○ MoMo                                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ Customer selects VNPay
┌─────────────────────────────────────────────────────────────┐
│ 5. SALEOR CALLS: TRANSACTION_INITIALIZE_SESSION             │
│    To VNPay app only                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. VNPAY APP: Creates payment, returns URL                  │
│    Creates payment in VNPay system                          │
│    Returns redirect URL                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. USER REDIRECTED: To VNPay payment page                   │
│    Completes payment on VNPay website                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. CALLBACK: IPN + Return URL                              │
│    VNPay notifies app of payment result                     │
│    App updates Saleor transaction                           │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Manifest Requirements

**File**: `src/pages/api/manifest.ts`

### Required Imports:
```typescript
import { paymentGatewayInitializeSessionWebhook } from "./webhooks/payment-gateway-initialize-session";
import { transactionInitializeSessionWebhook } from "./webhooks/transaction-initialize-session";
```

### Required Permissions:
```typescript
permissions: [
  "HANDLE_PAYMENTS",     // Required for payment operations
  "MANAGE_ORDERS",        // Read order data
  "MANAGE_CHECKOUTS",     // Read checkout data
]
```

### Required Webhooks:
```typescript
webhooks: [
  paymentGatewayInitializeSessionWebhook.getWebhookManifest(apiBaseURL),
  transactionInitializeSessionWebhook.getWebhookManifest(apiBaseURL),
]
```

## ⚠️ Common Mistakes

### ❌ Mistake 1: Only Implementing TRANSACTION webhook
```typescript
// WRONG - Gateway won't appear in checkout!
webhooks: [
  transactionInitializeSessionWebhook.getWebhookManifest(apiBaseURL),
]
```

```typescript
// CORRECT - Both webhooks required
webhooks: [
  paymentGatewayInitializeSessionWebhook.getWebhookManifest(apiBaseURL),
  transactionInitializeSessionWebhook.getWebhookManifest(apiBaseURL),
]
```

### ❌ Mistake 2: Not Reinstalling After Webhook Changes
```bash
# WRONG Process:
1. Add webhook to manifest
2. Deploy to Vercel
3. Expect it to work ❌

# CORRECT Process:
1. Add webhook to manifest
2. Deploy to Vercel
3. UNINSTALL app from Saleor
4. REINSTALL app from manifest URL
5. Now it works ✅
```

### ❌ Mistake 3: Hardcoding Credentials Instead of Using Metadata
```typescript
// WRONG - Lost on redeploy
const config = {
  tmnCode: "9BPJ5NYM",
  hashSecret: "SECRET"
};

// CORRECT - Persisted in Saleor
const configs = await getConfigsFromMetadata(client);
```

## 🧪 Testing Checklist

### Before Installation:
- [ ] Both webhooks implemented
- [ ] Webhooks registered in manifest
- [ ] Permissions include HANDLE_PAYMENTS
- [ ] Build succeeds without errors
- [ ] Deployed to production URL

### After Installation:
- [ ] Verify webhooks in Dashboard → Apps → Webhooks
- [ ] Should see PAYMENT_GATEWAY_INITIALIZE_SESSION
- [ ] Should see TRANSACTION_INITIALIZE_SESSION
- [ ] Check app has HANDLE_PAYMENTS permission

### Configuration:
- [ ] Can add configuration in app UI
- [ ] Configuration persists after reload
- [ ] Can assign to channels
- [ ] Mappings save correctly

### Checkout Flow:
- [ ] Payment gateway appears in checkout
- [ ] Can select payment method
- [ ] Redirects to payment page
- [ ] Payment completes successfully
- [ ] Order created in Saleor

## 📚 Key GraphQL Queries

### Check Available Gateways:
```graphql
query CheckPaymentGateways($id: ID!) {
  checkout(id: $id) {
    id
    availablePaymentGateways {
      id
      name
      currencies
      config {
        field
        value
      }
    }
  }
}
```

### Check Webhooks Registered:
```graphql
query CheckAppWebhooks {
  apps(first: 20) {
    edges {
      node {
        id
        name
        webhooks {
          edges {
            node {
              name
              targetUrl
              isActive
              events {
                eventType
              }
            }
          }
        }
      }
    }
  }
}
```

## 🔧 Debug Tools

### Check Webhook Logs:
```typescript
// In webhook handler, always log:
console.log("Payment Gateway Initialize Session webhook triggered", {
  channel: sourceObject.channel.slug,
  objectType: sourceObject.__typename,
});
```

### Test Webhook Locally:
```bash
# Use ngrok for local testing
ngrok http 3000

# Install app with ngrok URL
https://YOUR-NGROK-URL.ngrok.io/api/manifest
```

### Verify Response Format:
```typescript
// Response MUST match this structure:
return res.status(200).json({
  data: [
    {
      id: string,           // Gateway ID
      name: string,         // Display name
      currencies: string[], // Supported currencies
      config: Array<{       // Configuration
        field: string,
        value: string
      }>
    }
  ]
});
```

## 📖 References

- [Saleor Payment Documentation](https://docs.saleor.io/docs/3.x/developer/payments)
- [App SDK Webhooks](https://github.com/saleor/saleor-app-sdk/blob/main/docs/saleor-webhook.md)
- [Payment Gateway Example](https://github.com/saleor/example-payment-gateways)

## ✅ Success Criteria

Your payment app is correctly implemented when:

1. ✅ Gateway appears in `checkout.availablePaymentGateways` query
2. ✅ Gateway visible in storefront checkout UI
3. ✅ Clicking gateway triggers TRANSACTION webhook
4. ✅ Payment redirect works
5. ✅ Payment completion updates Saleor order

---

**Remember**: Payment apps need BOTH webhooks - one for discovery, one for payment!
