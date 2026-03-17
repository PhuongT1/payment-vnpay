# MoMo Integration Testing Guide

This guide covers all testing approaches for the MoMo payment integration.

## Quick Start

### 1. Manual Testing (UI)

The easiest way to test the MoMo integration:

```bash
# Start the development server
pnpm dev

# Open your browser
open http://localhost:3000/momo-test
```

**Test Steps:**
1. Click "1. Initialize Payment" → Opens MoMo payment page
2. Use test credentials:
   - Phone: `0399888999`
   - OTP: `123456`
3. Complete payment
4. Click "2. Query Status" → Verify payment success
5. Click "3. Test Refund" → Test refund flow

### 2. Automated Testing (Script)

Run automated tests to verify all flows:

```bash
# Start dev server first
pnpm dev

# In another terminal, run automated tests
pnpm test:momo
```

**Or run both in one command:**
```bash
pnpm test:momo:watch
```

This will:
- ✅ Test payment initialization
- ✅ Test payment status query
- ✅ Test data validation
- ✅ Test special characters handling
- ✅ Test large amounts
- ✅ Generate test report

### 3. Full Saleor Integration Testing

For end-to-end testing with Saleor:

1. **Install the app in Saleor:**

```bash
# Expose your local server
ngrok http 3000

# Update .env with ngrok URL
APP_API_BASE_URL=https://xxx.ngrok.io

# Restart server
pnpm dev
```

2. **Install in Saleor Dashboard:**
   - Go to: Dashboard → Apps → Install External App
   - Manifest URL: `https://xxx.ngrok.io/api/manifest`
   - Authorize permissions

3. **Test in Storefront:**
   - Create an order
   - Select MoMo as payment method
   - Complete payment
   - Verify order created

## Testing Checklist

### ✅ Manual UI Tests

- [ ] Initialize payment succeeds
- [ ] Payment URL is generated
- [ ] QR code displays correctly
- [ ] Payment can be completed with test credentials
- [ ] Query status returns correct result
- [ ] Refund can be processed
- [ ] Error messages display properly
- [ ] Loading states work correctly

### ✅ Automated Script Tests

- [ ] All tests pass (5/5)
- [ ] No HTTP errors
- [ ] Valid MoMo responses received
- [ ] Data validation works
- [ ] Special characters handled
- [ ] Large amounts accepted

### ✅ Saleor Integration Tests

- [ ] App installs successfully
- [ ] Manifest loads without errors
- [ ] Webhooks are registered
- [ ] Payment initialization webhook works
- [ ] Authorization flow completes
- [ ] Process session webhook verifies payment
- [ ] Order is created in Saleor
- [ ] Refund webhook processes correctly
- [ ] IPN callback updates transaction
- [ ] Return URL redirects properly

## Test Scenarios

### Scenario 1: Successful Payment

**Purpose:** Verify happy path payment flow

**Steps:**
1. Initialize payment with 100,000 VND
2. Complete payment with test credentials
3. Verify status shows success
4. Check transaction in Saleor

**Expected Result:**
- `resultCode: 0`
- `transId` received
- Order created in Saleor
- Status: CHARGED

### Scenario 2: Failed Payment

**Purpose:** Test error handling

**Steps:**
1. Initialize payment
2. Click "Cancel" on MoMo page
3. Return to storefront
4. Verify error displayed

**Expected Result:**
- `resultCode: 1004` (cancelled)
- Error message shown
- Order not created
- Can retry payment

### Scenario 3: Refund

**Purpose:** Verify refund flow

**Steps:**
1. Complete successful payment first
2. Note the `transId` from response
3. Click "Test Refund"
4. Enter original `transId` and amount
5. Submit refund

**Expected Result:**
- `resultCode: 0`
- New refund `transId` received
- Amount refunded
- Status updated in Saleor

### Scenario 4: Large Amount

**Purpose:** Test with maximum transaction size

**Steps:**
1. Initialize payment with 50,000,000 VND
2. Complete payment
3. Verify success

**Expected Result:**
- `resultCode: 0`
- Large amount handled correctly
- No overflow errors

### Scenario 5: Special Characters

**Purpose:** Test Vietnamese and special characters

**Steps:**
1. Initialize payment with order info: "Đơn hàng #123 & test@example.com"
2. Complete payment
3. Verify order info preserved

**Expected Result:**
- Characters encoded correctly
- No encoding errors
- Order info readable

## Expected Test Results

### Initialize Payment Response

```json
{
  "success": true,
  "data": {
    "partnerCode": "MOMOBKUN20240101",
    "orderId": "TEST_1710497234567",
    "requestId": "MOMOBKUN20240101_1710497234567",
    "amount": 100000,
    "responseTime": 1710497234567,
    "message": "Successful.",
    "resultCode": 0,
    "payUrl": "https://test-payment.momo.vn/gateway?...",
    "deeplink": "momo://app?action=payment&...",
    "qrCodeUrl": "https://test-payment.momo.vn/qrcode/..."
  }
}
```

### Query Status Response (Success)

```json
{
  "success": true,
  "data": {
    "partnerCode": "MOMOBKUN20240101",
    "orderId": "TEST_1710497234567",
    "requestId": "MOMOBKUN20240101_1710497234567",
    "amount": 100000,
    "resultCode": 0,
    "message": "Successful.",
    "responseTime": 1710497234567,
    "transId": 12345678,
    "payType": "qr"
  }
}
```

### Refund Response

```json
{
  "success": true,
  "data": {
    "partnerCode": "MOMOBKUN20240101",
    "orderId": "REFUND_1710497234567",
    "requestId": "MOMOBKUN20240101_1710497234567",
    "amount": 100000,
    "resultCode": 0,
    "message": "Refund successful",
    "responseTime": 1710497234567,
    "transId": 12345679
  }
}
```

### Automated Test Output

```
═══════════════════════════════════════════════
🚀 MoMo Payment Integration - Automated Tests
═══════════════════════════════════════════════
API Base: http://localhost:3000

🧪 Testing: Data Validation
   ✅ Valid order passed validation
   ✅ Invalid order correctly rejected
   ✅ Minimum amount validation works

🧪 Testing: Initialize Payment
   Order ID: TEST_1710497234567
   Amount: ₫100,000
   ✅ Payment URL: https://test-payment.momo.vn/gateway?...
   ✅ QR Code URL: https://test-payment.momo.vn/qrcode/...

🧪 Testing: Query Payment Status
   Order ID: TEST_1710497234567
   ℹ️  Status: Pending - Transaction pending
   ℹ️  Result Code: 1002

🧪 Testing: Special Characters
   Order Info: Test đặc biệt & #special @characters
   ✅ Special characters handled correctly

🧪 Testing: Large Amount
   Amount: ₫50,000,000
   ✅ Large amount handled correctly

═══════════════════════════════════════════════
📊 Test Report
═══════════════════════════════════════════════

Total Tests: 5
✅ Passed: 5
❌ Failed: 0
Success Rate: 100.00%

Detailed Results:
1. ✅ Data Validation (45ms)
2. ✅ Initialize Payment (1234ms)
3. ✅ Query Payment Status (2156ms)
4. ✅ Special Characters (987ms)
5. ✅ Large Amount (1098ms)

═══════════════════════════════════════════════
```

## Troubleshooting

### Tests Failing

**Issue:** `ECONNREFUSED` error

**Solution:**
```bash
# Make sure dev server is running
pnpm dev

# Then run tests in another terminal
pnpm test:momo
```

### MoMo API Errors

**Issue:** `resultCode: 11` (Invalid access key)

**Solution:**
```bash
# Check .env file has correct credentials
cat .env | grep MOMO

# Should match .env.example test credentials
```

**Issue:** `resultCode: 10` (Invalid signature)

**Solution:**
- Check `SECRET_KEY` in `.env`
- Ensure no extra spaces in environment variables
- Restart server after changing `.env`

### UI Test Issues

**Issue:** "Initialize Payment" button does nothing

**Solution:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify API endpoint is accessible:
   ```bash
   curl http://localhost:3000/api/test/momo-initialize
   ```

**Issue:** QR code not displaying

**Solution:**
- Check `qrCodeUrl` in response
- Ensure image URL is accessible
- Try opening QR URL directly in browser

## Performance Benchmarks

Expected response times for test endpoints:

| Endpoint | Expected Time | Notes |
|----------|---------------|-------|
| Initialize Payment | < 2s | Calls MoMo API |
| Query Status | < 1.5s | Calls MoMo API |
| Refund | < 2s | Calls MoMo API |
| Data Validation | < 50ms | Local only |

## CI/CD Integration

To run tests in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Test MoMo Integration

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Generate types
        run: pnpm generate
      
      - name: Run MoMo tests
        run: pnpm test:momo:watch
        env:
          MOMO_PARTNER_CODE: ${{ secrets.MOMO_PARTNER_CODE }}
          MOMO_ACCESS_KEY: ${{ secrets.MOMO_ACCESS_KEY }}
          MOMO_SECRET_KEY: ${{ secrets.MOMO_SECRET_KEY }}
          MOMO_ENDPOINT: https://test-payment.momo.vn
```

## Load Testing

For stress testing the integration:

```bash
# Install k6
brew install k6

# Create load test script (k6-test.js)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({
    orderId: `LOAD_${Date.now()}`,
    amount: 100000,
    orderInfo: 'Load test',
    userEmail: 'test@example.com',
  });

  const res = http.post('http://localhost:3000/api/test/momo-initialize', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has payUrl': (r) => JSON.parse(r.body).data.payUrl !== undefined,
  });

  sleep(1);
}

# Run load test
k6 run k6-test.js
```

## Next Steps

After successful testing:

1. **Update to production credentials**
   - Change `MOMO_ENDPOINT` to production URL
   - Use real partner code and keys
   - Test with real MoMo account

2. **Enable monitoring**
   - Add logging for all MoMo API calls
   - Set up alerts for failed payments
   - Track payment success rates

3. **Deploy to production**
   - Deploy app to production server
   - Update `APP_API_BASE_URL` in Saleor
   - Monitor first transactions closely

4. **Documentation**
   - Document production setup
   - Create runbook for common issues
   - Train support team on payment flows

## Support

For issues or questions:

- Check [MOMO_INTEGRATION.md](./MOMO_INTEGRATION.md) for technical details
- Review [TEST_FLOW.md](./TEST_FLOW.md) for detailed test procedures
- Contact MoMo support for API issues
- File GitHub issues for app bugs
