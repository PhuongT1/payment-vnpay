# 🎛️ MoMo Mode Switching Guide

Quick reference để switch giữa Mock, Sandbox, và Production modes.

## 🎯 3 Modes Available

### 1. 🟢 Mock Mode (Default)
**Best for:** Initial development, UI/UX testing
- ✅ No API calls
- ✅ No credentials needed
- ✅ Instant responses
- ✅ Full control over results
- ✅ Works offline

### 2. 🟡 Sandbox Mode
**Best for:** Integration testing, pre-production
- ✅ Real MoMo API (test environment)
- ✅ Test credentials required
- ✅ Verify signatures
- ⚠️ Need internet connection
- ⚠️ Need valid test credentials from MoMo

### 3. 🔴 Production Mode
**Best for:** Live deployment
- ✅ Real payments
- ✅ Real money flow
- ⚠️ Production credentials required
- ⚠️ Real money will be charged!

## 🔄 How to Switch Modes

### Switch to Mock Mode

```bash
# 1. Edit .env file:
MOMO_MOCK_MODE=true
MOMO_ENDPOINT=https://test-payment.momo.vn

# 2. Restart server:
# Ctrl+C → pnpm dev

# 3. Verify on test page:
# Should see: 🟢 MOCK MODE banner
```

### Switch to Sandbox Mode

```bash
# 1. Edit .env file:
MOMO_MOCK_MODE=false
MOMO_PARTNER_CODE=your_test_partner_code
MOMO_ACCESS_KEY=your_test_access_key
MOMO_SECRET_KEY=your_test_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn

# 2. Restart server:
# Ctrl+C → pnpm dev

# 3. Verify on test page:
# Should see: 🟡 SANDBOX banner
```

### Switch to Production Mode

```bash
# 1. Edit .env file:
MOMO_MOCK_MODE=false
MOMO_PARTNER_CODE=your_production_partner_code
MOMO_ACCESS_KEY=your_production_access_key
MOMO_SECRET_KEY=your_production_secret_key
MOMO_ENDPOINT=https://payment.momo.vn  # Note: NO "test-"

# 2. Restart server:
# Ctrl+C → pnpm dev

# 3. Verify on test page:
# Should see: 🔴 PRODUCTION banner (RED WARNING!)
```

## 📊 Mode Detection

App auto-detects mode based on:

1. **MOMO_MOCK_MODE=true** → Mock Mode
2. **MOMO_MOCK_MODE=false** + **test-payment.momo.vn** → Sandbox Mode
3. **MOMO_MOCK_MODE=false** + **payment.momo.vn** → Production Mode

## 🎨 Visual Indicators

### On Test Page (/momo-test):

**Mock Mode:**
```
🟢 MOCK MODE
Local simulation - No API calls
```

**Sandbox Mode:**
```
🟡 SANDBOX
MoMo Test Environment
```

**Production Mode:**
```
🔴 PRODUCTION
Real payments - Money will be charged!
```

### In Console:

**Mock Mode:**
```
🧪 [MOCK MODE] Using Mock MoMo API - No real API calls
🧪 [MOCK] Creating payment: {...}
```

**Sandbox/Production:**
```
MoMo API Request: {...}
MoMo API Response: {...}
```

## ⚙️ Configuration Details

View current config on test page:
```
⚙️ Current Configuration:
• Mode: MOCK / SANDBOX / PRODUCTION
• Endpoint: [API URL]
• Has Credentials: ✅ Yes / ❌ No
```

## 🧪 Testing Each Mode

### Test Mock Mode
```bash
# 1. Set mode to mock
MOMO_MOCK_MODE=true

# 2. Restart & test
pnpm dev
open http://localhost:3000/momo-test

# 3. Click "Initialize Payment"
# → Should see mock payment page (pink background)

# 4. Click "Simulate Successful Payment"
# → Should return with success result

# ✅ Verify: No real API calls in network tab
```

### Test Sandbox Mode
```bash
# 1. Set mode to sandbox
MOMO_MOCK_MODE=false
# + valid test credentials

# 2. Restart & test
pnpm dev
open http://localhost:3000/momo-test

# 3. Click "Initialize Payment"
# → Should see REAL MoMo payment page

# 4. Use test credentials to pay
# Phone: 0399888999, OTP: 123456 (if provided by MoMo)

# ✅ Verify: Real API calls in network tab
```

### Test Production Mode ⚠️
```bash
# ⚠️ WARNING: Only test with SMALL amounts!

# 1. Set mode to production
MOMO_MOCK_MODE=false
MOMO_ENDPOINT=https://payment.momo.vn
# + valid production credentials

# 2. Restart & test
pnpm dev
open http://localhost:3000/momo-test

# 3. Use SMALL test amount (e.g., 10,000 VND)

# 4. Use REAL MoMo account to pay

# ✅ Verify: Real money charged!
```

## 📋 Quick Switch Commands

### Development → Sandbox
```bash
# In .env:
sed -i '' 's/MOMO_MOCK_MODE=true/MOMO_MOCK_MODE=false/' .env

# Restart:
Ctrl+C → pnpm dev
```

### Sandbox → Production
```bash
# In .env:
sed -i '' 's/test-payment.momo.vn/payment.momo.vn/' .env

# Update credentials!
# Then restart:
Ctrl+C → pnpm dev
```

### Production → Mock (rollback)
```bash
# In .env:
sed -i '' 's/MOMO_MOCK_MODE=false/MOMO_MOCK_MODE=true/' .env
sed -i '' 's/payment.momo.vn/test-payment.momo.vn/' .env

# Restart:
Ctrl+C → pnpm dev
```

## ⚠️ Important Notes

1. **Always restart server** after changing .env
2. **Check banner color** on test page to confirm mode
3. **Never test production** with large amounts first
4. **Keep production credentials secret** - use .env.local for production
5. **Monitor console logs** to verify mode

## 🔒 Security Best Practice

For production deployment:

```bash
# Use .env.local (NOT committed to git):
cp .env .env.local

# Edit .env.local with production values:
MOMO_MOCK_MODE=false
MOMO_PARTNER_CODE=prod_partner_code
MOMO_ACCESS_KEY=prod_access_key
MOMO_SECRET_KEY=prod_secret_key
MOMO_ENDPOINT=https://payment.momo.vn
```

Add to `.gitignore`:
```
.env.local
.env.production
```

## 📚 Related Docs

- [MOCK_MODE.md](./MOCK_MODE.md) - Mock mode details
- [MOMO_SANDBOX_GUIDE.md](./MOMO_SANDBOX_GUIDE.md) - How to get sandbox credentials
- [TESTING.md](./TESTING.md) - Testing guide
- [.env](./.env) - Environment configuration

---

**Current Default:** 🟢 MOCK MODE (safe for development)

**Next Steps:**
1. Develop with mock mode
2. Get sandbox credentials from MoMo
3. Test with sandbox mode
4. Get production credentials
5. Deploy with production mode
