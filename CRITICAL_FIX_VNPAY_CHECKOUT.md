# 🔴 CRITICAL FIX: VNPay Không Hiện Ở Checkout - ĐÃ FIX

## ❌ Vấn Đề Gốc (Root Cause)

### 1. VNPay Không Hiện Trong Checkout
**Nguyên nhân**: App THIẾU webhook `PAYMENT_GATEWAY_INITIALIZE_SESSION`

Trong Saleor payment flow:
- `PAYMENT_GATEWAY_INITIALIZE_SESSION` → Làm cho payment method **HIỂN THỊ** trong checkout
- `TRANSACTION_INITIALIZE_SESSION` → Được gọi **SAU KHI** user chọn payment method

**App chỉ có TRANSACTION webhook nhưng KHÔNG có PAYMENT_GATEWAY webhook** → VNPay không bao giờ xuất hiện trong danh sách!

### 2. Configuration Không Lưu Sau Khi Reload
**Nguyên nhân**: App cần phải **REINSTALL** để đăng ký webhooks mới

Khi app deploy lại với webhooks mới:
- Manifest thay đổi (thêm 2 webhooks mới)
- Saleor cần **cài đặt lại app** để đăng ký webhooks
- Chỉ update code không đủ - phải reinstall!

## ✅ Đã Fix Gì

### Commit 1: `472303e` - Saleor Metadata API
- ✅ Replace localStorage + in-memory Map → Saleor Private Metadata
- ✅ Configs persistent qua `vnpay:configs` metadata key
- ✅ Mappings persistent qua `vnpay:channel_mappings` metadata key  
- ✅ Auto-save khi thay đổi channel mapping

### Commit 2: `1d34fb7` - **CRITICAL FIX**
- ✅ Tạo `payment-gateway-initialize-session.ts` webhook
- ✅ Đăng ký webhooks trong `manifest.ts`:
  - `PAYMENT_GATEWAY_INITIALIZE_SESSION` - Hiển thị VNPay
  - `TRANSACTION_INITIALIZE_SESSION` - Khởi tạo payment

## 🚀 Cách Test & Verify

### Bước 1: Đợi Vercel Deploy Xong (~2-3 phút)
```bash
# Check deployment status
# Deployed to: https://payment-vnpay-chi.vercel.app
```

### Bước 2: ⚠️ **REINSTALL APP** (QUAN TRỌNG!)

**KHÔNG THỂ BỎ QUA BƯỚC NÀY!** Webhooks chỉ được đăng ký khi install/reinstall app.

#### Option A: Reinstall Qua Saleor Dashboard (Khuyên dùng)
1. Vào Saleor Dashboard → Apps
2. Find "VNPay Payment Gateway"
3. Click **Uninstall** (hoặc Delete)
4. Install lại qua manifest URL:
   ```
   https://payment-vnpay-chi.vercel.app/api/manifest
   ```

#### Option B: Delete & Reinstall Qua GraphQL
```graphql
# 1. Get app ID
query {
  apps(first: 20) {
    edges {
      node {
        id
        name
        isActive
      }
    }
  }
}

# 2. Delete app
mutation {
  appDelete(id: "QXBwOjE=") {
    app {
      id
    }
    errors {
      message
    }
  }
}

# 3. Install fresh
mutation {
  appInstall(input: {
    manifestUrl: "https://payment-vnpay-chi.vercel.app/api/manifest"
  }) {
    appInstallation {
      id
      status
    }
    errors {
      message
    }
  }
}
```

### Bước 3: Verify Webhooks Đã Đăng Ký

Vào Saleor Dashboard → Apps → VNPay → Webhooks tab

**Phải thấy 4 webhooks**:
- ✅ Order Created
- ✅ Order Filter Shipping Methods
- ✅ **Payment Gateway Initialize Session** ← MỚI
- ✅ **VNPay Transaction Initialize Session** ← MỚI

### Bước 4: Configure VNPay

1. Mở app: `https://payment-vnpay-chi.vercel.app`
2. Add configuration:
   - Name: VNPay Sandbox
   - TMN Code: `9BPJ5NYM`
   - Hash Secret: `8H7WMLT2J77PW2WJW78DI67ETKG5R6QG`
   - Environment: Sandbox
3. **Save** → Config sẽ lưu vào Saleor Metadata
4. Assign to channel (ví dụ: Default Channel)
5. **Reload page** → Config phải còn đó (nếu mất = chưa install đúng)

### Bước 5: Test Checkout Flow

#### A. Test Trong Storefront (Saleor_user_web-main)

1. Add sản phẩm vào cart
2. Checkout
3. Điền shipping/billing
4. **Đến bước Payment** → **PHẢI THẤY VNPAY**

Expected:
```
Payment Methods:
○ Adyen (if configured)
○ VNPay ← Should appear now!
```

5. Chọn VNPay → Click "Complete Checkout"
6. Redirect đến VNPay payment page
7. Test payment với test card

#### B. Test GraphQL Query (Debug)

```graphql
query {
  checkout(id: "YOUR_CHECKOUT_ID") {
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

Expected response:
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

### Bước 6: Check Logs

Sau khi vào checkout page, check Vercel logs:

```bash
# Should see:
"Payment Gateway Initialize Session webhook triggered"
{
  "channel": "default-channel",
  "objectType": "Checkout"
}
"VNPay payment gateway is available for this checkout"
```

Khi click "Complete Checkout":
```bash
"Transaction Initialize Session webhook triggered"
"Using configuration: VNPay Sandbox"
"Payment created successfully: VNPAY_20240318..."
```

## 🔍 Troubleshooting

### ❌ VNPay vẫn không hiện trong checkout

**Nguyên nhân**: Chưa reinstall app

**Giải pháp**:
1. Uninstall app hoàn toàn
2. Install lại từ manifest URL
3. Verify webhooks (phải có 4 webhooks)

### ❌ Configuration mất sau khi reload

**Nguyên nhân**: Webhooks chưa được đăng ký → API không hoạt động

**Giải pháp**:
1. Check Saleor Dashboard → Apps → Webhooks
2. Nếu không thấy "Payment Gateway Initialize Session" → Chưa install đúng
3. Reinstall app

### ❌ Error: "No VNPay configuration found"

**Nguyên nhân**: Chưa configure VNPay hoặc chưa assign channel

**Giải pháp**:
1. Mở app → Add configuration
2. Assign configuration to channel
3. Save
4. Test lại checkout

### ❌ Checkout shows VNPay but clicking fails

**Nguyên nhân**: Configuration không hợp lệ hoặc credentials sai

**Giải pháp**:
1. Check Vercel logs cho error message
2. Verify TMN Code và Hash Secret
3. Test với VNPay sandbox credentials:
   - TMN: `9BPJ5NYM`
   - Secret: `8H7WMLT2J77PW2WJW78DI67ETKG5R6QG`

## 📊 Verification Checklist

- [ ] Vercel deployment completed
- [ ] App reinstalled in Saleor Dashboard
- [ ] 4 webhooks registered (not 2!)
- [ ] VNPay configuration added and saved
- [ ] Configuration persists after page reload
- [ ] Channel mapping assigned
- [ ] VNPay appears in checkout payment list
- [ ] Can select VNPay and redirect to payment page
- [ ] Payment flow completes successfully

## 🎯 Why This Was Happening

### Technical Explanation

Saleor payment app architecture có 2 layers:

**Layer 1: Payment Gateway Discovery** (PAYMENT_GATEWAY_INITIALIZE_SESSION)
- Saleor hỏi: "Những payment methods nào available?"
- App trả lời: "VNPay available với config này"
- User thấy VNPay trong danh sách

**Layer 2: Payment Transaction** (TRANSACTION_INITIALIZE_SESSION)
- User chọn VNPay
- Saleor gọi: "Initialize payment với VNPay"
- App tạo payment URL và trả về

**App cũ chỉ có Layer 2, thiếu Layer 1** → VNPay không bao giờ xuất hiện!

### Why Reinstall Required?

Saleor app webhooks được đăng ký ONLY during installation:
1. App install → Saleor reads manifest
2. Manifest có webhooks → Saleor tạo webhook subscriptions
3. Code deploy mới → Saleor KHÔNG tự động update webhooks
4. **Phải reinstall** để Saleor đọc lại manifest và đăng ký webhooks mới

## 📞 Support

Nếu vẫn có vấn đề:
1. Check Vercel logs: https://vercel.com/dashboard
2. Check Saleor Dashboard → Apps → Webhooks
3. Test GraphQL query `availablePaymentGateways`
4. Verify app permissions include `HANDLE_PAYMENTS`

## ✅ Success Criteria

**App working correctly khi**:
1. ✅ Configuration lưu được và không mất khi reload
2. ✅ VNPay xuất hiện trong checkout payment list
3. ✅ Click VNPay → Redirect to payment page
4. ✅ Complete payment → Order created in Saleor

---

**Last Updated**: March 18, 2026  
**Commits**: 472303e, 1d34fb7  
**Deployment**: https://payment-vnpay-chi.vercel.app
