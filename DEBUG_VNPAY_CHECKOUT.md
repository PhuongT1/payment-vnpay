# 🔍 DEBUG: VNPay Không Hiện Trong Checkout

## ✅ Bước 1: Verify Webhooks Đã Được Đăng Ký

**Saleor Dashboard → Apps → VNPay Payment Gateway → Webhooks tab**

### Phải thấy 4 webhooks:
```
1. Order Created                              [ASYNC]
2. Order Filter Shipping Methods              [SYNC]
3. Payment Gateway Initialize Session         [SYNC] ← CRITICAL!
4. VNPay Transaction Initialize Session       [SYNC]
```

**Nếu chỉ thấy 2 webhooks:**
→ App chưa reinstall đúng!
→ Uninstall → Install lại từ manifest URL

---

## ✅ Bước 2: Verify Configuration

**Open VNPay App:**

1. **VNPay Configurations section:**
   - Có config "VNPay Sandbox" ✓
   - TMN Code: 9BPJ5NYM ✓
   - Environment: sandbox ✓
   - Status: Active ✓

2. **Saleor channel mappings section:**
   - Default Channel → Dropdown chọn "VNPay Sandbox" ✓
   - Status: **Enabled** ✓

**Nếu dropdown rỗng:**
→ Frontend chưa load được configs
→ Check browser console có lỗi không

---

## ✅ Bước 3: Check Browser Console

**F12 → Console tab khi vào checkout page**

### Cần thấy:
```javascript
// Khi load checkout page
GET /graphql
  query CheckoutQuery {
    checkout {
      availablePaymentGateways { ... }
    }
  }

// Response phải có:
{
  "availablePaymentGateways": [
    {
      "id": "vnpay.payment.app",
      "name": "VNPay",
      "currencies": ["VND", "USD"]
    }
  ]
}
```

### Nếu array rỗng `[]`:
→ Saleor không gọi webhook
→ Hoặc webhook trả về empty array

---

## ✅ Bước 4: Check Vercel Logs

**https://vercel.com/dashboard → payment-vnpay-chi → Logs**

### Tìm log khi vào checkout:
```
"Payment Gateway Initialize Session webhook triggered"
{
  "channel": "default-channel",
  "objectType": "Checkout"
}
```

### Scenario A: Không thấy log này
→ Saleor KHÔNG GỌI webhook
→ Vấn đề: Webhook chưa được đăng ký
→ Fix: Reinstall app

### Scenario B: Thấy log nhưng trả về `data: []`
→ Webhook được gọi nhưng trả về empty
→ Vấn đề: App không tìm thấy config
→ Check logs xem có error gì

### Scenario C: Thấy log + "VNPay payment gateway is available"
→ Webhook OK, trả về VNPay
→ Vấn đề ở frontend
→ Check storefront GraphQL query

---

## ✅ Bước 5: Test GraphQL Trực Tiếp

**Saleor Playground: https://store-fvfkk5hg.saleor.cloud/graphql/**

```graphql
query TestPaymentGateways {
  checkout(id: "YOUR_CHECKOUT_ID") {
    id
    channel {
      id
      slug
    }
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

### Expected Response:
```json
{
  "data": {
    "checkout": {
      "availablePaymentGateways": [
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
  }
}
```

### Nếu trả về `[]`:
→ **PAYMENT_GATEWAY_INITIALIZE_SESSION** webhook có vấn đề!

---

## ✅ Bước 6: Common Issues & Fixes

### Issue 1: Webhooks Chưa Được Đăng Ký
**Symptoms:**
- Chỉ thấy 2 webhooks trong Dashboard
- Vercel logs không có "Payment Gateway Initialize Session"

**Fix:**
```
1. Uninstall app hoàn toàn
2. Clear browser cache
3. Install lại: https://payment-vnpay-chi.vercel.app/api/manifest
4. Verify 4 webhooks xuất hiện
```

### Issue 2: Configuration Không Lưu
**Symptoms:**
- Reload page → config mất
- Dropdown rỗng

**Fix:**
```
1. Check browser console có lỗi API call không
2. Verify app có permission HANDLE_PAYMENTS
3. Check Vercel logs khi save config
```

### Issue 3: Channel Mapping Không Match
**Symptoms:**
- Config có, webhooks có
- GraphQL vẫn trả về `[]`

**Fix:**
```
1. Verify channel ID trong mapping khớp với checkout channel
2. Check logs: "No VNPay configuration assigned to channel..."
3. Re-assign config to correct channel
```

### Issue 4: App Permission Thiếu
**Symptoms:**
- Webhook được gọi
- Trả về error authentication

**Fix:**
```
Dashboard → Apps → VNPay → Permissions
Phải có:
- HANDLE_PAYMENTS ✓
- MANAGE_ORDERS ✓
- MANAGE_CHECKOUTS ✓
```

---

## 🎯 Quick Troubleshooting Commands

### Check Manifest:
```bash
curl -s https://payment-vnpay-chi.vercel.app/api/manifest | \
  jq '.webhooks[] | {name, events: (.syncEvents // .asyncEvents)}'
```

### Check If App Is Registered:
```graphql
query {
  apps(first: 20) {
    edges {
      node {
        id
        name
        isActive
        webhooks(first: 10) {
          edges {
            node {
              name
              isActive
              targetUrl
              events { eventType }
            }
          }
        }
      }
    }
  }
}
```

### Force Refresh Storefront:
```bash
# Clear all caches and reload
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows/Linux)
```

---

## ✅ Success Checklist

- [ ] 4 webhooks xuất hiện trong Saleor Dashboard
- [ ] VNPay config tồn tại và active
- [ ] Channel mapping assigned và enabled
- [ ] Vercel logs show "Payment Gateway Initialize Session webhook triggered"
- [ ] GraphQL query trả về VNPay trong availablePaymentGateways
- [ ] Storefront checkout page hiển thị VNPay option
- [ ] Browser console không có errors

---

## 🆘 Nếu Vẫn Không Work

1. **Export Vercel logs** (last 1 hour)
2. **Screenshot** của:
   - Dashboard → Apps → Webhooks tab
   - VNPay app → Configuration page
   - Browser console khi ở checkout
3. **GraphQL query result** của availablePaymentGateways

Gửi debug info trên để troubleshoot tiếp!
