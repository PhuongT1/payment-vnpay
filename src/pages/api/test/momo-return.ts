import { NextApiRequest, NextApiResponse } from "next";

/**
 * Test return URL endpoint
 * This is where MoMo redirects users after payment
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    resultCode,
    message,
    orderId,
    requestId,
    transId,
    amount,
    orderInfo,
    payType,
  } = req.query;

  console.log("Test: MoMo return URL visited", {
    resultCode,
    orderId,
    transId,
    message,
  });

  // Return HTML page showing result
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MoMo Payment Result</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
          }
          .result-card {
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 30px;
            background: #f9f9f9;
          }
          .success {
            border-color: #4caf50;
            background: #e8f5e9;
          }
          .failure {
            border-color: #f44336;
            background: #ffebee;
          }
          h1 {
            margin-top: 0;
            color: #333;
          }
          .status {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
          }
          .success .status {
            color: #4caf50;
          }
          .failure .status {
            color: #f44336;
          }
          .details {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 4px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #666;
          }
          .value {
            color: #333;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
          .button:hover {
            background: #1976D2;
          }
          pre {
            background: white;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="result-card ${resultCode === '0' || resultCode === '9000' ? 'success' : 'failure'}">
          <h1>MoMo Payment Result</h1>
          
          <div class="status">
            ${resultCode === '0' || resultCode === '9000' ? '✅ Payment Successful!' : '❌ Payment Failed'}
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="label">Result Code:</span>
              <span class="value">${resultCode}</span>
            </div>
            <div class="detail-row">
              <span class="label">Message:</span>
              <span class="value">${message || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Order ID:</span>
              <span class="value">${orderId || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Transaction ID:</span>
              <span class="value">${transId || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span class="value">${amount ? `${parseInt(amount as string).toLocaleString()} VND` : 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Type:</span>
              <span class="value">${payType || 'N/A'}</span>
            </div>
          </div>

          <details style="margin-top: 20px;">
            <summary style="cursor: pointer; font-weight: 600; margin-bottom: 10px;">
              View Full Response
            </summary>
            <pre>${JSON.stringify(req.query, null, 2)}</pre>
          </details>

          <a href="/momo-test" class="button">← Back to Test Page</a>
        </div>

        <script>
          // Auto-close after 5 seconds if in popup
          if (window.opener) {
            setTimeout(() => {
              if (confirm('Close this window and return to test page?')) {
                window.close();
              }
            }, 5000);
          }
        </script>
      </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}
