# 🚀 VNPay Payment Gateway Integration - Quick Start

**⏱️ Setup Time: 5-10 minutes**

## ✅ Prerequisites

- Node.js 22+
- pnpm 10+
- Email address for VNPay sandbox registration

---

## 📋 Step 1: Đăng ký VNPay Sandbox (2 phút)

### 🔗 Truy cập trang đăng ký:
**http://sandbox.vnpayment.vn/devreg/**

### 📝 Điền form đăng ký:
1. Email của bạn
2. Thông tin dự án
3. Mã xác nhận (captcha)
4. Click **"Đăng ký"**

### 📧 Nhận credentials qua email:
Bạn sẽ nhận được email với:
- `vnp_TmnCode` (Merchant Code)
- `vnp_HashSecret` (Hash Secret)

**⚡ Lưu ý:** Credentials được gửi **ngay lập tức** qua email!

---

## ⚙️ Step 2: Cấu hình môi trường (1 phút)

### Cập nhật file `.env`:

```bash
# VNPay Credentials từ email
VNPAY_TMN_CODE=DEMOV210           # Thay bằng code của bạn
VNPAY_HASH_SECRET=your_secret_key  # Thay bằng secret của bạn

# Endpoints (giữ nguyên cho sandbox)
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
```

---

## 🏃 Step 3: Chạy ứng dụng (1 phút)

```bash
# Install dependencies (nếu chưa có)
pnpm install

# Start development server
pnpm run dev
```

Server sẽ chạy tại: **http://localhost:3000**

---

## 🧪 Step 4: Test thanh toán (2 phút)

### Mở test page:
```
http://localhost:3000/vnpay-test
```

### Test flow:

1. **Click "1️⃣ Initialize Payment"**
   - Tạo payment URL
   
2. **Click "Open VNPay Payment Page"**
   - Mở trang thanh toán VNPay
   
3. **Chọn phương thức thanh toán:**
   - Thẻ ATM nội địa
   - QR Code
   - Thẻ quốc tế

4. **Sử dụng test card:**
   ```
   Ngân hàng: NCB
   Số thẻ: 9704198526191432198
   Tên: NGUYEN VAN A
   Ngày phát hành: 07/15
   OTP: 123456
   ```

5. **Hoàn tất thanh toán**
   - Nhập OTP: `123456`
   - Trang sẽ redirect về kết quả

---

## 🎴 Test Cards Đầy Đủ

### ✅ Thanh toán thành công:

| Loại | Ngân hàng | Số thẻ | Tên | Ngày | OTP |
|------|-----------|--------|-----|------|-----|
| ATM | NCB | 9704198526191432198 | NGUYEN VAN A | 07/15 | 123456 |
| VISA (No 3DS) | - | 4456530000001005 | NGUYEN VAN A | 12/26 | - |
| Mastercard (3DS) | - | 5200000000001096 | NGUYEN VAN A | 12/26 | - |

**CVV/CVC:** 123  
**Email:** test@gmail.com  
**Địa chỉ:** 22 Lang Ha, Ha Noi

### ❌ Test lỗi:

| Số thẻ | Kết quả |
|--------|---------|
| 9704195798459170488 | Không đủ số dư |
| 9704192181368742 | Chưa kích hoạt |
| 9704193370791314 | Thẻ bị khóa |
| 9704194841945513 | Thẻ hết hạn |

---

## ✨ Kết quả mong đợi

### ✅ Sau khi thanh toán thành công:

1. **Trang kết quả hiển thị**:
   - ✅ "Thanh toán thành công!"
   - Số tiền: 100,000 ₫
   - Mã giao dịch VNPay
   - Ngân hàng: NCB
   - Thời gian thanh toán

2. **Console logs**:
   ```
   📥 VNPay IPN Callback Received
   ✅ Signature verified successfully
   ✅ Payment successful
   ```

3. **Test UI hiển thị**:
   - Payment URL
   - Transaction data
   - Response từ VNPay

---

## 🔍 Troubleshooting

### ❌ Lỗi "Invalid signature"

**Nguyên nhân:** `VNPAY_HASH_SECRET` không đúng

**Giải pháp:**
```bash
# Kiểm tra lại email từ VNPay
# Copy chính xác HASH_SECRET vào .env
# Restart server: Ctrl+C và pnpm run dev
```

### ❌ Lỗi "Merchant not found"

**Nguyên nhân:** `VNPAY_TMN_CODE` không đúng

**Giải pháp:**
```bash
# Kiểm tra lại TMN_CODE từ email
# Đảm bảo không có khoảng trắng thừa
```

### ❌ Không nhận được email credentials

**Giải pháp:**
1. Kiểm tra spam folder
2. Đợi 5-10 phút
3. Thử đăng ký lại với email khác
4. Liên hệ VNPay: hotrovnpay@vnpay.vn

---

## 📚 Next Steps

### 🔗 Xem documentation chi tiết:
- [README_VNPAY.md](./README_VNPAY.md) - Tổng quan dự án
- [VNPAY_INTEGRATION.md](./VNPAY_INTEGRATION.md) - Chi tiết kỹ thuật
- [VNPAY_TEST_CARDS.md](./VNPAY_TEST_CARDS.md) - Danh sách test cards

### 🎯 Tích hợp với Saleor:
```bash
# 1. Cài đặt app vào Saleor Dashboard
# 2. Configure webhook URLs
# 3. Test checkout flow
```

### 🚀 Lên production:
1. Liên hệ VNPay để lấy production credentials
2. Cập nhật `.env` với production values
3. Thay đổi endpoints từ sandbox → production
4. Test đầy đủ trước khi deploy

---

## 🆘 Support

### VNPay Support:
- 📧 Email: hotrovnpay@vnpay.vn
- 📞 Hotline: 1900 55 55 77
- 🌐 Docs: https://sandbox.vnpayment.vn/apis/docs/

### Documentation:
- 📖 API Reference: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
- 🎴 Test Cards: https://sandbox.vnpayment.vn/apis/vnpay-demo/

---

## ✅ Checklist

- [ ] Đăng ký VNPay sandbox tại http://sandbox.vnpayment.vn/devreg/
- [ ] Nhận credentials qua email
- [ ] Cập nhật `.env` với credentials
- [ ] Chạy `pnpm install` và `pnpm run dev`
- [ ] Mở http://localhost:3000/vnpay-test
- [ ] Test payment với card: 9704198526191432198
- [ ] Verify payment success trong console và UI
- [ ] Đọc documentation chi tiết

---

**🎉 Chúc mừng! Bạn đã tích hợp VNPay thành công!**

Để tìm hiểu thêm về flow chi tiết, webhook handling, và best practices, xem [README_VNPAY.md](./README_VNPAY.md).
