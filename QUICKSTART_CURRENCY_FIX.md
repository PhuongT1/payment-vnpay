# ✅ VNPay Currency Fix - Quick Start Guide

## 🎯 Vấn Đề Đã Fix

**Before**: Checkout hiển thị 5,010.13 USD nhưng VNPay chỉ nhận 501,013 VND ≈ $20  
**After**: Checkout 5,010.13 USD → VNPay nhận đúng 125,253,250 VND ≈ $5,010 ✅

---

## 🚀 Cách Sử Dụng

### 1. Cập Nhật Tỷ Giá (BẮT BUỘC)

Mở file `/payment-vnpay/.env` và cập nhật tỷ giá:

```bash
# 1️⃣ Kiểm tra tỷ giá hiện tại tại:
# https://www.vietcombank.com.vn/exchangerates

# 2️⃣ Cập nhật trong .env:
EXCHANGE_RATE_USD_TO_VND=25000   # Ví dụ: 1 USD = 25,000 VND
EXCHANGE_RATE_EUR_TO_VND=27000   # Ví dụ: 1 EUR = 27,000 VND

# 3️⃣ Thêm currency khác nếu cần:
# EXCHANGE_RATE_GBP_TO_VND=30000
# EXCHANGE_RATE_JPY_TO_VND=170
```

### 2. Restart Payment App

```bash
cd payment-vnpay
npm run dev
# hoặc deploy lại trên Railway/Vercel
```

### 3. Test Ngay

1. **Tạo order mới** trong Saleor_user_web-main
2. **Chọn VNPay** làm payment method
3. **Kiểm tra console logs**:

```
Expected logs:
💰 Original payment amount: { amount: 5010.13, currency: 'USD', orderId: '...' }
💱 Currency conversion: { 
  from: '5010.13 USD', 
  to: '125253250 VND', 
  rate: 25000,
  calculation: '5010.13 × 25000 = 125253250'
}
✅ Payment created successfully: {
  transactionRef: '...',
  originalAmount: '5010.13 USD',
  vnpayAmount: '125253250 VND'
}
```

4. **Verify VNPay popup** hiển thị đúng số tiền VND
5. **Complete payment** với test card

---

## 📋 Checklist Trước Khi Go Live

- [ ] ✅ Fix đã apply (check file webhook đã có code conversion)
- [ ] 🔄 Cập nhật tỷ giá trong .env theo rate hiện tại
- [ ] 🧪 Test với USD checkout → verify VND amount correct
- [ ] 🧪 Test với EUR checkout (nếu có) → verify VND amount
- [ ] 📊 Check logs có hiển thị conversion info
- [ ] 🚀 Deploy payment app lên production
- [ ] 🔔 Set up monitoring/alerting cho conversion errors
- [ ] 📝 Document tỷ giá đang dùng cho team

---

## ⚠️ Lưu Ý Quan Trọng

### 1. VNPay CHỈ Chấp Nhận VND

- ✅ Webhook tự động convert USD/EUR → VND
- ❌ Nếu dùng currency khác (GBP, JPY...) → phải thêm vào .env
- ⚠️ Nếu không config tỷ giá → trả về error `UNSUPPORTED_CURRENCY`

### 2. Giới Hạn Số Tiền VNPay

- **Minimum**: 5,000 VND (≈ $0.20 USD)
- **Maximum**: 1,000,000,000 VND (≈ $40,000 USD)
- Webhook tự động validate và trả error nếu ngoài range

### 3. Cập Nhật Tỷ Giá Thường Xuyên

**Recommended**:
- Update **hàng ngày** hoặc **hàng tuần**
- Monitor tỷ giá thay đổi > 5%
- Alert nếu conversion amount sai lệch quá nhiều

**Advanced** (Optional):
- Integrate live exchange rate API
- Auto-update via cron job
- Show real-time VND equivalent at checkout

---

## 🐛 Troubleshooting

### Error: "UNSUPPORTED_CURRENCY"

**Nguyên nhân**: Currency chưa config trong .env

**Cách fix**:
```bash
# Thêm vào .env:
EXCHANGE_RATE_<CURRENCY>_TO_VND=<rate>

# Ví dụ:
EXCHANGE_RATE_GBP_TO_VND=30000
```

### Error: "AMOUNT_TOO_SMALL"

**Nguyên nhân**: Sau khi convert, amount < 5,000 VND

**Cách fix**:
- Set minimum order amount trong Saleor: $1.00 USD
- Hoặc tăng phí ship để total > $0.20

### VNPay Hiển Thị Sai Số Tiền

**Nguyên nhân**: Tỷ giá trong .env sai hoặc outdated

**Cách fix**:
1. Check rate hiện tại: https://www.vietcombank.com.vn/exchangerates
2. Update `.env`: `EXCHANGE_RATE_USD_TO_VND=<new_rate>`
3. Restart app
4. Test lại

### Không Thấy Conversion Logs

**Check**:
1. Payment app có restart sau khi update .env?
2. File webhook có code conversion? (check git diff)
3. Transaction có trigger webhook? (check Saleor logs)

---

## 📞 Support

- **Documentation**: `/payment-vnpay/CRITICAL_FIX_CURRENCY_CONVERSION.md`
- **Code**: `/payment-vnpay/src/pages/api/webhooks/vnpay-transaction-initialize-session.ts`
- **Logs**: Check Railway/Vercel deployment logs

---

## ✅ Success Indicators

Sau khi fix, bạn sẽ thấy:

1. ✅ Console logs hiển thị conversion info
2. ✅ VNPay popup show correct VND amount
3. ✅ Payment processed successfully
4. ✅ No customer complaints về pricing
5. ✅ Revenue matches expected amount

**Test ngay để verify!** 🎉

---

**Last Updated**: March 20, 2026  
**Status**: ✅ READY TO USE  
**Critical**: YES - Must update exchange rates before production
