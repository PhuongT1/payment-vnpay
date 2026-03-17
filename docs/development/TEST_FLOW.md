# MoMo Payment Integration - Full Test Flow

## 🎯 Test Overview

This guide provides a complete step-by-step testing flow for the MoMo payment integration.

## 📋 Prerequisites

1. **MoMo Test Credentials** (already in `.env.example`)
   ```env
   MOMO_PARTNER_CODE=MOMOBKUN20240101
   MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
   MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
   MOMO_ENDPOINT=https://test-payment.momo.vn
   ```

2. **App Running**
   ```bash
   pnpm dev
   ```

3. **Publicly Accessible URL** (for IPN callbacks)
   ```bash
   ngrok http 3000
   ```

## 🧪 Test Flow 1: Standalone MoMo API Test (No Saleor)

### Step 1: Access Test UI

Navigate to: `http://localhost:3000/momo-test`

![Test UI](https://via.placeholder.com/800x400?text=MoMo+Test+UI)

### Step 2: Configure Test Data

Default values are pre-filled:
- **Amount**: 100000 (VND)
- **Order ID**: Auto-generated with timestamp
- **Order Info**: Test MoMo Payment
- **User Email**: test@example.com

You can modify these values if needed.

### Step 3: Initialize Payment

1. Click **"1. Initialize Payment"** button
2. Check the console for logs:
   ```
   Test: Initializing MoMo payment {
     orderId: 'TEST_1710497234567',
     amount: 100000,
     returnUrl: 'http://localhost:3000/api/test/momo-return',
     notifyUrl: 'http://localhost:3000/api/momo/ipn'
   }
   ```
3. A new tab will open with MoMo payment page
4. The result JSON will appear below:
   ```json
   {
     "partnerCode": "MOMOBKUN20240101",
     "requestId": "MOMOBKUN20240101_1710497234567",
     "orderId": "TEST_1710497234567",
     "amount": 100000,
     "resultCode": 0,
     "message": "Successful.",
     "payUrl": "https://test-payment.momo.vn/gateway...",
     "qrCodeUrl": "https://test-payment.momo.vn/qrcode/...",
     "deeplink": "momo://..."
   }
   ```

### Step 4: Complete Payment on MoMo

In the opened MoMo payment page:

**Option A: Use Test Phone Number**
1. Enter phone: **0399888999**
2. Enter OTP: **123456**
3. Confirm payment

**Option B: Scan QR Code**
1. Open MoMo app (test mode)
2. Scan the QR code shown
3. Confirm payment

### Step 5: Verify Payment Return

After completing payment:
1. MoMo redirects to return URL
2. You'll see a result page showing:
   - ✅ Payment Successful!
   - Result Code: 0
   - Transaction ID
   - Order ID
   - Amount

### Step 6: Query Payment Status

Back on test page:
1. Click **"2. Query Status"** button
2. Result will show:
   ```json
   {
     "partnerCode": "MOMOBKUN20240101",
     "orderId": "TEST_1710497234567",
     "requestId": "MOMOBKUN20240101_1710497234678",
     "amount": 100000,
     "resultCode": 0,
     "message": "Successful.",
     "transId": 12345678,
     "payType": "qr"
   }
   ```

### Step 7: Test Refund

1. Click **"3. Test Refund"** button
2. Refund will be processed:
   ```json
   {
     "partnerCode": "MOMOBKUN20240101",
     "orderId": "REFUND_1710497234789",
     "requestId": "MOMOBKUN20240101_1710497234789",
     "amount": 100000,
     "resultCode": 0,
     "message": "Refund successful",
     "transId": 12345679
   }
   ```

## 🔄 Test Flow 2: Full Saleor Integration Test

### Prerequisites

1. **Install App in Saleor**
   ```
   Dashboard → Apps → Install External App
   Manifest URL: https://your-ngrok-url.ngrok.io/api/manifest
   ```

2. **Configure Payment Gateway**
   ```
   Dashboard → Configuration → Payment Methods
   Add "MoMo Payment" gateway
   ```

### Test Steps

#### 1. Create Test Order in Storefront

1. Go to your Saleor storefront
2. Add products to cart
3. Proceed to checkout
4. Fill in shipping/billing details

#### 2. Select MoMo Payment

1. On payment step, select "MoMo"
2. Click "Complete Checkout"

#### 3. Monitor TRANSACTION_INITIALIZE_SESSION

Check terminal logs:
```
Transaction Initialize Session webhook triggered {
  merchantReference: 'Q29ja2pvdTplMGE1Z...',
  idempotencyKey: 'checkout-complete-123'
}
MoMo payment created successfully {
  orderId: 'SALEOR_1710497234567',
  requestId: 'MOMOBKUN20240101_1710497234567',
  payUrl: 'https://test-payment.momo.vn/gateway...'
}
```

#### 4. User Redirected to MoMo

1. Storefront redirects to MoMo payment page
2. User completes payment (phone: 0399888999, OTP: 123456)

#### 5. Monitor MoMo IPN

Check terminal logs:
```
MoMo IPN received: {
  orderId: 'SALEOR_1710497234567',
  transId: 12345678,
  resultCode: 0,
  message: 'Successful.'
}
Transaction update completed
```

#### 6. Monitor TRANSACTION_PROCESS_SESSION

After user returns to storefront:
```
Transaction Process Session webhook triggered {
  merchantReference: 'Q29ja2pvdTplMGE1Z...',
  transactionId: 'VHJhbnNhY3Rpb246MQ=='
}
MoMo payment status: {
  orderId: 'SALEOR_1710497234567',
  resultCode: 0,
  message: 'Successful.'
}
```

#### 7. Verify Order Created

1. Go to Saleor Dashboard → Orders
2. Find the newly created order
3. Check payment status: "Fully Paid"
4. Check transaction events in order details

#### 8. Test Refund Flow

1. In Dashboard, go to Order → Refund
2. Enter refund amount
3. Confirm refund

Monitor TRANSACTION_REFUND_REQUESTED:
```
Transaction Refund Requested webhook triggered {
  transactionId: 'VHJhbnNhY3Rpb246MQ==',
  amount: 100000
}
MoMo refund result: {
  orderId: 'REFUND_12345',
  resultCode: 0,
  message: 'Refund successful'
}
```

## 🔍 Testing Checklist

### Basic Flow
- [ ] Payment initialization creates MoMo payment request
- [ ] Payment URL is generated with QR code
- [ ] User can complete payment on MoMo page
- [ ] IPN callback is received and verified
- [ ] Payment status query returns correct status
- [ ] Transaction is updated in Saleor

### Edge Cases
- [ ] Invalid signature is rejected
- [ ] Expired payment is handled correctly
- [ ] Duplicate IPN is handled idempotently
- [ ] Network timeout is handled gracefully
- [ ] Invalid amount is rejected
- [ ] Missing required fields return error

### Refund Flow
- [ ] Refund request is sent to MoMo
- [ ] Partial refund works correctly
- [ ] Full refund works correctly
- [ ] Refund status is updated in Saleor
- [ ] Cannot refund more than original amount

### Cancellation Flow
- [ ] Pending payment can be cancelled
- [ ] Completed payment cannot be cancelled (must refund)
- [ ] Cancellation updates transaction status

## 📊 Expected Results

### Successful Payment
```json
{
  "pspReference": "12345678",
  "result": "CHARGE_SUCCESS",
  "amount": 100.00,
  "time": "2026-03-15T10:30:00Z",
  "message": "Payment completed successfully"
}
```

### Failed Payment
```json
{
  "pspReference": "REQ_12345",
  "result": "CHARGE_FAILURE",
  "amount": 0,
  "message": "Payment failed: User cancelled"
}
```

### Successful Refund
```json
{
  "pspReference": "12345679",
  "result": "REFUND_SUCCESS",
  "amount": 100.00,
  "message": "Refund processed successfully"
}
```

## 🐛 Troubleshooting

### Payment Not Initializing

**Symptom**: "Failed to initialize MoMo payment"

**Solutions**:
1. Check MoMo credentials in `.env`
2. Verify `MOMO_ENDPOINT` is correct
3. Check logs for signature errors
4. Ensure amount is positive integer

### IPN Not Received

**Symptom**: Payment completed but order not created

**Solutions**:
1. Ensure app URL is publicly accessible (use ngrok)
2. Check firewall settings
3. Verify IPN URL in MoMo portal
4. Check app logs for IPN errors

### Refund Failing

**Symptom**: "Refund failed" error

**Solutions**:
1. Verify original transaction was successful
2. Check refund amount doesn't exceed original
3. Ensure transaction ID is correct
4. Check MoMo account has refund permissions

### Signature Verification Failed

**Symptom**: "Invalid signature" error

**Solutions**:
1. Double-check `MOMO_SECRET_KEY`
2. Ensure no extra spaces in `.env`
3. Verify request parameters are correct
4. Check signature generation algorithm

## 📝 Test Logs Example

```
# Terminal Output

[12:30:15] Test: Initializing MoMo payment
[12:30:16] MoMo API Request: {
  orderId: 'TEST_1710497415000',
  amount: 100000,
  signature: 'a1b2c3d4e5f6...'
}
[12:30:17] MoMo API Response: {
  resultCode: 0,
  payUrl: 'https://test-payment.momo.vn/...'
}
[12:30:45] MoMo IPN received: {
  orderId: 'TEST_1710497415000',
  transId: 12345678,
  resultCode: 0
}
[12:30:45] IPN signature verified: ✓
[12:30:46] Test: Querying payment status
[12:30:47] MoMo Query Response: {
  resultCode: 0,
  transId: 12345678,
  payType: 'qr'
}
```

## 🎓 Learning Outcomes

After completing this test flow, you should understand:

1. ✅ How MoMo payment initialization works
2. ✅ Payment flow from initialization to completion
3. ✅ IPN callback handling and verification
4. ✅ Transaction status querying
5. ✅ Refund processing
6. ✅ Integration with Saleor Transactions API
7. ✅ Error handling and edge cases

## 📚 Next Steps

1. **Production Testing**
   - Get production MoMo credentials
   - Update environment variables
   - Test with real money (small amounts first)

2. **Performance Testing**
   - Load test with multiple concurrent payments
   - Test timeout scenarios
   - Verify IPN retry mechanism

3. **Security Testing**
   - Verify signature validation
   - Test with invalid credentials
   - Check for SQL injection, XSS

4. **Integration Testing**
   - Test with different Saleor versions
   - Test with different storefront implementations
   - Verify backward compatibility

## 🆘 Support

If you encounter issues:

1. Check logs in terminal
2. Review [MOMO_INTEGRATION.md](./MOMO_INTEGRATION.md)
3. Search MoMo documentation
4. Contact MoMo support: business@momo.vn

---

**Happy Testing! 🚀**
