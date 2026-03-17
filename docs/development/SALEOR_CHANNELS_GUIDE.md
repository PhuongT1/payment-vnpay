# 🔐 Lấy Channels từ Saleor API

## 📋 Tổng Quan

VNPay Payment App sử dụng **Saleor App SDK** để tự động xử lý authentication. **KHÔNG cần** config token thủ công!

---

## 🎯 Cách Hoạt Động

### 1. **Authentication Flow**

```
┌─────────────────┐
│ Saleor Dashboard│
│  Install App    │
└────────┬────────┘
         │
         │ 1. Install app từ manifest URL
         ▼
┌─────────────────┐
│   App Backend   │
│  (APL Storage)  │◄─── 2. Saleor gửi auth token
└────────┬────────┘
         │
         │ 3. Token được lưu vào .auth-data.json
         ▼
┌─────────────────┐
│   Frontend UI   │
│  (Dashboard)    │◄─── 4. AppBridge inject token vào requests
└─────────────────┘
```

### 2. **Token Storage - APL (App Permission List)**

**File**: [src/saleor-app.ts](src/saleor-app.ts)

```typescript
import { FileAPL } from "@saleor/app-sdk/APL/file";

export let apl: APL;

switch (process.env.APL) {
  default:
    apl = new FileAPL(); // Lưu token vào .auth-data.json
}
```

**Lưu ý:**
- ✅ **Development**: FileAPL (lưu local file `.auth-data.json`)
- ✅ **Production**: UpstashAPL (Redis cloud storage cho multi-tenant)

---

## 🚀 Cách Sử Dụng

### **Option 1: Hook `useSaleorChannels` (Khuyên dùng)**

File mới tạo: [src/hooks/useSaleorChannels.ts](src/hooks/useSaleorChannels.ts)

```tsx
import { useSaleorChannels } from '@/hooks/useSaleorChannels';

function MyComponent() {
  const { channels, loading, error, refetch } = useSaleorChannels();

  if (loading) return <div>Loading channels...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <select>
      {channels.map(channel => (
        <option key={channel.id} value={channel.id}>
          {channel.name} ({channel.currencyCode})
        </option>
      ))}
    </select>
  );
}
```

### **Option 2: API Route (Backend)**

File đã có: [src/pages/api/channels.ts](src/pages/api/channels.ts)

```typescript
// Gọi từ frontend
const response = await fetch('/api/channels', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'saleor-api-url': appBridgeState.saleorApiUrl, // Auto từ AppBridge
  },
});

const { channels } = await response.json();
```

### **Option 3: Direct GraphQL Query**

```typescript
import { useAppBridge } from '@saleor/app-sdk/app-bridge';

function MyComponent() {
  const { appBridgeState } = useAppBridge();
  
  const fetchChannels = async () => {
    const response = await fetch(appBridgeState.saleorApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization-Bearer': appBridgeState.token, // Auto từ AppBridge
      },
      body: JSON.stringify({
        query: `
          query GetChannels {
            channels {
              id
              name
              slug
              isActive
              currencyCode
            }
          }
        `,
      }),
    });
    
    const { data } = await response.json();
    console.log(data.channels);
  };
}
```

---

## ⚙️ Configuration

### **1. Update `.env`**

Đã update:
```env
NEXT_PUBLIC_SALEOR_API_URL=https://store-fvfkk5hg.saleor.cloud/graphql/
```

### **2. Install App vào Saleor Dashboard**

**Bước 1: Deploy app lên cloud** (Vercel/Railway)
```bash
pnpm run deploy:vercel
```

**Bước 2: Install vào Dashboard**
```
https://store-fvfkk5hg.saleor.cloud/dashboard/apps/install?manifestUrl=https://your-app.vercel.app/api/manifest
```

**Bước 3: Grant permissions**
- ✅ MANAGE_ORDERS
- ✅ HANDLE_PAYMENTS
- ✅ MANAGE_CHECKOUTS
- ✅ MANAGE_CHANNELS ← **Cần permission này!**

**Bước 4: Token tự động lưu**
- Token được lưu vào `.auth-data.json` (local)
- Hoặc Upstash Redis (production)

---

## 🧪 Testing

### **Test với Local Development**

```bash
# 1. Start dev server
pnpm dev

# 2. Expose to internet
ngrok http 3000

# 3. Install app
https://store-fvfkk5hg.saleor.cloud/dashboard/apps/install?manifestUrl=https://YOUR-NGROK-URL.ngrok.io/api/manifest

# 4. Test fetch channels
# Navigate to Configure page và check console logs
```

### **Test API Endpoint**

```bash
# Cần app đã được install trước
curl http://localhost:3000/api/channels \
  -H "saleor-api-url: https://store-fvfkk5hg.saleor.cloud/graphql/"
```

**Expected Response:**
```json
{
  "success": true,
  "channels": [
    {
      "id": "Q2hhbm5lbDox",
      "name": "Default Channel",
      "slug": "default-channel",
      "isActive": true,
      "currencyCode": "USD"
    }
  ]
}
```

---

## 🔍 Troubleshooting

### **1. Error: "App not registered"**

**Nguyên nhân**: App chưa được install vào Saleor Dashboard

**Giải pháp**:
```bash
# Install app qua manifest URL
https://store-fvfkk5hg.saleor.cloud/dashboard/apps/install?manifestUrl=YOUR_APP_URL/api/manifest
```

### **2. Error: "Missing MANAGE_CHANNELS permission"**

**Nguyên nhân**: App thiếu permission

**Giải pháp**:
1. Uninstall app trong Dashboard
2. Update [manifest.ts](src/pages/api/manifest.ts) thêm permission:
```typescript
permissions: [
  "MANAGE_ORDERS",
  "HANDLE_PAYMENTS",
  "MANAGE_CHECKOUTS",
  "MANAGE_CHANNELS", // ← Add this
],
```
3. Re-install app

### **3. Token không tồn tại (.auth-data.json empty)**

**Nguyên nhân**: App chưa complete install flow

**Giải pháp**:
```bash
# Xóa file cũ
rm .auth-data.json

# Re-install app từ Dashboard
# Token mới sẽ được tự động generate
```

### **4. "Cannot access channels" trong standalone mode**

**Expected behavior**: Standalone mode (localhost không qua Dashboard) sẽ dùng demo channels

**Solution**: Deploy app và install qua Dashboard để có real authentication

---

## 📊 Production Setup

### **1. Switch to UpstashAPL**

**File**: [src/saleor-app.ts](src/saleor-app.ts)

```typescript
import { UpstashAPL } from "@saleor/app-sdk/APL/upstash";

switch (process.env.APL) {
  case "upstash":
    apl = new UpstashAPL({
      restUrl: process.env.UPSTASH_URL!,
      restToken: process.env.UPSTASH_TOKEN!,
    });
    break;
  default:
    apl = new FileAPL();
}
```

**`.env`**:
```env
APL=upstash
UPSTASH_URL=https://your-redis.upstash.io
UPSTASH_TOKEN=your_token_here
```

### **2. Deploy to Vercel**

```bash
vercel deploy --prod
```

### **3. Update Saleor Dashboard**

```
Manifest URL: https://your-app.vercel.app/api/manifest
```

---

## 📚 Resources

- **Saleor App SDK Docs**: https://github.com/saleor/saleor-app-sdk
- **APL Documentation**: https://github.com/saleor/saleor-app-sdk/blob/main/docs/apl.md
- **Saleor GraphQL API**: https://docs.saleor.io/api-reference
- **Upstash Redis**: https://upstash.com/ (Free tier available)

---

## ✅ Checklist

- [x] Update `.env` với Saleor instance URL
- [x] Tạo hook `useSaleorChannels` 
- [x] API endpoint `/api/channels` sẵn sàng
- [ ] Deploy app lên cloud (Vercel/Railway)
- [ ] Install app vào Saleor Dashboard
- [ ] Grant MANAGE_CHANNELS permission
- [ ] Test fetch channels
- [ ] Switch to UpstashAPL cho production

---

**Last Updated**: March 17, 2026
