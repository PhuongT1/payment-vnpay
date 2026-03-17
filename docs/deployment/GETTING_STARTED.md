# ✅ MoMo Integration - Getting Started Checklist

Follow this checklist to get the MoMo payment integration up and running.

## Phase 1: Installation & Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd /Users/paco/Documents/Projects/saleor-app-template
pnpm install
```
- [ ] Dependencies installed successfully
- [ ] No errors during installation

### Step 2: Copy Environment File
```bash
cp .env.example .env
```
- [ ] `.env` file created
- [ ] Contains MoMo test credentials

### Step 3: Generate TypeScript Types
```bash
pnpm generate
```
- [ ] GraphQL types generated
- [ ] No compilation errors

### Step 4: Start Development Server
```bash
pnpm dev
```
- [ ] Server started on http://localhost:3000
- [ ] No startup errors

---

## Phase 2: Local Testing (10 minutes)

### Step 5: Test UI Access
```bash
open http://localhost:3000/momo-test
```
- [ ] Test page loads successfully
- [ ] Form displays correctly
- [ ] No console errors

### Step 6: Initialize Test Payment
1. Click "1. Initialize Payment" button
2. Check result displays:
   - [ ] `resultCode: 0`
   - [ ] `payUrl` received
   - [ ] `qrCodeUrl` received
3. Click the payment URL or "Open in New Tab"
4. You should see MoMo payment page

### Step 7: Complete Test Payment
1. On MoMo payment page, enter:
   - Phone: `0399888999`
   - OTP: `123456`
2. Complete payment
3. Return to test page
   - [ ] Payment completed successfully

### Step 8: Query Payment Status
1. Click "2. Query Status" button
2. Check result:
   - [ ] `resultCode: 0` (success)
   - [ ] `transId` received
   - [ ] Status shows payment completed

### Step 9: Test Refund (Optional)
1. Copy `transId` from previous result
2. Enter it in the refund section
3. Click "3. Test Refund"
4. Check result:
   - [ ] `resultCode: 0`
   - [ ] Refund successful

---

## Phase 3: Automated Testing (5 minutes)

### Step 10: Run Automated Tests
```bash
# In a new terminal (keep dev server running)
pnpm test:momo
```

Expected output:
```
═══════════════════════════════════════════════
🚀 MoMo Payment Integration - Automated Tests
═══════════════════════════════════════════════

✅ Passed: 5
❌ Failed: 0
Success Rate: 100.00%
```

- [ ] All tests pass (5/5)
- [ ] No HTTP errors
- [ ] Test report shows 100% success

---

## Phase 4: Saleor Integration (15 minutes)

### Step 11: Install ngrok
```bash
brew install ngrok

# Or download from: https://ngrok.com/download
```
- [ ] ngrok installed
- [ ] Can run `ngrok --version`

### Step 12: Expose Local Server
```bash
ngrok http 3000
```
- [ ] ngrok running
- [ ] HTTPS URL received (e.g., `https://abc123.ngrok.io`)

### Step 13: Update Environment
1. Copy ngrok URL
2. Edit `.env`:
   ```env
   APP_API_BASE_URL=https://your-ngrok-url.ngrok.io
   ```
3. Restart dev server (`Ctrl+C` then `pnpm dev`)
   - [ ] `.env` updated
   - [ ] Server restarted

### Step 14: Verify Manifest
```bash
curl https://your-ngrok-url.ngrok.io/api/manifest
```
- [ ] Manifest returns JSON
- [ ] Contains MoMo webhooks
- [ ] No errors

### Step 15: Install App in Saleor
1. Open Saleor Dashboard
2. Go to: **Apps** → **Install External App**
3. Enter manifest URL: `https://your-ngrok-url.ngrok.io/api/manifest`
4. Click **Install**
5. Authorize permissions:
   - [ ] HANDLE_PAYMENTS
   - [ ] MANAGE_CHECKOUTS
6. Click **Install App**
   - [ ] App installed successfully
   - [ ] Shows in app list

### Step 16: Configure Payment Gateway
1. In Saleor Dashboard: **Configuration** → **Channels**
2. Select your channel
3. Go to **Payment Settings**
4. Add **MoMo** gateway
5. Enable for checkout
   - [ ] MoMo gateway configured
   - [ ] Enabled for channel

---

## Phase 5: End-to-End Testing (10 minutes)

### Step 17: Test Full Checkout Flow
1. Go to your storefront
2. Add product to cart
3. Proceed to checkout
4. Select **MoMo** as payment method
5. Click **Complete Checkout**
   - [ ] Redirected to MoMo payment page
   - [ ] Can see payment amount

### Step 18: Complete Payment
1. Enter test credentials:
   - Phone: `0399888999`
   - OTP: `123456`
2. Complete payment
3. Should redirect back to storefront
   - [ ] Payment successful
   - [ ] Order created
   - [ ] Order ID received

### Step 19: Verify in Dashboard
1. Open Saleor Dashboard
2. Go to **Orders**
3. Find your order
4. Check:
   - [ ] Order status: **Unfulfilled**
   - [ ] Payment status: **Fully charged**
   - [ ] Transaction visible
   - [ ] MoMo `transId` in PSP reference

### Step 20: Test Refund
1. In order details, click **Refund**
2. Select amount
3. Confirm refund
4. Check:
   - [ ] Refund initiated
   - [ ] Refund event in transaction
   - [ ] Status updated

---

## Phase 6: Production Preparation (30 minutes)

### Step 21: Get Production Credentials
1. Contact MoMo to get production credentials
2. Save them securely
   - [ ] Production Partner Code
   - [ ] Production Access Key
   - [ ] Production Secret Key

### Step 22: Update Production Environment
```env
MOMO_PARTNER_CODE=your-production-code
MOMO_ACCESS_KEY=your-production-key
MOMO_SECRET_KEY=your-production-secret
MOMO_ENDPOINT=https://payment.momo.vn
```
- [ ] Production credentials added
- [ ] Endpoint changed to production

### Step 23: Deploy to Production
1. Deploy app to production server
2. Update Saleor with production app URL
3. Test with small amount first
   - [ ] App deployed
   - [ ] Saleor updated
   - [ ] Test transaction successful

### Step 24: Enable Monitoring
1. Set up logging for all MoMo API calls
2. Configure alerts for:
   - Failed payments
   - Failed refunds
   - Signature verification failures
   - API errors
   
   - [ ] Logging enabled
   - [ ] Alerts configured

### Step 25: Documentation
1. Document production setup
2. Create runbook for common issues
3. Train support team
   - [ ] Documentation complete
   - [ ] Team trained

---

## Troubleshooting

### Installation Issues

**Problem:** `pnpm install` fails

**Solution:**
```bash
# Check Node.js version (need >= 22)
node --version

# Check pnpm version (need >= 10)
pnpm --version

# Clear cache and retry
pnpm store prune
pnpm install
```

### Test UI Issues

**Problem:** `/momo-test` page shows 404

**Solution:**
```bash
# Ensure dev server is running
pnpm dev

# Check for build errors in terminal
# Try accessing directly: http://localhost:3000/momo-test
```

**Problem:** "Initialize Payment" returns error

**Solution:**
```bash
# Check .env file exists and has correct credentials
cat .env | grep MOMO

# Check server logs for errors
# Verify MoMo endpoint is accessible
curl https://test-payment.momo.vn
```

### Automated Test Issues

**Problem:** Tests fail with `ECONNREFUSED`

**Solution:**
```bash
# Make sure dev server is running
pnpm dev

# In another terminal:
pnpm test:momo
```

### Saleor Integration Issues

**Problem:** App installation fails

**Solution:**
1. Check ngrok is running
2. Verify manifest URL: `https://your-url.ngrok.io/api/manifest`
3. Check `.env` has correct `APP_API_BASE_URL`
4. Restart dev server after changing `.env`

**Problem:** Payment not showing in checkout

**Solution:**
1. Check app permissions include `HANDLE_PAYMENTS`
2. Verify payment gateway is enabled for channel
3. Check webhook registration in manifest

---

## Quick Reference

### Essential Commands
```bash
# Install & setup
pnpm install
pnpm generate
pnpm dev

# Testing
open http://localhost:3000/momo-test
pnpm test:momo

# Expose for Saleor
ngrok http 3000
```

### Test Credentials
```
Phone: 0399888999
OTP: 123456
```

### Key URLs
```
Test UI: http://localhost:3000/momo-test
Manifest: http://localhost:3000/api/manifest
Test API: http://localhost:3000/api/test/momo-*
```

### Documentation Files
- `README_MOMO.md` - Overview
- `QUICKSTART_MOMO.md` - Quick start
- `TESTING.md` - Testing guide
- `TEST_FLOW.md` - Test procedures
- `MOMO_INTEGRATION.md` - Technical docs

---

## Success Criteria

You've successfully completed the setup when:

- ✅ All dependencies installed
- ✅ Test UI accessible
- ✅ Can initialize payment
- ✅ Can complete test payment
- ✅ Can query payment status
- ✅ Automated tests pass (5/5)
- ✅ App installed in Saleor
- ✅ Full E2E checkout works
- ✅ Order created successfully
- ✅ Refund processed

---

## Need Help?

- 📖 Read [TESTING.md](./TESTING.md) for detailed testing guide
- 📖 Check [TEST_FLOW.md](./TEST_FLOW.md) for test procedures
- 📖 Review [MOMO_INTEGRATION.md](./MOMO_INTEGRATION.md) for technical details
- 🔗 Visit [Saleor Docs](https://docs.saleor.io/docs/3.x/developer/payments)
- 🔗 Read [MoMo API Docs](https://developers.momo.vn)

---

**Note:** Complete each phase in order. Don't skip steps as later phases depend on earlier ones.

**Estimated Total Time:** 1 hour 15 minutes
- Phase 1: 5 min
- Phase 2: 10 min
- Phase 3: 5 min
- Phase 4: 15 min
- Phase 5: 10 min
- Phase 6: 30 min
