# 🎴 VNPay Test Cards - Complete List

Danh sách đầy đủ test cards cho VNPay Sandbox environment.

**Source:** https://sandbox.vnpayment.vn/apis/vnpay-demo/

---

## 🏦 Thẻ ATM Nội Địa (Domestic ATM Cards)

### ✅ Thanh toán thành công

| STT | Ngân hàng | Số thẻ | Tên chủ thẻ | Ngày phát hành | OTP | Kết quả |
|-----|-----------|---------|-------------|----------------|-----|---------|
| 1 | **NCB** | **9704198526191432198** | NGUYEN VAN A | 07/15 | 123456 | ✅ Thành công |
| 2 | NAPAS Banks | 9704000000000018 | NGUYEN VAN A | 03/07 | otp | ✅ Thành công |
| 3 | NAPAS Banks | 9704020000000016 | NGUYEN VAN A | 03/07 | otp | ✅ Thành công |
| 4 | EXIMBBANK | 9704310005819191 | NGUYEN VAN A | 10/26 | - | ✅ Thành công |

### ❌ Test các trường hợp lỗi

| STT | Ngân hàng | Số thẻ | Tên chủ thẻ | Ngày phát hành | Kết quả |
|-----|-----------|---------|-------------|----------------|---------|
| 1 | NCB | **9704195798459170488** | NGUYEN VAN A | 07/15 | ❌ Không đủ số dư |
| 2 | NCB | **9704192181368742** | NGUYEN VAN A | 07/15 | ❌ Chưa kích hoạt |
| 3 | NCB | **9704193370791314** | NGUYEN VAN A | 07/15 | ❌ Thẻ bị khóa |
| 4 | NCB | **9704194841945513** | NGUYEN VAN A | 07/15 | ❌ Thẻ hết hạn |

---

## 💳 Thẻ Quốc Tế (International Cards)

### ✅ VISA Cards

| STT | Loại | Số thẻ | CVV | Tên | Ngày hết hạn | 3D Secure | Kết quả |
|-----|------|---------|-----|-----|--------------|-----------|---------|
| 1 | VISA (No 3DS) | **4456530000001005** | 123 | NGUYEN VAN A | 12/26 | ❌ Không | ✅ Thành công |
| 2 | VISA (3DS) | **4456530000001096** | 123 | NGUYEN VAN A | 12/26 | ✅ Có | ✅ Thành công |

### ✅ Mastercard

| STT | Loại | Số thẻ | CVV | Tên | Ngày hết hạn | 3D Secure | Kết quả |
|-----|------|---------|-----|-----|--------------|-----------|---------|
| 1 | MC (No 3DS) | **5200000000001005** | 123 | NGUYEN VAN A | 12/26 | ❌ Không | ✅ Thành công |
| 2 | MC (3DS) | **5200000000001096** | 123 | NGUYEN VAN A | 12/26 | ✅ Có | ✅ Thành công |

### ✅ JCB Cards

| STT | Loại | Số thẻ | CVV | Tên | Ngày hết hạn | 3D Secure | Kết quả |
|-----|------|---------|-----|-----|--------------|-----------|---------|
| 1 | JCB (No 3DS) | **3337000000000008** | 123 | NGUYEN VAN A | 12/26 | ❌ Không | ✅ Thành công |
| 2 | JCB (3DS) | **3337000000200004** | 123 | NGUYEN VAN A | 12/24 | ✅ Có | ✅ Thành công |

### Thông tin bổ sung cho thẻ quốc tế:
- **Email:** test@gmail.com
- **Địa chỉ:** 22 Lang Ha
- **Thành phố:** Ha Noi
- **Quốc gia:** Việt Nam

---

## 🎯 Quick Test Cards (Recommended)

### Cho ATM testing:
```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên: NGUYEN VAN A
Ngày: 07/15
OTP: 123456
```

### Cho International Card testing:
```
Loại: VISA (No 3DS)
Số thẻ: 4456530000001005
CVV: 123
Tên: NGUYEN VAN A
Ngày hết hạn: 12/26
Email: test@gmail.com
Địa chỉ: 22 Lang Ha, Ha Noi
```

---

## 📝 Lưu ý quan trọng

### ⚠️ Môi trường Test (Sandbox)

1. **Chỉ sử dụng thẻ trong danh sách trên**
   - Các thẻ thật sẽ không hoạt động
   - Các ngân hàng khác có thể đã đóng môi trường test

2. **OTP cố định**
   - ATM cards: `123456` hoặc `otp`
   - International cards: Không cần OTP (trừ 3DS)

3. **Số tiền test**
   - Không giới hạn số tiền trong sandbox
   - Recommend: 10,000 - 10,000,000 VND

### ✅ Best Practices

1. **Test đầy đủ các scenarios:**
   - ✅ Thanh toán thành công
   - ❌ Không đủ số dư
   - ❌ Thẻ bị khóa
   - ❌ Timeout
   - ❌ User cancel

2. **Test nhiều loại thẻ:**
   - ATM nội địa
   - VISA/Mastercard
   - 3D Secure và Non-3DS

3. **Verify webhooks:**
   - IPN callback nhận đúng
   - Return URL hoạt động
   - Signature validation đúng

---

## 🔍 Test Scenarios

### Scenario 1: Successful Payment (ATM)
```
1. Card: 9704198526191432198
2. Select: NCB Bank
3. Enter OTP: 123456
4. Expected: ✅ Payment successful
5. Result Code: 00
```

### Scenario 2: Insufficient Balance
```
1. Card: 9704195798459170488
2. Select: NCB Bank
3. Expected: ❌ Không đủ số dư
4. Result Code: 51
```

### Scenario 3: Inactive Card
```
1. Card: 9704192181368742
2. Select: NCB Bank
3. Expected: ❌ Thẻ chưa kích hoạt
4. Result Code: 12
```

### Scenario 4: International Card (VISA)
```
1. Card: 4456530000001005
2. CVV: 123
3. Expiry: 12/26
4. No 3DS
5. Expected: ✅ Payment successful
6. Result Code: 00
```

### Scenario 5: User Cancellation
```
1. Use any valid card
2. At payment page: Click "Cancel" or "Back"
3. Expected: ❌ User cancelled
4. Result Code: 24
```

---

## 📊 Response Codes Reference

| Code | Ý nghĩa | Chi tiết |
|------|---------|----------|
| **00** | ✅ Thành công | Giao dịch hoàn tất |
| **07** | ⚠️ Nghi ngờ gian lận | Cần xác minh |
| **09** | ❌ Chưa đăng ký IB | Thẻ chưa kích hoạt Internet Banking |
| **10** | ❌ Sai thông tin | Nhập sai thông tin quá 3 lần |
| **11** | ❌ Timeout | Hết hạn thanh toán |
| **12** | ❌ Thẻ bị khóa | Liên hệ ngân hàng |
| **13** | ❌ Sai OTP | Mật khẩu OTP không đúng |
| **24** | ❌ Hủy bởi người dùng | Khách hàng cancel |
| **51** | ❌ Không đủ tiền | Tài khoản không đủ số dư |
| **65** | ❌ Vượt hạn mức | Quá hạn mức ngày |
| **75** | ⚠️ Bảo trì | Ngân hàng đang maintain |
| **79** | ❌ Sai mật khẩu | Nhập sai quá số lần quy định |
| **99** | ❌ Lỗi khác | Lỗi không xác định |

---

## 🧪 Testing Checklist

### ATM Card Testing
- [ ] Test card thành công: 9704198526191432198
- [ ] Test không đủ số dư: 9704195798459170488
- [ ] Test thẻ chưa kích hoạt: 9704192181368742
- [ ] Test thẻ bị khóa: 9704193370791314
- [ ] Verify OTP: 123456
- [ ] Check IPN callback
- [ ] Verify return URL

### International Card Testing
- [ ] Test VISA (No 3DS): 4456530000001005
- [ ] Test VISA (3DS): 4456530000001096
- [ ] Test Mastercard (No 3DS): 5200000000001005
- [ ] Test Mastercard (3DS): 5200000000001096
- [ ] Verify CVV: 123
- [ ] Check email: test@gmail.com
- [ ] Verify address fields

### Error Handling
- [ ] Test timeout (don't complete payment)
- [ ] Test user cancellation
- [ ] Test invalid signature
- [ ] Test duplicate transaction
- [ ] Test refund flow

---

## 📞 Hỗ trợ

Nếu gặp vấn đề với test cards:

1. **Xác nhận đang dùng môi trường Sandbox**
   - URL: https://sandbox.vnpayment.vn
   - Không phải: https://payment.vnpay.vn

2. **Kiểm tra credentials**
   - TMN_CODE từ email đăng ký
   - HASH_SECRET chính xác

3. **Liên hệ VNPay Support**
   - Email: hotrovnpay@vnpay.vn
   - Hotline: 1900 55 55 77

---

**Last Updated:** March 15, 2026  
**Source:** [VNPay Demo Page](https://sandbox.vnpayment.vn/apis/vnpay-demo/)
