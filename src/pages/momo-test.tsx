import Head from "next/head";
import { useEffect, useState } from "react";

export default function MoMoTestPage() {
  const [testData, setTestData] = useState({
    amount: "100000",
    orderId: `TEST_${Date.now()}`,
    orderInfo: "Test MoMo Payment",
    userEmail: "test@example.com",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [modeInfo, setModeInfo] = useState<any>(null);

  // Fetch current mode on mount
  useEffect(() => {
    fetch("/api/momo-mode")
      .then((res) => res.json())
      .then((data) => setModeInfo(data))
      .catch((err) => console.error("Failed to fetch mode:", err));
  }, []);

  const getModeConfig = () => {
    const mode = modeInfo?.mode || "mock";
    
    if (mode === "production") {
      return {
        label: "PRODUCTION",
        color: "#dc3545",
        bgColor: "#fff5f5",
        borderColor: "#dc3545",
        icon: "🔴",
        description: "Real payments - Money will be charged!",
      };
    }
    if (mode === "sandbox") {
      return {
        label: "SANDBOX",
        color: "#fd7e14",
        bgColor: "#fff3e6",
        borderColor: "#fd7e14",
        icon: "🟡",
        description: "MoMo Test Environment",
      };
    }
    return {
      label: "MOCK MODE",
      color: "#28a745",
      bgColor: "#f0fff4",
      borderColor: "#28a745",
      icon: "🟢",
      description: "Local simulation - No API calls",
    };
  };

  const handleTestInitialize = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/test/momo-initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseInt(testData.amount),
          orderId: testData.orderId,
          orderInfo: testData.orderInfo,
          userEmail: testData.userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      setResult(data);

      // Auto-open payment URL in new tab
      if (data.success && data.data?.payUrl) {
        window.open(data.data.payUrl, "_blank");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestQuery = async () => {
    if (!result?.data?.orderId || !result?.data?.requestId) {
      setError("Please initialize a payment first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/test/momo-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: result.data.orderId,
          requestId: result.data.requestId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to query payment");
      }

      setResult({ ...result, queryResult: data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestRefund = async () => {
    const transId = result?.data?.transId || result?.queryResult?.data?.transId;
    
    if (!transId) {
      setError("No transaction ID available. Complete a payment first and query status.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/test/momo-refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: `REFUND_${Date.now()}`,
          transId: transId,
          amount: parseInt(testData.amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to refund");
      }

      setResult({ ...result, refundResult: data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewOrder = () => {
    setTestData({
      ...testData,
      orderId: `TEST_${Date.now()}`,
    });
    setResult(null);
    setError(null);
  };

  const modeConfig = getModeConfig();

  return (
    <>
      <Head>
        <title>MoMo Payment Test - {modeConfig.label}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={`Test MoMo payment integration in ${modeConfig.label} mode`} />
      </Head>
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* Mode Banner */}
      <div
        style={{
          backgroundColor: modeConfig.bgColor,
          border: `2px solid ${modeConfig.borderColor}`,
          borderRadius: "8px",
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{modeConfig.icon}</span>
          <div>
            <div style={{ fontWeight: "700", fontSize: "1.1rem", color: modeConfig.color }}>
              {modeConfig.label}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
              {modeConfig.description}
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: modeConfig.color,
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            fontSize: "0.875rem",
            fontWeight: "600",
          }}
        >
          {modeConfig.label}
        </div>
      </div>

      <h1 style={{ marginBottom: "2rem", color: "#333" }}>🧪 MoMo Payment Gateway Test</h1>

      {/* Test Configuration */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginBottom: "1rem", color: "#555" }}>Test Configuration</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
              Amount (VND)
            </label>
            <input
              type="number"
              value={testData.amount}
              onChange={(e) => setTestData({ ...testData, amount: e.target.value })}
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
            />
            <small style={{ color: "#666", display: "block", marginTop: "0.25rem" }}>
              Amount in VND (e.g., 100000 = 100,000 VND)
            </small>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
              Order ID
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={testData.orderId}
                onChange={(e) => setTestData({ ...testData, orderId: e.target.value })}
                style={{ flex: 1, padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
              />
              <button
                onClick={handleGenerateNewOrder}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                New ID
              </button>
            </div>
            <small style={{ color: "#666", display: "block", marginTop: "0.25rem" }}>
              Unique order identifier
            </small>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
              Order Info
            </label>
            <input
              type="text"
              value={testData.orderInfo}
              onChange={(e) => setTestData({ ...testData, orderInfo: e.target.value })}
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
            />
            <small style={{ color: "#666", display: "block", marginTop: "0.25rem" }}>
              Description of the order
            </small>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
              User Email
            </label>
            <input
              type="email"
              value={testData.userEmail}
              onChange={(e) => setTestData({ ...testData, userEmail: e.target.value })}
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
            />
            <small style={{ color: "#666", display: "block", marginTop: "0.25rem" }}>
              Customer email address
            </small>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginBottom: "1rem", color: "#555" }}>Test Actions</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={handleTestInitialize}
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: loading ? "#ccc" : "#0066ff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "500",
              fontSize: "14px",
              transition: "background-color 0.2s",
            }}
          >
            {loading ? "⏳ Loading..." : "1️⃣ Initialize Payment"}
          </button>
          <button
            onClick={handleTestQuery}
            disabled={loading || !result?.data?.orderId}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: loading || !result?.data?.orderId ? "#ccc" : "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading || !result?.data?.orderId ? "not-allowed" : "pointer",
              fontWeight: "500",
              fontSize: "14px",
              transition: "background-color 0.2s",
            }}
          >
            2️⃣ Query Status
          </button>
          <button
            onClick={handleTestRefund}
            disabled={loading || (!result?.data?.transId && !result?.queryResult?.data?.transId)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: loading || (!result?.data?.transId && !result?.queryResult?.data?.transId) ? "#ccc" : "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading || (!result?.data?.transId && !result?.queryResult?.data?.transId) ? "not-allowed" : "pointer",
              fontWeight: "500",
              fontSize: "14px",
              transition: "background-color 0.2s",
            }}
          >
            3️⃣ Test Refund
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
          <p style={{ color: "#856404", margin: 0 }}>
            <strong>⚠️ Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div style={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "1rem", color: "#555" }}>📊 Result</h3>
          
          {/* Payment URL Section */}
          {result.success && result.data?.payUrl && (
            <div style={{ backgroundColor: "#d1ecf1", border: "1px solid #bee5eb", borderRadius: "4px", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ margin: "0 0 0.5rem 0", color: "#0c5460", fontWeight: "500" }}>
                ✅ Payment URL generated! Click below to open:
              </p>
              <a
                href={result.data.payUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#0066ff",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "4px",
                  fontWeight: "500",
                  marginTop: "0.5rem",
                }}
              >
                🚀 Open MoMo Payment Page
              </a>
            </div>
          )}

          {/* QR Code Section */}
          {result.data?.qrCodeUrl && (
            <div style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "4px", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ margin: "0 0 0.5rem 0", color: "#495057", fontWeight: "500" }}>
                📱 QR Code:
              </p>
              <img 
                src={result.data.qrCodeUrl} 
                alt="QR Code" 
                style={{ maxWidth: "200px", border: "1px solid #ddd", borderRadius: "4px" }} 
              />
              <p style={{ margin: "0.5rem 0 0 0", color: "#6c757d", fontSize: "12px" }}>
                Scan with MoMo app to pay
              </p>
            </div>
          )}

          {/* Query Result Status */}
          {result.queryResult && (
            <div style={{ 
              backgroundColor: result.queryResult.success ? "#d4edda" : "#f8d7da", 
              border: `1px solid ${result.queryResult.success ? "#c3e6cb" : "#f5c6cb"}`, 
              borderRadius: "4px", 
              padding: "1rem", 
              marginBottom: "1rem" 
            }}>
              <p style={{ 
                margin: 0, 
                color: result.queryResult.success ? "#155724" : "#721c24", 
                fontWeight: "500" 
              }}>
                {result.queryResult.success ? "✅ Payment Status: SUCCESS" : "❌ Payment Status: FAILED"}
              </p>
              {result.queryResult.data?.transId && (
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "14px", color: "#495057" }}>
                  Transaction ID: <code>{result.queryResult.data.transId}</code>
                </p>
              )}
            </div>
          )}

          {/* Refund Result Status */}
          {result.refundResult && (
            <div style={{ 
              backgroundColor: result.refundResult.success ? "#d4edda" : "#f8d7da", 
              border: `1px solid ${result.refundResult.success ? "#c3e6cb" : "#f5c6cb"}`, 
              borderRadius: "4px", 
              padding: "1rem", 
              marginBottom: "1rem" 
            }}>
              <p style={{ 
                margin: 0, 
                color: result.refundResult.success ? "#155724" : "#721c24", 
                fontWeight: "500" 
              }}>
                {result.refundResult.success ? "✅ Refund Status: SUCCESS" : "❌ Refund Status: FAILED"}
              </p>
              {result.refundResult.data?.transId && (
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "14px", color: "#495057" }}>
                  Refund Transaction ID: <code>{result.refundResult.data.transId}</code>
                </p>
              )}
            </div>
          )}

          {/* JSON Response */}
          <details style={{ marginTop: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: "500", color: "#555", padding: "0.5rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
              📄 View Full JSON Response
            </summary>
            <pre
              style={{
                backgroundColor: "#f5f5f5",
                padding: "1rem",
                borderRadius: "4px",
                overflow: "auto",
                maxHeight: "400px",
                fontSize: "0.875rem",
                marginTop: "0.5rem",
                border: "1px solid #ddd",
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Instructions */}
      <div style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "8px", padding: "1.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginBottom: "1rem", color: "#555" }}>📝 Testing Instructions</h3>
        <ol style={{ color: "#666", lineHeight: "1.8", paddingLeft: "1.5rem" }}>
          <li>
            Click <strong>"1️⃣ Initialize Payment"</strong> to create a test payment
            <ul style={{ marginTop: "0.5rem", color: "#888" }}>
              <li>A new tab will open with MoMo payment page</li>
              <li>Payment URL and QR code will be displayed</li>
            </ul>
          </li>
          <li style={{ marginTop: "0.5rem" }}>
            Use test credentials on MoMo page:
            <ul style={{ marginTop: "0.5rem", color: "#888" }}>
              <li>Phone: <code style={{ backgroundColor: "#fff", padding: "2px 4px", borderRadius: "2px" }}>0399888999</code></li>
              <li>OTP: <code style={{ backgroundColor: "#fff", padding: "2px 4px", borderRadius: "2px" }}>123456</code></li>
            </ul>
          </li>
          <li style={{ marginTop: "0.5rem" }}>
            After completing payment, return here and click <strong>"2️⃣ Query Status"</strong>
            <ul style={{ marginTop: "0.5rem", color: "#888" }}>
              <li>This will check if payment was successful</li>
              <li>You'll see the transaction ID if successful</li>
            </ul>
          </li>
          <li style={{ marginTop: "0.5rem" }}>
            Optional: Click <strong>"3️⃣ Test Refund"</strong> to test refund flow
            <ul style={{ marginTop: "0.5rem", color: "#888" }}>
              <li>Only works after successful payment</li>
              <li>Will initiate a refund for the same amount</li>
            </ul>
          </li>
        </ol>
        <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "4px" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#495057" }}>
            <strong>💡 Tip:</strong> Use the "New ID" button to generate a fresh order ID for each new test payment.
          </p>
        </div>

        {/* Mode Details */}
        {modeInfo && (
          <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "4px" }}>
            <p style={{ margin: "0 0 0.5rem 0", fontSize: "14px", fontWeight: "600", color: "#333" }}>
              ⚙️ Current Configuration:
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.5rem", fontSize: "13px", color: "#666" }}>
              <li>Mode: <strong>{modeInfo.mode.toUpperCase()}</strong></li>
              <li>Endpoint: <code>{modeInfo.endpoint}</code></li>
              <li>Has Credentials: {modeInfo.hasCredentials ? "✅ Yes" : "❌ No"}</li>
              {modeInfo.mode === "mock" && (
                <li style={{ color: "#28a745" }}>
                  <strong>Mock Mode Active</strong> - Using local simulation
                </li>
              )}
              {modeInfo.mode === "sandbox" && (
                <li style={{ color: "#fd7e14" }}>
                  <strong>Sandbox Mode</strong> - Using MoMo test environment
                </li>
              )}
              {modeInfo.mode === "production" && (
                <li style={{ color: "#dc3545", fontWeight: "600" }}>
                  <strong>⚠️ PRODUCTION MODE</strong> - Real money will be charged!
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
