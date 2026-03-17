import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";

export default function MockMoMoPaymentPage() {
  const router = useRouter();
  const { orderId, amount } = router.query;
  const [processing, setProcessing] = useState(false);

  const handlePayment = async (success: boolean) => {
    setProcessing(true);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redirect back to return URL with mock result
    const returnUrl = `/api/test/momo-return?orderId=${orderId}&amount=${amount}&resultCode=${success ? 0 : 1003}&message=${
      success ? "Successful" : "User cancelled"
    }&transId=${Math.floor(Math.random() * 1000000000)}`;

    window.location.href = returnUrl;
  };

  return (
    <>
      <Head>
        <title>Mock MoMo Payment</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Mock MoMo payment page for testing" />
      </Head>
      <div
        style={{
          padding: "2rem",
          maxWidth: "600px",
          margin: "2rem auto",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        {/* Mock MoMo Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #a80056 0%, #d82d8b 100%)",
          color: "#fff",
          padding: "2rem",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem" }}>🧪 Mock MoMo Payment</h1>
        <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9 }}>Test Sandbox Environment</p>
      </div>

      {/* Payment Details */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderTop: "none",
          padding: "2rem",
          borderRadius: "0 0 12px 12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "8px",
              marginBottom: "1rem",
            }}
          >
            <p style={{ margin: "0 0 0.5rem 0", color: "#666", fontSize: "0.875rem" }}>Order ID</p>
            <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#333" }}>{orderId}</p>
          </div>

          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "8px",
            }}
          >
            <p style={{ margin: "0 0 0.5rem 0", color: "#666", fontSize: "0.875rem" }}>Amount</p>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: "700", color: "#a80056" }}>
              {parseInt(amount as string).toLocaleString("vi-VN")} ₫
            </p>
          </div>
        </div>

        {/* Alert Box */}
        <div
          style={{
            backgroundColor: "#d1ecf1",
            border: "1px solid #bee5eb",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "2rem",
          }}
        >
          <p style={{ margin: 0, color: "#0c5460", fontSize: "0.875rem" }}>
            <strong>ℹ️ Mock Mode:</strong> This is a simulated payment page. No real payment will be processed.
          </p>
        </div>

        {/* Action Buttons */}
        {!processing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button
              onClick={() => handlePayment(true)}
              style={{
                padding: "1rem 2rem",
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1.1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#218838")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#28a745")}
            >
              ✅ Simulate Successful Payment
            </button>

            <button
              onClick={() => handlePayment(false)}
              style={{
                padding: "1rem 2rem",
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1.1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#c82333")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#dc3545")}
            >
              ❌ Simulate Failed Payment
            </button>

            <button
              onClick={() => window.close()}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#5a6268")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#6c757d")}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ padding: "2rem" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #a80056",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 1rem auto",
              }}
            />
            <p style={{ color: "#666" }}>Processing payment...</p>
            <style jsx>{`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        )}

        {/* Instructions */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "8px",
            textAlign: "left",
          }}
        >
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: "600", color: "#856404" }}>
            💡 Testing Instructions:
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#856404", fontSize: "0.875rem" }}>
            <li>Click "Successful Payment" to simulate a completed transaction</li>
            <li>Click "Failed Payment" to simulate a cancelled/failed transaction</li>
            <li>After clicking, you'll be redirected back to the test page</li>
          </ul>
        </div>
      </div>
    </div>
    </>
  );
}
