/**
 * VNPay Return URL Handler
 * This endpoint handles customer redirect after payment
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getVNPayAPI } from "../../../lib/vnpay/vnpay-api";
import {
  VNPayIPNResponse,
  isVNPayPaymentSuccessful,
  getVNPayResponseMessage,
  parseVNPayAmount,
} from "../../../lib/vnpay/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  console.log("=".repeat(80));
  console.log("🔙 VNPay Return URL - Customer Redirect");
  console.log("=".repeat(80));

  try {
    const vnpayAPI = getVNPayAPI();
    const returnData = req.query as unknown as VNPayIPNResponse;

    console.log("Return Data:", {
      txnRef: returnData.vnp_TxnRef,
      amount: parseVNPayAmount(Number(returnData.vnp_Amount)),
      responseCode: returnData.vnp_ResponseCode,
      transactionStatus: returnData.vnp_TransactionStatus,
    });

    // Verify signature
    const isValidSignature = vnpayAPI.verifyIPNSignature(returnData);

    if (!isValidSignature) {
      console.error("❌ Invalid signature");
      return res.send(generateResultHTML({
        success: false,
        message: "Chữ ký không hợp lệ",
        orderId: returnData.vnp_TxnRef,
      }));
    }

    console.log("✅ Signature verified");

    // Check payment result
    const paymentSuccess = isVNPayPaymentSuccessful(returnData);
    const amount = parseVNPayAmount(Number(returnData.vnp_Amount));
    const message = getVNPayResponseMessage(returnData.vnp_ResponseCode);

    console.log(paymentSuccess ? "✅ Payment successful" : "❌ Payment failed");
    console.log("=".repeat(80));

    // Display result page
    return res.send(generateResultHTML({
      success: paymentSuccess,
      message,
      orderId: returnData.vnp_TxnRef,
      amount,
      transactionNo: returnData.vnp_TransactionNo,
      bankCode: returnData.vnp_BankCode,
      payDate: returnData.vnp_PayDate,
      responseCode: returnData.vnp_ResponseCode,
    }));
  } catch (error) {
    console.error("❌ VNPay Return URL Error:", error);
    console.log("=".repeat(80));

    return res.send(generateResultHTML({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý kết quả thanh toán",
      orderId: "unknown",
    }));
  }
}

// ============================================================================
// HTML Result Page Generator
// ============================================================================

function generateResultHTML(data: {
  success: boolean;
  message: string;
  orderId: string;
  amount?: number;
  transactionNo?: string;
  bankCode?: string;
  payDate?: string;
  responseCode?: string;
}): string {
  const { success, message, orderId, amount, transactionNo, bankCode, payDate, responseCode } = data;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kết quả thanh toán - VNPay</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }
    
    .header {
      background: ${success ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'};
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .content {
      padding: 30px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      color: #666;
      font-size: 14px;
    }
    
    .info-value {
      color: #333;
      font-weight: 600;
      font-size: 14px;
      text-align: right;
    }
    
    .amount {
      font-size: 24px;
      color: ${success ? '#667eea' : '#f5576c'};
      font-weight: 700;
    }
    
    .actions {
      padding: 20px 30px 30px;
      display: flex;
      gap: 10px;
    }
    
    .btn {
      flex: 1;
      padding: 14px 20px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .btn-secondary {
      background: #f5f5f5;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #e0e0e0;
    }
    
    @media (max-width: 480px) {
      .header h1 {
        font-size: 24px;
      }
      
      .icon {
        font-size: 48px;
      }
      
      .actions {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${success ? '✅' : '❌'}</div>
      <h1>${success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}</h1>
      <p>${message}</p>
    </div>
    
    <div class="content">
      <div class="info-row">
        <span class="info-label">Mã đơn hàng:</span>
        <span class="info-value">${orderId}</span>
      </div>
      
      ${amount ? `
      <div class="info-row">
        <span class="info-label">Số tiền:</span>
        <span class="info-value amount">${amount.toLocaleString('vi-VN')} ₫</span>
      </div>
      ` : ''}
      
      ${transactionNo ? `
      <div class="info-row">
        <span class="info-label">Mã giao dịch VNPay:</span>
        <span class="info-value">${transactionNo}</span>
      </div>
      ` : ''}
      
      ${bankCode ? `
      <div class="info-row">
        <span class="info-label">Ngân hàng:</span>
        <span class="info-value">${bankCode}</span>
      </div>
      ` : ''}
      
      ${payDate ? `
      <div class="info-row">
        <span class="info-label">Thời gian:</span>
        <span class="info-value">${formatPayDate(payDate)}</span>
      </div>
      ` : ''}
      
      ${responseCode && !success ? `
      <div class="info-row">
        <span class="info-label">Mã lỗi:</span>
        <span class="info-value">${responseCode}</span>
      </div>
      ` : ''}
    </div>
    
    <div class="actions">
      <a href="/vnpay-test" class="btn btn-secondary">
        ← Quay lại test
      </a>
      <a href="/" class="btn btn-primary">
        Về trang chủ →
      </a>
    </div>
  </div>
  
  <script>
    // Auto redirect after 30 seconds
    setTimeout(function() {
      window.location.href = '/vnpay-test';
    }, 30000);
  </script>
</body>
</html>
  `;
}

function formatPayDate(vnpayDate: string): string {
  // Format: yyyyMMddHHmmss -> dd/MM/yyyy HH:mm:ss
  const year = vnpayDate.substring(0, 4);
  const month = vnpayDate.substring(4, 6);
  const day = vnpayDate.substring(6, 8);
  const hours = vnpayDate.substring(8, 10);
  const minutes = vnpayDate.substring(10, 12);
  const seconds = vnpayDate.substring(12, 14);

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}
