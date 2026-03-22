# Fix Lỗi: "Failed to generate action ID. Please ensure you are using https or localhost"

## 🔴 Vấn đề

Khi chạy payment app, gặp lỗi:
```
Failed to generate action ID. Please ensure you are using https or localhost
Error tại: src/pages/_app.tsx (20:7)
```

### Nguyên nhân

Saleor App SDK sử dụng `crypto.randomUUID()` - chỉ work trong **secure context**:
- ✅ `https://` (production)
- ✅ `http://localhost` (development)
- ❌ `http://192.168.x.x` (IP local network)

Khi Next.js bind vào `0.0.0.0` (all network interfaces), browser có thể truy cập qua IP thay vì `localhost`, gây lỗi.

---

## ✅ Giải pháp (Đã fix)

### Script đã được update:

```json
{
  "scripts": {
    "dev": "next dev -H localhost",        // ✅ Chỉ bind localhost
    "dev:network": "next dev -H 0.0.0.0"   // ⚠️ Bind all IPs (cho test trên mobile)
  }
}
```

---

## 🚀 Cách chạy Local

### Option 1: Chạy trên localhost (Recommended)

```bash
cd /Users/paco/Documents/Projects/payment-vnpay
pnpm run dev
```

**Truy cập:** `http://localhost:3000`

✅ **Pros:**
- Secure context enabled
- Không bị lỗi crypto
- Chuẩn development workflow

❌ **Cons:**
- Không thể access từ mobile/devices khác trên cùng network

---

### Option 2: Chạy trên network (Test mobile/tablet)

```bash
cd /Users/paco/Documents/Projects/payment-vnpay
pnpm run dev:network
```

**Truy cập:** 
- `http://localhost:3000` ✅ (vẫn work)
- `http://192.168.1.43:3000` ❌ (sẽ bị lỗi crypto)

⚠️ **Giải pháp nếu cần test trên mobile:**

1. **Sử dụng ngrok/tunneling:**
   ```bash
   # Install ngrok
   brew install ngrok
   
   # Terminal 1: Run app
   pnpm run dev
   
   # Terminal 2: Create tunnel
   ngrok http 3000
   
   # Access via: https://xxx.ngrok.io (secure context ✅)
   ```

2. **Hoặc deploy lên Vercel/Railway** (có HTTPS)

---

## 🧪 Test hoàn chỉnh

### Step 1: Start Payment App
```bash
cd /Users/paco/Documents/Projects/payment-vnpay
pnpm run dev
```

**Expected:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 2: Start Storefront (Terminal khác)
```bash
cd /Users/paco/Documents/Projects/Saleor_user_web-main
pnpm run dev
```

### Step 3: Test
1. Mở browser: `http://localhost:3000`
2. Không thấy lỗi "Failed to generate action ID" ✅
3. App load bình thường

---

## 📋 Troubleshooting

### Issue: Vẫn bị lỗi sau khi update

**Check:**
```bash
# Xem script hiện tại
cat package.json | grep "\"dev\""
```

**Expected output:**
```json
"dev": "next dev -H localhost",
```

**Nếu chưa đúng:**
```bash
# Kill tất cả Node process
killall node

# Chạy lại
pnpm run dev
```

---

### Issue: Cần access từ mobile

**Solution 1: Sử dụng ngrok (Recommended)**
```bash
# Terminal 1
pnpm run dev

# Terminal 2
ngrok http 3000
# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
```

**Solution 2: Deploy preview**
```bash
# Deploy to Vercel
vercel --prod

# Hoặc Railway
railway up
```

---

### Issue: Port 3000 đã được sử dụng

**Check port:**
```bash
lsof -ti:3000
```

**Kill process:**
```bash
kill -9 $(lsof -ti:3000)
```

**Hoặc đổi port:**
```bash
pnpm run dev -- -p 3001
# Access: http://localhost:3001
```

⚠️ **Nhớ update .env nếu đổi port:**
```bash
PAYMENT_APP_URL=http://localhost:3001
APP_API_BASE_URL=http://localhost:3001
VNPAY_IPN_URL=http://localhost:3001/api/vnpay/ipn
```

---

## 🔍 Technical Details

### Tại sao `crypto.randomUUID()` cần secure context?

Web Crypto API yêu cầu secure context vì lý do bảo mật:
- Prevents man-in-the-middle attacks
- Ensures cryptographic operations are secure
- Browser policy for sensitive APIs

### Secure Contexts include:
- `https://` (TLS/SSL)
- `http://localhost` (special exception)
- `http://127.0.0.1` (special exception)
- `file://` URLs

### NOT Secure Contexts:
- `http://192.168.x.x`
- `http://10.x.x.x`
- `http://172.x.x.x`
- Any HTTP over network IP

---

## ✅ Summary

✅ **Fixed**: Updated `dev` script to bind localhost only  
✅ **Added**: `dev:network` script for network access (với cảnh báo)  
✅ **Documented**: Ngrok solution cho mobile testing  

**Current status**: Payment app có thể chạy local mà không bị lỗi crypto!

---

**Last updated**: March 20, 2026  
**Status**: ✅ Production-ready
