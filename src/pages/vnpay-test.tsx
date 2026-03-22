import Head from "next/head";
import { useEffect, useState } from "react";

export default function VNPayTestPage() {
  const [testData, setTestData] = useState({
    orderId: `TEST_${Date.now()}`,
    amount: 100000, // 100,000 VND
    orderInfo: "Test payment for VNPay integration",
    bankCode: "", // empty = user selects at VNPay
    locale: "vn",
    vnpVersion: "2.1.0",
    vnpCommand: "pay",
    vnpReturnUrl: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined" && !testData.vnpReturnUrl) {
      setTestData((prev) => ({
        ...prev,
        vnpReturnUrl: `${window.location.origin}/vnpay-return`,
      }));
    }
  }, [testData.vnpReturnUrl]);

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Test payment initialization
  const handleInitialize = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/test/vnpay-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || "Failed to initialize payment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Test query transaction
  const handleQuery = async () => {
    if (!testData.orderId) {
      setError("Please enter order ID");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/test/vnpay-query?orderId=${testData.orderId}`
      );
      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || "Failed to query transaction");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Reset to new order ID
  const handleNewId = () => {
    setTestData({
      ...testData,
      orderId: `TEST_${Date.now()}`,
    });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Head>
        <title>VNPay Payment Test</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Test VNPay payment integration"
        />
      </Head>
      <div
        style={{
          padding: "2rem",
          maxWidth: "1200px",
          margin: "0 auto",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            padding: "2rem",
            borderRadius: "12px 12px 0 0",
            marginBottom: "0",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "2rem" }}>
            🧪 VNPay Payment Gateway Test
          </h1>
          <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9 }}>
            Test VNPay payment integration with real sandbox
          </p>
        </div>

        {/* Configuration Info */}
        <div
          style={{
            background: "#f8f9fa",
            padding: "1.5rem",
            borderRadius: "0 0 12px 12px",
            marginBottom: "2rem",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
            <strong>📜 Sandbox URL:</strong>{" "}
            https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
          </p>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "0.9rem",
              color: "#666",
            }}
          >
            <strong>🔑 Credentials:</strong> From .env (VNPAY_TMN_CODE,
            VNPAY_HASH_SECRET)
          </p>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "0.9rem",
              color: "#666",
            }}
          >
            <strong>📋 Đăng ký:</strong>{" "}
            <a
              href="http://sandbox.vnpayment.vn/devreg/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#667eea" }}
            >
              sandbox.vnpayment.vn/devreg/
            </a>
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
        >
          {/* Left Column: Test Form */}
          <div>
            <div
              style={{
                background: "#fff",
                padding: "2rem",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ marginTop: 0, color: "#333" }}>
                Test Payment Data
              </h2>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#555",
                  }}
                >
                  Order ID:
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={testData.orderId}
                    onChange={(e) =>
                      setTestData({ ...testData, orderId: e.target.value })
                    }
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "1rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleNewId}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#f5f5f5",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    New ID
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#555",
                  }}
                >
                  Amount (VND):
                </label>
                <input
                  type="number"
                  value={testData.amount}
                  onChange={(e) =>
                    setTestData({
                      ...testData,
                      amount: Number(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#555",
                  }}
                >
                  Order Info:
                </label>
                <input
                  type="text"
                  value={testData.orderInfo}
                  onChange={(e) =>
                    setTestData({ ...testData, orderInfo: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#555",
                  }}
                >
                  vnp_ReturnUrl:
                </label>
                <input
                  type="url"
                  value={testData.vnpReturnUrl}
                  onChange={(e) =>
                    setTestData({ ...testData, vnpReturnUrl: e.target.value })
                  }
                  placeholder="https://your-store.com/vnpay-return"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "600",
                      color: "#555",
                    }}
                  >
                    vnp_Version:
                  </label>
                  <input
                    type="text"
                    value={testData.vnpVersion}
                    onChange={(e) =>
                      setTestData({ ...testData, vnpVersion: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "600",
                      color: "#555",
                    }}
                  >
                    vnp_Command:
                  </label>
                  <input
                    type="text"
                    value={testData.vnpCommand}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: "#f5f5f5",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#555",
                  }}
                >
                  vnp_Locale:
                </label>
                <select
                  value={testData.locale}
                  onChange={(e) =>
                    setTestData({ ...testData, locale: e.target.value as "vn" | "en" })
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                >
                  <option value="vn">vn (Vietnamese)</option>
                  <option value="en">en (English)</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#555",
                  }}
                >
                  Bank Code (optional):
                </label>
                <select
                  value={testData.bankCode}
                  onChange={(e) =>
                    setTestData({ ...testData, bankCode: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                >
                  <option value="">User selects at VNPay</option>
                  <option value="VNPAYQR">VNPAY QR</option>
                  <option value="VNBANK">ATM Card / Bank Account</option>
                  <option value="INTCARD">International Card</option>
                  <option value="NCB">NCB Bank</option>
                  <option value="VCB">Vietcombank</option>
                  <option value="TCB">Techcombank</option>
                  <option value="BIDV">BIDV</option>
                  <option value="AGB">Agribank</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={handleInitialize}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Processing..." : "1️⃣ Initialize Payment"}
                </button>
                <button
                  type="button"
                  onClick={handleQuery}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    background: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Querying..." : "2️⃣ Query Status"}
                </button>
              </div>
            </div>

            {/* Test Cards Info */}
            <div
              style={{
                background: "#fff3cd",
                padding: "1.5rem",
                borderRadius: "12px",
                marginTop: "1.5rem",
                border: "2px solid #ffc107",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#856404" }}>
                🎴 Test Cards (NCB Bank)
              </h3>
              <div style={{ fontSize: "0.9rem", color: "#856404" }}>
                <p style={{ margin: "0.5rem 0" }}>
                  <strong>✅ Success:</strong> 9704198526191432198
                </p>
                <p style={{ margin: "0.5rem 0" }}>
                  <strong>❌ Insufficient:</strong> 9704195798459170488
                </p>
                <p style={{ margin: "0.5rem 0" }}>
                  <strong>Tên:</strong> NGUYEN VAN A
                </p>
                <p style={{ margin: "0.5rem 0" }}>
                  <strong>Ngày:</strong> 07/15
                </p>
                <p style={{ margin: "0.5rem 0" }}>
                  <strong>OTP:</strong> 123456
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div>
            {error && (
              <div
                style={{
                  background: "#f8d7da",
                  border: "2px solid #f5c6cb",
                  color: "#721c24",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                }}
              >
                <h3 style={{ marginTop: 0 }}>❌ Error</h3>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}

            {result && (
              <div
                style={{
                  background: "#d4edda",
                  border: "2px solid #c3e6cb",
                  color: "#155724",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                }}
              >
                <h3 style={{ marginTop: 0 }}>✅ Success</h3>

                {result.data?.paymentUrl && (
                  <div style={{ marginTop: "1rem" }}>
                    <a
                      href={result.data.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "1rem 2rem",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        textDecoration: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "1.1rem",
                      }}
                    >
                      🔗 Open VNPay Payment Page
                    </a>
                  </div>
                )}

                <div
                  style={{
                    marginTop: "1.5rem",
                    background: "#fff",
                    padding: "1rem",
                    borderRadius: "8px",
                    maxHeight: "400px",
                    overflow: "auto",
                  }}
                >
                  <pre style={{ margin: 0, fontSize: "0.85rem" }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div
              style={{
                background: "#fff",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#333" }}>
                📖 Test Instructions
              </h3>
              <ol style={{ paddingLeft: "1.5rem", color: "#666" }}>
                <li style={{ marginBottom: "0.75rem" }}>
                  Click <strong>1️⃣ Initialize Payment</strong> to create test
                  payment
                </li>
                <li style={{ marginBottom: "0.75rem" }}>
                  Click <strong>Open VNPay Payment Page</strong> button
                </li>
                <li style={{ marginBottom: "0.75rem" }}>
                  Select payment method (QR, ATM, International Card)
                </li>
                <li style={{ marginBottom: "0.75rem" }}>
                  Use test card: <code>9704198526191432198</code>, OTP:{" "}
                  <code>123456</code>
                </li>
                <li style={{ marginBottom: "0.75rem" }}>
                  Complete payment and wait for redirect
                </li>
                <li>
                  Optional: Use <strong>2️⃣ Query Status</strong> to check
                  payment status
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
